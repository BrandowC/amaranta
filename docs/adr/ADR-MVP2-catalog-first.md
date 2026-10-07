# ADR-MVP2-catalog-first — extracción por bloques y consistencia objetivo

Fecha: 2026-10-07. Estado: implementado para lectura Catalog; propuesta pendiente de
revisión para cutover/Saga/Outbox. Referencias: HU-CAT-001/002, HU-SALES-001 y ADR-003
en el repositorio de documentación. Nombre semántico para no colisionar con su numeración.

## Contexto

Develop contiene catálogo administrativo dependiente de Identity y checkout que
decrementa stock en proceso. Extraerlo todo hoy excede el primer bloque autorizado.
El catálogo y pedidos viven en schemas distintos de una misma DB, no en DB por servicio.
La guía afirma una transacción común, pero CheckoutUseCase no la implementa.

## Decisión

1. Crear apps/catalog como unidad de despliegue autónoma, sin imports de apps/api,
   con catalog_db, migración propia y contrato GET /v1/products.
2. Extraer la proyección de consulta HU-CAT-001, conservando NestJS/TypeORM/PostgreSQL.
   No copiar el agregado mutable ni Identity para una consulta pública.
3. Mantener tráfico legacy hasta que HU-CAT-002 transfiera ownership de escritura y
   reserva idempotente. Nada de dual writes ni cambio de stock de la tienda prematuro.
4. Objetivo MVP2 limitado a Catalog y Sales, cada uno con DB; Saga orquestada por Sales,
   reserva/release síncronos y estado durable; Outbox transaccional y RabbitMQ (ADR-003).
5. Worker del mismo contexto Sales, inbox+efecto atómicos, at-least-once con deduplicación,
   ACK tras commit, retry limitado y DLQ. No prometer exactly-once de extremo a extremo.
6. Config explícita dev/qa/prod; credenciales externas fuera de dev; health live/ready
   distintos, logs correlacionados y Compose aislado además del integrado.

## Alternativas y consecuencias

- Extraer Catalog completo y sustituir Sales hoy: rechazado por ampliar alcance y
  exponer decremento no compensable por red sin diseño durable.
- Copiar el monolito entero como un "microservicio": rechazado por dependencias y DB compartida.
- Nuevo broker/infraestructura ahora: innecesario para HU-CAT-001; RabbitMQ permanece elegido.
- Consulta independiente: avance comprobable y pequeño, pero no completa la extracción.
  Su DB empieza vacía; no es réplica del catálogo legacy y no sirve al checkout aún.
- Migraciones al startup solo para una réplica; job exclusivo requerido antes de escalar.

## Contradicciones que deberá resolver el siguiente bloque

FR-006 y ADR-003 originales prevén descontar al consumir OrderCreated. Con reserva
síncrona eso descontaría dos veces: ese consumidor no puede mutar stock otra vez.
La Saga usa CONFIRMED como estado de checkout, sin reemplazar PAID/FULFILLED del pedido.
Release fallido deja COMPENSATING hasta recuperación, nunca CANCELLED prematuramente.
La documentación del repo vecino no fue modificada; esta decisión requiere revisión
del equipo antes de desarrollar el siguiente bloque.
