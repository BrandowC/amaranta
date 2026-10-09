# Propuesta de evidencia individual — sin semana atribuida

Se localizaron las rutas reales `01-week/hu-status/README.md` a
`16-week/hu-status/README.md` en `../sistemas-distribuidos-2026-b-g2`.
Los CONFIG semanales tienen FULL_NAME/GITHUB_USER/TEAM vacíos. El README raíz del
curso contiene `Victor Manuel Brand Cepeda` / `VMbrand`; Git local está configurado
como VMbrand / vmbrand-2022@corhuila.edu.co. No se verificó el repo de perfil remoto.
Esto permite proponer atribución, no inventar semana, equipo ni validación del perfil.

Se pidió NN-week y TEAM durante la ejecución. Sin respuesta, no se modificará una
semana elegida por fecha o suposición. Tampoco se modificará el repo del curso.
El borrador inglés siguiente conserva las seis secciones y marcadores del template;
NN/TEAM y atribución deberán confirmarse antes de copiarlo a la ruta real.

---

# Weekly Status — pending confirmed week

<!-- CONFIG-START - must match your profile repo (username/username) CONFIG -->
- FULL_NAME: Victor Manuel Brand Cepeda (proposed; verify profile)
- GITHUB_USER: VMbrand (proposed; verify profile)
- TEAM: Pending confirmation
- SPRINT_GOAL: Establish an independently deployable Catalog query service with its own database, explicit contract and reproducible checks, while preserving the legacy checkout.
<!-- CONFIG-END -->

## 1. User stories worked this week

| HU ID | Title | Status (todo/doing/done) | Evidence (PR or commit URL) |
|---|---|---|---|
| HU-CAT-001 | Independent Catalog query runtime and database | doing | Local commits recorded in docs/mvp2/execution.md; no published URL or PR |

## 2. My individual contribution

- Prepared the baseline audit, architecture decision and P0 backlog with Codex assistance.
- Added the standalone Catalog query service, environment configuration, migrations,
  provider contract and tests. See execution.md for checks actually completed.
- Acceptance criteria: deploy without the legacy API; list only active products;
  retain out-of-stock products; maximum 50 per page; readiness fails when DB fails;
  data ownership and migration are independently verifiable.
- Commits: use the exact local SHAs from execution.md. No remote commit links yet.
- PR: not created; human review pending.
- Ceremonies: no attendance, planning meeting or daily meeting evidence provided.
- Review: local implementation prepared; no reviewer approval claimed.
- Retro: schemas alone did not provide service isolation; reserve/save/publish were
  not atomic. Next increment needs durable reservations before checkout cutover.

## 3. Blockers and risks

- NN-week and TEAM unresolved; attribution must match the profile CONFIG.
- Legacy and new catalog are separate datasets. Do not switch storefront stock yet.
- Sales, Saga, compensation, Outbox and broker worker remain pending.
- See execution.md for Docker/environment limitations observed, without inventing success.

## 4. Plan for next week

- Review HU-CAT-001 locally; next technical block belongs to HU-CAT-002: write ownership,
  migration/cutover and idempotent reservation/release. Await authorization to continue.

## 5. Compliance self-check

- [x] Conventional Commits - `type(scope): summary` (local commits)
- [ ] Per-environment HU branch + PR to that environment (branch exists, PR pending)
- [x] Testable acceptance criteria
- [x] Tests added/updated (unit / integration)
- [x] DDD / hexagonal boundaries respected (domain has no I/O)
- [x] No secrets; config via environment variables (only explicit local fixture credentials)

## 6. Evidence links

- Local repository: docs/mvp2/execution.md, apps/catalog/README.md and
  apps/catalog/contracts/openapi.json. Replace with real published URLs only after
  authorized push and PR. Test results belong to this local run, not to an unexecuted CI pipeline.
