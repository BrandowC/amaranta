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
- cliente HTTP JSON que consume `/v1/stock/reservations` y `/v1/stock/releases`.

El agregado Order, la transacción local de PostgreSQL y la saga completa son la
siguiente capa. La API general de NestJS ya puede seleccionar el mismo contrato
por `CATALOG_SERVICE_URL`; sin esa variable conserva el adaptador local de
transición.
