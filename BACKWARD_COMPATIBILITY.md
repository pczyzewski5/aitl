# Zgodność wsteczna

Ten dokument wymienia **chronione powierzchnie kontraktowe** AITL i opisuje, jak je zmieniać. Powstał z inwentarza powierzchni faktycznie obecnych w repozytorium. Skille review sprawdzają zmiany względem tego pliku, a skille implementujące ostrzegają, gdy zmiana go narusza. Zmiana łamiąca bez opisanej ścieżki jest blockerem w review (patrz `CODE_REVIEW.md`) i ma ryzyko `risk-high` (patrz `SDLC.md`).

Aplikacja jest na etapie początkowym (wszystkie pakiety w wersji `0.0.0`, `private: true`, brak publikacji do rejestru npm). Dlatego powierzchnie wewnętrzne mogą się zmieniać swobodniej niż publiczne, ale to, co trafiło na wspólne środowisko albo do bazy z danymi, jest chronione.

## 1. Schemat bazy danych i migracje

Powierzchnia: `packages/db/migrations/` (np. `Migration20261102112044_initial.ts`), encje w `packages/db/src/entities/`.

- Schemat zmienia się **wyłącznie przez migracje**, nigdy ręcznie ani przez synchronizację schematu. Wykonana migracja jest niezmienna: nie edytujemy pliku, który już trafił na `main`; poprawkę wprowadzamy nową migracją.
- Każda migracja ma działający `down`; test `tests/integration/migrations.test.ts` sprawdza jej poprawność.
- **Zmiana łamiąca**: usunięcie lub zmiana nazwy tabeli albo kolumny, zmiana typu kolumny, zawężenie typu, dodanie `NOT NULL` bez wartości domyślnej, dodanie ograniczenia unikalności na istniejących danych, zmiana klucza głównego (UUID z `base.entity.ts`).
- **Wymagana ścieżka**: wzorzec rozszerz-i-skurcz w osobnych PR-ach (1. dodaj nową kolumnę/tabelę i zacznij pisać do obu, 2. przenieś dane migracją, 3. przełącz odczyt, 4. usuń starą strukturę w późniejszej migracji). PR zawiera plan wycofania w opisie i wynik testu migracji w górę i w dół.
- Konwencje nazw (tabele w liczbie mnogiej snake_case, kolumny snake_case) są częścią kontraktu: zmiana nazwy to zmiana łamiąca.

## 2. Powierzchnia HTTP (`/api/*`)

Powierzchnia: route w `packages/app/src/app/api/<concept>/route.ts` (obecnie `GET /api/health`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/bank-accounts`, `GET /api/bank-accounts/{id}`), koperta odpowiedzi z `packages/core/src/http/`.

- Kształt koperty to kontrakt: `{ ok: true, data }` oraz `{ ok: false, error: { code, message, fieldErrors?, retryAfterSeconds? } }`. Przykład: `GET /api/health` zwraca `{ ok: true, data: { status: 'up' } }`.
- Kody statusu i kody błędów (`error.code`) mapowane z hierarchii `AppError` są częścią kontraktu.
- **Zmiana łamiąca**: usunięcie lub zmiana nazwy route, metody lub pola odpowiedzi, zmiana typu pola, zmiana znaczenia istniejącego kodu błędu lub statusu, dodanie nowego wymaganego pola żądania, zaostrzenie walidacji akceptowanego dotąd wejścia, zmiana jednostki kwoty (liczby całkowite w jednostce podstawowej plus waluta).
- **Zmiana zgodna**: nowa route, nowe opcjonalne pole żądania, nowe pole odpowiedzi, nowy kod błędu dla nowego przypadku.
- **Wymagana ścieżka**: dla zmiany łamiącej najpierw wprowadź nową wersję obok starej (nowa route lub nowe pole), oznacz starą jako przestarzałą w opisie PR-a i zachowaj ją co najmniej do momentu, gdy wszyscy konsumenci w repozytorium (`packages/ui/src/backend/api`, strony w `packages/app`) przejdą na nową; usunięcie starej w osobnym PR-ze. Klient (`apiCall`) i serwer (`apiHandler`) deklarują własne typy koperty, więc zmiana kształtu wymaga równoległej zmiany po obu stronach.
- Dane użytkownika zwracane z API nie mogą ujawniać sekretów, haszy haseł ani stack trace.
- `POST /api/auth/login` (publiczna, wymaga nagłówka CSRF): żądanie `{ email, password }` (e-mail jest przycinany i zamieniany na małe litery po stronie serwera), odpowiedź 200 `{ ok: true, data: { user: { id, email, displayName } } }` i cookie sesji (jeśli żądanie niosło cookie istniejącej sesji, ta sesja jest usuwana, a nowa ją zastępuje); błędy: 400 `validation_error` (z `fieldErrors`), 401 `invalid_credentials` (ten sam status, kod i komunikat dla nieznanego e-maila i złego hasła), 403 `forbidden` (brak nagłówka CSRF), 429 `too_many_attempts` (blokada logowania, patrz niżej), 500 `internal`. Odpowiedź nigdy nie zawiera hasha, hasła ani tokena.
- Blokada logowania: kod `too_many_attempts`, status 429, `error.retryAfterSeconds` (liczba całkowita sekund do końca blokady, nowe opcjonalne pole koperty błędu) i nagłówek `Retry-After` o tej samej wartości; odpowiedź nie ma cookie. Blokada obejmuje także poprawne hasło i jest identyczna dla istniejącego i nieistniejącego e-maila (brak wycieku istnienia konta). Próba jest zliczana atomowo przed weryfikacją hasła, więc przy równoległych żądaniach do weryfikacji hasła dochodzi najwyżej próg prób na okno, a próba ponad próg dostaje 429 bez weryfikacji hasła. Udane logowanie kasuje tylko licznik pary adres+e-mail; licznik samego e-maila (także udane próby) zostaje do końca okna. Progi (5 prób na parę adres+e-mail, 20 na sam e-mail), okno 15 min i blokada 15 min to część kontraktu: ich zmiana zmienia zachowanie klientów. Kod `invalid_credentials` (401) jest zarezerwowany dla złych danych logowania, a `too_many_attempts` (429) dla blokady; zmiana któregokolwiek jest zmianą łamiącą.
- `GET /api/auth/me` (wymaga sesji; nowa route zgodna wstecz, dodana w PR-10c, bo `GET /api/bank-accounts` nie zwraca nazwy osoby, a pasek aplikacji pokazuje `displayName` po odświeżeniu strony): 200 `{ ok: true, data: { user: { id, email, displayName } } }` (ten sam kształt `user` co w odpowiedzi logowania, bez hasha i hasła); 401 `unauthorized` bez ważnej sesji lub gdy użytkownik sesji już nie istnieje. Strony `/` i `/login` czytają użytkownika po stronie serwera tym samym `AuthService.getCurrentUser`, a route służy klientom API.
- `GET /api/bank-accounts` (wymaga sesji): 200 `{ ok: true, data: { bankAccounts: [{ id, type, name }] } }` tylko z kont, których użytkownik jest członkiem, w kolejności: konta wspólne przed osobistymi, potem alfabetycznie po nazwie; 401 `unauthorized` bez ważnej sesji. Kształt elementu (dokładnie `id`, `type` `shared`/`personal`, `name`) i kolejność są kontraktem dla UI.
- `GET /api/bank-accounts/{id}` (wymaga sesji): 200 `{ ok: true, data: { id, type, name } }` dla członka; 401 bez sesji; 400 `validation_error` dla `id` niebędącego UUID; 403 `forbidden` dla nie-członka, **także gdy konto nie istnieje** (ta sama odpowiedź, brak wycieku istnienia). Wzorzec dla kolejnych route'ów zasobów konta: `requireSession`, potem `assertMemberOfBankAccount`, potem odczyt.
- `POST /api/auth/logout` (publiczna, wymaga nagłówka CSRF): zawsze 200 `{ ok: true, data: null }` i wygaszone cookie, także bez sesji lub z nieznanym tokenem; usuwa rekord sesji z cookie.
- Nagłówek CSRF: każda mutująca route wymaga `X-Requested-With: aitl` (dokładna wartość); brak lub inna wartość daje 403 `forbidden`. Zmiana nazwy lub wartości nagłówka jest zmianą łamiącą (klient `apiCall` ustawia go zawsze).
- Cookie sesji `aitl_session`: `httpOnly`, `sameSite=lax`, `path=/`, `maxAge` 90 dni, `secure` wg `SESSION_COOKIE_SECURE`. Nazwa cookie, flagi i okresy ważności (30 dni przesuwne, 90 dni twardy limit) są częścią kontraktu; zmiana skraca lub wylogowuje istniejące sesje.
- Kod błędu `internal` (status 500, komunikat `Internal server error`) zwraca `apiHandler` dla każdego błędu spoza hierarchii `AppError` oraz dla błędu przy tworzeniu scope; ma zawsze stały komunikat bez szczegółów, a przyczyna trafia tylko do logu serwera. Klienci mogą polegać na tym kodzie i statusie; zmiana kodu, statusu albo ujawnienie szczegółów w odpowiedzi jest zmianą łamiącą.

## 3. Konfiguracja środowiska

Powierzchnia: zmienne środowiskowe w `.env.example` (`DATABASE_URL`, `SESSION_SECRET`), walidowane Zodem; opcjonalne `SESSION_COOKIE_SECURE` i `TRUSTED_PROXY_HOPS`; `docker-compose.yml` (lokalny PostgreSQL).

- `TRUSTED_PROXY_HOPS` (opcjonalne, liczba całkowita >= 0, domyślnie 0): liczba zaufanych proxy przed aplikacją; przy N > 0 adres klienta dla throttla logowania to N-ty wpis od prawej w `X-Forwarded-For`, przy 0 nagłówek jest ignorowany (nie da się go podrobić), a komponent adresu w kluczu throttla jest stały. Zmiana wartości zmienia sposób liczenia prób, ale nie kształt API; wartość niebędąca liczbą całkowitą -> start odmawia z błędem walidacji. Nie występuje w `.env.example` (pusta wartość byłaby niepoprawna).
- `SESSION_SECRET` (wymagane, >= 32 znaki, klucz HMAC tokenów sesji): rotacja wylogowuje wszystkich (zamierzone); brak lub za krótki -> start odmawia z błędem walidacji bez wypisania wartości. `SESSION_COOKIE_SECURE` (opcjonalne, `true`/`false`): domyślnie `true` przy `NODE_ENV=production`, inaczej `false`; lokalny build produkcyjny bez HTTPS ustawia `false`. `NODE_ENV` nie jest w `.env.example`.
- Plik `.env` leży w korzeniu repozytorium; `packages/app/next.config.ts` ładuje go przez `@next/env` (zmienne z procesu mają pierwszeństwo). `.env` w `packages/app` nie jest czytany.
- **Zmiana łamiąca**: usunięcie lub zmiana nazwy zmiennej, zmiana jej formatu, dodanie nowej wymaganej zmiennej bez wartości domyślnej.
- **Wymagana ścieżka**: nowa wymagana zmienna trafia do `.env.example`, a PR opisuje, co operator musi ustawić przed wdrożeniem; zmiana nazwy przez okres, w którym działa stara i nowa nazwa, z ostrzeżeniem o przestarzałej. Aplikacja musi się zbudować i wystartować bez dostępnej bazy.
- `SEED_PASSWORD` (puste w `.env.example`) jest czytane wyłącznie przez komendę `npm run seed:user`, nie przez aplikację; kontrakt komendy to opcje `--email`, `--name`, `--shared-only`, `--shared-account-name`, `--personal-account-name` oraz kody wyjścia 0 (sukces), 1 (istniejący użytkownik z innym hasłem), 2 (błędne dane wejściowe), więc ich zmiana jest zmianą łamiącą dla skryptów operatora.

## 4. API pakietów wewnętrznych (`@aitl/*`)

Powierzchnia: eksporty z `packages/{core,db,ui}/src/index.ts` (pakiety `private`, `main` wskazuje `./src/index.ts`) oraz porty `*-repository.port.ts` w `core`.

- Są to kontrakty wewnętrzne monorepo, nie publiczne API: zmiana eksportu jest dozwolona w jednym PR-ze, o ile ten sam PR aktualizuje wszystkich konsumentów (`app`, inne pakiety) i przechodzi `npm run typecheck`.
- Kierunek zależności (`app → {ui, core, db}`, `db → core`, `ui` samodzielne) jest kontraktem architektonicznym wymuszanym przez ESLint: jego zmiana wymaga zgody właściciela repo i aktualizacji `AGENTS.md`.
- **Zmiana łamiąca** dla portu: zmiana sygnatury portu repozytorium wymaga równoczesnej zmiany adaptera w `db`.

## 5. Zdarzenia domenowe

Powierzchnia: ID zdarzeń w formacie `concept.entity.action` (np. `expenses.expense.created`) i ich ładunki, emitowane przez typowany emiter w `packages/core/src/events` (tworzony z pierwszą funkcją, która go potrzebuje).

- ID zdarzenia i kształt ładunku są kontraktem dla subskrybentów w procesie.
- **Zmiana łamiąca**: zmiana nazwy zdarzenia, usunięcie lub zmiana typu pola ładunku.
- **Wymagana ścieżka**: dodaj nowe zdarzenie lub pole obok starego, zaktualizuj subskrybentów w tym samym PR-ze, usuń stare w kolejnym.

## 6. Konfiguracja pipeline i narzędzi

Powierzchnia: `.ai/agentic.config.json`, `SDLC.md`, struktura `.ai/` (specyfikacje, dzienniki, lekcje), skrypty npm w korzeniu (`typecheck`, `lint`, `test`, `test:coverage`, `test:integration`, `build`) oraz job-y CI wymagane przez ochronę `main` (Build, Lint, Unit tests, Integration tests).

- Zmiana nazw skryptów npm lub job-ów CI wymaga równoczesnej aktualizacji `.ai/agentic.config.json`, `SDLC.md`, `AGENTS.md` i ochrony gałęzi na GitHubie, inaczej bramka walidacji lub wymagane checki przestaną działać.
- Pliki w `.ai/runs/` i wcześniejsze wpisy dzienników są niezmienne (patrz `AGENTS.md`).

## Jak postępować przy zmianie łamiącej

1. Zidentyfikuj powierzchnię z listy powyżej i wskaż ją w opisie PR-a.
2. Zastosuj ścieżkę wymaganą dla tej powierzchni (okres przejściowy, nowa wersja obok starej, migracja danych).
3. Dodaj testy obu stron: nowego zachowania i zgodności ze starym w okresie przejściowym; dla schematu test migracji w górę i w dół.
4. Oznacz PR `risk-high`, dołącz plan wycofania, a usunięcie starej powierzchni zaplanuj w osobnym PR-ze.
5. Brak ścieżki przejściowej wymaga jawnego wyjątku maintainera zapisanego na PR-ze z uzasadnieniem.

Gdy w repozytorium pojawią się nowe powierzchnie (publiczne API, CLI, webhooki, publikowane pakiety), dopisz je do tego pliku w tym samym PR-ze, który je wprowadza.
