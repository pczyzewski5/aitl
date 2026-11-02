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
