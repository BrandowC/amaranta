# Arquitectura MVP2 congelada para este incremento

## Componentes objetivo (no todos implementados)

```text
Client -> Sales Service -> sales_db
                 |
                 +-- HTTP v1 --> Catalog Service -> catalog_db

Sales transaction: order + saga state + outbox row -> COMMIT
Sales outbox publisher -> RabbitMQ sales.events -> sales worker
                                                  -> inbox + local effect (transaction)
```

El publisher y el worker son ejecutables del paquete Sales, no nuevos bounded contexts.
Identity y las funcionalidades existentes permanecen en el monolito durante la transición.
No añadir gateway, discovery ni plataformas adicionales para este bloque.

## Ownership

| Dueño | Datos | Únicas escrituras permitidas |
|---|---|---|
| Catalog | products, stock_reservations, reservation_items | Catalog mediante transacciones locales |
| Sales | orders, order_items, checkout_sagas, outbox, consumer_inbox, processing_receipts | API/publisher/worker del mismo contexto Sales |
| Monolito heredado | identity y módulos ya existentes | monolito; retirada de Catalog/Sales en cutover posterior |

Sales guarda snapshots de nombre/precio; no consulta tablas Catalog. No joins/FK entre bases.
El worker usa la DB de su contexto Sales; no necesita un tercer servicio ni una tercera DB.

## Comunicación síncrona

- Primer bloque implementa `GET /v1/products`, `/health/live`, `/health/ready`.
- Objetivo siguiente: Sales → `PUT /v1/stock-reservations/{reservationId}`
  (items, request hash/idempotency key) y `DELETE /v1/stock-reservations/{reservationId}`.
- La misma clave con distinto cuerpo da conflicto; repetir reserve/release no cambia stock dos veces.
- Timeout implica resultado desconocido: consultar/repetir con el mismo ID; nunca generar otra reserva.
- Correlation ID via `x-correlation-id`, timeout acotado, autenticación de servicio en endpoints de escritura.

## Comunicación asíncrona

Envelope v1 previsto: eventId, eventType, schemaVersion, occurredAt, aggregateId,
correlationId, payload. Routing `sales.order.confirmed.v1`; exchange/queue durables,
mensajes persistentes y publisher confirms. Stock no se decrementa otra vez al consumir
OrderCreated: el objetivo de reserva síncrona sustituye ese aspecto de FR-006 del repo docs.
Esta divergencia debe revisarse al implementar HU-CAT-002; no cambiar ese repositorio aquí.

## Máquina de estados de Saga (objetivo)

```text
PENDING -> [reserve stock, ID durable] -> STOCK_RESERVED -> CONFIRMED
PENDING/STOCK_RESERVED -> [fallo] -> COMPENSATING
COMPENSATING -> [release confirmado] -> CANCELLED
COMPENSATING -> [timeout/fallo] -> COMPENSATING (reintento durable)
```

CONFIRMED significa checkout aceptado, **no pago recibido**; PAID/FULFILLED del dominio
existente se conservan separadamente. Persistir intención antes de llamar por red.
Catalog serializa reservas concurrentes por producto, en orden estable, y mantiene
tombstone de release para que una reserva retrasada no descuente después de compensar.
No mantener transacciones SQL abiertas durante llamadas HTTP. Reinicios recuperan
estados intermedios. No marcar CANCELLED mientras release sea incierto.

## Outbox y fallos

1. Confirmación del pedido y evento outbox en la misma transacción sales_db.
2. Publisher reclama lote con bloqueo/lease y publica con confirm del broker.
3. Marca delivered solo tras confirm. Caída entre publish y mark puede duplicar.
4. Worker inserta inbox UNIQUE(eventId) y efecto local en una sola transacción; ACK tras commit.
5. Fallos transitorios: backoff con límite. Fallos agotados/esquema inválido: DLQ.
6. Demo: fallo después de reserve, release y reanudación; luego broker caído,
   outbox pendiente, recuperación y entrega duplicada con un solo efecto.

## Estado al terminar el primer bloque

```text
Cliente de prueba -> Catalog Service (8081) -> catalog_db (DB separada)
Tienda -> API heredada -> amaranta (incluye catálogo/checkout heredados)
```

Catalog nuevo tiene migración y contrato de lectura, sin imports ni conexión al monolito.
Se usan fixtures explícitos para pruebas, sin replicación implícita ni sincronización doble.
El traspaso de datos conserva UUID/SKU y requiere reconciliar cantidades antes del cutover;
no se migra ni borra información existente automáticamente.
