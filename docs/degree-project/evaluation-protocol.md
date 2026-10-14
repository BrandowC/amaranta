# Protocolo de evaluación y replicación

Este protocolo evita dos errores frecuentes: demostrar solo que los componentes
arrancan, y convertir resultados de una demo aislada en afirmaciones generales de
escalabilidad o confiabilidad.

## Tipo de estudio

Estudio aplicado de ingeniería con comparación pre/post y experimentos controlados.
La unidad de análisis es un intento de checkout bajo una condición de fallo definida.
No se estudian personas ni se recopilan datos personales. Productos, usuarios, pedidos
e identificadores de las pruebas son sintéticos.

## Hipótesis falsables

| ID | Hipótesis | Resultado que la respaldaría |
|---|---|---|
| H1 | Reserva idempotente preserva stock bajo repetición y concurrencia. | cero stock negativo, cero doble descuento y una reserva durable por ID lógico |
| H2 | Saga durable recupera inventario tras fallar Sales después de reservar. | toda Saga incompleta converge a CONFIRMED o CANCELLED con stock correcto |
| H3 | Outbox + confirms reduce pérdida frente a publicar después del commit. | todo pedido confirmado tiene evento entregado o pendiente recuperable |
| H4 | Inbox idempotente evita efectos duplicados con entrega al menos una vez. | N entregas del mismo eventId producen un solo efecto persistente |
| H5 | Distribución tiene costo medible aceptable bajo el perfil definido. | p50/p95, tasa de error y recursos reportados sin ocultar degradación |

No se concluye causalidad más allá del entorno y las cargas declaradas.

## Entorno reproducible

Cada corrida guarda `evidence/runs/<run-id>/manifest.json` con SHA, rama, estado Git,
hashes de imágenes, sistema operativo, CPU, RAM, versiones de runtime, Compose, perfil
de carga, semilla del dataset, stock inicial, comandos, resultados y logs filtrados.
Las contraseñas se reemplazan por el nombre de su variable de entorno.

## Datos sintéticos

| Dataset | Uso |
|---|---|
| D1: inventario básico | productos activos, inactivos y stock cero |
| D2: última unidad | dos clientes compiten por una sola unidad |
| D3: multítem | un producto disponible y otro insuficiente |
| D4: eventos | pedido confirmado, eventId duplicado y mensaje inválido |
| D5: recuperación | reservas en varios estados y reinicio de Sales/worker |

Los fixtures se versionan y se limpian por `run-id`; nunca usan bases personales de
desarrollo ni datos reales.

## Escenarios obligatorios

| ID | Estímulo | Resultado esperado |
|---|---|---|
| E1 | checkout normal | reserva, pedido, Saga y Outbox consistentes |
| E2 | misma petición dos veces | un pedido y una reserva efectivos |
| E3 | dos checkouts por última unidad | máximo uno confirmado; stock final cero |
| E4 | multítem con segundo ítem insuficiente | ningún producto queda descontado |
| E5 | caída de Sales después de reservar | recovery libera una sola vez |
| E6 | timeout entre Sales y Catalog | reintento con mismo ID consulta/reanuda, no duplica |
| E7 | caída de RabbitMQ | Outbox conserva pendientes y publisher recupera |
| E8 | caída tras publish y antes de marcar publicado | reentrega posible, único efecto por Inbox |
| E9 | worker recibe eventId duplicado | ACK posterior a commit; un efecto |
| E10 | mensaje inválido o fallos agotados | DLQ con correlationId y causa |
| E11 | Mongo/PostgreSQL no disponibles | readiness falla; liveness expresa estado de proceso |
| E12 | llamada no autorizada entre servicios | rechazo auditado, sin filtrar secretos |

E1–E10 son aceptación del sistema distribuido; E11–E12 aseguran que disponibilidad y
seguridad no sean afirmaciones solo documentales.

## Métricas

| Dimensión | Medida | Cálculo / criterio |
|---|---|---|
| Consistencia | violaciones de stock | productos con stock < 0; objetivo 0 |
| Idempotencia | efectos adicionales | `observados - lógicos esperados`; objetivo 0 |
| Recuperabilidad | Sagas convergidas | `terminales correctas / inducidas`; objetivo 100% |
| Eventos | eventos rastreables | `entregado o pendiente / outbox confirmado`; objetivo 100% |
| Disponibilidad experimental | éxito por escenario | respuestas correctas / intentos, con intervalo de confianza |
| Latencia | p50, p95 y p99 | por endpoint y perfil, incluyendo timeout y errores |
| Rendimiento | throughput | operaciones correctas/segundo con concurrencia declarada |
| Eficiencia | CPU, memoria y conexiones | máximo y promedio por contenedor |
| Observabilidad | trazas completas | solicitudes con correlationId/traceId end-to-end / solicitudes |
| Seguridad | hallazgos abiertos | severidad, componente, decisión y fecha de revisión |

Por escenario ejecutar al menos 30 repeticiones independientes cuando sea viable.
Para pruebas deterministas, cubrir todas las transiciones de estado y registrar el
resultado. Reportar mediana, p95, mínimo, máximo y tasa de éxito; no ocultar outliers.

Los objetivos de rendimiento se fijan después de medir la línea base. Es válido aceptar
una degradación de p95 previamente acordada si H1–H4 se mantienen; no es válido inventar
un umbral absoluto sin perfil de usuarios, hardware y baseline.

## Carga y fallos

La carga se versiona con k6, Gatling, JMeter u otra herramienta equivalente:

1. `normal`: consulta y checkout espaciado.
2. `peak`: ráfaga breve con concurrencia definida.
3. `contention`: solicitudes simultáneas sobre la misma última unidad.

Las inyecciones de fallo son scripts versionados: detener/recuperar RabbitMQ, detener
Sales tras reserva, bloquear Catalog, reiniciar worker y reenviar el mismo evento.
Antes y después de cada prueba se valida el estado de reservas, pedidos, eventos e
inventario.

## Seguridad y cadena de suministro

Cada release candidato produce:

- threat model STRIDE y casos de abuso del checkout;
- matriz de riesgo con control, prueba y riesgo residual;
- SBOM CycloneDX o SPDX;
- escaneo de dependencias y contenedores con hallazgos revisados;
- revisión de secretos y mínimos privilegios;
- digest de imágenes y hash de artefactos;
- reporte de cobertura y pruebas;
- procedimiento de backup/restauración ensayado.

## Amenazas a la validez

| Riesgo | Mitigación |
|---|---|
| Entorno local no representa producción | describirlo como laboratorio; no extrapolar capacidad absoluta |
| Datos sintéticos simples | publicar composición de D1–D5 |
| Fallos manuales irrepetibles | scripts con IDs de corrida y pasos versionados |
| Sesgo por calentamiento o caché | warm-up separado y repeticiones independientes |
| Código e infraestructura cambian a la vez | una hipótesis/PR por bloque; SHA e imágenes fijadas |
| Resultados selectivos | conservar éxitos, fallos, logs y configuración de cada corrida |
| Mock confundido con integración | exigir E2E contra contenedores reales |

## Terminación para sustentación

El proyecto queda listo cuando E1–E12 estén automatizados o se ejecuten por scripts,
los resultados se reproduzcan desde un clon limpio y una demo en vivo cubra E1, E3,
E5, E7 y E9. La memoria debe comparar baseline y diseño distribuido, explicar costos
y límites, y enlazar cada afirmación a un SHA, artefacto de evidencia y prueba.
