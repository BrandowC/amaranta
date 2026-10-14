# Primera capa de migración real

## Qué queda demostrado

1. Catalog API tiene una implementación Python independiente del monolito.
2. Catalog tiene un puerto de persistencia y un adaptador MongoDB.
3. Sales tiene un boundary Java y un cliente HTTP con serialización JSON real.
4. Sales dispone de un esquema PostgreSQL propio.
5. MongoDB y PostgreSQL se pueden levantar de forma reproducible con
   `docker-compose.distributed.yml`.
6. Catalog expone health liveness/readiness y propagación de
   `x-correlation-id`.
7. El contrato Sales–Catalog tiene endpoints, payloads y errores versionados.
8. La topología fue levantada y sus dependencias quedaron saludables.
9. PostgreSQL creó el esquema propio de Sales.
10. La nueva API Python respondió live, ready y consulta vacía contra MongoDB.

## Qué no se debe afirmar todavía

- No existe todavía un cutover del monolito.
- No existe idempotencia por `reservationId`.
- La reserva MongoDB todavía requiere una operación atómica de producción.
- Sales todavía no tiene agregado Order, transacción local ni Outbox operativo.
- No existe una prueba end-to-end automatizada entre ambos servicios.
- La compilación Maven completa queda pendiente porque Maven no está instalado
  en el entorno local actual.
- No existe sincronización ni migración de datos del catálogo heredado.

## Flujo adecuado antes de pedir el PR

```text
1. Levantar dependencias
2. Iniciar Catalog con CATALOG_MONGO_URI
3. Ejecutar health live/ready
4. Cargar fixture controlado
5. Ejecutar reserva y liberación con correlation ID
6. Iniciar/compilar Sales
7. Ejecutar cliente HTTP Java contra Catalog
8. Verificar PostgreSQL con schema.sql
9. Ejecutar pruebas y guardar evidencia
10. Abrir PR como "primera capa de migración", no como cutover final
```

## Adecuaciones posteriores

La siguiente capa debe abordar atomicidad, idempotencia, seguridad interna,
observabilidad, persistencia de órdenes, Saga/Outbox y pruebas de integración.
