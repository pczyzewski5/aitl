# Auth i fundamenty aplikacji (implementacja)

Cele:
- Fundament (Faza 1): env z walidacją Zod, logger pino z redakcją, `createApiHandler` + health, kontener Awilix z leniwym ORM (#17, #18)
- Logowanie i konta (Faza 2): standardy, auth, model danych, sesja serwerowa, seed, strony `/login` i `/` (#18, #19, #20, #10)
- Izolacja i druga osoba: test własności przez route, niezależne sesje, E2E żony (#11)
- Instalator `npm run setup` (#2) jako osobny PR równoległy do Fazy 1

Spec: [.ai/specs/2026-11-17-auth-and-app-foundation.md](../specs/2026-11-17-auth-and-app-foundation.md)
Postęp i plan PR-ów: [.ai/pipeline-runs/2026-11-24-auth-and-app-foundation/track.md](../pipeline-runs/2026-11-24-auth-and-app-foundation/track.md)
Status: in-progress

---

## 2026-11-24
Ten PR (tylko dokumentacja): plan implementacji i plik postępu `track.md` (12 PR-ów + instalator), notatka w specu o podziale kroku 2.6 na trzy PR-y.
Decyzje właściciela: plan i kolejność zatwierdzone; AppShell i LoginForm rozszerzamy w `packages/ui`; krok 2.6 jako 2.6a/2.6b/2.6c (jednorazowy wyjątek od Q22).
Do zrobienia: PR-1 (krok 1.1: env, logger, instrumentation).

## 2026-11-24 (PR-#2, instalator)
`npm run setup` (#2): `scripts/setup.ts` + `scripts/setup/` (kroki z wstrzykiwanymi zależnościami), `scripts/tsconfig.json` w `npm run typecheck`, `vitest.config.ts` rozszerzony o `scripts/`. README: sekcja Getting started (dwie ścieżki).
Pułapka: MikroORM nie wypisuje "No pending migrations", przy aktualnej bazie jest tylko "Successfully migrated"; migracje rozpoznajemy po linii `Applied '...'`.
Decyzje właściciela: bez generowania sekretów, bez startu dev servera, miejsce na `seed:user` w następnych krokach (dopiero po kroku 2.5).

## 2026-11-24 (PR-1, krok 1.1, commit 1)
Dodane `core/config/env.ts` (schemat Zod z części: runtime + baza; błąd walidacji podaje tylko nazwy kluczy), `core/logger.ts` (pino z jawną redakcją ze specu), `app/src/instrumentation.ts` (`register()` tylko w runtime Node), zależności `zod` i `pino` w `core`. Unity 100%.
Pułapka: `register()` rzucające błąd nie zatrzymuje procesu `next start`, serwer działa i zwraca 500 (zgłoszone właścicielowi).
Do zrobienia: test integracyjny startu bez DATABASE_URL, siatka SB-I, PR.

## 2026-11-24 (PR-1, krok 1.1, commit 2)
Test integracyjny `startup-env.test.ts` i pomocnik `startAppWithInvalidEnv` w `app-server.ts`: start bez DATABASE_URL loguje czytelny błąd, health zwraca 500. Siatka SB-I zielona lokalnie.
Pułapka: Next 16 nie kończy procesu po błędzie w `register()` (patrz poprzedni wpis); test sprawdza komunikat i 500, nie kod wyjścia.
Do zrobienia: PR i uzupełnienie wiersza PR-1 w track.md po merge.

## 2026-11-24 (PR-1, krok 1.1, commit 3)
PR #64; wiersz PR-1 w track.md (in-progress, wynik SB), lekcja o `register()` w Next 16 z wpisem w indeksie.
Do zrobienia: zielone checki, merge, uzupełnienie SHA w track.md.

## 2026-11-24 (PR-2, krok 1.2, commit 1)
Dodane `core/http/apiHandler.ts` (`createApiHandler(createScope, log)` mapuje `AppError` na kopertę, nieznany błąd na 500 `internal` bez szczegółów z wpisem w logu); `GET /api/health` przepięte na handler z tymczasowym pustym scope (do czasu kontenera z 1.3). Unity 100%, koperta health bez zmian.
Decyzje: kod `internal` jako stałe w `apiHandler.ts` (bez `InternalError`), `Retry-After` poza zakresem (pole `retryAfterSeconds` wejdzie z `TooManyRequestsError` w 2.1).
Do zrobienia: SB-I (integracyjne, audit), PR, wiersz w track.md.
