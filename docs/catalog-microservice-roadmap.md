# Trayectoria ejecutable: microservicio real de Catalog

Este documento convierte el trabajo existente en una secuencia de desarrollo y
validación. El objetivo de este corte es demostrar la primera capa real de
extracción, no fingir que ya existe un cutover productivo.

## Estado al iniciar el corte

Ya están trazados:

- el alcance dinámico de Catalog y Sales;
- el repositorio lógico `amaranta-shop-catalog-api`;
- TDD de dominio y casos de uso en Python;
- el puerto `ProductRepository` y el adaptador MongoDB;
- la API versionada de consulta, reserva y liberación;
- el contrato Sales-Catalog y el boundary Java;
- la base propia de Sales en PostgreSQL;
- health live/ready y `x-correlation-id`.

## Secuencia de implementación

| Paso | Entregable verificable | Criterio de salida |
| --- | --- | --- |
| 1. Congelar alcance | Registry dinámico y tablero | No se inventan repositorios fuera del scope autorizado |
| 2. Aislar Catalog | Contenedor Python + MongoDB propio | Catalog inicia sin `apps/api`, JWT ni PostgreSQL legacy |
| 3. Probar comportamiento | TDD de dominio y servicio | Listado, paginación y compensación pasan |
| 4. Probar contrato | OpenAPI/JSON y errores versionados | Sales nunca lee `catalog_db` |
| 5. Probar runtime | live/ready, correlation ID y consulta | Mongo saludable; API responde en puerto aislado |
| 6. Cerrar primera capa | Evidencia y PR | El PR declara límites y no lo presenta como cutover |
| 7. Segunda capa | Atomicidad e idempotencia | Reserva durable por `reservationId` |
| 8. Integrar Sales | Adaptador HTTP real + Order/Saga/Outbox | La API general usa `CATALOG_SERVICE_URL` y conserva compensación |
| 9. Migrar tráfico | Ownership de escrituras y datos | No quedan lecturas heredadas del catálogo |
| 10. Release | QA, fallo reproducible y tag | Solo entonces se autoriza el release final |

## Comandos de la primera capa

```powershell
python -m unittest discover -s amaranta-distributed/01-repositories/amaranta-shop-catalog-api/tests -v
python -m compileall -q amaranta-distributed/01-repositories/amaranta-shop-catalog-api/src
docker compose -f docker-compose.distributed.yml config
docker compose -f docker-compose.distributed.yml up --build -d --wait catalog-mongo catalog-api
Invoke-RestMethod http://localhost:8082/health/live
Invoke-RestMethod http://localhost:8082/health/ready
Invoke-RestMethod http://localhost:8082/v1/products
```

La API general selecciona el adaptador de red con:

```text
CATALOG_SERVICE_URL=http://catalog-api:8081
```

Cuando la variable existe, Sales publica reservas y liberaciones mediante el
contrato HTTP versionado y propaga un `x-correlation-id`. Sin la variable se
mantiene el adaptador en proceso para no romper el desarrollo legacy.

## Límites honestos

La primera capa no incluye todavía atomicidad Mongo en producción, idempotencia
por `reservationId`, autenticación interna, persistencia completa de Sales,
Outbox operativo, prueba E2E Java-Mongo ni retiro del tráfico legacy. Cada punto
es un gate posterior y debe obtener su propio commit, prueba y evidencia.
