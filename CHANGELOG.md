# Changelog

## Unreleased — HU-CAT-001

- Baseline por SHA, evaluación MVP2 A–Z, alcance, backlog y arquitectura documentados.
- Nuevo Catalog de consulta desplegable por separado, catalog_db y migración versionada.
- Contrato HTTP v1, paginación validada, live/ready y correlation ID.
- Configuración explícita dev/qa/prod; Compose autónomo e inclusión en el Compose raíz.
- Pruebas unitarias y de integración PostgreSQL/HTTP con validación de contrato provider.

Limitación: consulta nueva aislada; administración, reservas y tráfico de la tienda
continúan en el monolito. Sales independiente, Saga, compensación, Outbox, RabbitMQ y
worker están en backlog. No se ha publicado una versión MVP2 ni el tag v2.0.0.
