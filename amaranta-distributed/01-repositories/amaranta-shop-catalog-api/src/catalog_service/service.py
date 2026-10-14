from .domain import CatalogError, Product
from .repository import ProductRepository


class CatalogService:
    def __init__(self, repository: ProductRepository):
        self.repository = repository

    def list_products(self, page: int = 1, page_size: int = 50) -> dict:
        if not isinstance(page, int) or not 1 <= page <= 1_000_000:
            raise CatalogError("INVALID_PAGINATION", "page must be between 1 and 1000000")
        if not isinstance(page_size, int) or not 1 <= page_size <= 50:
            raise CatalogError("INVALID_PAGINATION", "pageSize must be between 1 and 50")

        products = sorted(self.repository.active_products(), key=lambda item: (item.name, item.id))
        start = (page - 1) * page_size
        return {
            "items": [product.summary() for product in products[start : start + page_size]],
            "page": page,
            "pageSize": page_size,
            "total": len(products),
        }

    def reserve(self, reservation_id: str, items: list[dict]) -> list[dict]:
        self._validate_reservation_id(reservation_id)
        if not items:
            raise CatalogError("INV-ORDER-004", "an order must have at least one item")
        existing = self.repository.reservation(reservation_id)
        requested = self._canonical_items(items)
        if existing:
            if existing["items"] != requested:
                raise CatalogError("RESERVATION_ID_REUSED", "reservationId cannot be reused with different items", 409)
            if existing["status"] in {"RESERVED", "CONFIRMED"}:
                return existing["lines"]
            raise CatalogError("RESERVATION_NOT_ACTIVE", "reservation is not active", 409)

        products = []
        for item in requested:
            product = self.repository.by_id(item.get("productId"))
            if product is None:
                raise CatalogError("PRODUCT_NOT_FOUND", f"Product {item.get('productId')} does not exist", 404)
            products.append((product, item.get("quantity")))

        def operation(*_):
            reserved: list[tuple[Product, int]] = []
            try:
                for product, quantity in products:
                    product.reserve(quantity)
                    self.repository.save(product)
                    reserved.append((product, quantity))
            except Exception:
                for product, quantity in reserved:
                    product.release(quantity)
                    self.repository.save(product)
                raise
            lines = [
            {
                "productId": product.id,
                "productName": product.name,
                "unitPriceAmount": product.price,
                "quantity": quantity,
            }
            for product, quantity in products
            ]
            self.repository.save_reservation({
                "reservationId": reservation_id,
                "status": "RESERVED",
                "items": requested,
                "lines": lines,
            })
            return lines

        return self.repository.atomic(operation)

    def release(self, reservation_id: str) -> None:
        self._validate_reservation_id(reservation_id)
        reservation = self.repository.reservation(reservation_id)
        if reservation is None:
            raise CatalogError("RESERVATION_NOT_FOUND", "reservation does not exist", 404)
        if reservation["status"] in {"RELEASED", "EXPIRED"}:
            return
        if reservation["status"] == "CONFIRMED":
            raise CatalogError("RESERVATION_NOT_ACTIVE", "confirmed reservation cannot be released", 409)

        def operation(*_):
            for item in reservation["items"]:
                product = self.repository.by_id(item["productId"])
                if product is None:
                    raise CatalogError("PRODUCT_NOT_FOUND", f"Product {item['productId']} does not exist", 404)
                product.release(item["quantity"])
                self.repository.save(product)
            reservation["status"] = "RELEASED"
            self.repository.save_reservation(reservation)

        self.repository.atomic(operation)

    def confirm(self, reservation_id: str) -> None:
        self._validate_reservation_id(reservation_id)
        reservation = self.repository.reservation(reservation_id)
        if reservation is None:
            raise CatalogError("RESERVATION_NOT_FOUND", "reservation does not exist", 404)
        if reservation["status"] == "CONFIRMED":
            return
        if reservation["status"] != "RESERVED":
            raise CatalogError("RESERVATION_NOT_ACTIVE", "only a reserved reservation can be confirmed", 409)

        def operation(*_):
            reservation["status"] = "CONFIRMED"
            self.repository.save_reservation(reservation)

        self.repository.atomic(operation)

    def expire(self, reservation_id: str) -> None:
        self._validate_reservation_id(reservation_id)
        reservation = self.repository.reservation(reservation_id)
        if reservation is None:
            raise CatalogError("RESERVATION_NOT_FOUND", "reservation does not exist", 404)
        if reservation["status"] == "EXPIRED":
            return
        if reservation["status"] != "RESERVED":
            raise CatalogError("RESERVATION_NOT_ACTIVE", "only a reserved reservation can expire", 409)

        def operation(*_):
            for item in reservation["items"]:
                product = self.repository.by_id(item["productId"])
                if product is None:
                    raise CatalogError("PRODUCT_NOT_FOUND", f"Product {item['productId']} does not exist", 404)
                product.release(item["quantity"])
                self.repository.save(product)
            reservation["status"] = "EXPIRED"
            self.repository.save_reservation(reservation)

        self.repository.atomic(operation)

    @staticmethod
    def _validate_reservation_id(reservation_id: str) -> None:
        if not isinstance(reservation_id, str) or not reservation_id.strip():
            raise CatalogError("INVALID_RESERVATION_ID", "reservationId is required")

    @staticmethod
    def _canonical_items(items: list[dict]) -> list[dict]:
        return [{"productId": item.get("productId"), "quantity": item.get("quantity")} for item in items]
