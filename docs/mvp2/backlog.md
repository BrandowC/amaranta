# Backlog P0 y flujo Git

IDs oficiales obtenidos de `../amaranta-shop-docs/04-requirements/user-stories.md`:
HU-CAT-001, HU-CAT-002, HU-SALES-001/002/003. Los bloques siguientes son tareas técnicas
de esas HU, **no una numeración oficial nueva**. Todos tienen PRIORITY P0.

## HU-CAT-001 — consulta como servicio independiente (primer bloque)

- PROBLEM: catálogo solo puede desplegarse con el monolito.
- SCOPE: runtime propio, catalog_db, migración, GET versionado, live/ready, config dev/qa/prod.
- ACCEPTANCE CRITERIA: arranca sin API/Identity; lista solo activos, paginación máxima 50,
  COP entero, stock cero visible; entrada inválida 400; DB caída produce ready 503;
  contrato estable y sin credenciales implícitas en qa/prod.
- FILES: apps/catalog/**, docker-compose.catalog.yml, docker-compose.yml, docs/mvp2/**,
  docs/adr/**, CHANGELOG.md.
- TESTS: unit de configuración/paginación; integración HTTP+Postgres; contrato de respuestas.
- DEPENDENCIES: baseline develop 56827f3; PostgreSQL y Node disponibles.
- DEMO: levantar solo Catalog, migrar, insertar fixture explícito, GET y fallo de DB.
- COMMIT TYPES: docs(mvp2), feat(catalog), docs(release); footer Refs: HU-CAT-001.
- PRIORITY: P0.

## HU-CAT-002 — ownership de escritura y reserva durable

- PROBLEM: read/modify/save sin idempotencia ni reserva persistida.
- SCOPE: administración autenticada; reserve/release/query; migración conservando UUID;
  retirar acceso legacy a tablas Catalog cuando el contrato esté disponible.
- ACCEPTANCE CRITERIA: última unidad solo se reserva una vez con concurrencia;
  operación multítem atómica; repetición no duplica; release repetido/reordenado es seguro;
  migración conserva productos y stock; no doble descuento por OrderCreated.
- FILES: apps/catalog/src/{application,domain,infrastructure}/**, migrations,
  contracts, adaptadores legacy mínimos y runbook de cutover.
- TESTS: auth, concurrencia Postgres, reservas duplicadas y compensación retrasada.
- DEPENDENCIES: HU-CAT-001; resolver FR-006 con ADR de Saga.
- DEMO: dos clientes compiten por última unidad; compensar dos veces sin crear stock.
- COMMIT TYPES: feat(contract), feat(catalog), test(integration).
- PRIORITY: P0.

## HU-SALES-001 (con HU-SALES-002/003) — Sales independiente

- PROBLEM: pedidos dependen del runtime/DB del monolito.
- SCOPE: apps/sales, sales_db, adapter HTTP Catalog; preservar historial/in-store.
- ACCEPTANCE CRITERIA: arranque autónomo, cero acceso catalog_db; snapshots de precio;
  JWT RS256 verificado sin DB Identity; health/config; compatibilidad del cliente.
- FILES: apps/sales/**, Compose, contrato Sales–Catalog, web/lib/api.ts al cutover.
- TESTS: domain, provider/consumer, DB real, auth, timeout y validación remota.
- DEPENDENCIES: HU-CAT-002.
- DEMO: listar pedidos y checkout con trazabilidad de llamada HTTP.
- COMMIT TYPES: feat(sales), feat(contract), test(contract).
- PRIORITY: P0.

## HU-SALES-001 — Saga y compensación

- PROBLEM: checkout fallido puede perder stock; timeout tiene resultado ambiguo.
- SCOPE: estado durable, reserva estable, compensación y recovery.
- ACCEPTANCE CRITERIA: PENDING→STOCK_RESERVED→CONFIRMED; fallo→COMPENSATING→CANCELLED
  solo tras release; restart retoma; mismo checkoutId no duplica pedido ni reserva.
- FILES: apps/sales/src/application/checkout*, persistence/saga*, catalog release contract.
- TESTS: transiciones unitarias, fallo tras reserva, timeout, kill/restart y release fallido.
- DEPENDENCIES: Sales independiente y reserva Catalog.
- DEMO: inyectar fallo tras reserva, recuperar stock exactamente, verificar estado final.
- COMMIT TYPES: feat(saga), test(resilience).
- PRIORITY: P0.

## HU-SALES-001 — Outbox y RabbitMQ

- PROBLEM: save/publish separados pierden eventos.
- SCOPE: outbox SQL transaccional, publisher con confirms, broker seleccionado ADR-003.
- ACCEPTANCE CRITERIA: rollback no deja outbox; commit siempre lo deja; caída de broker
  conserva pendientes; publisher restart recupera; contratos v1 con correlationId.
- FILES: apps/sales/migrations/**, infrastructure/outbox/**, publisher entrypoint, Compose.
- TESTS: transacción real, broker detenido, caída entre confirm y marca de publicado.
- DEPENDENCIES: Saga estable.
- DEMO: detener broker, confirmar checkout, recuperar publicación al restablecer broker.
- COMMIT TYPES: feat(outbox), feat(events), test(integration).
- PRIORITY: P0.

## HU-SALES-001 — worker idempotente, retry y DLQ

- PROBLEM: entrega al menos una vez genera efectos duplicados.
- SCOPE: worker en paquete Sales, inbox y recibo durable, retry acotado, DLQ.
- ACCEPTANCE CRITERIA: evento duplicado produce un efecto; ACK tras commit;
  fallo repetido termina en DLQ; logs correlacionan pedido, evento y error.
- FILES: apps/sales/src/worker/**, inbox migration, definición RabbitMQ, Compose.
- TESTS: duplicado simultáneo, crash-before-ack, poison message, retry agotado.
- DEPENDENCIES: Outbox/broker.
- DEMO: entregar dos veces y consultar inbox/efecto; mostrar DLQ.
- COMMIT TYPES: feat(worker), test(integration), test(resilience).
- PRIORITY: P0.

## HU-CAT-001/002 y HU-SALES-001 — validación y release MVP2

- PROBLEM: capacidades distribuidas sin evidencia reproducible.
- SCOPE: unit/integration/contract/resilience por ambiente, Compose integrado, CI,
  ADR, CHANGELOG y evidencia individual en semana confirmada.
- ACCEPTANCE CRITERIA: suite y demo desde entorno limpio; secrets externos en qa/prod;
  commits enlazados a HU; revisión humana antes de promover; no afirmar evidencia inexistente.
- FILES: .github/workflows/**, docs/mvp2/**, docs/adr/**, CHANGELOG.md;
  NN-week/hu-status/README.md en fork del curso cuando NN esté confirmado.
- TESTS: todas las suites; smoke de compose y demo de recuperación.
- DEPENDENCIES: bloques anteriores.
- DEMO: docs/mvp2/demo.md; release v2.0.0 solo tras aceptación.
- COMMIT TYPES: test(contract), test(resilience), docs(adr), docs(release), chore(ci).
- PRIORITY: P0.

## Flujo propuesto y aplicado solo hasta commits locales

`hu-cat-001-dev` (desde origin/develop) → futuro PR a develop.
Después de aprobar: rama `hu-cat-001-qa` desde qa + cherry-pick -x de cambios aceptados
→ PR qa; rama `hu-cat-001-main` desde main + cherry-pick -x → PR main.
La nomenclatura explícita del curso/solicitud tiene precedencia sobre prefijos feat/*
de docs/git-conventions.md. No merge directo entre ramas permanentes.

Primer commit propuesto: `docs(mvp2): freeze baseline and catalog scope`.
Commit funcional previsto: `feat(catalog): add independent catalog read service`.
Tests, migración y contrato acompañan el cambio funcional; no fabricar commits vacíos.
Push/PR/promoción/tag quedan fuera de esta ejecución. Las aprobaciones CODEOWNERS
aplicarán al futuro PR, no a las modificaciones locales autorizadas.
