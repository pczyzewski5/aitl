# Auth i fundamenty aplikacji (implementacja)

Cele:
- Fundament (Faza 1): env z walidacją Zod, logger pino z redakcją, `createApiHandler` + health, kontener Awilix z leniwym ORM (#17, #18)
- Logowanie i konta (Faza 2): standardy, auth, model danych, sesja serwerowa, seed, strony `/login` i `/` (#18, #19, #20, #10)
- Izolacja i druga osoba: test własności przez route, niezależne sesje, E2E żony (#11)
- Instalator `npm run setup` (#2) jako osobny PR równoległy do Fazy 1

Spec: [.ai/specs/implemented/2026-11-17-auth-and-app-foundation.md](../specs/implemented/2026-11-17-auth-and-app-foundation.md)
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

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 1)
`apiHandler` przekazuje kontekst route jako trzeci argument `(request, scope, context)`; typ `ApiRouteParams<TParams>` opisuje `{ params: Promise<TParams> }` z Next 16. Test jednostkowy na typowane `params`.
Do zrobienia: redakcja logów, serializer `err`, rejestracje kontenera, moduł `api-handler` w `app`, stałe i dokumentacja.

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 2)
Redakcja logów generowana z listy `SENSITIVE_KEYS` na głębokościach 0-2 (np. `password`, `*.password`, `*.*.password`), z wariantami wielkości liter nagłówków; sprawdzone empirycznie z pino, także dla tablic obiektów (`items[].password` łapie ścieżka głębokości 2).
Głębokość 3+ nie jest redagowana (świadome ograniczenie kosztu ścieżek).

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 3)
Własny serializer `err` w loggerze (`type`, `message`, `code`, `stack`): pola sterownika typu `detail` nie trafiają do logu; test na poziomie loggera i `apiHandler`.
Pułapka: `message` błędu sterownika nadal trafia do logu (może zawierać fragment danych); świadomie zostawione do diagnostyki.

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 4)
Kontener złożony z rejestracji per koncept: `container/registrations/{core,db}.ts` (`createXRegistrations` z `satisfies`), `Cradle = CoreCradle & DbCradle`; test rozwiązuje każdy klucz w scope i porównuje klucze kontenera z plikami rejestracji.
Kolejny koncept dopisuje własny plik rejestracji i jedną linię spread w `container.ts`.

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 5)
Jeden moduł `app/src/http/api-handler.ts` eksportuje `apiHandler` zbudowany na `container.createScope()` i loggerze z kontenera; health z niego korzysta. Test: scope z kontenera, osobny scope na wywołanie, log przez logger kontenera.
Do zrobienia: stała statusu health, nazwa testu ponownej próby ORM, dokumentacja.

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 6)
Stała `HEALTH_STATUS_UP` w health (nieeksportowana, bo route Next dopuszcza tylko eksporty handlerów); test ponownej próby ORM opisuje błąd konfiguracji/discovery, nie awarię bazy przy init.
Do zrobienia: dopisy w specu i BACKWARD_COMPATIBILITY.md.

## 2026-11-24 (poprawki po przeglądzie Fazy 1, commit 7)
Spec: dopisane Q36-Q38 (fail-fast bez zakończenia procesu, 200 przy sukcesie i plan na 201/Retry-After, `params` w handlerze); `BACKWARD_COMPATIBILITY.md` §2 opisuje kod `internal` (500). Istniejące decyzje bez zmian.
Świadomie odłożone: cache ORM po zmianie URL, `orm.close()`, zmiana `serverExternalPackages`.

## 2026-11-24 (PR-4, krok 2.0)
Standardy: JWT zastąpione sesją serwerową (token >= 32 B, HMAC w DB, 30 dni przesuwne + 90 dni twardy limit), argon2id, `requireRole` usunięte (Q7), koncepty `auth`, `bank-accounts`, `users`; poprawione też AGENTS.md i CODE_REVIEW.md. Bez kodu.
Do zrobienia: krok 2.1 (`core/http/auth.ts`, błędy, walidator).

## 2026-11-24 (PR-4, krok 2.1)
Dodane `core/http/auth.ts` (porty `SessionResolver`/`BankAccountMembershipLookup`, `requireSession`, `assertMemberOfBankAccount`, fail-closed: odpowiedz inna niz `true` -> 403), `InvalidCredentialsError`, `TooManyRequestsError`, `Retry-After` i `retryAfterSeconds` w `apiHandler`, `loginSchema` (e-mail trim + lower-case). Unity 100% pokrycia, SB-A zielone.
Decyzja: bledy resolvera/lookupu propaguja sie (500, dostep nie przyznany) zamiast mapowania na 403, bo spec wymaga 500 przy niedostepnej bazie.
Do zrobienia: PR, wiersz PR-4 w track.md.

## 2026-11-24 (PR-5, krok 2.2, commit 1)
Encje `User`, `BankAccount`, `BankAccountMembership`, `Session`, `LoginThrottle` w `db/src/entities/{users,bank-accounts,auth}/` i migracja `auth_entities` wygenerowana MikroORM (CHECK e-mail małymi literami, CHECK właściciel wg typu, częściowe unikalne indeksy: jedno osobiste na właściciela i `(type, name)` dla wspólnych, FK z `restrict`/`cascade`) wraz ze snapshotem.
Testy integracyjne: up, naruszenia (dwa osobiste, osobiste bez właściciela, drugi wspólny, e-mail wielkimi literami i inne), down i ponowne up; unity 100%. Lekcja o generowaniu migracji (skrypt jest `--blank`).
Do zrobienia: PR, wiersz PR-5 w track.md, zielone checki.

## 2026-11-24 (PR-5, krok 2.2, commit 2)
PR #72; wiersz PR-5 w track.md (in-progress, wynik SB).
Do zrobienia: zielone checki, merge, SHA w track.md.

## 2026-11-24 (PR-6, krok 2.3, commit 1)
Baza: stos #73 + #70 + #72 (merge'e; konflikty tylko w dzienniku i track.md, a w testach `apiHandler` #70 dostosowane do `(request, context)` z #73). Port `PasswordHasher` (`hash`, `verify`, `verifyAgainstDecoy`), adapter `Argon2PasswordHasher` w `app/src/adapters` (parametry z konstruktora, produkcyjne 19456 KiB / 2 / 1, wabik liczony raz), porty repozytoriów i `ProvisioningUnitOfWork`, `BankAccountService` (`listForUser`, `addMember`), `UserProvisioningService`, regula `assertCanBeMember` (niezmiennik konta osobistego).
Do zrobienia: adaptery MikroORM w `db`, rejestracje w kontenerze, test integracyjny.

## 2026-11-24 (PR-6, krok 2.3, commit 2)
Adaptery MikroORM w `db/src/repositories/{users,bank-accounts}` (user, konto, członkostwo) oraz `MikroOrmProvisioningUnitOfWork`: transakcja przez `em.transactional`, repozytoria związane z transakcyjnym EM (fork nie dziedziczy kontekstu transakcji, więc nie wolno użyć repozytoriów spoza callbacka).
Testy: unity z fałszywym EntityManager i integracyjne na Postgresie (`tests/integration/repositories.test.ts`: unikalność konta osobistego, idempotencja, rollback całego provisioningu).
Do zrobienia: rejestracje w kontenerze i test integracyjny z prawdziwym argon2.

## 2026-11-24 (PR-6, krok 2.3, commit 3)
Rejestracje per koncept w kontenerze: `registrations/{auth,bank-accounts,users}.ts` (hasher singleton, repozytoria i serwisy scoped na EM scope), `Cradle` rozszerzony; `serverExternalPackages` miało już `@node-rs/argon2` (PR-3), bez zmiany. Testy integracyjne: serwisy z kontenera na Postgresie z prawdziwym argon2id i parametrami produkcyjnymi (`auth-services.test.ts`) oraz kontrola bundlingu (`bundling.test.ts`); lekcja o hashowanych nazwach zewnętrznych pakietów w Turbopacku.
Bundling zweryfikowany: po zepsuciu `argon2/index.js` health zwraca 500, więc zielony health pod `next start` dowodzi ładowania bindingu; HTTP-owego rozwiązania serwisu nie ma, bo brak route (pierwsza w 2.4a).
Do zrobienia: wiersz PR-6 w track.md, SB-I, PR.

## 2026-11-24 (PR-6, krok 2.3, commit 4)
PR #75 (base `main`, leży na stosie #73, #70, #72); wiersz PR-6 w track.md (in-progress, wynik SB-I).
Do zrobienia: zielone checki, merge po #73/#70/#72, SHA w track.md.

## 2026-11-24 (PR-7, krok 2.4a, commit 1)
Baza: stos #73, #70, #72, #75 (gałąź `feature/auth-session-login` z `feature/auth-services-hasher`). Rdzeń sesji w `core`: `SESSION_SECRET` (>= 32 znaki) i `SESSION_COOKIE_SECURE` (domyślnie true przy `NODE_ENV=production`) w schemacie env, `SessionTokens` (token 32 B base64url, HMAC-SHA256 z prefiksem domeny `session:`/`throttle:`), `SessionService` (30 dni przesuwne, twardy limit 90 dni, przedłużanie najwyżej raz na godzinę, sprzątanie wygasłych przy logowaniu; implementuje port `SessionResolver`), `AuthService` (login z `verifyAgainstDecoy` dla nieznanego e-maila, logout), `requireCsrfHeader`, `parseJsonBody`; unity z fałszywym zegarem.
Do zrobienia: adapter MikroORM sesji i rejestracje, route login/logout, ładowanie env z korzenia monorepo, testy integracyjne, BACKWARD_COMPATIBILITY, spec (nowe Q).

## 2026-11-24 (PR-7, krok 2.4a, commit 2)
Adapter `MikroOrmSessionRepository` (tworzenie, odczyt po hashu, `nativeUpdate` terminu, usuwanie po hashu i wygasłych jednym zapytaniem `$or`) oraz rejestracje w kontenerze: `clock`, `sessionTokens` (singleton z `SESSION_SECRET`), `sessionRepository`/`sessionService`/`authService` scoped, `sessionResolver` to ta sama usługa sesji (port z `core/http/auth.ts`, konsument dopiero w PR-8).
Unity adaptera z fałszywym EM; integracja z Postgresem w commicie z testami HTTP.

## 2026-11-24 (PR-7, krok 2.4a, commit 3)
Route `POST /api/auth/login` i `POST /api/auth/logout` (CSRF `X-Requested-With: aitl`, `parseJsonBody` + `loginSchema`, cookie `aitl_session` httpOnly/lax/path `/`/maxAge 90 dni, `secure` z env; logout zawsze 200 i wygaszone cookie), helper `http/session-cookie.ts`. `next.config.ts` ładuje `.env` z korzenia repo przez `@next/env` z wymuszonym przeładowaniem (nowe Q39); `.env.example` ma `SESSION_SECRET=`.
Pułapka: bez `forceReload` `loadEnvConfig` zwraca wynik z `packages/app` (lekcja). Testy integracyjne (`auth-session`, `env-loading`): poprawny login, ten sam wynik dla złego hasła i e-maila, flagi cookie (także `Secure` w produkcji), wygaśnięcie przesuwne i twarde, logout usuwa rekord, brak CSRF -> 403, logi bez haseł/tokenów/sekretu (także przy awarii bazy). `ci.yml` bez zmian (Q40).
Do zrobienia: SB-I, PR, wiersz PR-7 w track.md. Throttle i API kont to PR-8.

## 2026-11-24 (PR-7, krok 2.4a, commit 4)
SB-I zielone lokalnie (typecheck, lint, coverage 100%, build, audit, integracyjne). Pulapka: `migrations.test.ts` zakladal, ze migruje wspolna baze jako pierwszy; po dodaniu plikow testowych kolejnosc sie zmienila, wiec test dostal wlasna baze (lekcja).
Do zrobienia: PR, wiersz PR-7 w track.md, zielone checki.

## 2026-11-24 (PR-7, krok 2.4a, commit 5)
PR #77 (base `main`, leży na stosie #73, #70, #72, #75); wiersz PR-7 w track.md (in-progress, wynik SB-I).
Do zrobienia: zielone checki, merge po #73/#70/#72/#75, SHA w track.md.

## 2026-11-24 (PR-8, krok 2.4b, commit 1)
Baza: stos #73, #70, #72, #75, #77 (gałąź `feature/login-throttle-accounts-api` z `feature/auth-session-login`). Rdzeń throttla w `core`: port `LoginThrottleRepository`, `LoginThrottleService` (dwa liczniki: adres+e-mail próg 5, sam e-mail próg 20; okno i blokada 15 min; klucze to HMAC z domeną `throttle:`), `resolveClientIp` (`TRUSTED_PROXY_HOPS`: 0 ignoruje `X-Forwarded-For`, N bierze wpis N-ty od prawej), env `TRUSTED_PROXY_HOPS` (nieobecne w `.env.example`, bo pusta wartość nie przeszłaby walidacji), repozytorium w pamięci i unity z fałszywym zegarem.
Do zrobienia: adapter `ON CONFLICT`, `AuthService.login`, route, API kont, BACKWARD_COMPATIBILITY.

## 2026-11-24 (PR-8, krok 2.4b, commit 2)
Adapter `MikroOrmLoginThrottleRepository` (atomowy `INSERT ... ON CONFLICT (key_hash) DO UPDATE` w jednym zapytaniu: licznik, reset okna i `locked_until` liczone w SQL, więc równoległe próby nie gubią inkrementów; odczyt blokady jednym `max(locked_until)`), rejestracje `loginThrottleRepository`/`loginThrottleService`, `AuthService.login(input, clientIp)`: blokada sprawdzana przed weryfikacją hasła (Q31: poprawne hasło w blokadzie też daje 429), porażka zapisywana także dla nieznanego e-maila, sukces czyści oba liczniki. Route login liczy adres z `TRUSTED_PROXY_HOPS`; 429 niesie `retryAfterSeconds` i `Retry-After` (koperta i mapowanie istniały od PR-7).
Testy integracyjne (`login-throttle.test.ts`): 429 po 5, poprawne hasło w blokadzie, reset po sukcesie, wiersz dla nieznanego e-maila, hashe zamiast e-maila i adresu, adres za proxy kontra ignorowany nagłówek, próg 20 na e-mail, 10 równoległych prób HTTP i 20 równoległych `recordFailure` na bazie, granice okna i blokady przez zegar przekazany do repozytorium.
Do zrobienia: API kont, BACKWARD_COMPATIBILITY, SB-I, PR.

## 2026-11-24 (PR-8, krok 2.4b, commit 3)
`GET /api/bank-accounts` (lista w kolejności z Q26: wspólne przed osobistymi, potem po nazwie) i `GET /api/bank-accounts/{id}` (wzorzec: `requireSession` -> `assertMemberOfBankAccount` -> odczyt; Q20), `BankAccountService.getSummary`, schemat `bankAccountIdSchema` (UUID; nie-UUID -> 400). Nie-członek i nieistniejące konto dają identyczne 403, więc nie ma wycieku istnienia; 401 wyprzedza walidację id. Spec nie przewiduje `GET /api/auth/session`, więc go nie dodano.
Pułapka: pliki route Next nie mogą eksportować stałych (stąd komunikat id w `core`); test integracyjny zostawia `.snapshot-migrations_*.json` (lekcja).
Do zrobienia: BACKWARD_COMPATIBILITY, SB-I, PR, track.md.

## 2026-11-24 (PR-8, krok 2.4b, commit 4)
SB-I zielone lokalnie (typecheck, lint, coverage 100%, build, audit 0 podatności, integracyjne 12 plików/78 testów; testy throttla uruchomione trzykrotnie bez flaky). Wiersz PR-8 w track.md.
Do zrobienia: PR (base main, stos #73, #70, #72, #75, #77), zielone checki, merge po stosie, SHA w track.md.

## 2026-11-24 (PR-8, krok 2.4b, commit 5)
PR #78 (base `main`, leży na stosie #73, #70, #72, #75, #77); numer w wierszu PR-8 w track.md.
Do zrobienia: zielone checki, merge po stosie, SHA w track.md.

## 2026-11-24 (PR-10a, krok 2.6a, commit 1)
Gałąź `feature/ui-appshell-loginform` z `origin/feature/core-auth-primitives` (zależność od PR #70). `AppShell`: `logoutHref` zastąpione przez `onLogout` (przycisk wyglądający jak link, Q24) i `displayName` (Q25); stories i dokumentacja ekranów E01/E02 przepięte, stories testują przycisk, klawiaturę i długą nazwę na 320 px.
Do zrobienia: LoginForm (500, fokus), `apiCall`, `LoadingMessage`, stan pusty, `docs/design-system.md`, PR.

## 2026-11-24 (PR-10a, krok 2.6a, commit 2)
`LoginForm`: nowy rodzaj `server-error` w `LoginFailure` z tekstem Q29 (`serverError` w messages) i fokus na polu e-mail po każdym nieudanym logowaniu (Q30), także przy wyjątku żądania; po sukcesie formularz fokusu nie rusza (h1 po zalogowaniu robi strona, Q32). Testy jednostkowe i stories (500, fokus) dodane, dokumentacja `login-form.mdx` zaktualizowana.
Do zrobienia: `apiCall`, `LoadingMessage`, stan pusty (Q35), `docs/design-system.md`, PR.

## 2026-11-24 (PR-10a, krok 2.6a, commit 3)
`ui/backend/api/apiCall.ts`: jedyny `fetch` do `/api/*`, zawsze `X-Requested-With: aitl`, wynik `ok` / `api-error` / `invalid-response` / `network` (nigdy nie rzuca z powodu sieci ani niepoprawnego JSON; ścieżka spoza `/api/` rzuca `TypeError`). Testy 100%, strona `Wzorce/Wywołania API`, przykład adaptera w `login-form.mdx`.
Do zrobienia: `LoadingMessage`, stan pusty (Q35), `docs/design-system.md`, PR.

## 2026-11-24 (PR-10a, krok 2.6a, commit 4)
Feedback bez duplikatów: `EmptyState` i `ErrorState` zostają w `components/ui/`, dodany tylko `LoadingMessage` (`ui/backend/feedback`, `role="status"`). Stan pusty listy kont: opis "Skontaktuj się z administratorem aplikacji." (Q35). Helper `buildAccountHref` (`/?account=<id>`, Q26) wyeksportowany z `@aitl/ui`.
Do zrobienia: `docs/design-system.md`, AGENTS.md (miejsce feedback), POSTEP.md, track.md, PR.

## 2026-11-24 (PR-10a, krok 2.6a, commit 5)
Dokumentacja: `docs/design-system.md` (AppShell, LoginForm, LoadingMessage, `apiCall`, `buildAccountHref`, reguły błędów, fokusu i stanu pustego), `AGENTS.md` (feedback: tylko `LoadingMessage`, bez dublowania `EmptyState`/`ErrorState`), `POSTEP.md`. SB-A + SB-U zielone lokalnie (typecheck, lint, coverage 100%, build, audit, test:storybook 619/619, check:tokens, build-storybook).
Do zrobienia: PR, wiersz PR-10a w track.md, zielone checki.

## 2026-11-24 (PR-10a, krok 2.6a, commit 6)
PR #74 (base `feature/core-auth-primitives`, bo #70 niezmergowany; CI odpala się na dowolnej bazie); wiersz PR-10a w track.md (in-progress, wynik SB).
Do zrobienia: zielone checki, po merge #70 przestawić bazę na `main`, merge, SHA w track.md.
## 2026-11-24 (PR-10b, krok 2.6b, commit 1)
`app`: `postcss.config.mjs` (`@tailwindcss/postcss`), `src/app/globals.css` (import `@aitl/ui/src/styles.css` + `@source` na `ui/src`), import w root layout, pinowane `tailwindcss`/`@tailwindcss/postcss` 4.3.5; test integracyjny: strona linkuje CSS z tokenami i klasami `ui`.
Pułapka: bez `@source` Tailwind nie widzi klas z `packages/ui` (poza bazą skanowania `app`); lekcja dodana. `packages/ui` bez zmian.
Do zrobienia: PR, wiersz PR-10b w track.md.

## 2026-11-24 (PR-10c, krok 2.6c, commit 1)
Strony `/login` i `/` w `app` (redirecty po stronie serwera przez `loadCurrentUser`, ekrany klienckie z `apiCall`, adapter wyniku na `LoginResult`, fokus na h1 w odroczonym efekcie). Dodana route `GET /api/auth/me` i `AuthService.getCurrentUser` (nazwa w pasku musi przetrwać odświeżenie; opis w `BACKWARD_COMPATIBILITY.md`). Testy jednostkowe 100% i integracyjne (redirecty, nazwa, dwie sesje, Q33).
Do zrobienia: weryfikacja w przeglądarce, SB-U, PR, wiersz PR-10c w track.md.

## 2026-11-24 (PR-10c, krok 2.6c, commit 2)
Weryfikacja w prawdziwym Chrome na seedowanej aplikacji: `/` -> `/login`, zły login (komunikat, dane zostają, fokus na e-mailu), poprawny (fokus na h1, nazwa w pasku, wspólne przed osobistymi, linki `/?account=<id>`), `/login` zalogowanego -> `/`, wylogowanie (fokus na h1 `/login`, `/` przekierowuje). Lekcja o seedowaniu aplikacji do testu przeglądarkowego i stabilnym mocku `useRouter`. SB-I zielone (typecheck, lint, coverage 100%, build, audit, test:integration 87/87); `packages/ui` bez zmian, więc SB-U nie dotyczy.
Do zrobienia: PR, checki, wiersz PR-10c w track.md.

## 2026-11-24 (PR-10c, krok 2.6c, commit 3)
PR #79 otwarty (etykieta `needs-qa`), wiersz PR-10c w track.md uzupełniony.
Do zrobienia: zielone checki, po merge stosu przestawić bazę na `main`, merge, SHA w track.md.

## 2026-11-24 (PR-9, krok 2.5, commit 1)
Baza: `origin/feature/auth-services-hasher` (#75, stos #73, #70, #72). Seed: logika w `packages/app/src/seed/` (`run-seed`, `seed-arguments`, `seed-config`), wrapper `scripts/seed-user.ts` (tsx, zamyka ORM w `finally`), komenda `npm run seed:user`, `SEED_PASSWORD=` w `.env.example`; hasło tylko z env (stdin odłożone), min. 8 / 12 przy production, kody wyjścia 0/1/2, ostrzeżenie przez `PasswordHasher.verify` bez zapisu i bez haseł w logu.
Testy: unity 100% (wrapper objęty progiem) i integracyjne z prawdziwym procesem (dwa konta, idempotencja, ostrzeżenie). Lekcja o tsx.
Do zrobienia: instalator, README, BACKWARD_COMPATIBILITY, PR, wiersz PR-9 w track.md.

## 2026-11-24 (PR-9, krok 2.5, commit 2)
Instalator: "Następne kroki" wskazują `seed:user` i `SEED_PASSWORD` (bez generowania sekretów i bez uruchamiania seeda), stałe w `scripts/setup/config.ts`; README (Getting started i sekcja "Konta użytkowników"); BACKWARD_COMPATIBILITY §3 o `SEED_PASSWORD` i kontrakcie komendy.
Do zrobienia: wiersz PR-9 w track.md, SB-I, PR.

## 2026-11-24 (PR-11, krok 2.7, commit 1)
Baza: gałąź `feature/second-user-isolation` z `feature/login-and-accounts-pages` (#79) plus merge `feature/seed-accounts` (#76); konflikty (`.env.example`, lessons, dziennik, track) rozwiązane zachowaniem obu stron. Nowy `tests/integration/second-user-isolation.test.ts` (16 testów): żona `shared-only` ma jedno członkostwo, widzi tylko wspólne konto (API i strona `/`, także z `?account=<cudze>`), 403 bez danych na cudze konta osobiste, 401 przed decyzją dostępu, brak handlerów POST/PUT/PATCH/DELETE na `[id]`, niezależne sesje dwóch różnych użytkowników (wylogowanie jednej nie rusza drugiej) i 10 równoległych rund bez mieszania danych.
Pułapka: HTML strony `/?account=<id>` zawiera echo parametru w payloadzie Next, więc nie asertuję id, tylko nazwy.
Do zrobienia: E2E w przeglądarce dla żony, SB-I, PR, track.md.

## 2026-11-24 (PR-11, krok 2.7, commit 2)
SB-I: po merge #76 padły 2 testy `seed.test.ts` (brak `SESSION_SECRET` wymaganego od #77); test ustawia teraz losowy sekret, README wymienia `SESSION_SECRET` przed `seed:user` (lekcja). Przeglądarka (Chrome, seedowana aplikacja z testu przejściowego, usunięty): żona loguje się, widzi tylko "Konto wspolne", wylogowanie wraca na `/login`, ponowne wejście na `/` też. Typecheck, lint, coverage 100

## 2026-11-24 (PR-11, krok 2.7, commit 3)
Dopisek do commitu 2 (wpis urwał się na znaku procentu): coverage 100 procent, build, audit 0 podatności, integracyjne 105/105. PR #80 (base main, etykieta needs-qa, stos #70, #72, #73, #75, #76, #77, #78, #74, #71, #79); wiersz PR-11 uzupełniony numerem.
Do zrobienia: zielone checki, merge po stosie, SHA w track.md.

## 2026-11-24 (PR-12, close-out, commit 1)
Baza: `feature/e01-closeout` z `origin/feature/second-user-isolation` (#80, stos #70, #72, #73, #75, #76, #77, #78, #74, #71, #79). Spec auth-and-app-foundation przeniesiony `git mv` do `.ai/specs/implemented/` (bez zmiany nazwy); poprawione linki w track.md, nagłówku tego dziennika, specach E02 i E03, mapie ekranów, README prototypu, RAPORT.md, POSTEP.md i plikach `.mdx` w `packages/ui`. Stare wpisy w `.ai/runs/2026-11-02-project-bootstrap.md` zostawione bez zmian (historia).
Do zrobienia: sekcja odchyleń w specu, backlog, checkboxy monorepo-migration, track.md.

## 2026-11-24 (PR-12, close-out, commit 2)
Do speca (w `implemented/`) dopisana sekcja "Odchylenia od specu w implementacji": seed (wrapper w root `scripts/`, hasło tylko z `SEED_PASSWORD`, nazwy kont z opcji CLI, bez stdin, wymaga `SESSION_SECRET`), `GET /api/auth/me`, `loadEnvConfig` (Q39), CSRF (Q40), dwa liczniki throttla (5 i 20), `TRUSTED_PROXY_HOPS`, 400 dla nie-UUID w `/api/bank-accounts/{id}`. Wartości sprawdzone w kodzie (`seed-config.ts`, `login-throttle.service.ts`).
Do zrobienia: backlog, checkboxy monorepo-migration, track.md, PR.

## 2026-11-24 (PR-12, close-out, commit 3)
`.ai/specs/backlog.md`: sekcja "Status implementacji E01" (E01, S01, S02, #17-#20) według stanu PR-ów z `gh pr list`; tabela backlogu i issues na GitHubie bez zmian, bo tabela nie ma kolumny statusu.
Do zrobienia: checkboxy monorepo-migration, track.md, PR.

## 2026-11-24 (PR-12, close-out, commit 4)
`2026-11-02-monorepo-migration.md`: odhaczone tylko to, co istnieje w kodzie: Faza 4 (kontener Awilix, rejestracje `core`/`db`, test `container.test.ts`), w 4b `apiHandler`, `auth`, `env`, `logger` oraz w Fazie 5 Tailwind w `app` (#71, jeszcze niezmergowany). Linie rozdzielone, bo `makeCrudRoute`, `ui/backend/{tables}` i shadcn dla panelu admina nie powstały i zostają niezaznaczone.
Do zrobienia: track.md, PR.
