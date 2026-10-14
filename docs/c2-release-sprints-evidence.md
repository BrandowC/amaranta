# Entrega consolidada — Corte 2: Release y Sprints

**Proyecto:** Amaranta  
**Corte:** 2  
**Fecha:** 14 de octubre de 2026  
**Equipo:** `[completar nombres oficiales]`  
**Tag de evaluación:** `[crear y completar antes de subir]`  
**Enlace al release:** `[pegar URL antes de subir]`

## Propósito

Este documento reúne la evidencia de las actividades **c2-release** y
**c2-sprints**. Demuestra la primera integración distribuida entre la API
general/Sales y Catalog: Catalog opera como servicio Python con MongoDB propio,
la API general lo consume por contrato HTTP y las reservas usan un
`reservationId` para soportar reintentos idempotentes.

No presenta el sistema como un cutover productivo. Saga durable, Outbox
operativo, mensajería confiable, autenticación interna y pruebas E2E completas
siguen siendo gates de la siguiente etapa.

---

## 1. Evidencia para c2-release

### Alcance liberado

| Entregable | Estado | Evidencia |
| --- | --- | --- |
| Servicio Catalog aislado | Implementado | Python, MongoDB y endpoints `live`/`ready` |
| Contrato Sales–Catalog | Implementado | [Contrato v1](../amaranta-distributed/02-contracts-cache/sales-catalog-v1.json) y [ADR-011](adr/ADR-011-sales-catalog-query-contract.md) |
| Integración de la API general | Implementada | `CATALOG_SERVICE_URL=http://catalog-api:8081` en [Compose distribuido](../docker-compose.distributed.yml) |
| Reserva idempotente | Implementada y probada | `reservationId`, estados de reserva e índice único en MongoDB |
| Base aislada de API general | Implementada | Servicio `api-db` en la topología distribuida |

### Cambios verificables

| Commit | Aporte |
| --- | --- |
| `f77fae0` | Publica la primera capa de extracción real de Catalog. |
| `26a9397` | Conecta Sales con el contrato de Catalog. |
| `d0ce2b8` | Incorpora la API general y `api-db` al stack distribuido; configura `CATALOG_SERVICE_URL`. |
| `67be2dd` | Añade reservas idempotentes con `reservationId`, confirmación, liberación y expiración. |

### Validación ejecutada

Las siguientes validaciones fueron ejecutadas sobre el commit `67be2dd`:

| Verificación | Resultado |
| --- | --- |
| Pruebas unitarias de Catalog | **10 pruebas aprobadas** |
| Resolución de `docker-compose.distributed.yml` | **Válida** |

Comandos reproducibles:

```powershell
Push-Location amaranta-distributed/01-repositories/amaranta-shop-catalog-api
python -m unittest discover -s tests -v
Pop-Location

$env:JWT_PRIVATE_KEY='clave-local-de-validacion'
$env:JWT_PUBLIC_KEY='clave-publica-local-de-validacion'
docker compose -f docker-compose.distributed.yml config --quiet
```

El primer comando debe ejecutarse desde el directorio del servicio Catalog;
desde la raíz del repositorio Python no resuelve el paquete `src` de las
pruebas.

### Material obligatorio que se adjunta en c2-release

1. Este archivo Markdown.
2. Un ZIP creado desde el **tag de evaluación** indicado arriba.
3. El enlace al release que contiene ese tag.
4. Un archivo `integrantes.txt` con los nombres oficiales del equipo.

El ZIP y el TXT no se sustituyen con este documento porque son requisitos
separados de la actividad.

---

## 2. Evidencia para c2-sprints

### Avance por fases

| Fase | Estado | Evidencia |
| --- | --- | --- |
| Alcance y registro de repositorios | Completada | [Registry](../amaranta-distributed/00-control/repository-registry.json) |
| Arquitectura de Catalog | Completada | [Arquitectura](../amaranta-distributed/03-migration/catalog-architecture.md) |
| TDD de dominio y servicio | Completada | [Pruebas de Catalog](../amaranta-distributed/01-repositories/amaranta-shop-catalog-api/tests/test_catalog_service.py) |
| Contrato Sales–Catalog | Completada | Contrato v1 y ADR-011 |
| Catalog con MongoDB | Implementación funcional | Repositorio Mongo, health checks y Compose |
| API general hacia Catalog | Implementada | Adaptador HTTP y `CATALOG_SERVICE_URL` |
| Reservas idempotentes | Implementada y probada | `reservationId`; estados `RESERVED`, `RELEASED`, `CONFIRMED`, `EXPIRED` |
| Saga/Outbox durables | Pendiente | Gate de siguiente etapa |
| Mensajería confiable y DLQ | Pendiente | Gate de siguiente etapa |
| Prueba E2E con fallas inyectadas | Pendiente | Definida en el protocolo de evaluación |

### Evidencia de sprint y anexos

- [Avance original al 60%](../amaranta-distributed/05-evidence/progress-to-60.md)
- [Primera capa y límites](../amaranta-distributed/05-evidence/first-migration-layer.md)
- [Trayectoria técnica](catalog-microservice-roadmap.md)
- [Protocolo de evaluación del proyecto](degree-project/evaluation-protocol.md)
- [Ruta secuencial de madurez](degree-project/execution-roadmap.md)

Para completar la carga de **c2-sprints**, adjuntar junto a este archivo:

1. Captura o salida de las diez pruebas unitarias aprobadas.
2. Captura o salida de `docker compose ... config --quiet` sin errores.
3. Capturas de `/health/live`, `/health/ready` y `/v1/products` cuando se levante la topología.
4. IDs de los cuatro commits listados en la sección de release.

### Ejecución de runtime para las capturas pendientes

```powershell
docker compose -f docker-compose.distributed.yml up --build -d --wait api-db catalog-mongo catalog-api api
Invoke-RestMethod http://localhost:8082/health/live
Invoke-RestMethod http://localhost:8082/health/ready
Invoke-RestMethod http://localhost:8082/v1/products
```

No se deben adjuntar claves JWT reales, secretos ni datos de producción.

---

## 3. Límites y siguiente paso

La entrega demuestra una frontera de servicio y reservas idempotentes, pero no
garantiza aún recuperación durable de una venta si el proceso cae entre la
reserva y la persistencia de la orden. El siguiente incremento debe persistir
Order, Saga y Outbox en una transacción local de Sales; después se incorporan
publicación confiable, Inbox idempotente y pruebas de fallas.

Esta separación mantiene la evidencia honesta: lo implementado se prueba, y lo
pendiente queda trazado como trabajo futuro verificable.
