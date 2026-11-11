import http.client
import threading
import unittest
from http.server import ThreadingHTTPServer

from src.catalog_service.domain import CatalogError, Product
from src.catalog_service.repository import InMemoryProductRepository
from src.catalog_service.server import create_handler
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
        result = self.service.reserve("reservation-1", [{"productId": "2", "quantity": 2}])
        self.assertEqual(result[0]["unitPriceAmount"], 12500)
        self.assertEqual(self.repository.by_id("2").stock_quantity, 1)

    def test_failed_multi_item_reservation_compensates_previous_items(self) -> None:
        with self.assertRaises(CatalogError):
            self.service.reserve("reservation-2", [{"productId": "2", "quantity": 2}, {"productId": "1", "quantity": 1}])
        self.assertEqual(self.repository.by_id("2").stock_quantity, 3)

    def test_releases_reserved_stock(self) -> None:
        self.service.reserve("reservation-3", [{"productId": "2", "quantity": 2}])
        self.service.release("reservation-3")
        self.assertEqual(self.repository.by_id("2").stock_quantity, 3)

    def test_repeating_reservation_is_idempotent(self) -> None:
        first = self.service.reserve("same-id", [{"productId": "2", "quantity": 2}])
        second = self.service.reserve("same-id", [{"productId": "2", "quantity": 2}])
        self.assertEqual(first, second)
        self.assertEqual(self.repository.by_id("2").stock_quantity, 1)

    def test_reusing_reservation_id_with_different_items_is_rejected(self) -> None:
        self.service.reserve("same-id", [{"productId": "2", "quantity": 1}])
        with self.assertRaises(CatalogError) as context:
            self.service.reserve("same-id", [{"productId": "2", "quantity": 2}])
        self.assertEqual(context.exception.code, "RESERVATION_ID_REUSED")

    def test_release_is_idempotent(self) -> None:
        self.service.reserve("same-id", [{"productId": "2", "quantity": 2}])
        self.service.release("same-id")
        self.service.release("same-id")
        self.assertEqual(self.repository.by_id("2").stock_quantity, 3)

    def test_confirmation_is_idempotent_and_blocks_release(self) -> None:
        self.service.reserve("confirmed-id", [{"productId": "2", "quantity": 2}])
        self.service.confirm("confirmed-id")
        self.service.confirm("confirmed-id")
        with self.assertRaises(CatalogError) as context:
            self.service.release("confirmed-id")
        self.assertEqual(context.exception.code, "RESERVATION_NOT_ACTIVE")
        self.assertEqual(self.repository.reservation("confirmed-id")["status"], "CONFIRMED")

    def test_expiration_releases_stock_and_is_idempotent(self) -> None:
        self.service.reserve("expired-id", [{"productId": "2", "quantity": 2}])
        self.service.expire("expired-id")
        self.service.expire("expired-id")
        self.assertEqual(self.repository.by_id("2").stock_quantity, 3)
        self.assertEqual(self.repository.reservation("expired-id")["status"], "EXPIRED")

    def test_ready_returns_503_when_the_repository_is_unavailable(self) -> None:
        class UnavailableRepository:
            def active_products(self):
                raise TimeoutError("database unavailable")

        service = CatalogService(UnavailableRepository())
        server = ThreadingHTTPServer(("127.0.0.1", 0), create_handler(service))
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = http.client.HTTPConnection("127.0.0.1", server.server_port, timeout=2)
            connection.request("GET", "/health/ready", headers={"x-correlation-id": "c3-health-check"})
            response = connection.getresponse()
            self.assertEqual(response.status, 503)
            self.assertEqual(response.getheader("x-correlation-id"), "c3-health-check")
            self.assertEqual(response.read(), b'{"status": "not_ready"}')
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
