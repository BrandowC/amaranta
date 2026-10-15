# Olas de integración del ecosistema real

## Regla de promoción

Cada ola usa el siguiente recorrido por repositorio:

```text
feat/* | fix/* | chore/* -> PR -> develop
commit aprobado -> cherry-pick -x -> qa/<work-item> -> PR -> qa
commit validado en QA -> cherry-pick -x -> release/<version> -> PR -> main
```

No se permiten merges entre ramas permanentes. `main` requiere aprobación de
`ariel5253`, CODEOWNERS y los checks requeridos.

## Ola 0 — Baseline (completada)

- Inventario de 12 repositorios accesibles y clones oficiales aislados.
- Clasificación por código y por rama.
- Infra Postgres, Infra Mongo y Security DB registrados como bloqueados por acceso.

## Ola 1 — Gateway de los dominios ya implementados (P0)

| Orden | Repositorio | Rama existente | Objetivo |
| ---: | --- | --- | --- |
| 1 | API Gateway | `feat/catalog-routes` | Exponer sólo `/api/v1/products*` y administración pública autorizada hacia Catalog. |
| 2 | API Gateway | `feat/sales-routes` | Exponer `/api/v1/orders*` hacia Sales, con CORS, headers y límites. |

Cada rama pasa por su PR a `develop`; no se combinan mediante merge entre
permanentes ni se crea una implementación paralela.

## Ola 2 — Ensamblaje de interfaz

- Promover el esqueleto del Front y los remotes necesarios de Catalog Portal.
- Verificar que Sales Portal se cargue desde el shell y use rutas relativas del
  Gateway, nunca una URL de servicio hardcodeada.

## Ola 3 — Primer E2E reproducible

- Resolver la conectividad de Docker y confirmar acceso a las imágenes.
- Ejecutar el E2E del Sales Portal con los SHAs promovidos.
- Guardar resultado de checkout, idempotencia, stock, correlación y cleanup.

## Ola 4 — Capacidades posteriores

- Workflow y Worker sólo después de definir su primer caso de negocio y contrato.
- Security sólo después de desbloquear o crear el repositorio de Security DB.
- Infra persistente sólo cuando `amaranta-shop-infra-postgres` y
  `amaranta-shop-infra-mongo` sean accesibles o exista una alternativa aprobada.
