# Amaranta — MVP (monolito modular)

MVP de **Amaranta** (tienda + clínica veterinaria) implementado como un **monolito modular**
con **NestJS + PostgreSQL** en el backend y **Next.js** en el frontend. El código vive fuera
del repo de documentación (`amaranta-shop-docs`) a propósito: este es el proyecto de
implementación, ese otro es el scaffold de documentación del curso.

El objetivo pedagógico es que el monolito ya esté organizado **como si fueran varios
microservicios que aún no se separaron** — cada bounded context es un módulo de NestJS con
arquitectura hexagonal completa (dominio / aplicación / infraestructura), su propio schema de
PostgreSQL, y los puntos de integración con otros contextos pasan siempre por un _puerto_. Ver
[`docs/path-to-microservices.md`](./docs/path-to-microservices.md) para el ejercicio de
extracción.

## Historias de usuario implementadas

| HU    | Contexto          | Descripción                                         |
| ----- | ----------------- | --------------------------------------------------- |
| HU-01 | Identity & Access | Registro de cliente (`POST /auth/register`)         |
| HU-02 | Catalog           | Explorar el catálogo de productos (`GET /products`) |
| HU-03 | Sales             | Carrito y checkout (`POST /orders`, `GET /orders`)  |

`POST /auth/login` también existe: es infraestructura de soporte (emite el JWT que exige el
checkout), no una cuarta HU — corresponde a HU-IAM-002 en el backlog completo.

## Stack

| Capa               | Tecnología                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| Backend            | Node.js 20, NestJS, TypeScript, TypeORM                                                 |
| Frontend           | Next.js 14 (App Router), React 18, Tailwind CSS                                         |
| Base de datos      | PostgreSQL 16 — un schema por bounded context (`identity`, `catalog`, `sales`)          |
| Autenticación      | JWT (passport-jwt), bcryptjs                                                            |
| Eventos de dominio | `EventEmitter2` en memoria — sustituto local de RabbitMQ (ver ADR-003 del repo de docs) |

## Arquitectura

Cada bounded context (`identity`, `catalog`, `sales`) sigue la misma estructura, calcada de
`05-architecture/hexagonal-architecture.md` del repo de documentación:

```
src/<contexto>/
├── domain/            # Entidades, Value Objects, eventos, puertos (in/out) — sin dependencias externas
├── application/        # Casos de uso — orquestan el dominio, implementan los puertos "in"
└── infrastructure/
    ├── http/            # Controladores REST (adaptador primario)
    ├── persistence/      # TypeORM entity + mapper + repositorio (adaptador secundario)
    ├── security/         # JWT, bcrypt (solo identity)
    └── adapters/          # Adaptadores hacia OTROS contextos (solo sales → catalog)
```

**La regla de dependencia** (`domain` no importa nada de `application` ni `infrastructure`) se
cumple en todo el código. Los tests de dominio (`*.spec.ts`) no arrancan Nest ni tocan una base
de datos real — son pruebas puras contra las entidades.

### Cómo Sales habla con Catalog

`sales` necesita validar precio y stock de Catalog al hacer checkout. En vez de importar el
repositorio de Catalog directamente, `sales/domain/ports/out/product-stock.port.ts` define lo
que Sales _necesita_, y `sales/infrastructure/adapters/catalog-stock.adapter.ts` lo implementa
llamando al caso de uso de Catalog **en el mismo proceso**. Ese archivo es literalmente el único
lugar que cambiaría el día que `sales` se separe en su propio servicio — se reemplaza por un
adaptador HTTP que llama a `catalog-service`, sin tocar `domain/` ni `application/`.

### Eventos de dominio

`Order.checkout()` produce un evento `OrderCreated` (ver `02-domain/domain-events.md`). Se
publica a través de `EventPublisherPort`, implementado hoy por `InProcessEventPublisher`
(usa `@nestjs/event-emitter`). Un listener (`OrderCreatedListener`) simula lo que haría
`notification-service`: solo imprime un log. Extraer Sales a su propio servicio implica
cambiar ese publisher por uno de RabbitMQ — de nuevo, sin tocar el dominio.

## Cómo correrlo

### Opción A — Docker Compose (recomendado)

```bash
cp .env.example .env
docker compose up --build
```

- API: http://localhost:8080 (docs interactivos en http://localhost:8080/api-docs)
- Web: http://localhost:3000
- PostgreSQL: localhost:5432 (usuario/clave `amaranta`/`amaranta`, ver `db/init/` para el schema y los datos semilla)

### Opción B — Local, sin Docker para el código (solo Postgres en Docker)

```bash
docker compose up -d postgres

cd apps/api
cp .env.example .env
npm install
npm run dev        # http://localhost:8080

cd ../web
cp .env.example .env
npm install
npm run dev         # http://localhost:3000
```

### Tests

```bash
cd apps/api
npm test
```

## Estructura del repo

```
amaranta-shop-mvp/
├── apps/
│   ├── api/     # NestJS — identity, catalog, sales
│   └── web/     # Next.js — tienda, login, registro, carrito, pedidos
├── db/init/     # Schemas + tablas + seed, montados en el contenedor de Postgres
├── docs/        # Notas de este proyecto (mapeo a microservicios)
└── docker-compose.yml
```
