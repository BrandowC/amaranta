# Corte 2 — MVP 2 Release Readiness

## Objetivo evaluable

Entregar un incremento versionado y ejecutable del sistema distribuido mediante:

```text
services + contracts + DB per service + Saga/compensation + Outbox/RabbitMQ
       -> Docker Compose -> QA -> main -> v2.0.0
```

El baseline integrado actual no se presenta como MVP 2 terminado. Es el punto de
partida verificable para completar la extracción y la comunicación distribuida.

## Estado congelado

| Elemento | Estado | Evidencia |
|---|---|---|
| `develop` integrado | PASS | `7510cf21a63afa88414dcc9a9c9d763ca50bd42a` |
| PRs funcionales #10/#11/#12/#14/#15 | MERGED | GitHub, integrados en `develop` |
| API | PASS | 7 suites, 40 tests, build |
| Web | PASS | production build |
| `develop -> qa` | PR abierto | PR #17, revisión independiente pendiente |
| Docker runtime | BLOCKED ambiental | Docker Hub no resuelve `production.cloudfront.docker.com` |
| Repositorios oficiales | WAITING | URLs/nombres 01–17 pendientes de confirmación |
| Catalog independiente completo | NOT STARTED | bloqueado por URL oficial |
| Sales HTTP/Saga/Outbox/RabbitMQ | NOT STARTED | depende de Catalog y Sales separados |
| `main` / `v2.0.0` | NOT READY | requiere QA completa y demo de fallo |

## Definition of Done del release

El release no se puede marcar como terminado hasta cumplir todos estos puntos:

- `docker compose up` funciona desde un entorno limpio.
- Catalog y Sales tienen procesos, contratos y bases de datos independientes.
- Sales llama a Catalog por HTTP, no mediante imports TypeScript.
- Reserva y liberación son idempotentes y resistentes a concurrencia.
- Saga persiste estados y ejecuta compensación después de un fallo inyectado.
- Order, estado Saga y Outbox se confirman en la misma transacción local de Sales.
- RabbitMQ entrega al menos una vez y el worker deduplica por `eventId`.
- Hay pruebas unitarias, integración, contrato, E2E y resiliencia.
- La promoción sigue `hu-* -> develop -> qa -> main` mediante PRs protegidos.
- CHANGELOG, ADRs, demo y evidencia individual están publicados.
- El tag `v2.0.0` apunta al commit fusionado en `main`.

## Flujo de promoción

```text
feature/HU
  -> PR develop
  -> develop integrated baseline
  -> PR #17 develop -> qa
  -> QA runtime + E2E + failure demo
  -> PR qa -> main
  -> tag v2.0.0
```

No se deben hacer merges directos a ramas permanentes ni crear el tag antes de
la aceptación de QA.

## Evidencia requerida por la sustentación

| Evidencia | Resultado esperado |
|---|---|
| Demo normal | checkout confirmado y stock reservado |
| Fallo después de reservar | pedido compensado y stock restaurado una sola vez |
| Duplicado | mismo `orderId`/`eventId` no duplica efectos |
| Broker detenido | Outbox queda pendiente y se publica al recuperar |
| Worker duplicado | inbox evita el segundo efecto |
| Configuración | `.env.example`, `qa`, `prod` sin secretos versionados |
| Git-flow | PRs enlazados a HU, reviews y promociones protegidas |
