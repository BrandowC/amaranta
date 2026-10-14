from __future__ import annotations

from dataclasses import asdict
from typing import Protocol

from .domain import Product


class ProductRepository(Protocol):
    def active_products(self) -> list[Product]: ...

    def by_id(self, product_id: str) -> Product | None: ...

    def save(self, product: Product) -> None: ...


class InMemoryProductRepository:
    def __init__(self, products: list[Product] | None = None):
        self._products = {product.id: product for product in products or []}

    def active_products(self) -> list[Product]:
        return [product for product in self._products.values() if product.active]

    def by_id(self, product_id: str) -> Product | None:
        return self._products.get(product_id)

    def save(self, product: Product) -> None:
        self._products[product.id] = product


class MongoProductRepository:
    """MongoDB adapter behind the same port used by the TDD tests."""

    def __init__(self, uri: str, database: str):
        try:
            from pymongo import MongoClient
        except ImportError as error:
            raise RuntimeError("Install the mongo extra to use MongoProductRepository") from error
        self._collection = MongoClient(uri)[database]["products"]

    def active_products(self) -> list[Product]:
        return [self._from_document(doc) for doc in self._collection.find({"active": True})]

    def by_id(self, product_id: str) -> Product | None:
        document = self._collection.find_one({"_id": product_id})
        return self._from_document(document) if document else None

    def save(self, product: Product) -> None:
        document = asdict(product)
        document["_id"] = document.pop("id")
        self._collection.replace_one({"_id": document["_id"]}, document, upsert=True)

    @staticmethod
    def _from_document(document: dict) -> Product:
        values = dict(document)
        values["id"] = values.pop("_id", values.get("id"))
        return Product(**values)
