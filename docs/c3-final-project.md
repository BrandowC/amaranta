# Amaranta — Final project, Corte 3

## Release statement

`v3.0.0` is the C3 release candidate that can be built and demonstrated from this
repository. It combines the Amaranta NestJS application with the independently
deployed NestJS Catalog service. The purpose of this release is to demonstrate the
real extraction boundary without presenting planned components as completed.

The validated composition is the tracked root `docker-compose.yml`. No public
deployment URL is claimed for this release; the supported target is a local Docker
environment.
The presentation used for the oral delivery is
[`deliverables/amaranta-c3-v3.0.0-presentation-sequence.pptx`](../deliverables/amaranta-c3-v3.0.0-presentation-sequence.pptx).

## Release sequence

The product release follows dependency order. Each supporting component has its
own tag and verification boundary; `v3.0.0` records the Amaranta product baseline
without copying their full commit histories into this repository.

| Step | Decision and implementation | Evidence |
| --- | --- | --- |
| 1. Baseline | Preserve the bounded contexts and their tests before changing runtime dependencies. | Amaranta API suite, Catalog suites, Compose validation |
| 2. Infrastructure | Select the already released runtime foundations for Catalog and Sales persistence. | `amaranta-shop-infra-mongo` `v2.0.0`; `amaranta-shop-infra-postgres` `v2.0.0` |
| 3. Edge boundary | Verify the API Gateway independently before using it as the platform entry point. | `amaranta-shop-api-gateway` `v2.0.1`; route, security, trace, and dependency-failure tests |
| 4. Integration | Assemble the runnable Amaranta API, Catalog API, MongoDB, API PostgreSQL, and Sales PostgreSQL boundary. | `docker-compose.distributed.yml` and `scripts/verify-c3.ps1` |
| 5. Product release | Tag the documented, runnable baseline after test and recovery checks. | Amaranta `v3.0.0` |

The Gateway remains a separately versioned component in this release. The current
local Compose profile exposes the Amaranta API directly for the validated demo;
the Gateway passed its own contract suite and is ready to be wired in through its
published configuration in a subsequent integration increment.

## System architecture

![Amaranta domain flow](flujo-dominios.svg)

```text
Browser or API client
        |
        v
Amaranta API (NestJS, :8080)              Catalog API (NestJS, :8081)
        |                                           |
        v                                           v
API PostgreSQL (:5432)                     Catalog PostgreSQL (:55432)
```

The API contains the Identity, Catalog, Sales, Clinical, and Scheduling modules
with domain/application/infrastructure boundaries. The extracted Catalog service
owns its PostgreSQL schema and exposes versioned HTTP endpoints. The planned
Sales-to-Catalog dependency is an adapter boundary, not a cross-database query.

### Implemented contracts and operational interfaces

| Interface | Evidence in repository | Operational purpose |
| --- | --- | --- |
| Amaranta API | `apps/api`, `GET /health`, `GET /api-docs` | Main application and OpenAPI UI |
| Catalog HTTP service | `apps/catalog`, `GET /v1/products` | Independent Catalog boundary |
| Catalog readiness | `GET /health/live`, `GET /health/ready` | Separates process liveness from PostgreSQL availability |
| Correlation header | `x-correlation-id` in Catalog HTTP server and Sales adapter | Request-level integration correlation |
| Persistence isolation | `postgres`, `catalog-db` Compose services | Prevents direct shared database access |

The detailed migration decisions are recorded in
[`ADR-010`](adr/ADR-010-c2-distributed-release.md) and
[`ADR-011`](adr/ADR-011-sales-catalog-query-contract.md).

## Reproducible validation

Prerequisites: Docker Desktop with Compose, Node.js 20, and the local `.env` values
derived from `.env.example`. Never commit private keys or `.env` files.

```powershell
cd C:\path\to\amaranta
docker compose -f docker-compose.yml up --build -d
.\scripts\verify-c3.ps1

Set-Location apps\api
npm test -- --runInBand
npm run build

Set-Location ..\catalog
npm test
npm run build
```

Validation performed for this release:

| Check | Result |
| --- | --- |
| API unit/application suite | 8 suites, 42 tests passed |
| Independent Catalog suite | 22 tests passed |
| Root Compose syntax | valid |
| `GET /health` on Amaranta API | 200 |
| `GET /health/ready` on Catalog API with PostgreSQL available | 200 |

## Live demonstration

1. Start the composition and run `scripts/verify-c3.ps1`.
2. Open `http://localhost:8080/api-docs` to show the published Amaranta API.
3. Request `http://localhost:8081/v1/products` with an `x-correlation-id` header.
   A valid empty collection is expected until an approved data load exists; do not
   invent production catalog data for the demo.
4. Show the separate containers and data stores:

   ```powershell
   docker compose -f docker-compose.yml ps
   ```

5. Demonstrate a real dependency failure by stopping only the Catalog database:

   ```powershell
   docker compose -f docker-compose.yml stop catalog-db
   curl.exe --max-time 10 -i http://localhost:8081/health/ready
   curl.exe -i http://localhost:8081/health/live
   docker compose -f docker-compose.yml start catalog-db
   curl.exe -i http://localhost:8081/health/ready
   ```

   The readiness request returns `503` while PostgreSQL is down; liveness remains
   `200`; readiness returns to `200` after the database restarts. This is a
   dependency-health demonstration, not a completed Saga or compensation flow.

## Handover and operations

| Need | Command or source |
| --- | --- |
| Start the runnable system | `docker compose -f docker-compose.yml up --build -d` |
| Inspect runtime | `docker compose -f docker-compose.yml ps` and `logs` |
| Stop only this composition | `docker compose -f docker-compose.yml down` |
| API contract | `http://localhost:8080/api-docs` while running |
| Catalog contract and tests | `apps/catalog`, `apps/catalog/contracts/openapi.json` |
| Domain architecture | `docs/flujo-dominios.svg` and `docs/path-to-microservices.md` |
| Change history | `CHANGELOG.md` |

## Known limitations and next decisions

The release is runnable, tested, and has a genuine inter-service Catalog boundary,
but it is not a claim of a completed production microservice platform. The following
items are intentionally outside `v3.0.0`:

1. The autonomous Sales API and its persisted Saga state are not yet runnable.
2. RabbitMQ, durable outbox, idempotent inbox, DLQ, and worker are not yet present
   in the runtime composition.
3. Full metrics export, traces, alert delivery, and a public deployment remain
   future operational work.

These limitations are recorded so that the demo, presentation, and oral defense
can explain the implemented value and the next engineering increment precisely.
