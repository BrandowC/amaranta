import unittest

from src.catalog_service.domain import CatalogError, Product
from src.catalog_service.repository import InMemoryProductRepository
from src.catalog_service.service import CatalogService


def product(product_id: str, name: str, stock: int = 3) -> Product:
    return Product(product_id, f"SKU-{product_id}", name, "desc", "FOOD", 12500, stock, "image")


class CatalogServiceTddTests(unittest.TestCase):
    def setUp(self) -> None:
        self.repository = InMemoryProductRepository([product("2", "Zeta"), product("1", "Alpha", 0)])
        self.service = CatalogService(self.repository)

    def test_lists_active_products_sorted_and_marks_stock(self) -> None:
        result = self.service.list_products()
        self.assertEqual(result["total"], 2)
        self.assertEqual([item["name"] for item in result["items"]], ["Alpha", "Zeta"])
        self.assertFalse(result["items"][0]["inStock"])
        self.assertTrue(result["items"][1]["inStock"])

    def test_rejects_invalid_pagination(self) -> None:
        with self.assertRaises(CatalogError):
            self.service.list_products(0, 50)
        with self.assertRaises(CatalogError):
            self.service.list_products(1, 51)

    def test_reserves_stock_and_returns_sales_snapshot(self) -> None:
        result = self.service.reserve([{"productId": "2", "quantity": 2}])
        self.assertEqual(result[0]["unitPriceAmount"], 12500)
        self.assertEqual(self.repository.by_id("2").stock_quantity, 1)

    def test_failed_multi_item_reservation_compensates_previous_items(self) -> None:
        with self.assertRaises(CatalogError):
            self.service.reserve([{"productId": "2", "quantity": 2}, {"productId": "1", "quantity": 1}])
        self.assertEqual(self.repository.by_id("2").stock_quantity, 3)

    def test_releases_reserved_stock(self) -> None:
        self.service.reserve([{"productId": "2", "quantity": 2}])
        self.service.release([{"productId": "2", "quantity": 2}])
        self.assertEqual(self.repository.by_id("2").stock_quantity, 3)


if __name__ == "__main__":
    unittest.main()
