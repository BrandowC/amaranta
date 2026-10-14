import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse
from uuid import uuid4

from .domain import CatalogError
from .repository import InMemoryProductRepository, MongoProductRepository
from .service import CatalogService


def build_service() -> CatalogService:
    uri = os.getenv("CATALOG_MONGO_URI")
    if uri:
        return CatalogService(MongoProductRepository(uri, os.getenv("CATALOG_MONGO_DATABASE", "catalog")))
    return CatalogService(InMemoryProductRepository())


def create_handler(service: CatalogService):
    class CatalogHandler(BaseHTTPRequestHandler):
        def _send(self, status: int, body: dict, correlation_id: str) -> None:
            encoded = json.dumps(body).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("x-correlation-id", correlation_id)
            self.end_headers()
            self.wfile.write(encoded)

        def _body(self) -> dict:
            length = int(self.headers.get("Content-Length", "0"))
            return json.loads(self.rfile.read(length) or b"{}")

        def do_GET(self) -> None:
            correlation_id = self.headers.get("x-correlation-id", uuid4().hex)
            parsed = urlparse(self.path)
            if parsed.path == "/health/live":
                self._send(200, {"status": "live"}, correlation_id)
                return
            if parsed.path == "/health/ready":
                try:
                    service.repository.active_products()
                    self._send(200, {"status": "ready"}, correlation_id)
                except Exception:
                    self._send(503, {"status": "not_ready"}, correlation_id)
                return
            if parsed.path == "/v1/products":
                query = parse_qs(parsed.query)
                try:
                    result = service.list_products(int(query.get("page", ["1"])[0]), int(query.get("pageSize", ["50"])[0]))
                    self._send(200, result, correlation_id)
                except (ValueError, CatalogError) as error:
                    self._send(400, {"code": "INVALID_PAGINATION", "message": str(error)}, correlation_id)
                return
            self._send(404, {"code": "NOT_FOUND", "message": "route not found"}, correlation_id)

        def do_POST(self) -> None:
            correlation_id = self.headers.get("x-correlation-id", uuid4().hex)
            try:
                body = self._body()
                if self.path == "/v1/stock/reservations":
                    result = service.reserve(body.get("items", []))
                    self._send(201, {"items": result}, correlation_id)
                    return
                if self.path == "/v1/stock/releases":
                    service.release(body.get("items", []))
                    self._send(204, {}, correlation_id)
                    return
                self._send(404, {"code": "NOT_FOUND", "message": "route not found"}, correlation_id)
            except CatalogError as error:
                self._send(error.status, {"code": error.code, "message": error.message}, correlation_id)
            except (TypeError, ValueError, json.JSONDecodeError):
                self._send(400, {"code": "INVALID_REQUEST", "message": "invalid JSON request"}, correlation_id)

        def log_message(self, format: str, *args) -> None:
            return

    return CatalogHandler


def run() -> None:
    host = os.getenv("CATALOG_HOST", "127.0.0.1")
    port = int(os.getenv("CATALOG_PORT", "8081"))
    server = ThreadingHTTPServer((host, port), create_handler(build_service()))
    print(f"Catalog API listening on http://{host}:{port}")
    server.serve_forever()
