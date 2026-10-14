# Readiness para PR: primera capa de migración

## Propósito del PR

Este PR debe presentar una **visión y trazo ejecutable de la primera capa de
migración**, no un cutover completo del monolito.

## Ya validado

- Alcance dinámico Catalog + Sales.
- Catalog API nueva en Python.
- Pruebas TDD de dominio y casos de uso.
- Adaptador MongoDB declarado y probado contra una instancia Mongo disponible.
- Contrato HTTP versionado Sales–Catalog.
- Cliente Java con serialización JSON mediante Jackson.
- Esquema PostgreSQL propio para Sales.
- Topología Docker reproducible para MongoDB y PostgreSQL.
- Health live/ready y correlation ID.

## Gates antes de solicitar el PR

| Gate | Estado | Acción |
| --- | --- | --- |
| Pruebas Python | aprobado | `python -m unittest discover -s tests -v` |
| Sintaxis Python | aprobado | `python -m compileall -q src tests` |
| JSON registry/contract | aprobado | `ConvertFrom-Json` |
| Compose config | aprobado | `docker compose -f docker-compose.distributed.yml config` |
| Mongo healthy | aprobado | `docker compose ... up -d --wait` |
| PostgreSQL schema | aprobado | verificar `orders`, `order_items`, `checkout_sagas`, `outbox_events` |
| Catalog live/ready | aprobado | probar el puerto aislado 8082 |
| Sales Maven build | bloqueado localmente | instalar Maven o ejecutar en CI |
| End-to-end Java → Catalog | pendiente | completar ejecución con Maven y fixture |

## Flujo de solicitud

1. Instalar Maven o confirmar que el runner del PR lo tiene.
2. Ejecutar `mvn test` en `amaranta-shop-sales-api`.
3. Ejecutar Catalog contra Mongo con datos de prueba controlados.
4. Ejecutar reserva y liberación desde un cliente Java.
5. Registrar los resultados en `05-evidence/`.
6. Revisar que no haya secretos, `__pycache__`, `target` ni datos reales.
7. Crear el commit de la primera capa.
8. Solicitar PR con la descripción y limitaciones de este documento.

## No bloquear el PR por lo que pertenece a la segunda capa

No se debe presentar como condición de esta primera capa la implementación
completa de:

- Saga y compensación durable en Sales.
- Outbox operativo.
- Idempotencia por `reservationId`.
- Migración de datos del catálogo heredado.
- Retiro del tráfico del monolito.
- Seguridad interna de servicio a servicio.

Esos elementos deben quedar como backlog explícito y no como funcionalidad
supuestamente terminada.
