from __future__ import annotations

from dataclasses import asdict
from contextvars import ContextVar
from threading import RLock
from typing import Protocol
from time import sleep

from .domain import CatalogError, Product

_mongo_session: ContextVar[object | None] = ContextVar("mongo_session", default=None)


class ReservationRepository(Protocol):
    def reservation(self, reservation_id: str) -> dict | None: ...

    def save_reservation(self, reservation: dict) -> None: ...


class ProductRepository(Protocol):
    def active_products(self) -> list[Product]: ...

    def by_id(self, product_id: str) -> Product | None: ...

    def save(self, product: Product) -> None: ...


class InMemoryProductRepository:
    def __init__(self, products: list[Product] | None = None):
        self._products = {product.id: product for product in products or []}
        self._reservations: dict[str, dict] = {}
        self._lock = RLock()

    def active_products(self) -> list[Product]:
        return [product for product in self._products.values() if product.active]

    def by_id(self, product_id: str) -> Product | None:
        return self._products.get(product_id)

    def save(self, product: Product) -> None:
        self._products[product.id] = product

    def reservation(self, reservation_id: str) -> dict | None:
        return self._reservations.get(reservation_id)

    def save_reservation(self, reservation: dict) -> None:
        self._reservations[reservation["reservationId"]] = reservation

    def atomic(self, operation):
        with self._lock:
            return operation()


class MongoProductRepository:
    """MongoDB adapter behind the same port used by the TDD tests."""

    def __init__(self, uri: str, database: str):
        try:
            from pymongo import MongoClient
        except ImportError as error:
            raise RuntimeError("Install the mongo extra to use MongoProductRepository") from error
        self._client = MongoClient(
            uri,
            retryWrites=True,
            connectTimeoutMS=2000,
            serverSelectionTimeoutMS=2000,
            socketTimeoutMS=2000,
        )
        self._database = self._client[database]
        self._collection = self._database["products"]
        self._reservations = self._database["reservations"]
        self._reservations.create_index("reservationId", unique=True)

    def active_products(self) -> list[Product]:
        return [self._from_document(doc) for doc in self._collection.find({"active": True}, session=_mongo_session.get())]

    def by_id(self, product_id: str) -> Product | None:
        document = self._collection.find_one({"_id": product_id}, session=_mongo_session.get())
        return self._from_document(document) if document else None

    def save(self, product: Product) -> None:
        document = asdict(product)
        document["_id"] = document.pop("id")
        self._collection.replace_one(
            {"_id": document["_id"]},
            document,
            upsert=True,
            session=_mongo_session.get(),
        )

    def reservation(self, reservation_id: str) -> dict | None:
        return self._reservations.find_one(
            {"reservationId": reservation_id},
            {"_id": 0},
            session=_mongo_session.get(),
        )

    def save_reservation(self, reservation: dict) -> None:
        self._reservations.replace_one(
            {"reservationId": reservation["reservationId"]},
            reservation,
            upsert=True,
            session=_mongo_session.get(),
        )

    def atomic(self, operation):
        for attempt in range(3):
            with self._client.start_session() as session:
                token = _mongo_session.set(session)
                try:
                    with session.start_transaction():
                        return operation(session)
                except Exception as error:
                    has_label = getattr(error, "has_error_label", None)
                    is_transient = has_label("TransientTransactionError") if callable(has_label) else False
                    if not is_transient or attempt == 2:
                        raise
                    sleep(0.05 * (attempt + 1))
                finally:
                    _mongo_session.reset(token)

    @staticmethod
    def _from_document(document: dict) -> Product:
        values = dict(document)
        values["id"] = values.pop("_id", values.get("id"))
        return Product(**values)
