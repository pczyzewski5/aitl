# Migracja do monorepo

Cel: przenieść projekt do monorepo zgodnie ze stackiem i architekturą z `AGENTS.md` i `README.md`.

Stan wyjściowy: repo nie zawiera jeszcze kodu aplikacji (tylko dokumentację i puste pakiety), więc "migracja" oznacza zbudowanie działającego szkieletu monorepo, a nie przenoszenie istniejącego kodu. Menedżer pakietów: npm (workspaces), bo pnpm nie jest zainstalowany.

## Faza 1: fundament workspace

Zakres: konfiguracja workspace, TypeScript, zależności między pakietami, skrypty.

Kryteria ukończenia:
- [x] `npm install` w rootcie instaluje wszystkie pakiety i linkuje `@aitl/*`
- [x] wspólny `tsconfig.base.json`, każdy pakiet ma własny `tsconfig.json` i `src/index.ts`
- [x] zależności zgodne z architekturą: `app` → `core`, `db`, `ui`; `db` → `core`; `core` i `ui` bez zależności od pakietów
- [x] importy `@aitl/*` rozwiązują się w każdym pakiecie
- [x] skrypt `npm run typecheck` w rootcie przechodzi dla wszystkich pakietów

## Faza 2: aplikacja Next.js w `packages/app`

Kryteria ukończenia:
- [x] najnowszy Next.js + React + TypeScript w `packages/app`, `transpilePackages` dla `@aitl/*`
- [x] ESLint z `no-restricted-imports` wymuszającym kierunek zależności oraz skrypty `lint` i `test` (standardy: `2026-09-01-engineering-standards.md`)
- [x] `npm run build` działa, strona startowa i `/api/health` renderują się (dev nie uruchamiany ręcznie)
- [x] CI GitHub (build, lint, testy jednostkowe 100%, integracyjne z testcontainers) w `.github/workflows/ci.yml`

## Faza 3: `packages/db` (PostgreSQL + MikroORM)

Kryteria ukończenia:
- [x] konfiguracja MikroORM z pulą połączeń, wspólne właściwości encji (UUID, znaczniki czasu) i pierwsza (pusta) migracja; pierwsza encja domenowa dopiero z pierwszym konceptem
- [x] skrypty migracji, lokalny PostgreSQL (docker compose) i zmienne środowiskowe w `.env.example`
- [x] test integracyjny stosujący migracje na PostgreSQL z testcontainers

## Faza 4: Awilix w `packages/app`

Kryteria ukończenia:
- [ ] composition root kontenera DI, rejestracja serwisów z `core` i połączenia z `db`
- [ ] wstrzykiwanie przez konstruktor, test jednostkowy kontenera

## Faza 4b: warstwa wielokrotnego użytku (standardy inżynieryjne)

Źródło: `.ai/specs/2026-09-01-engineering-standards.md`, sekcja 4.

Kryteria ukończenia:
- [x] zasady ze speca w `AGENTS.md`
- [x] `core/src/http/errors.ts` (hierarchia `AppError`)
- [ ] `core/src/http/{apiHandler,makeCrudRoute,auth}.ts`, `core/src/config/env.ts`, `core/src/logger.ts`
- [ ] `ui/src/backend/{api,forms,tables,feedback}` zbudowane na jednym realnym przykładzie, przed drugim konceptem

## Faza 5: UI (Tailwind i shadcn/ui)

Kryteria ukończenia:
- [ ] Tailwind dla stron frontendowych w `app`, shadcn/ui dla stron panelu admina
- [ ] wspólne komponenty w `packages/ui`, tryb jasny i ciemny
