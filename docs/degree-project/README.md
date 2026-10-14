# Amaranta como proyecto de grado: sistema distribuido verificable

## Propósito académico

Amaranta no se presentará como una colección de microservicios ni como una
migración terminada. Se propone como un estudio aplicado de cómo preservar la
consistencia de inventario y la trazabilidad de checkout al separar Catalog y Sales.

La contribución defendible no es usar MongoDB, RabbitMQ o Docker por sí mismos. Es
diseñar, implementar y evaluar un flujo que mantenga las invariantes de negocio ante
concurrencia, duplicados, caídas de red y reinicios de procesos.

## Problema, pregunta y objetivos

El monolito inicial conserva checkout dentro de un proceso y una base compartida.
Al separar Catalog y Sales, reservar inventario, persistir pedido y publicar un evento
ya no pueden depender de una única transacción de base de datos.

**Pregunta principal:** ¿en qué medida una Saga orquestada por Sales, con reservas
idempotentes en Catalog, Transactional Outbox e Inbox idempotente, preserva la
consistencia de inventario y la trazabilidad operacional frente a fallos y duplicados,
respecto al baseline monolítico de Amaranta?

Preguntas derivadas:

1. ¿La reserva con identificador estable evita sobreventa y dobles liberaciones bajo
   solicitudes concurrentes o repetidas?
2. ¿La Saga recupera inventario tras fallar Sales después de reservar?
3. ¿El Outbox evita perder eventos cuando PostgreSQL confirma el pedido pero el
   broker no está disponible?
4. ¿El Inbox produce un único efecto persistente ante entrega al menos una vez?
5. ¿Qué costo introduce el diseño distribuido en latencia, disponibilidad y operación?

Objetivo general: construir y evaluar un checkout distribuido entre Catalog y Sales
que sea consistente, seguro, observable y reproducible, con evidencia experimental
suficiente para sostener sus propiedades y límites.

Objetivos específicos:

1. Establecer un único Catalog canónico con datos y ownership explícitos.
2. Implementar reservas y liberaciones durables e idempotentes.
3. Extraer Sales con PostgreSQL propio y comunicación HTTP contractual hacia Catalog.
4. Implementar una Saga recuperable y un Outbox transaccional.
5. Incorporar RabbitMQ con publisher confirms, acknowledgement posterior al commit,
   Inbox y DLQ.
6. Medir corrección, rendimiento, resiliencia, seguridad y mantenibilidad mediante
   pruebas controladas y artefactos reproducibles.

## Alcance responsable

El alcance experimental es Catalog, Sales, checkout, inventario, mensajería y sus
controles transversales. Identity puede suministrar autenticación, pero no será un
servicio de investigación independiente. Clinical, Scheduling, IA, PDF, Redis y
Kubernetes quedan excluidos hasta que una métrica demuestre que son necesarios.

No se harán afirmaciones de producción, alta disponibilidad geográfica ni cumplimiento
regulatorio completo. La evaluación usará datos sintéticos. Todo dato identificable de
clientes, mascotas o personal queda fuera de logs, fixtures, capturas y repositorios.

## Estado verificable al 14 de octubre de 2026

| Elemento | Estado verificable | Límite que debe declararse |
|---|---|---|
| Catalog Python/Mongo | API de lectura, reserva y liberación con adaptador Mongo | sin `reservationId` ni atomicidad multítem demostrada |
| Adaptador Sales → Catalog | existe `HttpCatalogStockAdapter` y pruebas unitarias con fetch simulado | no sustituye una prueba E2E real |
| Compensación inmediata | Checkout legacy libera si falla su persistencia local | no es Saga durable tras caída de proceso |
| Sales PostgreSQL | schema incluye orders, checkout_sagas y outbox_events | el servicio Sales independiente aún no está implementado |
| RabbitMQ | ADR y diseño existen | broker, publisher, Inbox, DLQ y worker faltan |
| Compose distribuido | levanta Catalog Python/Mongo y sales-db | debe ejecutar Sales/API real contra `catalog-api:8081` |
| Tags `c2-*` | existen 30 marcadores | todos apuntan al mismo commit; no son 30 entregables históricos |

El checkout local contiene dos candidatos de Catalog: `apps/catalog` (Nest/PostgreSQL)
y `amaranta-distributed/.../amaranta-shop-catalog-api` (Python/Mongo). Para el estudio
distribuido se adopta provisionalmente el segundo como candidato canónico porque ya
expone el contrato de reserva. El primero permanece como baseline/legacy hasta un
cutover medido; ninguno puede ser dueño simultáneo del stock.

El commit `d0ce2b8` corrige el Compose integrado y es ancestro de esta rama de
investigación; los 30 tags conservan como referencia `26a9397`, anterior a esa
corrección. Antes de citar cualquier topología como evidencia debe verificarse el SHA
del PR y ejecutarse desde un clon limpio.

## Arquitectura objetivo mínima

```text
Web / API Gateway
        |
        v
Sales Service --------------------------> sales_db (PostgreSQL)
  |            order + saga + outbox              |
  | HTTP (timeout, correlationId, idempotency key) | publisher confirms
  v                                               v
Catalog Service ------------------------> RabbitMQ ----> Sales Worker
  |             reservationId                         | inbox + effect
  v                                                    v
catalog_db / MongoDB                           DLQ + observabilidad
```

Ownership obligatorio:

- Catalog: productos, stock y reservas.
- Sales: pedidos, estados de Saga, Outbox, Inbox y efectos de consumidores.
- RabbitMQ: transporte, no fuente de verdad del negocio.
- Gateway: autenticación de borde, rate limiting y contexto; nunca reglas de stock
  ni acceso directo a las bases de servicios.

No hay joins, claves foráneas ni credenciales compartidas entre Catalog y Sales.

## Invariantes que deben demostrarse

1. `stock_quantity >= 0` en todo estado observable.
2. Mismo `reservationId` y misma carga: un resultado; carga distinta: rechazo.
3. Una liberación repetida o tardía no incrementa stock dos veces.
4. Una reserva multítem es totalmente aplicada o no tiene efecto.
5. Un checkout persistido referencia una reserva confirmada.
6. `COMPENSATING` no llega a `CANCELLED` hasta confirmar la liberación.
7. Pedido, estado Saga y Outbox se confirman en una transacción local de Sales.
8. Un `eventId` repetido produce un único efecto persistente.
9. Request, Saga, evento y logs relevantes conservan correlationId y traceId.
10. Ningún secreto, token o dato personal aparece en código, logs o evidencia.

## Calidad evaluable

Se usará ISO/IEC 25010:2023 como taxonomía, no como certificación. Cada característica
se traduce a una medida concreta.

| Calidad | Medida | Evidencia |
|---|---|---|
| Corrección | checkout/stock conforme a invariantes | pruebas de dominio, API y E2E |
| Fiabilidad | recuperación correcta tras fallos inyectados | escenarios reproducibles |
| Eficiencia | p50/p95, error rate y recursos bajo carga definida | reporte de carga con entorno fijado |
| Seguridad | amenazas, controles y dependencias revisadas | threat model, SCA/SBOM, CI |
| Mantenibilidad | límites, contratos y cambios trazables | ADR, C4 y revisión de dependencias |
| Compatibilidad | provider/consumer versionados | validación OpenAPI/Pact o equivalente |
| Observabilidad | trazas, logs y métricas correlacionadas | dashboard y prueba de diagnóstico |

## Secuencia académica y técnica

| Fase | Pregunta | Entregable y gate de salida |
|---|---|---|
| 0. Protocolo | ¿Qué se prueba y qué no? | hipótesis, métricas, alcance y riesgos aprobados |
| 1. Línea base | ¿Contra qué se compara? | checkout legacy reproducible, carga y resultados iniciales |
| 2. Topología canónica | ¿Qué runtime y DB son fuente de verdad? | ADR, Compose integrado y cero doble ownership |
| 3. Catalog correcto | ¿La reserva resiste duplicados y concurrencia? | reservationId, registro durable, atomicidad y pruebas de carrera |
| 4. Sales independiente | ¿Persiste sin DB/catalog compartidos? | API, sales_db, HTTP y health propios |
| 5. Saga | ¿Recupera el negocio de fallos parciales? | estados durables, reinicio y compensación verificados |
| 6. Eventos | ¿Se pierden o duplican efectos? | Outbox, RabbitMQ, Inbox, retry y DLQ |
| 7. Seguridad/operación | ¿Se protege y diagnostica? | STRIDE, controles, trazas, métricas, runbooks y CI |
| 8. Evaluación | ¿Qué mejora y qué costo tiene? | experimento, datos, análisis y amenazas a validez |
| 9. Sustentación | ¿Otra persona verifica la afirmación? | demo de fallos, scripts, memoria y Git trazable |

No se inicia una fase sin evidencia del gate anterior. La escalabilidad se añade solo
después de medir: primero una réplica por servicio; réplicas horizontales únicamente
cuando datos y locks preserven las invariantes.

## Seguridad, responsabilidad y gobernanza

Se adoptan prácticas del SSDF de NIST: preparar el entorno, proteger el software,
producir software seguro y responder a vulnerabilidades. Cada cambio relevante exige
revisión de secretos, dependencia, prueba y evidencia.

Para cada frontera se mantiene un modelo STRIDE: cliente↔gateway, gateway↔Sales,
Sales↔Catalog, servicios↔bases y publisher/worker↔RabbitMQ. El registro de amenazas
incluye activo, amenaza, probabilidad, impacto, control, prueba y riesgo residual.
También se modelan abusos de negocio: repetir checkout, alterar cantidades, liberar
una reserva ajena y competir por la última unidad.

Controles mínimos: autenticación de usuario y de servicio, autorización por ownership,
timeouts/rate limits, secretos externos, SBOM/SCA, logs estructurados sin PII, retención
limitada de telemetría y restauración de bases de datos ensayada.

## Fuentes base

- ISO/IEC 25010:2023: https://www.iso.org/standard/78176.html
- NIST SP 800-218, SSDF: https://csrc.nist.gov/pubs/sp/800/218/final
- NIST SP 800-161r1, cadena de suministro: https://csrc.nist.gov/pubs/sp/800/161/r1/upd1/final
- MongoDB, transacciones: https://www.mongodb.com/docs/manual/core/transactions/
- RabbitMQ, confirms y acknowledgements: https://www.rabbitmq.com/docs/confirms
- OpenTelemetry, correlación de telemetría: https://opentelemetry.io/docs/specs/otel/logs/
- OWASP, modelado de amenazas: https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html

El protocolo de evaluación y reproducción está en [evaluation-protocol.md](evaluation-protocol.md).
