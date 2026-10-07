# AMARANTA MVP2 EXECUTION BASELINE

Ejecución local: 2026-10-07. Resultado: **primer bloque HU-CAT-001 implementado y
verificado; MVP2 completo pendiente**. Detener aquí para revisión humana.

## Estado Git

| Campo | Resultado |
|---|---|
| REPOSITORY | `C:\Users\Manuel\Desktop\Seemestre 8\Sistma distribuidos\amaranta` |
| REMOTE | `https://github.com/BrandowC/amaranta.git` |
| BRANCH | `hu-cat-001-dev` |
| UPSTREAM | ninguno; rama local creada con --no-track |
| HEAD funcional probado | `a05382390800bb1d24071b0997740f30c2b18a61` |
| SYNC | main sincronizado ff-only; trabajo basado en origin/develop 56827f3 |
| BASELINE main | `0a88c105025300573afa2f15ecf200451ed980ed` |
| BASELINE develop | `56827f30ddd282ba91254eff5b3c6c5a9978cbe3` |
| LAST FETCH | 2026-10-07 19:17:45 UTC |
| WORKTREE | código funcional comprometido; este informe y documentos de cierre se incorporan en el commit docs(release) siguiente |

El HEAD final incluye además el commit de documentación que contiene este archivo;
obtenerlo con `git rev-parse HEAD`. No se hace auto-referencia a un SHA aún no creado.
La respuesta de cierre proporciona el HEAD final y el estado limpio comprobado.

Commits reales hasta el informe:

1. `5947df3e5a571311341cf994da9f7d906709b260` — docs(mvp2): freeze baseline and catalog scope.
2. `a05382390800bb1d24071b0997740f30c2b18a61` — feat(catalog): add independent catalog read service.

Ambos tienen `Refs: HU-CAT-001`. El cierre documental usa el mismo footer.
No hubo push, PR, merge, tag, rebase, reset ni modificación de historia.

## CURRENT ARCHITECTURE y FROZEN MVP2 SCOPE

Actual: monolito heredado conservado + nuevo Catalog de consulta en 8081 con su
propia catalog_db en 55432. La tienda todavía usa el monolito y su stock.
El nuevo Catalog no requiere Identity, Sales, claves JWT ni base heredada para iniciar.

Objetivo congelado: Client → Sales → sales_db y Sales → Catalog → catalog_db;
Saga durable con reserva/compensación, Outbox transaccional, RabbitMQ y worker
idempotente del contexto Sales. No Clinical/Scheduling/PDF/IA/Redis/Kubernetes nuevos.
Diagramas, ownership, mapas sync/async y fallos en [architecture.md](architecture.md).

## MVP2 GAP y prioridades

La matriz completa A–Z, con STATUS/EVIDENCE/RISK/ACTION/PRIORITY anterior al cambio,
está en [baseline.md](baseline.md). Después de este bloque:

- IMPLEMENTED en el nuevo Catalog: runtime independiente **de consulta**, DB propia,
  contrato HTTP de lectura, migración, live/ready, config dev/qa/prod,
  pruebas unitarias/integración/contrato provider y log con correlationId.
- PARTIAL: extracción total de Catalog y eliminación de DB compartida a nivel del
  sistema; aún falta mover administración/reservas y hacer cutover de datos/tráfico.
- P0 pendiente: HU-CAT-002 reserva idempotente/ownership; Sales independiente + sales_db;
  contrato Sales–Catalog de escritura; Saga/compensación; Outbox, RabbitMQ runtime,
  worker, inbox, retry/DLQ y sus pruebas de fallos.
- P1: métricas/trazas operativas, CI y endurecimiento de despliegue.
- P2: optimización de capacidad después de medir, sin añadir infraestructura ajena al alcance.

PROPOSED HU: IDs oficiales HU-CAT-001/002 y HU-SALES-001/002/003; tareas y aceptación
en [backlog.md](backlog.md). No se creó una numeración MVP2 ficticia.
PROPOSED BRANCH aplicada: hu-cat-001-dev desde develop.
PROPOSED FIRST COMMIT aplicado: docs(mvp2): freeze baseline and catalog scope.

## FIRST IMPLEMENTATION BLOCK / FILES CHANGED

El commit funcional contiene 28 archivos, 8.557 líneas añadidas, de las cuales
7.650 pertenecen al lockfile reproducible. Es una unidad funcional con sus tests.

| Archivos | Cambio |
|---|---|
| apps/catalog/package.json, package-lock.json, tsconfig.json, tsconfig.build.json | paquete/build/test propios |
| apps/catalog/.eslintrc.cjs, .prettierrc.json, .dockerignore, Dockerfile | lint/format e imagen con npm ci y usuario node |
| apps/catalog/.env.dev.example, .env.qa.example, .env.prod.example | configuración documentada por ambiente |
| apps/catalog/src/config.ts, main.ts, app.ts | validación, bootstrap, DI, shutdown, CORS y correlationId |
| apps/catalog/src/domain/product-query.port.ts | puerto/proyección de dominio sin I/O |
| apps/catalog/src/application/list-products.ts | HU-CAT-001, COP y disponibilidad |
| apps/catalog/src/infrastructure/product.repository.ts | consultas parametrizadas y snapshot de paginación |
| apps/catalog/src/infrastructure/catalog.controller.ts | HTTP versionado, validación y salud |
| apps/catalog/src/infrastructure/database.ts | conexión propia, synchronize=false, ledger fijado en public |
| apps/catalog/src/infrastructure/migrations/1791331200000-catalog-products.ts | tabla y restricciones Catalog; migración registrada |
| apps/catalog/contracts/openapi.json | contrato v1 verificable |
| apps/catalog/test/config.spec.ts, list-products.spec.ts, catalog.integration.spec.ts | pruebas ejecutadas |
| apps/catalog/README.md | arranque, tests y fallo reproducibles |
| docker-compose.catalog.yml, docker-compose.yml | Compose autónomo e integrado |
| .gitignore | ignorar archivos reales de configuración por ambiente |
| README.md, CHANGELOG.md | orientar al incremento y declarar límites de Unreleased |
| docs/adr/ADR-MVP2-catalog-first.md | decisiones y contradicciones pendientes para Saga |
| docs/mvp2/{baseline,architecture,backlog,demo,individual-evidence-proposal,execution}.md | análisis, roadmap, demo y evidencia |

No se cambió código de apps/api, apps/web ni db/init respecto de develop.
No se modificaron los repositorios vecinos ni datos heredados.

## TEST STATUS

Host: Node v22.22.2 / npm 10.9.7; imagen Docker node:20-alpine; PostgreSQL 16.

| Comando / validación | Resultado real |
|---|---|
| API baseline main: npm test -- --runInBand | 3 suites, 15 tests aprobados |
| API baseline develop: npm test -- --runInBand | 5 suites, 28 tests aprobados |
| API baseline main/develop: build + ESLint | aprobados antes de modificar |
| Catalog npm run format:check | aprobado; formato final también aplicado después del test de regresión |
| Catalog npm run lint | aprobado con fuente y test de regresión finales |
| Catalog npm run build | aprobado con fuente final |
| Catalog npm test | 2 suites, 22 tests aprobados |
| Catalog npm run test:integration | 1 suite, 13 tests aprobados; PostgreSQL real + HTTP + contrato provider |
| git diff --cached --check | aprobado antes del commit funcional |
| docker compose -f docker-compose.catalog.yml config --quiet | aprobado |
| docker compose config --quiet (integrado) | aprobado con claves RSA efímeras inyectadas solo en el proceso, no persistidas |
| Docker build final + up -d --wait catalog | aprobado |
| Docker restart catalog + up -d --wait catalog | aprobado; migración y datos conservados |

Las 13 pruebas de integración cubren activos/inactivos, stock cero, COP, paginación,
requests inválidos, restricciones de DB, ausencia de schemas ajenos, idempotencia del
runner de migración, contrato de respuesta y rechazo de precio string, ready sin DB,
y reinicio con search_path catalog/public. No son todavía tests del consumidor Sales.

## DOCKER STATUS y failure scenario observado

Servicio final `amaranta-catalog-1` saludable, URL `http://localhost:8081`.
`amaranta-catalog-db-1` saludable; base de tests detenida al terminar para liberar recursos.
Imagen final: `amaranta-catalog:latest`, manifest
`sha256:0d931713047ea9fa31db6ff1ea79d31ba3a13ea5a49ff092487217b149120478`.

Observaciones reales del smoke y del fallo, 2026-10-07:

```text
GET /v1/products -> 200 {"items":[],"page":1,"pageSize":50,"total":0}
x-correlation-id: hu-cat-001-smoke  (eco del header de la petición)
GET /health/ready -> 200 {"status":"ok","service":"catalog","database":"up"}
stop catalog-db
GET /health/ready -> 503 Catalog database unavailable
GET /health/live  -> 200 {"status":"ok","service":"catalog"}
start catalog-db + esperar healthy
GET /health/ready -> 200
```

Después del reinicio final, SQL verificó:

```text
current_database: catalog_db
catalog.products
public.migrations -> CatalogProducts1791331200000 (una fila)
```

El catálogo vacío es real y esperado: no se importaron productos legacy.
Fixtures de tests se insertaron únicamente en la DB efímera de pruebas.

Incidencias resueltas durante implementación: fixture con parámetro UUID/text sin
cast explícito; primer build intentado antes de terminar lockfile; búsqueda del ledger
en schema catalog al reiniciar como usuario catalog. Se corrigieron y repitieron las
verificaciones afectadas. Se retiró solo la tabla catalog.migrations vacía creada por
ese intento fallido en la nueva DB; public.migrations y products se conservaron.

Limitaciones de entorno observadas: DNS Docker Hub intermitente (baseline postgres:16-alpine
y un rebuild node:20-alpine fallaron; build final de Catalog pasó al reintentar).
El stack legacy completo no quedó levantado: requiere sus claves RS256 y 5432 está
ocupado por otro proyecto. Se validó su configuración integrada, no su operación completa.
No se detuvo ni se alteró ese otro contenedor. El Docker de Catalog sí está operativo.

## RESULT / DIFF SUMMARY / RISKS / NEXT HU

RESULT: primer bloque de consulta independiente completo y probado; separación
transaccional de todo el catálogo todavía PARTIAL. No confundirlo con MVP2 terminado.

RISKS:

1. No dirigir la tienda al nuevo dataset hasta migrar UUID/stock y transferir reservas.
2. FR-006 del repo docs propone descuento por evento; el diseño de reserva síncrona
   necesita revisarlo para evitar doble descuento.
3. Migraciones al startup para una réplica; antes de escalar, usar job exclusivo.
4. QA/prod tienen validación y ejemplos, no despliegues ni credenciales reales verificados.
5. NN-week y TEAM no confirmados; propuesta individual preservada sin publicar ni
   inventar ceremonias, PR, aprobación, URLs o evidencia de CI.

NEXT HU: **HU-CAT-002**, ownership de escritura, reservas idempotentes y release.
Después: extracción Sales y flujo distribuido, según dependencias de backlog.md.
Guion objetivo de 15 pasos en demo.md; v2.0.0 es una meta futura, sin tag creado.

STOP HERE. Sin push, PR, merge ni tag. Revisar antes de continuar.
