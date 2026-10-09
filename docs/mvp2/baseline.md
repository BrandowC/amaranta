# AMARANTA MVP2 EXECUTION BASELINE

Fecha: 2026-10-07. Este documento congela la inspección **anterior al cambio**.
Los resultados posteriores se registran en `execution.md`.

## Sincronización y baseline reproducible

| Campo | Evidencia |
|---|---|
| REPOSITORY | `C:\Users\Manuel\Desktop\Seemestre 8\Sistma distribuidos\amaranta` |
| REMOTE | `https://github.com/BrandowC/amaranta.git` (origin, fetch/push) |
| BRANCH inicial | `main` |
| UPSTREAM inicial | `origin/main` |
| HEAD inicial | `0a88c105025300573afa2f15ecf200451ed980ed` |
| WORKTREE inicial | limpio |
| LAST FETCH | 2026-10-07 19:17:45 UTC, según `.git/FETCH_HEAD` |
| SYNC STATUS | fetch correcto; `git pull --ff-only`: Already up to date |
| Baseline de implementación | `origin/develop`: `56827f30ddd282ba91254eff5b3c6c5a9978cbe3` |
| qa | `origin/qa`: `4244a3f6d699c19ae83d4d7f306e768f398d6bfc` |
| Rama de trabajo | `hu-cat-001-dev`, creada sin upstream desde el SHA de develop |
| Tags | ninguno en la inspección |

Secuencia ejecutada: `git status`, `git remote -v`, `git branch --show-current`,
`git branch -a`, `git fetch --all --prune`, `git status`, `git pull --ff-only`.
Fetch avanzó origin/develop de a3962e0 a 56827f3. No se mezclaron ramas.
`main`, `develop` y `qa` existen en origin; inicialmente solo main existía localmente.
No fue necesario crear ramas permanentes. El baseline queda identificado por SHA y
por este registro versionado, sin crear un tag.

## Inventario

- `apps/api`: NestJS 10, TypeORM, PostgreSQL; dominio/aplicación/infraestructura por contexto.
- `apps/web`: Next.js 14, React 18, Tailwind; HTTP hacia API en 8080; web en 3000.
- `db/init`: V001–V006 en main; V007–V009 añaden clinical/scheduling en develop.
  Son scripts de inicialización de volúmenes nuevos; no un runner de upgrades.
- `AppModule`: una conexión `DATABASE_URL`, `synchronize: false`, entidades auto-registradas.
- Catalog: Product, Money, ProductRepositoryPort, repositorio TypeORM,
  ListProductsUseCase, ReserveStockUseCase; develop agrega administración y depende de Identity.
- Sales: Order/OrderItem, CheckoutUseCase, ProductStockPort;
  CatalogStockAdapter importa ReserveStockUseCase directamente.
- `CheckoutUseCase`: reserva, crea y guarda pedido, luego publica evento. **No hay una
  transacción atómica que abarque esos pasos**, pese a la afirmación en la guía anterior.
- ReserveStockUseCase hace read/modify/save sin bloqueo de fila ni registro durable
  de reserva. Puede perder actualizaciones concurrentes y stock tras fallar checkout.
- EventPublisherPort → InProcessEventPublisher → EventEmitter2 → listener que solo escribe logs.
- HealthController devuelve OK sin consultar PostgreSQL.
- Swagger se genera en ejecución en `/api-docs`; no hay contrato versionado en este repo.
- `.github` contiene CODEOWNERS; no tiene workflows CI ni plantilla de PR.
- Sin ADR ni CHANGELOG propios; ADR-003 del repo vecino `amaranta-shop-docs`
  selecciona RabbitMQ. No se modificó ese repositorio.
- `docs/git-conventions.md` solo en develop: ramas por tarea, promoción por
  cherry-pick -x y PR. Referencias a branching-policy.md y plantilla PR no existen aquí.
- Develop agrega catálogo administrativo, Clinical, Scheduling y JWT RS256.
  Se preservan como código existente; no se amplían en este bloque.

## Validación anterior a cambios

- main: `npm ci`, 3 suites / 15 tests aprobados; build y ESLint aprobados.
- `docker compose config --quiet`: aprobado en main (Compose resuelve desde apps/api).
- `docker compose up --build -d`: falló al descargar postgres:16-alpine por DNS:
  `lookup production.cloudfront.docker.com: no such host`.
- Docker Desktop y daemon disponibles. El contenedor ajeno `inventario-postgres-local`
  ya ocupa 5432. No se detuvo ni se alteró.
- Develop: `npm ci`, 5 suites / 28 tests, build y ESLint aprobados antes de código nuevo.
- Develop: `docker compose config --quiet` falla por JWT_PRIVATE_KEY/JWT_PUBLIC_KEY
  ausentes. No se alteraron archivos para hacerlo pasar en esta fase.

## GAP MVP2: A–Z

Estado previo; IMPLEMENTED significa evidencia ejecutable, PARTIAL implementación incompleta,
DOCUMENTED_ONLY intención escrita, MISSING ausencia encontrada. Cada fila especifica
STATUS / EVIDENCE / RISK / ACTION / PRIORITY.

| Capacidad | STATUS | EVIDENCE | RISK | ACTION | PRIORITY |
|---|---|---|---|---|---|
| A Catalog independiente | DOCUMENTED_ONLY | docs/path-to-microservices.md; CatalogModule embebido | despliegue acoplado | runtime y DB propios, luego transferir escrituras | P0 |
| B Sales independiente | DOCUMENTED_ONLY | guía; SalesModule embebido | checkout acoplado | extraer tras contrato de reservas | P0 |
| C DB por servicio | PARTIAL | schemas en V001/V007, una DATABASE_URL | aislamiento lógico solamente | catalog_db y sales_db con credenciales propias | P0 |
| D Sin DB compartida | MISSING | AppModule y Compose: un postgres | acceso cruzado posible | conexiones y ownership exclusivos | P0 |
| E Contrato Sales–Catalog | PARTIAL | ProductStockPort y adapter in-process | tipos TS no son contrato de red | OpenAPI versionado y tests provider/consumer | P0 |
| F Reserva stock | PARTIAL | ReserveStockUseCase decrementa y guarda | carreras; sin ID de reserva | transacción, bloqueo, reservationId e idempotency key | P0 |
| G Saga | DOCUMENTED_ONLY | guía de extracción | pedido fallido deja stock descontado | estado durable y reanudación | P0 |
| H Compensación | MISSING | restoreStock existe, no flujo checkout | pérdida permanente de stock | release idempotente y reintento durable | P0 |
| I Transactional Outbox | MISSING | save(order) precede publish | caída pierde evento | pedido+outbox en misma transacción | P0 |
| J Broker | DOCUMENTED_ONLY | ADR-003 del repo docs elige RabbitMQ | EventEmitter no es durable | RabbitMQ con confirms y colas durables | P0 |
| K Consumer/worker | PARTIAL | OrderCreatedListener solo log | no consume broker ni efecto durable | proceso worker del paquete Sales | P0 |
| L Idempotency | DOCUMENTED_ONLY | ADR-003 y guía | duplicación de efectos/reservas | clave de petición e inbox UNIQUE(eventId) | P0 |
| M Retry | DOCUMENTED_ONLY | guía y ADR-003 | fallo transitorio pierde avance | presupuesto, backoff, estado durable | P0 |
| N DLQ | DOCUMENTED_ONLY | ADR-003 | poison messages bloquean consumo | intentos limitados y DLQ observable | P0 |
| O correlationId | MISSING | DomainEvent/HTTP sin propagación | imposible seguir checkout | cabecera HTTP y envelope de eventos | P0 |
| P Config dev/qa/prod | PARTIAL | .env.example y ConfigModule | defaults de dev en otros ambientes | validación y ejemplos separados | P0 |
| Q Health checks | PARTIAL | API responde OK; pg_isready en DB | falsos positivos | live y ready consultando DB | P0 |
| R Unit tests | IMPLEMENTED | main 3 suites/15 tests; specs adicionales en develop | cobertura acotada | conservar y ampliar Catalog/Saga | P0 |
| S Integration tests | MISSING | no suite PostgreSQL/HTTP | fallos de wiring no detectados | prueba con DB real y migraciones | P0 |
| T Contract tests | MISSING | Swagger sin tests | drift producer/consumer | validar responses y requests | P0 |
| U Resilience test | MISSING | ningún fallo inyectado | compensación no demostrable | cortar red/proceso y verificar convergencia | P0 |
| V Docker Compose | PARTIAL | postgres/api/web; fallo DNS observado | no demuestra servicios separados | añadir Catalog aislado; luego Sales/broker/worker | P0 |
| W Observability | PARTIAL | logs Nest/EventEmitter | faltan métricas y trazas | correlation logs P0; métricas/trazas después | P1 |
| X ADR | DOCUMENTED_ONLY | decisiones en repo vecino | código y diseño divergen | ADR local de alcance/Saga/Outbox | P0 |
| Y CHANGELOG | MISSING | sin archivo | release no auditable | Unreleased por HU, no anunciar v2.0.0 | P0 |
| Z git-flow | PARTIAL | origin main/develop/qa; convenciones | nombres difieren del curso, sin CI | HU-dev + commits; promoción por PR tras revisión | P0 |

P1: observabilidad operativa ampliada, CI reproducible y endurecimiento de credenciales/runtime.
P2: optimización de consultas y capacidad solo después de medir. Redis, Kubernetes,
Clinical, Scheduling, PDF e IA no forman parte de este incremento.

## Decisiones de alcance y trazabilidad

Ver `architecture.md`, `backlog.md` y `demo.md`. Primer bloque: consulta independiente
HU-CAT-001; catálogo administrativo y stock siguen en el monolito hasta la siguiente HU.
Esto permite levantar Catalog sin Identity/Sales, pero **no declara el cutover terminado**.
No conectar la tienda a un stock distinto al que usa checkout.

La petición reserva solo el primer bloque para implementación. No implementar Sales,
Saga, Outbox, broker ni worker durante esta ejecución. Sin push, PR, merge ni tag.
