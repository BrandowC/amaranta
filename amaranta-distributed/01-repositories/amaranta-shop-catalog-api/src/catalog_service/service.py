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

    def reserve(self, items: list[dict]) -> list[dict]:
        if not items:
            raise CatalogError("INV-ORDER-004", "an order must have at least one item")
        products = []
        for item in items:
            product = self.repository.by_id(item.get("productId"))
            if product is None:
                raise CatalogError("PRODUCT_NOT_FOUND", f"Product {item.get('productId')} does not exist", 404)
            products.append((product, item.get("quantity")))

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

        return [
            {
                "productId": product.id,
                "productName": product.name,
                "unitPriceAmount": product.price,
                "quantity": quantity,
            }
            for product, quantity in products
        ]

    def release(self, items: list[dict]) -> None:
        if not items:
            raise CatalogError("INV-ORDER-004", "an order must have at least one item")
        for item in items:
            product = self.repository.by_id(item.get("productId"))
            if product is None:
                raise CatalogError("PRODUCT_NOT_FOUND", f"Product {item.get('productId')} does not exist", 404)
            product.release(item.get("quantity"))
            self.repository.save(product)
