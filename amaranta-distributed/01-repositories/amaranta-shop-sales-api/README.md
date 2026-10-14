# amaranta-shop-sales-api

Servicio Java de Sales preparado para consumir el contrato
`02-contracts-cache/sales-catalog-v1.json`.

## Regla de dependencia

Sales solo conoce `CatalogClient`, nunca `catalog_db`, tablas, colecciones o
credenciales de Catalog. La base propia será PostgreSQL.

## Estado

El esqueleto compilable contiene:

- contrato de salida `CatalogClient`;
- modelos de reserva;
- configuración por variables de entorno;
- punto de entrada para la siguiente iteración.

Todavía falta implementar el agregado Order, la transacción local de PostgreSQL y
la saga completa.
