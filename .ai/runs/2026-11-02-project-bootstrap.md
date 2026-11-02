# Project bootstrap

Cele:
- Opisać projekt i stack w README
- Przygotować strukturę `.ai/` oraz AGENTS.md / CLAUDE.md
- Założyć szkielet monorepo w `packages/` (app, core, db, ui)

Spec: brak
Status: in-progress

---

## 2026-11-02
Dodano README ze stackiem i architekturą, strukturę `.ai/`, AGENTS.md i CLAUDE.md oraz szkielet monorepo (puste pakiety z package.json).
Decyzja: kierunki zależności między pakietami to propozycja, do potwierdzenia; menedżer pakietów jeszcze nie wybrany (workspaces zgodne z npm/yarn).
Do zrobienia: inicjalizacja Next.js w `packages/app`, konfiguracja MikroORM w `packages/db`, kontener Awilix, Tailwind i shadcn/ui.

## 2026-11-02 (specs)
Added the monorepo migration plan and the AITL-adapted engineering standards spec, plus the matching rules in AGENTS.md.
Decision: dependency direction stays db -> core (persistence through repository ports); the original spec's app -> core -> db was rejected.
Todo: workspace skeleton, Next.js app, lint, tests and CI.

## 2026-11-02 (workspace, app, CI)
Added the npm workspace skeleton, minimal Next.js app, ESLint with dependency-boundary rules, Vitest unit tests at 100% coverage, testcontainers integration tests and the GitHub CI workflow.
Pitfalls: typescript-eslint caps TypeScript at 6.0.x; Vitest needs the automatic JSX runtime because the app tsconfig uses preserve.
Todo: phase 3 (MikroORM and migrations), phase 4 (Awilix), phase 4b (http and ui/backend layers), phase 5 (Tailwind and shadcn/ui); CI not yet run on GitHub (no remote).

## 2026-11-02 (pre-commit hook)
Added a pre-commit hook running lint, typecheck and unit tests with coverage, installed through the prepare script.
Decision: dependency-free hook in .githooks instead of husky; origin switched to SSH.
Todo: branch protection with required CI checks, phase 3 (MikroORM).

## 2026-11-02 (CI hang fix)
First CI run hung in the integration job: tests passed, but the app started through npx left an orphaned server holding the Vitest worker.
Fix: spawn Next.js directly with the Node binary so SIGTERM reaches the server; added a 15 minute timeout to every CI job.
Todo: branch protection with required checks (needs gh auth, done), phase 3 (MikroORM).

## 2026-11-02 (first lesson)
Recorded the first lesson (hanging CI integration job) in the lessons index.
Pitfall: branch protection and rulesets are unavailable for private repos on the free GitHub plan (HTTP 403), so main is not protected server-side.
Todo: decide on GitHub Pro or public repo for branch protection, phase 3 (MikroORM).

## 2026-11-02 (phase 3: MikroORM)
Added MikroORM setup in the db package: pool config, shared entity properties, blank initial migration, migration scripts, docker compose PostgreSQL, .env.example and an integration test applying migrations.
Pitfalls: MikroORM refuses to start with zero entities (disabled the check until the first concept); the CLI needs configPaths and the tsx loader to read a TS config; parameter properties in the errors class broke the erasable-syntax check once tests imported package code.
Todo: phase 4 (Awilix composition root), phase 4b, first domain concept (expenses).

## 2026-11-02 (secret scanner)
GitGuardian flagged one secret on the phase 3 PR, most likely the database URL with a password; removed passwords from example URLs and test fixtures and switched local PostgreSQL to trust auth.
Pitfall: the finding details are visible only in the GitGuardian dashboard, so the exact line was inferred.
Todo: confirm the check turns green; phase 4.
