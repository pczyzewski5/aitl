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
