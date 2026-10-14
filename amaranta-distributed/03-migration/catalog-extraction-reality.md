# Catalog: realidad contextual y adaptación pendiente

## Estado observado

El repositorio heredado contiene `apps/catalog`, un servicio independiente basado en
NestJS, TypeORM y PostgreSQL. También existe el módulo Catalog dentro de `apps/api`.
Ambos son referencias funcionales útiles, pero no cumplen todavía el destino autorizado
para `amaranta-shop-catalog-api`.

## Destino autorizado

- API: Python.
- Persistencia: MongoDB.
- Desarrollo: TDD desde el primer commit.
- Integración con Sales: contrato HTTP versionado.
- Extracción: el nuevo servicio vive en su repositorio desde la primera iteración.

## Avance realizado

1. Se creó el repositorio lógico `amaranta-shop-catalog-api`.
2. Se escribieron primero pruebas de dominio y casos de uso con `unittest`.
3. Se implementó una capa de dominio independiente del transporte.
4. Se implementó un repositorio en memoria para TDD.
5. Se dejó un adaptador MongoDB detrás del mismo puerto.
6. Se implementaron endpoints para consulta, reserva y liberación.
7. Se documentó el contrato que consumirá Sales.

## Adecuaciones restantes

- Ejecutar MongoDB en Compose para el servicio nuevo.
- Añadir pruebas de integración con MongoDB real.
- Definir índices, persistencia atómica y control de concurrencia para reservas.
- Sustituir el repositorio en memoria en QA/prod mediante configuración obligatoria.
- Migrar o cargar datos del catálogo solo después de definir ownership y estrategia de
  sincronización.
- Retirar el acceso heredado cuando HU-CAT-002 y la validación de Sales estén completas.

## Criterio de no confusión

`apps/catalog` no se elimina ni se modifica para fingir que ya es Python/MongoDB. Se
conserva como implementación de referencia y evidencia de comportamiento del monolito.
La implementación nueva debe cumplir sus propios tests y contrato.
