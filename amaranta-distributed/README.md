# Amaranta distributed

Este directorio reemplaza la idea de un registro fijo de 17 repositorios. La estrategia actual es dinámica y responde a los bounded contexts que el profesor autoriza en cada momento.

## Dominio activo en este corte

- Catalog
- Sales

## Política operativa

1. No se inventan repositorios sin aprobación explícita del profesor.
2. El `repository-registry.json` es el único punto de verdad para los repos activos.
3. Cada nuevo bounded context se agrega solo cuando se abre la solicitud formal del profesor.
4. La extracción sigue siendo monolith-first, pero el servicio extraído vive en su repositorio desde el primer commit.

## Estructura actual

```text
amaranta-distributed/
├── 00-control/
│   ├── repository-registry.json
│   ├── repos.txt
│   └── status-board.md
├── 01-repositories/
│   ├── amaranta-shop-api-gateway/
│   ├── amaranta-shop-worker/
│   ├── amaranta-shop-workflow/
│   ├── amaranta-shop-front/
│   ├── amaranta-shop-catalog-db/
│   ├── amaranta-shop-catalog-api/
│   ├── amaranta-shop-catalog-portal/
│   ├── amaranta-shop-sales-db/
│   ├── amaranta-shop-sales-api/
│   ├── amaranta-shop-sales-portal/
│   ├── amaranta-shop-infra-postgres/
│   ├── amaranta-shop-infra-mongo/
│   └── amaranta-shop-security/
├── 02-contracts-cache/
├── 03-migration/
├── 04-integration/
├── 05-evidence/
└── 06-release/
```

## Repositorios autorizados actualmente

- Transversales: api-gateway, worker, workflow, front
- Catalog: catalog-db, catalog-api, catalog-portal
- Sales: sales-db, sales-api, sales-portal
- Ya existentes: infra-postgres, infra-mongo, security

El contenido de estos repositorios se actualiza dinámicamente conforme se aprueba cada nueva extensión del dominio.
