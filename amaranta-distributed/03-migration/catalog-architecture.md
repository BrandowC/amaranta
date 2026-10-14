# Arquitectura inicial de Catalog API

```text
HTTP adapter
    ↓
CatalogService
    ↓
Product domain
    ↓
ProductRepository port
    ├── InMemoryProductRepository (TDD/local)
    └── MongoProductRepository (QA/prod)
```

## Casos de uso del primer bloque

- Listar productos activos, ordenados por nombre e identificador.
- Consultar stock a través de una reserva controlada.
- Liberar stock como compensación de Sales.

## Invariantes

- El precio se representa como entero en COP.
- El stock nunca es negativo.
- La cantidad debe ser un entero positivo.
- Una reserva parcial se compensa si un ítem posterior falla.
- Catalog no conoce entidades internas de Sales.

## Decisiones que aún requieren implementación

- Atomicidad de reserva en MongoDB.
- Idempotencia por `reservationId`.
- Autenticación interna y autorización administrativa.
- Observabilidad y health check de dependencia MongoDB.
