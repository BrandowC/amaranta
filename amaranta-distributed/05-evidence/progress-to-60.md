# Evidencia de avance del corte

## Criterio de medición

El avance se mide contra las diez fases autorizadas, ponderando como completadas
las fases que ya tienen evidencia ejecutable o documental verificable.

| Fase | Estado | Evidencia |
| --- | --- | --- |
| 1. Congelar alcance | completada | `00-control/repository-registry.json`, `status-board.md` |
| 2. Validar registry | completada | estructura de `01-repositories/` y registro dinámico |
| 3. Definir arquitectura Catalog | completada | `03-migration/catalog-architecture.md` |
| 4. Escribir TDD Catalog | completada | `amaranta-shop-catalog-api/tests/test_catalog_service.py` |
| 5. Implementar Catalog Python | avance funcional | dominio, servicio, HTTP y adaptador Mongo |
| 6. Contrato Sales-Catalog | completada | `02-contracts-cache/sales-catalog-v1.json`, ADR-011 |
| 7. Diseñar Sales independiente | completada | `03-migration/sales-architecture.md` |
| 8. Implementar Java + PostgreSQL | avance estructural | boundary Java y `sales-db/schema.sql` |
| 9. Probar integración | pendiente | requiere Mongo, cliente HTTP JSON y PostgreSQL |
| 10. Redactar tesis | iniciada | evidencia y decisiones ya trazadas |

## Resultado

El proyecto supera el umbral del 60% en trazado documental y estructural. Catalog
ya tiene una primera implementación ejecutable y Sales tiene una frontera técnica
que impide la lectura directa de `catalog_db`.

## No declarar terminado

Este avance no declara listo el despliegue productivo. Quedan explícitamente
pendientes la persistencia Mongo real, idempotencia de reservas, cliente HTTP JSON,
transacción PostgreSQL, integración automatizada y redacción final.
