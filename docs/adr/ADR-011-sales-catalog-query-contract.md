# ADR-011 — Consulta de Catalog desde Sales sin lectura directa de base

- **Estado:** aceptado
- **Fecha:** 2026-10-10
- **Alcance:** Catalog y Sales, corte distribuido actual

## Contexto

El profesor dejó explícita la regla de que Sales no puede consultar la base de datos de Catalog salvo deuda técnica expresamente documentada. Esto es obligatorio para mantener la separación por bounded context y para evitar que un servicio extraído dependa de los esquemas ajenos.

Además, la estrategia de extracción exige que el servicio extraído viva en su repositorio desde el primer commit, con un diseño que se valida desde el comportamiento y no desde la copia literal del monolito.

## Decisión

1. `Sales` consulta `Catalog` a través de un contrato explícito de red, preferiblemente HTTP y versionado.
2. La consulta se implementa mediante un adaptador de salida (`CatalogStockPort` / `CatalogClient`) que encapsula la dependencia.
3. `Sales` nunca hace `SELECT`, `JOIN` o lectura directa sobre tablas o esquemas de `catalog_db`.
4. La API de `Catalog` publicará un contrato versionado (`/v1/...`) y pruebas de contrato orientadas a provider/consumer.
5. Si una dependencia directa se vuelve inevitable por deuda técnica, debe quedar documentada como deuda con causa, límite y plan de remediación.
6. El servicio de `Catalog` se construye como Python con TDD, mientras `Sales` se modela como Java con PostgreSQL.

## Diseño propuesto

```text
Sales API
  ↓
  CatalogClient (adapter)
  ↓
  GET /v1/catalog/stock or /v1/products/:id/availability
  ↓
Catalog API
  ↓
  Query/Read model
```

La intención es que la semántica funcional se mantenga en el contrato y no en el conocimiento de la tabla de la otra base. El dominio de Sales sigue definiendo lo que necesita, pero la integración ocurre por interfaz y red, no por acceso directo a datos.

## Invariantes

1. `sales_db` no contiene referencias ni joins a `catalog_db`.
2. El contrato es el único punto de verdad entre Catalog y Sales.
3. Las fallas de red se tratan como fallos temporales; no equivalen a confirmación de reserva.
4. Si el servicio de Catalog no está disponible, la operación se maneja con timeout, retry y compensación según el flujo de la saga.

## Consecuencias

- Aumenta la disciplina de acoplamiento por contrato y reduce la deuda técnica que se vuelve invisible.
- Se desplaza el costo de integración a la capa de infraestructura, donde corresponde.
- El comportamiento de cada servicio queda más verificable con pruebas de contrato y tests de consumidor.

## Alternativas rechazadas

- Leer directamente la DB de Catalog: rechazada por la regla del profesor.
- Copiar el modelo de datos de Catalog dentro de Sales: rechazada porque acopla dominios.
- Simular la consulta con import directo del módulo: rechazada porque no refleja un servicio extraído.
