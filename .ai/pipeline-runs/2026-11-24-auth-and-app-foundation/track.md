# Track: auth i fundamenty aplikacji

Spec: [.ai/specs/2026-11-17-auth-and-app-foundation.md](../../specs/2026-11-17-auth-and-app-foundation.md)
Dziennik: [.ai/runs/2026-11-24-auth-and-app-foundation.md](../../runs/2026-11-24-auth-and-app-foundation.md)
Plan zatwierdzony przez właściciela: 2026-11-24. Poziom ryzyka: risk-high (review drugiej osoby, `needs-qa` przy PR-ach UI i izolacji).

## Siatka bezpieczeństwa

- **SB-A**: `npm run typecheck`, `npm run lint`, `npm run test:coverage` (100%), `npm run build`, `npm audit --omit=dev --audit-level=high`; wpis w dzienniku, lekcja po napotkanej pułapce.
- **SB-I**: SB-A + `npm run test:integration` (Docker, po build). Gdy task dotyka DB, migracji, env, kontenera, route lub `app-server.ts`.
- **SB-U**: SB-A + `test:storybook` + `check:tokens` + `build-storybook` + aktualizacja `docs/design-system.md`. Gdy task dotyka `packages/ui`.

## Tabela PR-ów

Statusy: todo / in-progress / done. Kolumny PR, SHA i SB uzupełnia agent po zakończeniu.

| PR | Krok | Issue | Zakres | Siatka | Zależności | Status | PR # | SHA | Wynik SB |
|----|------|-------|--------|--------|------------|--------|------|-----|----------|
| PR-1 | 1.1 | #18 | env Zod, logger pino z redakcją, `instrumentation.ts` (core/app) | SB-I | - | done | #64 | c05b1bc | SB-I zielone (typecheck, lint, coverage 100%, build, audit, integracyjne); `process.exit(1)` w `register()` nie dodane (decyzja właściciela: zostaje 500) |
| PR-2 | 1.2 | #18 | `createApiHandler` + health | SB-I | PR-1 | done | #67 | b765b90 | SB-I zielone lokalnie (typecheck, lint, coverage 100%, build, audit, integracyjne) |
| PR-3 | 1.3 | #17 | Awilix, leniwy ORM, `serverExternalPackages` | SB-I | PR-1 | done | #68 | 984b49a | SB-I zielone lokalnie (typecheck, lint, coverage 100%, build, audit, integracyjne) |
| PR-4 | 2.0 + 2.1 | #18 | standardy (JWT -> sesja serwerowa, także AGENTS.md i CODE_REVIEW.md gdzie dotyczy), `core/http/auth.ts`, `InvalidCredentialsError`, `TooManyRequestsError`, walidator login | SB-A | PR-2 | in-progress | #70 | | SB-A zielone lokalnie (typecheck, lint, coverage 100%, build, audit) |
| PR-5 | 2.2 | #20 | encje users/bank-accounts/auth + migracja up/down z CHECK-ami | SB-I | może równolegle z Fazą 1 | todo | | | |
| PR-6 | 2.3 | #18/#20 | hasher argon2id (`@node-rs/argon2`), repozytoria, serwisy, kontener | SB-I | PR-3, PR-4, PR-5 | todo | | | |
| PR-7 | 2.4a | #18 | sesja, login, logout, CSRF, `SESSION_SECRET`; aktualizacja BACKWARD_COMPATIBILITY (route login/logout, env) | SB-I | PR-6 | todo | | | |
| PR-8 | 2.4b | #18 | throttle, API kont, kontrakt, BACKWARD_COMPATIBILITY (reszta) | SB-I | PR-7 | todo | | | |
| PR-9 | 2.5 | #18 | seed (logika w `packages/app/src/seed/`, cienki wrapper w `scripts/`), `SEED_PASSWORD` w `.env.example` | SB-I | PR-6; równolegle z PR-7/8 | todo | | | |
| PR-10a | 2.6a | #19 | ui: rozszerzenie AppShell (displayName, wylogowanie jako przycisk wyglądający jak link) i LoginForm (komunikat 500, fokus), `ui/backend/api/apiCall.ts`, feedback (bez duplikowania istniejących EmptyState/ErrorState), `docs/design-system.md` | SB-A + SB-U | PR-4 | todo | | | |
| PR-10b | 2.6b | #19 | Tailwind i style `@aitl/ui` w `app` | SB-I | - | todo | | | |
| PR-10c | 2.6c | #19, #10 | strony `/login` i `/` (lista kont, `/?account=<id>`), redirecty, wylogowanie, fokus na h1; `needs-qa` | SB-I + SB-U | PR-8, PR-10a, PR-10b | todo | | | |
| PR-11 | 2.7 | #11 | izolacja i druga osoba, test API dwóch sesji, E2E tylko żony; `needs-qa` | SB-I | PR-8, PR-9, PR-10c | todo | | | |
| PR-12 | close-out | - | spec do `implemented/`, backlog, checkboxy monorepo-migration | SB-A | PR-11 | todo | | | |
| PR-#2 | instalator | #2 | `npm run setup`, bez generowania sekretów (tylko instrukcja); follow-up o `seed:user` po PR-9 | SB-A | równolegle z Fazą 1 w osobnym worktree, merge przed PR-7 | done | #65 | a4f4a6f | SB-A zielone, instalator sprawdzony dwukrotnie (idempotentność) |

## Zasady pracy

- Jeden agent i jeden worktree na PR; jeden PR na krok (wyjątek: 2.6 jako trzy PR-y, patrz decyzje).
- Commit po każdym tasku; dziennik `.ai/runs/2026-11-24-auth-and-app-foundation.md` aktualizowany w każdym commicie (wpis 2-5 linii, bez edycji wcześniejszych).
- Przed prośbą o review: siatka bezpieczeństwa wskazana w tabeli (SB-A/SB-I/SB-U).
- Review cross-model (Opus) po fazie, przed testami ręcznymi właściciela (patrz sekcja Review).
- Tytuły PR po angielsku, w trybie rozkazującym, bez prefiksu typu; numer issue w opisie PR; brak `Co-Authored-By`.
- Po zakończeniu PR-a uzupełnić tabelę: status, numer PR, SHA merge, wynik siatki.
- Hasła w testach z `randomBytes`, nigdy literały (Q21). Bez `--no-verify`.

## Decyzje właściciela (2026-11-24)

- Plan i kolejność zatwierdzone.
- AppShell i LoginForm rozszerzamy w `packages/ui` (zamyka luki LDS1, LDS2, LDS4).
- Pokrycie 100% adapterów `db`: testy jednostkowe z fałszywym `EntityManager` + integracyjne na Postgresie.
- Krok 2.6 dzielimy na 3 PR-y (jednorazowy wyjątek od "jeden PR na krok").
- Domyślnie: `zod` i `pino` w `core`; `SEED_PASSWORD` w `.env.example` dopiero w 2.5; BACKWARD_COMPATIBILITY aktualizowany w 2.4a (route login/logout, env) i 2.4b (reszta); logika seed w `packages/app/src/seed/`; brak `Co-Authored-By`.

## Review

Po Fazie 1 (po PR-3) i po Fazie 2 (po PR-11): przegląd cross-model Opusem względem `CODE_REVIEW.md`, speca i `BACKWARD_COMPATIBILITY.md`, przed testami ręcznymi właściciela.
Fokus Fazy 2: auth i własność na route, IDOR, fail-closed, flagi cookie, redakcja logów, mass assignment, enumeracja e-maili, throttle (współbieżność), CSRF, migracje up/down, sekrety w testach (hasła z `randomBytes`, Q21).

## Praca ręczna właściciela

- Lokalny `.env`: `DATABASE_URL`, `SESSION_SECRET` (>= 32 losowe bajty), `SEED_PASSWORD`; wpisuje właściciel, agent ich nie zna i nie zapisuje.
- Uruchomienie seed po PR-9; Docker lokalnie.
- Testy ręczne po review (scenariusz właściciela i żony).
- Materiał z rozmowy z żoną (A02) przed wdrożeniem S02.
- Poza zakresem: OAuth, rejestracja, reset hasła.

## Ryzyka

- Natywny argon2 pod bundlerem Next 16 / MikroORM 7 (`serverExternalPackages`); weryfikują 1.3 i 2.3.
- Przy `TRUSTED_PROXY_HOPS=0` komponent IP throttla jest stały (Q15).
- Login bez throttla między PR-7 a PR-8: tylko lokalnie.
- Flaky współbieżność throttla.
- Fokus na h1 vs Radix FocusScope (lekcja z 2026-11-24).
- Konflikty: `package-lock.json`, `container.ts`/`cradle.ts`, `.env.example`, `BACKWARD_COMPATIBILITY.md`, dziennik.

## Pytania otwarte (rozstrzygnąć przy odpowiednim kroku, nie teraz)

- 1.2 vs 1.3: kolejność (tymczasowy scope w health).
- Kod `internal` w `AppError` (InternalError).
- `Retry-After` w apiHandler czy w route.
- Env w Next: `--env-file` vs `loadEnvConfig`.
- Zmiany `ci.yml` w 2.4a.
- Narzędzie E2E (agent-browser brak; Playwright w devDependencies ui?).
- Stories dla stron `app`.
- Rozszerzenie `validation.commands` o `test:storybook` i `check:tokens`.
- Kiedy zamykać #10, #11, #6.
- Czy instalator generuje `SESSION_SECRET` (rekomendacja: nie).
