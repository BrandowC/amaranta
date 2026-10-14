# ADR-010 — Corte 2 como release distribuido

- **Estado:** aceptado como plan de implementación
- **Fecha:** 2026-10-09
- **Alcance:** MVP 2 / Corte 2

## Contexto

El baseline integrado en `develop` contiene Catalog, Sales, Scheduling, Clinical
y Web dentro del repositorio transicional. Eso demuestra integración de código,
pero no cumple por sí solo la rúbrica de servicios comunicándose por contratos,
consistencia mediante Saga/Outbox y configuración por ambiente.

## Decisión

El camino crítico será Catalog -> Sales -> HTTP -> Saga/compensación ->
Transactional Outbox -> RabbitMQ -> worker idempotente. Los demás contextos pueden
permanecer planificados o scaffolded si la asignatura no exige su implementación
completa en este corte.

Cada servicio debe tener:

- runtime y base de datos propios;
- contrato versionado y pruebas de contrato;
- configuración explícita para dev/qa/prod;
- health liveness/readiness;
- migraciones y evidencia de persistencia;
- PR por ambiente.

## Invariantes

1. Sales nunca accede a `catalog_db`.
2. Un `orderId` no puede reservar ni liberar stock dos veces.
3. Un timeout no equivale a una reserva confirmada.
4. `Order`, `SagaState` y `OutboxEvent` se confirman en una transacción local.
5. El consumidor confirma RabbitMQ después de persistir el efecto.
6. `eventId` procesado dos veces produce un solo efecto observable.
7. `v2.0.0` solo se crea desde `main` después de QA y demo de fallo.

## Alternativas rechazadas

- Promover `develop` directamente a `main`: omite QA y la evidencia del release.
- Simular HTTP dentro del monolito: no demuestra fallo de red ni parcialidad.
- Prometer exactly-once: RabbitMQ y la red requieren at-least-once más deduplicación.
- Inventar los repositorios 07–17: rompe trazabilidad y ownership académico.
