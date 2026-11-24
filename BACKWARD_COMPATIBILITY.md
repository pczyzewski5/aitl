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

Powierzchnia: route w `packages/app/src/app/api/<concept>/route.ts` (obecnie `GET /api/health`), koperta odpowiedzi z `packages/core/src/http/`.

- Kształt koperty to kontrakt: `{ ok: true, data }` oraz `{ ok: false, error: { code, message, fieldErrors? } }`. Przykład: `GET /api/health` zwraca `{ ok: true, data: { status: 'up' } }`.
- Kody statusu i kody błędów (`error.code`) mapowane z hierarchii `AppError` są częścią kontraktu.
- **Zmiana łamiąca**: usunięcie lub zmiana nazwy route, metody lub pola odpowiedzi, zmiana typu pola, zmiana znaczenia istniejącego kodu błędu lub statusu, dodanie nowego wymaganego pola żądania, zaostrzenie walidacji akceptowanego dotąd wejścia, zmiana jednostki kwoty (liczby całkowite w jednostce podstawowej plus waluta).
- **Zmiana zgodna**: nowa route, nowe opcjonalne pole żądania, nowe pole odpowiedzi, nowy kod błędu dla nowego przypadku.
- **Wymagana ścieżka**: dla zmiany łamiącej najpierw wprowadź nową wersję obok starej (nowa route lub nowe pole), oznacz starą jako przestarzałą w opisie PR-a i zachowaj ją co najmniej do momentu, gdy wszyscy konsumenci w repozytorium (`packages/ui/src/backend/api`, strony w `packages/app`) przejdą na nową; usunięcie starej w osobnym PR-ze. Klient (`apiCall`) i serwer (`apiHandler`) deklarują własne typy koperty, więc zmiana kształtu wymaga równoległej zmiany po obu stronach.
- Dane użytkownika zwracane z API nie mogą ujawniać sekretów, haszy haseł ani stack trace.
- Kod błędu `internal` (status 500, komunikat `Internal server error`) zwraca `apiHandler` dla każdego błędu spoza hierarchii `AppError` oraz dla błędu przy tworzeniu scope; ma zawsze stały komunikat bez szczegółów, a przyczyna trafia tylko do logu serwera. Klienci mogą polegać na tym kodzie i statusie; zmiana kodu, statusu albo ujawnienie szczegółów w odpowiedzi jest zmianą łamiącą.

## 3. Konfiguracja środowiska

Powierzchnia: zmienne środowiskowe w `.env.example` (m.in. `DATABASE_URL`), walidowane Zodem; `docker-compose.yml` (lokalny PostgreSQL).

- **Zmiana łamiąca**: usunięcie lub zmiana nazwy zmiennej, zmiana jej formatu, dodanie nowej wymaganej zmiennej bez wartości domyślnej.
- **Wymagana ścieżka**: nowa wymagana zmienna trafia do `.env.example`, a PR opisuje, co operator musi ustawić przed wdrożeniem; zmiana nazwy przez okres, w którym działa stara i nowa nazwa, z ostrzeżeniem o przestarzałej. Aplikacja musi się zbudować i wystartować bez dostępnej bazy.

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
