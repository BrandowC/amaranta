# Changelog

## Unreleased — Corte 2 / Integrated baseline

- Integrados en `develop` Scheduling, Sales, Clinical, Catalog HU-CAT-002 y Web.
- Baseline integrado congelado en `7510cf21a63afa88414dcc9a9c9d763ca50bd42a`.
- API validada con 7 suites y 40 tests; API y Web compilan.
- Preparado PR protegido #17 para promover `develop` a `qa`.
- Añadidos el plan de readiness del release, ADR-010 y plantilla de evidencia
  semanal `hu-status`.
- La extracción de Catalog, Sales HTTP, Saga, Outbox, RabbitMQ y worker sigue
  pendiente de los repositorios oficiales y de la validación runtime Docker.

## Unreleased — HU-CAT-001

- Baseline por SHA, evaluación MVP2 A–Z, alcance, backlog y arquitectura documentados.
- Nuevo Catalog de consulta desplegable por separado, catalog_db y migración versionada.
- Contrato HTTP v1, paginación validada, live/ready y correlation ID.
- Configuración explícita dev/qa/prod; Compose autónomo e inclusión en el Compose raíz.
- Pruebas unitarias y de integración PostgreSQL/HTTP con validación de contrato provider.

Histórico del primer bloque: la consulta nueva quedó aislada; administración,
reservas y tráfico de la tienda continuaban en el monolito. Sales independiente,
Saga, compensación, Outbox, RabbitMQ y worker permanecen en backlog. No se ha
publicado una versión MVP2 ni el tag v2.0.0.
