# Release v2.0.0 — Amaranta Shop (integrated monolith baseline)

Release branch: `release.2.0.0` -> `main`. Tag: `v2.0.0`.
The exact commit id is the merge commit on `main` that the tag points to
(`git rev-parse v2.0.0^{commit}`).

## Scope

This release delivers the integrated modular monolith (hexagonal architecture,
NestJS API + Next.js web) with the catalog, sales, scheduling, clinical and
identity contexts. It is **not** the distributed MVP 2 (see "Not included").

Delivered:

- Identity: JWT signed with RS256 (ADR-009), staff RBAC.
- Catalog: atomic stock reservation (conditional update), idempotent release,
  product deletion and image upload, standalone read-only Catalog service
  (`apps/catalog`, own database and migration, OpenAPI contract).
- Sales: checkout compensates reserved stock on any failure; shop hours and
  walk-in customer rules in the domain.
- Scheduling: business-hour windows and available slots.
- Clinical: pets directory, public medical history, symptoms (migration V010).
- Web: staff screens (admin, reception, clinic, appointments), public pet
  page with QR code, slot picker.
- Governance: CODEOWNERS, keys and local state ignored, no secrets versioned.

## Repository layout (what the course calls repo-bd / repo-api)

The course model uses one repository per service. Amaranta is a single
repository, so the same parts live in one tree:

| Course repo | Here |
|---|---|
| repo-bd | `db/` (versioned SQL migrations) |
| repo-api | `apps/api/` (modular monolith) and `apps/catalog/` |
| front | `apps/web/` |

The release `.zip` contains the whole repository without `node_modules`,
`.env`, `keys/` or `.claude/` (see `.gitignore`).

## Verification

- API: `tsc --noEmit` clean; 7 suites, 40 tests passing.
- Web: `tsc --noEmit` clean.
- Docker runtime was not validated (Docker Hub unreachable in the build
  environment).

## Not included (pending the official service repositories)

Sales as an independent service over HTTP, Saga persistence, Transactional
Outbox, RabbitMQ and the idempotent worker.

## Git flow

`hu-*-dev` -> `develop`; `develop` -> `hu-*-qa` (cherry-pick -x) -> `qa`;
`hu-mvp2-release` -> `release.2.0.0` -> `main`; tag `v2.0.0`.

## Commits included (main..qa, no merges)

- `b098168` chore(governance): add CODEOWNERS for develop (BrandowC)
- `de414d0` chore(repo): ignore JWT keys, tsbuildinfo and .claude (BrandowC)
- `956b456` feat(clinical,scheduling): complete Cut 1 backlog with staff RBAC (BrandowC)
- `d071adb` feat(web): add staff screens for admin, reception, clinic and appointments (BrandowC)
- `fb784e3` feat(db): add clinical and scheduling schemas (BrandowC)
- `f32f4db` docs: update project documentation (BrandowC)
- `1eed7f3` feat(identity): sign JWT with RS256 per course norm (ADR-009) (BrandowC)
- `deb8ff7` docs(mvp2): freeze baseline and catalog scope (VMbrand)
- `c8ee049` feat(catalog): add independent catalog read service (VMbrand)
- `9b500b0` docs(release): record catalog validation and mvp2 handoff (VMbrand)
- `fc08910` chore(repo): ignore JWT keys, tsbuildinfo and .claude (BrandowC)
- `a6c5eec` feat(catalog): atomic stock reservation, idempotent release and product deletion (BrandowC)
- `f2143f3` feat(catalog): wire release use case and add product image upload (BrandowC)
- `9279d1e` fix(sales): compensate reserved stock when checkout fails (BrandowC)
- `51ca873` fix(sales): keep PR independent from clinical guard (VMbrand)
- `cfa95c2` feat(scheduling): validate business hours and expose available slots (BrandowC)
- `076cd2b` fix(scheduling): preserve business hour windows (VMbrand)
- `5105ae1` feat(clinical): public pet medical history, pets directory and symptoms (BrandowC)
- `c5e983b` feat(web): reception, clinic and public pet screens with slot picker (BrandowC)
- `8c030b0` fix(web): consume scheduling availability windows (VMbrand)
