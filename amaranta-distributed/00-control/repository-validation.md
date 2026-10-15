# Validación de repositorios oficiales

**Fecha:** 2026-10-15.

**Método:** descubrimiento con `gh repo list code-corhuila`, clon HTTPS, inspección de
`origin`, HEAD, ramas, CODEOWNERS, README, CI, build files, scripts y árboles de código.

**Clones:** `01-repositories/official/` (no se sobrescribieron las copias locales del monorepo).

## Resultado

| Repositorio | Rama por defecto | Permiso | Evidencia de código | Clasificación |
| --- | --- | --- | --- | --- |
| `amaranta-shop-catalog-api` | `develop` | READ | Python 3.12/FastAPI, 62 archivos fuente, 21 pruebas, Docker y scripts smoke/integration | IMPLEMENTED |
| `amaranta-shop-catalog-db` | `develop` | READ | Liquibase/Mongo, validator, índices, seed, roles y `rebuild-check.sh` | IMPLEMENTED |
| `amaranta-shop-catalog-portal` | `develop` | READ | `develop` sólo tiene README; seis ramas de UI contienen código sin integrar | PARTIAL |
| `amaranta-shop-sales-api` | `develop` | READ | Java 21/Spring, 73 archivos fuente, 22 pruebas, Maven, Docker y E2E con Catalog | IMPLEMENTED |
| `amaranta-shop-sales-db` | `develop` | READ | Flyway/PostgreSQL, schema, `idempotency_key`, roles y `rebuild-check.sh` | IMPLEMENTED |
| `amaranta-shop-sales-portal` | `develop` | READ | React/Vite, 38 archivos fuente, 18 pruebas y script E2E real | IMPLEMENTED |
| `amaranta-shop-api-gateway` | `develop` | READ | `develop` sólo tiene README; Nginx y rutas existen en ramas no integradas | PARTIAL |
| `amaranta-shop-front` | `develop` | READ | `develop` sólo tiene README; shell y remotes existen en ramas no integradas | PARTIAL |
| `amaranta-shop-security` | `develop` | READ | README declara explícitamente que la implementación está pendiente | DESIGN_ONLY |
| `amaranta-shop-worker` | `develop` | READ | Sólo gobierno y README | DESIGN_ONLY |
| `amaranta-shop-workflow` | `develop` | READ | Sólo gobierno y README | DESIGN_ONLY |
| `amaranta-shop-docs` | `main` | WRITE | 109 documentos: ADR, contratos OpenAPI, requisitos, gobierno y runbooks | IMPLEMENTED |

Todos los clones están limpios, tienen `origin` HTTPS en `code-corhuila/*` y
CODEOWNERS. Los repositorios de código exponen `develop`, `qa` y `main`; Docs usa
solamente `main` como define la política oficial.

## Ramas no integradas relevantes

| Repositorio | Ramas detectadas fuera de `develop` | Implicación |
| --- | --- | --- |
| Gateway | `chore/nginx-skeleton`, `feat/catalog-routes`, `feat/sales-routes`, `feat/workflow-route` | Existe Nginx, health checks, tests y rutas; requiere PR a `develop`. |
| Catalog Portal | `chore/react-skeleton`, `feat/catalog-api-client`, `feat/product-list`, `feat/product-detail`, `feat/add-to-cart`, `feat/catalog-admin` | Existe implementación de interfaz; requiere promoción ordenada. |
| Front | `chore/react-skeleton`, `feat/shell-and-remotes`, `feat/api-client`, `feat/cart-for-portals`, `feat/auth-for-portals`, `feat/session-and-guard` | Existe shell y capacidades compartidas; requiere promoción ordenada. |

Estas ramas no están incluidas en `develop`; el onboarding no hizo PR, merge ni
`cherry-pick`.

## Pruebas y límites de validación local

Los repositorios implementados incluyen comandos reproducibles:

- Catalog API: `scripts/py.sh pytest`, `integration-test.sh`, `smoke-test.sh`.
- Catalog DB: `scripts/rebuild-check.sh`.
- Sales API: `scripts/mvn.sh verify`, `integration-test.sh`, `smoke-test.sh`, `e2e-with-catalog.sh`.
- Sales DB: `scripts/rebuild-check.sh`.
- Sales Portal: `scripts/test.sh`, `e2e-real-stack.sh`.

La ejecución local de Catalog quedó bloqueada antes de iniciar las pruebas porque
Docker Desktop no pudo resolver `production.cloudfront.docker.com` al descargar
`python:3.12-slim`. Las dependencias Python tampoco están instaladas en el host.
Por ello este baseline no declara tests locales verdes. Las ejecuciones de CI más
recientes visibles para Catalog API, Sales API y Sales Portal figuran fallidas,
pero los logs no pudieron descargarse por la misma restricción de conectividad;
su causa se registra como **UNKNOWN**, no como defecto de código.

## Infraestructura no accesible

No se pudieron resolver en `code-corhuila`:

- `amaranta-shop-infra-postgres`
- `amaranta-shop-infra-mongo`
- `amaranta-shop-security-db`

Los scripts de base de datos pueden crear instancias efímeras para pruebas; el
stack persistente no puede declararse listo mientras estos repositorios sigan
sin acceso o sin una sustitución oficial documentada.

## Decisión de siguiente paso

**P0:** promover la ruta de Gateway para Catalog mediante el flujo existente
`feat/catalog-routes -> PR -> develop`. Después se incorpora la ruta de Sales con
su propia revisión. No se inicia un Gateway nuevo ni se reimplementan Catalog o
Sales.

**Rama existente a revisar:** `feat/catalog-routes`.  
**Base esperada del PR:** `develop`.  
**HU asociada:** `HU-CAT-001` (consulta pública de catálogo); la historia de
Gateway no tiene identificador independiente en el registro oficial, por lo que
no se inventa uno.
