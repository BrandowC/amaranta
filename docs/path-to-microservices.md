# Del monolito a microservicios — guía de extracción

Este documento explica, módulo por módulo, qué cambiaría para separar `identity`, `catalog` y
`sales` en los microservicios ya diseñados en `amaranta-shop-docs/09-microservices/`. La idea
es que el monolito de este repo **ya está cortado por las costuras correctas** — extraer un
módulo es (casi) solo mover carpetas y cambiar adaptadores, no rediseñar el dominio.

## Por qué ya está "pre-cortado"

1. **Un módulo de NestJS por bounded context**, cada uno con su propio `domain/`,
   `application/`, `infrastructure/` — nunca se importan entidades de dominio entre módulos.
2. **Un schema de PostgreSQL por contexto** (`identity`, `catalog`, `sales`) dentro de la misma
   instancia — el día de la extracción cada schema se vuelve la base de datos de su propio
   servicio (`06-data/models.md`, principio "Database per Service").
3. **Toda comunicación entre contextos pasa por un puerto**, nunca por un import directo de
   otro módulo de dominio. Hoy esos puertos se implementan con una llamada en el mismo proceso;
   mañana se implementan con HTTP o eventos.

## Extracción de `catalog-service`

| Hoy (monolito) | Microservicio (`09-microservices/services/`) |
|-----------------|----------------------------------------------|
| `src/catalog/` completo | Nuevo repo/proyecto NestJS, mismo código de `domain/` y `application/` sin cambios |
| Schema `catalog` en la instancia compartida de Postgres | Su propia instancia de PostgreSQL |
| `sales/infrastructure/adapters/catalog-stock.adapter.ts` llama `ReserveStockUseCase` en el mismo proceso | Se reemplaza por un `HttpProductStockAdapter` que hace `POST` a `catalog-service` (contrato en `07-api/contracts/openapi/`) |
| No hay eventos de stock | `ReserveStockUseCase` empieza a publicar `StockReserved` / `StockDepleted` a RabbitMQ (`02-domain/domain-events.md`) |

**Lo que NO cambia:** `Product` (entidad), sus invariantes (`INV-PRODUCT-001/002`),
`ListProductsUseCase`, `ReserveStockUseCase`, el controlador HTTP.

## Extracción de `identity-service`

| Hoy (monolito) | Microservicio |
|-----------------|----------------|
| `src/identity/` completo | Nuevo repo, mismo dominio/aplicación |
| Otros módulos usan `JwtStrategy`/`JwtAuthGuard` importados directamente de `identity` | Se vuelve un **Open Host Service**: los demás servicios solo verifican la firma del JWT (misma clave pública/simétrica), sin llamar a `identity-service` en cada request — así lo describe `02-domain/domain-map.md` |
| Un solo proceso valida el token | Kong (API Gateway) valida el JWT en el borde; cada servicio lo revalida si necesita el `role` |

**Lo que NO cambia:** `User` (entidad), `RegisterUserUseCase`, `LoginUseCase`, las reglas
`INV-USER-001/002`.

## Extracción de `sales-service`

Es el más ilustrativo porque **depende de otro contexto**:

1. Mover `src/sales/` a su propio proyecto, con su propio schema `sales` como base de datos.
2. Reemplazar `CatalogStockAdapter` (llamada en proceso) por un adaptador HTTP/gRPC hacia
   `catalog-service`, implementando el mismo `ProductStockPort` — el caso de uso
   `CheckoutUseCase` no se entera del cambio.
3. Reemplazar `InProcessEventPublisher` por un publisher de RabbitMQ; `OrderCreatedListener`
   (el "notification-service" simulado) se borra de este código y se convierte en el consumidor
   real dentro de `notification-service`.
4. Añadir manejo de fallos de red / timeouts en el nuevo adaptador HTTP — algo que la llamada en
   proceso no necesitaba (ver `05-architecture/pattern-guide.md` para Circuit Breaker / Retry).

## Lo que este MVP deliberadamente NO resuelve todavía

Para no ocultar el problema pedagógico detrás de "ya está resuelto":

- **Transacciones distribuidas / Saga:** hoy `CheckoutUseCase` llama a Catalog y luego guarda el
  `Order` en la misma transacción de proceso. Al separar los servicios, esto se vuelve una Saga
  (reservar stock → crear orden → compensar si algo falla) — ver `05-architecture/pattern-guide.md`.
- **Idempotencia de eventos:** el listener en memoria no necesita deduplicar; un consumidor real
  de RabbitMQ sí (at-least-once delivery, ver `02-domain/domain-events.md`).
- **Circuit breaker / timeouts** en las llamadas cross-context: no existen aquí porque una
  llamada de función nunca falla por red.

Estos tres puntos son justamente el temario natural de "qué se rompe cuando separas un
monolito en microservicios" — el ejercicio de clase.
