# Arquitectura inicial de Sales

## Boundary

```text
Sales HTTP API
    ↓
Checkout application service
    ├── CatalogClient (HTTP contract)
    └── SalesRepository (PostgreSQL)
```

Sales owns orders, checkout state, saga state and outbox records. Catalog owns
products and stock. No table, schema or MongoDB collection is shared between them.

## First implementation slice

1. Validate item input through `StockItem`.
2. Request reservation through `CatalogClient`.
3. Persist the order and local saga state in PostgreSQL.
4. Release stock through the same contract if the local operation fails.

The full transaction and outbox are deliberately pending until the first Java
contract client is implemented.
