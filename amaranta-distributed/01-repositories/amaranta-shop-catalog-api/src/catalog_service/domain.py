from dataclasses import dataclass


class CatalogError(Exception):
    """Expected domain error exposed as a client error."""

    def __init__(self, code: str, message: str, status: int = 400):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status


@dataclass
class Product:
    id: str
    sku: str
    name: str
    description: str
    category: str
    price: int
    stock_quantity: int
    image_url: str
    active: bool = True

    def __post_init__(self) -> None:
        if not self.sku or not 2 <= len(self.sku) <= 50:
            raise CatalogError("INV-PRODUCT-004", "sku must be between 2 and 50 characters")
        if not self.name or not 1 <= len(self.name) <= 120:
            raise CatalogError("INV-PRODUCT-005", "name must be between 1 and 120 characters")
        if not isinstance(self.stock_quantity, int) or self.stock_quantity < 0:
            raise CatalogError("INV-PRODUCT-006", "stockQuantity must be a non-negative integer")
        if not isinstance(self.price, int) or self.price < 1:
            raise CatalogError("INV-PRODUCT-001", "price must be a positive integer in COP")

    def summary(self) -> dict:
        return {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "price": self.price,
            "priceFormatted": f"${self.price:,}".replace(",", "."),
            "stockQuantity": self.stock_quantity,
            "inStock": self.stock_quantity > 0,
            "imageUrl": self.image_url,
        }

    def reserve(self, quantity: int) -> None:
        if not isinstance(quantity, int) or quantity <= 0:
            raise CatalogError("INV-PRODUCT-003", "quantity must be positive")
        if not self.active:
            raise CatalogError("PRODUCT_NOT_FOUND", f"Product {self.id} does not exist or is inactive", 404)
        if self.stock_quantity < quantity:
            raise CatalogError(
                "INV-PRODUCT-002",
                f'"{self.name}" only has {self.stock_quantity} unit(s) left (requested {quantity})',
                409,
            )
        self.stock_quantity -= quantity

    def release(self, quantity: int) -> None:
        if not isinstance(quantity, int) or quantity <= 0:
            raise CatalogError("INV-PRODUCT-003", "quantity must be positive")
        self.stock_quantity += quantity
