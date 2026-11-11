# Changelog

## v3.0.0 — Corte 3 operational baseline

- Packaged a reproducible Docker composition with the NestJS Amaranta API,
  PostgreSQL, the extracted Python Catalog API, MongoDB, and the prepared Sales
  database boundary.
- Validated the API test suite (42 tests) and the independent Catalog suite (22
  tests), as well as both Compose configurations.
- Bounded MongoDB connection and selection checks to two seconds so Catalog
  readiness returns `503` during a database outage instead of waiting on the
  driver default timeout.
- Recorded the component sequence used for the release: Infra Mongo `v2.0.0`,
  Infra PostgreSQL `v2.0.0`, and the independently verified API Gateway
  `v2.0.1`.
- Added the C3 runbook with the actual architecture, contracts, health checks,
  a dependency-failure demonstration, handover commands, and explicitly recorded
  limitations.
- This release is intentionally honest about scope: durable messaging, a worker,
  autonomous Sales, transactional outbox, and a complete distributed Saga remain
  planned work rather than implemented functionality.

## Unreleased — HU-CAT-001

- Baseline por SHA, evaluación MVP2 A–Z, alcance, backlog y arquitectura documentados.
- Nuevo Catalog de consulta desplegable por separado, catalog_db y migración versionada.
- Contrato HTTP v1, paginación validada, live/ready y correlation ID.
- Configuración explícita dev/qa/prod; Compose autónomo e inclusión en el Compose raíz.
- Pruebas unitarias y de integración PostgreSQL/HTTP con validación de contrato provider.

Limitación: consulta nueva aislada; administración, reservas y tráfico de la tienda
continúan en el monolito. Sales independiente, Saga, compensación, Outbox, RabbitMQ y
worker están en backlog. No se ha publicado una versión MVP2 ni el tag v2.0.0.
