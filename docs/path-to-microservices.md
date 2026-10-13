# From monolith to microservices — extraction guide

This document explains, module by module, what would change to split `identity`, `catalog`,
`sales`, `clinical` and `scheduling` into the microservices already sketched out in
`amaranta-shop-docs/09-microservices/`. The idea is that this repo's monolith **is already cut
along the right seams** — extracting a module is (almost) just moving folders and swapping
adapters, not redesigning the domain.

## Why it's already "pre-cut"

1. **One NestJS module per bounded context**, each with its own `domain/`, `application/`,
   `infrastructure/` — domain entities are never imported across modules.
2. **One PostgreSQL schema per context** (`identity`, `catalog`, `sales`, `clinical`,
   `scheduling`) inside the same instance — on extraction day, each schema becomes its own
   service's database (`06-data/models.md`, "Database per Service" principle).
3. **All cross-context communication goes through a port**, never a direct import of another
   module's domain. Today those ports are implemented as an in-process call; tomorrow they're
   implemented over HTTP or events.

## Extracting `catalog-service`

| Today (monolith) | Microservice (`09-microservices/services/`) |
|-------------------|----------------------------------------------|
| `src/catalog/` in full | New repo/project, same `domain/` and `application/` code unchanged |
| `catalog` schema in the shared Postgres instance | Its own PostgreSQL instance |
| `sales/infrastructure/adapters/catalog-stock.adapter.ts` calls `ReserveStockUseCase` in-process | Replaced by an `HttpProductStockAdapter` that does a `POST` to `catalog-service` (contract in `07-api/contracts/openapi/`) |
| No stock events | `ReserveStockUseCase` starts publishing `StockReserved` / `StockDepleted` to RabbitMQ (`02-domain/domain-events.md`) |

**What does NOT change:** the `Product` entity, its invariants (`INV-PRODUCT-001/002`),
`ListProductsUseCase`, `ReserveStockUseCase`, the HTTP controller.

## Extracting `identity-service`

| Today (monolith) | Microservice |
|-------------------|---------------|
| `src/identity/` in full | New repo, same domain/application |
| Other modules import `JwtStrategy`/`JwtAuthGuard` directly from `identity` | Becomes an **Open Host Service**: other services only verify the JWT signature (same symmetric/public key) without calling `identity-service` on every request — as described in `02-domain/domain-map.md` |
| A single process validates the token | Kong (API Gateway) validates the JWT at the edge; each service re-validates it only if it needs the `role` claim |

**What does NOT change:** the `User` entity, `RegisterUserUseCase`, `LoginUseCase`, invariants
`INV-USER-001/002`.

## Extracting `sales-service`

The most illustrative case because **it depends on another context**:

1. Move `src/sales/` to its own project, with its `sales` schema as its own database.
2. Replace `CatalogStockAdapter` (in-process call) with an HTTP/gRPC adapter to
   `catalog-service`, implementing the same `ProductStockPort` — `CheckoutUseCase` never finds
   out about the change.
3. Replace `InProcessEventPublisher` with a RabbitMQ publisher; `OrderCreatedListener` (today's
   simulated "notification-service") is deleted from this code and becomes the real consumer
   inside `notification-service`.
4. Add network failure/timeout handling to the new HTTP adapter — something the in-process call
   never needed (see `05-architecture/pattern-guide.md` for Circuit Breaker / Retry).

## Extracting `clinical-service` and `scheduling-service` — the mutual-dependency case

These two are the most interesting extraction because, unlike `sales → catalog` (a one-way
dependency), **they depend on each other**:

- Scheduling needs to know "does this pet belong to this owner?" before booking an appointment
  → calls Clinical's `PetVerificationPort` (implemented by `SchedulingPetVerificationAdapter`,
  which lives in `scheduling/infrastructure/adapters/` and calls Clinical's own
  `PET_VERIFICATION_PORT`).
- Clinical needs to know "is this appointment COMPLETED?" before accepting a medical record →
  calls Scheduling's `AppointmentStatusPort` (implemented by `AppointmentStatusAdapter`, which
  lives in `scheduling/infrastructure/adapters/` and is exported so Clinical can inject it).

In the monolith this is resolved with NestJS's `forwardRef()` on both `ClinicalModule` and
`SchedulingModule` — a module-resolution circularity that Nest supports natively, and that has
zero cost because both calls are plain function calls in the same process.

**That free ride ends the moment these become two separate services.** Two independent HTTP
services calling each other synchronously means:

- Neither can start up, be deployed, or be load-tested in true isolation — each needs the other
  reachable for its own writes to succeed.
- Neither call is a deadlock by itself (it's "Scheduling's *booking* endpoint calls Clinical" and
  separately "Clinical's *add-medical-record* endpoint calls Scheduling" — not the same request
  bouncing back and forth), but the **bidirectional coupling** is exactly the kind of thing a
  bounded-context split is supposed to reduce, not just relocate over the network.

### Two ways to resolve it

| Option | How | Trade-off |
|--------|-----|-----------|
| **A — Keep it synchronous** | Each adapter becomes an `HttpXxxAdapter` implementing the same port, calling the other service's REST endpoint (e.g. `GET /internal/pets/:id/ownership`, `GET /internal/appointments/:id/status`) | Simplest to implement (same code shape as `sales → catalog`), but now needs Circuit Breaker + Retry + timeout budgets on *both* sides, and neither service can come up cleanly if the other is down |
| **B — Break it with events + local read-models (recommended)** | Clinical publishes `PetRegistered`; Scheduling consumes it into a tiny local `pet_ownership_cache` table it owns, so booking never calls Clinical at request time. Scheduling publishes `AppointmentCompleted`; Clinical consumes it into a local `completed_appointments` flag, so adding a medical record never calls Scheduling at request time | Removes the synchronous coupling entirely — each service becomes independently deployable and testable — at the cost of eventual consistency (a pet registered or an appointment completed a few hundred ms ago might not be visible yet) |

Option B is the textbook Strangler Fig / DDD answer to a mutual dependency: convert a
synchronous "ask the other context" into an asynchronous "keep a local copy of the one fact I
need, updated via that context's own domain events." It is also exactly what the two gaps below
already call out as deliberately unsolved in this MVP.

**What does NOT change either way:** `Pet`, `MedicalRecord`, `Appointment` (entities), their
invariants (`INV-PET-*`, `INV-MEDREC-*`, `INV-APPT-*`), the use cases, the HTTP controllers.

## What this MVP deliberately does not solve yet

So as not to hide the pedagogical problem behind "already solved":

- **Distributed transactions / Saga:** today `CheckoutUseCase` calls Catalog and then saves the
  `Order` in the same in-process transaction. Splitting the services turns this into a Saga
  (reserve stock → create order → compensate if something fails) — see
  `05-architecture/pattern-guide.md`.
- **Event idempotency:** the in-memory listener doesn't need to deduplicate; a real RabbitMQ
  consumer does (at-least-once delivery, see `02-domain/domain-events.md`). This also applies to
  the `PetRegistered` / `AppointmentCompleted` consumers from Option B above.
- **Circuit breakers / timeouts** on cross-context calls: none exist here because an in-process
  function call never fails over the network. This is the concrete cost that Option A (above)
  would introduce for `clinical-service` ↔ `scheduling-service`.

These three points are exactly the natural syllabus of "what breaks when you split a monolith
into microservices" — the class exercise.
