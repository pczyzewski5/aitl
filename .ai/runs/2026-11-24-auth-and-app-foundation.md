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

## 2026-11-24 (PR-3, krok 1.3, commit 1)
`db`: `createOrmProvider` (leniwe `MikroORM.init`, jedna inicjalizacja na proces, ponowna próba po błędzie, współdzielenie przez `globalThis` tylko w dev) i `createEntityManagerProvider` (fork EM raz na scope); `migrationsPath` w `createOrmConfig` opcjonalne.
MikroORM 7 nie łączy się z bazą przy `init`, więc start bez DB działa z definicji; testy jednostkowe 100%.
Do zrobienia: kontener Awilix w `app`, `serverExternalPackages`, test integracyjny.

## 2026-11-24 (PR-3, krok 1.3, commit 2)
`app/src/container/{container,cradle}.ts` (Awilix PROXY, strict; `env` i `ormProvider` singletony, `entityManagerProvider` scoped), `serverExternalPackages` w `next.config.ts`, test integracyjny kontenera na Postgresie.
Weryfikacja bundlingu tymczasową route (niezacommitowana): build i zapytanie przez EM działają pod `next start`, ale także BEZ `serverExternalPackages` (Next 16 sam externalizuje `@mikro-orm/*` i `pino` z transpilowanych pakietów); lista zostaje jawna wg specu.
Do zrobienia: PR, uzupełnienie wiersza PR-3 w track.md.

## 2026-11-24 (PR-3, krok 1.3, commit 3)
PR #68; wiersz PR-3 w track.md (in-progress, wynik SB).
Do zrobienia: zielone checki, merge, SHA w track.md.

## 2026-11-24 (PR-2, krok 1.2, commit 1)
Dodane `core/http/apiHandler.ts` (`createApiHandler(createScope, log)` mapuje `AppError` na kopertę, nieznany błąd na 500 `internal` bez szczegółów z wpisem w logu); `GET /api/health` przepięte na handler z tymczasowym pustym scope (do czasu kontenera z 1.3). Unity 100%, koperta health bez zmian.
Decyzje: kod `internal` jako stałe w `apiHandler.ts` (bez `InternalError`), `Retry-After` poza zakresem (pole `retryAfterSeconds` wejdzie z `TooManyRequestsError` w 2.1).
Do zrobienia: SB-I (integracyjne, audit), PR, wiersz w track.md.

## 2026-11-24 (PR-2, krok 1.2, commit 2)
PR #67; wiersz PR-2 w track.md (in-progress, wynik SB). Brak nowej pulapki, lekcji nie dodano.
Do zrobienia: zielone checki, merge, uzupelnienie SHA w track.md.

## 2026-11-24 (track.md po merge PR-1 i instalatora)
Wiersze PR-1 (#64, c05b1bc) i PR-#2 (#65, a4f4a6f) oznaczone jako done.
Decyzja właściciela: `process.exit(1)` w `register()` nie dodajemy (serwer bez konfiguracji zwraca 500).
Do zrobienia: PR-2 (krok 1.2) i PR-3 (krok 1.3) równolegle.

## 2026-11-24 (Faza 1, health na scope kontenera)
`GET /api/health` korzysta z `container.createScope()` zamiast tymczasowego pustego scope; wiersze PR-2 (#67, b765b90) i PR-3 (#68, 984b49a) oznaczone jako done.
Do zrobienia: przegląd Opusem po Fazie 1, potem PR-4 (kroki 2.0 + 2.1) i PR-5 (krok 2.2) równolegle.

## 2026-11-24 (PR-4, krok 2.0)
Standardy: JWT zastąpione sesją serwerową (token >= 32 B, HMAC w DB, 30 dni przesuwne + 90 dni twardy limit), argon2id, `requireRole` usunięte (Q7), koncepty `auth`, `bank-accounts`, `users`; poprawione też AGENTS.md i CODE_REVIEW.md. Bez kodu.
Do zrobienia: krok 2.1 (`core/http/auth.ts`, błędy, walidator).

## 2026-11-24 (PR-4, krok 2.1)
Dodane `core/http/auth.ts` (porty `SessionResolver`/`BankAccountMembershipLookup`, `requireSession`, `assertMemberOfBankAccount`, fail-closed: odpowiedz inna niz `true` -> 403), `InvalidCredentialsError`, `TooManyRequestsError`, `Retry-After` i `retryAfterSeconds` w `apiHandler`, `loginSchema` (e-mail trim + lower-case). Unity 100% pokrycia, SB-A zielone.
Decyzja: bledy resolvera/lookupu propaguja sie (500, dostep nie przyznany) zamiast mapowania na 403, bo spec wymaga 500 przy niedostepnej bazie.
Do zrobienia: PR, wiersz PR-4 w track.md.

## 2026-11-24 (PR-10a, krok 2.6a, commit 1)
Gałąź `feature/ui-appshell-loginform` z `origin/feature/core-auth-primitives` (zależność od PR #70). `AppShell`: `logoutHref` zastąpione przez `onLogout` (przycisk wyglądający jak link, Q24) i `displayName` (Q25); stories i dokumentacja ekranów E01/E02 przepięte, stories testują przycisk, klawiaturę i długą nazwę na 320 px.
Do zrobienia: LoginForm (500, fokus), `apiCall`, `LoadingMessage`, stan pusty, `docs/design-system.md`, PR.
