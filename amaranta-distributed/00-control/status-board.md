# Status board — baseline real del ecosistema

**Corte de evidencia:** 15 de octubre de 2026.

**Fuente:** clones oficiales en `01-repositories/official/`; cada clon conserva su origen
`code-corhuila/*` y no modifica la copia local del monorepo.

| Estado | Cantidad | Repositorios |
| --- | ---: | --- |
| IMPLEMENTED | 6 | Catalog API, Catalog DB, Sales API, Sales DB, Sales Portal, Docs |
| PARTIAL | 3 | API Gateway, Front, Catalog Portal |
| DESIGN_ONLY | 3 | Security, Worker, Workflow |
| BLOCKED | 3 referencias | Infra Postgres, Infra Mongo y Security DB no son accesibles en la organización |

## Hallazgo operativo

Catalog y Sales ya son servicios reales y autónomos: Python/FastAPI/MongoDB para
Catalog y Java/Spring/PostgreSQL para Sales. Sus repositorios incluyen pruebas,
contenedores y scripts de integración. No deben reimplementarse desde el monorepo.

El bloqueo para ensamblar el flujo real es el **Gateway**: `develop` contiene sólo
su README, aunque existen ramas no integradas que implementan Nginx, health checks y
rutas de Catalog, Sales y Workflow. Front y Catalog Portal tienen la misma condición.

## Promoción obligatoria

```text
feat/* | fix/* | chore/* -> PR -> develop
develop aprobado -> cherry-pick -x -> qa/<work-item> -> PR -> qa
QA validado -> cherry-pick -x -> release/<version> -> PR -> main
```

No se permiten `merge develop -> qa` ni `merge qa -> main`. `main` requiere una
aprobación de `ariel5253` y CODEOWNERS.

## P0 actual

Completar la promoción por PR de las rutas ya implementadas en
`amaranta-shop-api-gateway` hacia `develop`, iniciando con
`feat/catalog-routes` y con base esperada `develop`. El Gateway debe publicar sólo
las rutas públicas de Catalog y Sales; los endpoints internos de reserva de stock
continúan fuera de su superficie pública.

La evidencia detallada está en `repository-validation.md`, la dependencia de
servicios en `integration-trace.md` y las olas de integración en `migration-waves.md`.
