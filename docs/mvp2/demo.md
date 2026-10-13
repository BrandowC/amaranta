# Guion de demo: bloque actual y objetivo MVP2

No presentar pasos futuros como ejecutados. Consultar `execution.md` para evidencia real.

## Demo reproducible ahora: HU-CAT-001

1. Desde raíz: `docker compose -f docker-compose.catalog.yml up --build -d --wait catalog`.
2. `curl.exe -i http://localhost:8081/health/live` y `/health/ready`.
3. `docker compose -f docker-compose.catalog.yml exec -T catalog-db psql -U catalog -d catalog_db -c "SELECT current_database();"`.
4. En esa DB consultar `information_schema.tables` para schema catalog;
   no hay identity/sales/clinical/scheduling. Comparar con baseline compartido, sin cambiarlo.
5. `curl.exe -i http://localhost:8081/v1/products` muestra la DB real. Inicialmente
   items vacío y total cero son correctos; no afirmar que existe catálogo migrado.
6. Levantar `catalog-test-db` con perfil test; ejecutar la integración descrita en
   apps/catalog/README.md: fixtures explícitos muestran activos, stock cero y paginación.
7. Mostrar contrato versionado `apps/catalog/contracts/openapi.json` y test provider.
8. Detener **solo** catalog-db, consultar ready/live y reiniciarlo; ver recuperación.
9. Mostrar logs con correlationId y `git log origin/develop..HEAD`.

## Objetivo de aceptación MVP2 completo (pendiente)

| Paso | Demostración exigida | Estado tras primer bloque |
|---|---|---|
| 1 docker compose up | Catalog/Sales, sus DB y RabbitMQ/worker arrancan | solo Catalog implementado; stack completo pendiente |
| 2 health checks | live y ready por dependencia | Catalog disponible; Sales pendiente |
| 3 DB independientes | credenciales distintas, tablas propias, ningún join/FK cruzado | catalog_db disponible; sales_db pendiente |
| 4 checkout normal | pedido y snapshot de precio/stock coherentes | solo checkout legacy |
| 5 contrato Sales–Catalog | captura HTTP v1 reserve con correlationId | contrato de lectura; reserve/consumer pendientes |
| 6 Saga | PENDING→STOCK_RESERVED→CONFIRMED persistidos | pendiente |
| 7 Outbox | pedido y evento commit/rollback juntos | pendiente |
| 8 RabbitMQ | exchange, queue, mensajes persistentes y confirms | elegido; runtime pendiente |
| 9 worker | duplicado entregado dos veces, un efecto e inbox | pendiente |
| 10 failure injection | fallo después de reserve / broker down / kill publisher | solo fallo DB de Catalog demostrable |
| 11 compensación | release idempotente incluso al repetir/reordenar | pendiente |
| 12 consistencia final | stock original, pedido CANCELLED, sin outbox de confirmado | pendiente |
| 13 tests | unit/integration/provider+consumer/resilience | solo bloque Catalog y baseline |
| 14 PR/Git | HU→commits→PR develop→qa→main | commits locales; PR no autorizado |
| 15 v2.0.0 | CHANGELOG aceptado y release validado | pendiente; no crear tag aquí |

Antes de la demo completa resolver el cutover (UUID, stock, catálogo administrativo),
aceptar la semántica de Saga/FR-006, ejecutar la batería de fallos y aprobar promoción.
Un log de "email sent" del listener legacy no demuestra un envío ni un worker real.
