# Ruta secuencial de ejecución y mejora

Este documento es el orden obligatorio de construcción, medición y decisión. La
mejora se representa como una escalera de evidencia: cada nivel agrega una
capacidad verificable sobre el nivel anterior. No se avanza por intuición ni por
componentes “levantados”; se avanza cuando el gate queda respaldado por un SHA,
una prueba y un artefacto de corrida.

## Regla de avance

```text
implementación mínima
        ↓
prueba determinista
        ↓
prueba contra servicios reales
        ↓
fallo inyectado
        ↓
métrica + evidencia
        ↓
decisión de aceptación o corrección
```

Un gate fallido vuelve al último nivel aprobado. Ninguna fase posterior puede
ocultar o compensar un fallo de consistencia de una fase anterior.

## Escalera de madurez

| Nivel | Fase | Capacidad que se agrega | Gate obligatorio | Evidencia |
|---:|---|---|---|---|
| M0 | Baseline | Checkout monolítico medible | E1 ejecutado sin cambios distribuidos | `baseline/<run-id>/` |
| M1 | Frontera | Catalog Python/Mongo y contrato HTTP | live/ready, contrato y consulta real | SHA + OpenAPI + logs |
| M2 | Consistencia | `reservationId`, atomicidad e idempotencia | E2, E3 y E4 con stock correcto | estado Mongo antes/después |
| M3 | Sales autónomo | `sales_db`, Order y Saga persistentes | E5 y E6 recuperables | estados de Saga + SQL |
| M4 | Mensajería fiable | Outbox, confirms, Inbox y DLQ | E7, E8, E9 y E10 | tablas + RabbitMQ + DLQ |
| M5 | Operabilidad | health, trazas, métricas y alertas | E11 y trazabilidad completa | traceId/correlationId |
| M6 | Seguridad | identidad de servicio, mínimo privilegio y abuso | E12 + STRIDE sin críticos abiertos | threat model + SBOM |
| M7 | Comparación | baseline versus distribuido | 30 repeticiones por escenario viable | informe estadístico |
| M8 | Sustentación | replicación desde clon limpio | demo E1/E3/E5/E7/E9 | release candidate |

La progresión es “exponencial” en capacidad de demostración, no una promesa de
throughput exponencial: M2 protege el dato, M3 recupera el proceso, M4 protege
los eventos, M5 hace visible el comportamiento y M6 lo hace defendible.

## Secuencia operativa

### Fase 0 — Congelar la investigación

**Entrada:** baseline integrado y pregunta de investigación.  
**Acciones:** fijar SHA, entorno, datasets D1-D5, variables no secretas y
criterios de éxito.  
**Salida:** manifiesto inicial y ejecución M0.  
**No avanzar si:** no se puede reconstruir el baseline desde un clon limpio.

### Fase 1 — Consolidar Catalog canónico

**Entrada:** `apps/catalog` como legacy y Catalog Python/Mongo como candidato
canónico.  
**Acciones:** levantar `catalog-api` con Mongo, validar contrato, sembrar solo
fixtures sintéticos y demostrar que el stock tiene un único dueño.  
**Salida:** M1 aprobado.  
**No avanzar si:** existen dos escritores activos del inventario.

### Fase 2 — Hacer correcta la reserva

**Entrada:** contrato HTTP y repositorio Mongo.  
**Acciones:** agregar `reservationId`, operación atómica multítem, liberación
idempotente y control de concurrencia sobre la última unidad.  
**Salida:** M2 aprobado con E2-E4.  
**No avanzar si:** una repetición produce doble descuento, stock negativo o
compensación parcial no verificable.

### Fase 3 — Extraer Sales

**Entrada:** M2 aprobado.  
**Acciones:** mover Order y Saga a `sales_db`, autenticar llamadas de servicio,
persistir estados `PENDING`, `STOCK_RESERVED`, `CONFIRMED`,
`COMPENSATING` y `CANCELLED`.  
**Salida:** M3 aprobado con E5-E6.  
**No avanzar si:** la recuperación depende de memoria del proceso o se confirma
la Saga antes de confirmar la liberación.

### Fase 4 — Asegurar eventos

**Entrada:** Sales persistente.  
**Acciones:** guardar Outbox en la misma transacción de Order/Saga, publicar con
confirm, consumir con Inbox idempotente, reintentar con backoff y enviar a DLQ
cuando se agota el presupuesto.  
**Salida:** M4 aprobado con E7-E10.  
**No avanzar si:** un evento confirmado no es rastreable o un duplicado produce
dos efectos.

### Fase 5 — Hacer observable el sistema

**Entrada:** flujo distribuido funcional.  
**Acciones:** propagar `correlationId` y `traceId`, instrumentar HTTP,
Mongo/PostgreSQL, RabbitMQ y worker; publicar p50/p95/p99, throughput, errores,
CPU, memoria y conexiones.  
**Salida:** M5 aprobado con E11 y trazas completas.  
**No avanzar si:** una corrida no puede reconstruirse de extremo a extremo.

### Fase 6 — Asegurar y revisar suministro

**Entrada:** release candidate observable.  
**Acciones:** STRIDE, abuso de checkout, SBOM, dependencias, imágenes,
secretos externos, mínimo privilegio y restauración ensayada.  
**Salida:** M6 aprobado con riesgo residual firmado.  
**No avanzar si:** hay un hallazgo crítico abierto o no se puede restaurar la
información de una corrida.

### Fase 7 — Comparar y sustentar

**Entrada:** M0 y M6 con datasets equivalentes.  
**Acciones:** ejecutar escenarios con repeticiones independientes, conservar
todos los resultados, calcular intervalos y explicar beneficios y costos.  
**Salida:** M7/M8: informe, demo y release reproducible.  
**No avanzar si:** se reportan solo ejecuciones exitosas o se confunde un mock
con una prueba E2E.

## Artefacto mínimo por fase

Cada PR de fase debe contener únicamente un cambio coherente y:

```text
docs/degree-project/evidence/<phase>/<run-id>/manifest.json
docs/degree-project/evidence/<phase>/<run-id>/results.json
docs/degree-project/evidence/<phase>/<run-id>/logs/
docs/degree-project/evidence/<phase>/<run-id>/checksums.txt
```

El `manifest.json` debe incluir SHA, imagen por digest, sistema, carga,
dataset, semilla, comandos, resultado y limitaciones. Si un resultado no puede
repetirse, se registra como fallo de replicación, no como éxito.
