# Status board

Este tablero refleja el alcance válido en la etapa actual del curso y reemplaza el viejo registro fijo de 17 repositorios.

## Dominio activo

| Dominio | Estado | Repositorios |
| --- | --- | --- |
| Catalog | autorizado | `amaranta-shop-catalog-db`, `amaranta-shop-catalog-api`, `amaranta-shop-catalog-portal` |
| Sales | autorizado | `amaranta-shop-sales-db`, `amaranta-shop-sales-api`, `amaranta-shop-sales-portal` |
| Transversal | autorizado | `amaranta-shop-api-gateway`, `amaranta-shop-worker`, `amaranta-shop-workflow`, `amaranta-shop-front` |
| Infra | existente | `amaranta-shop-infra-postgres`, `amaranta-shop-infra-mongo`, `amaranta-shop-security` |

## Reglas actuales

- Catalog API: Python + TDD.
- Catalog DB: MongoDB.
- Sales API: Java.
- Sales DB: PostgreSQL.
- No se espera un listado fijo de 17 repositorios ni un domain map completo desde este punto.
- El registro crece según los bounded contexts autorizados por el profesor.

## Proceso de expansión

```text
Issue al profesor
  ↓
nuevo bounded context
  ↓
se crea la triada necesaria
  ↓
registry se expande
```

Esto mantiene trazabilidad y ownership sin inventar placeholders innecesarios.

## Avance autorizado

El avance actual supera el 60% de la ruta aprobada: alcance, registry, arquitectura
de Catalog, TDD, primera implementación Python, contrato con Sales, diseño de Sales y
esqueleto Java/PostgreSQL ya están trazados. La integración ejecutable y la tesis final
permanecen abiertas y se mantienen como siguientes gates.
