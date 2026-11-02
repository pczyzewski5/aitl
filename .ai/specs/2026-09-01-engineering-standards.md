# AITL: standardy inżynieryjne i struktura pakietów

Data: 2026-09-01 (adaptacja do AITL: 2026-11-02)
Status: active

Źródło: spec standardów dla projektu DevMentor, przepisany pod AITL (śledzenie i analiza wydatków). Decyzje potwierdzone z właścicielem projektu:

- **podfoldery domenowe wewnątrz istniejących pakietów warstwowych** (nie runtime modułów),
- **zostaje `awilix`** jako kontener DI,
- **zostaje kierunek zależności `db → core`** (`app` zależy od wszystkich; `core` nie zna Next.js ani MikroORM). Różni się to od oryginalnej wersji speca (`app → core → db`); konsekwencje opisane w sekcji "Architektura".

Przykładowe koncepty domenowe AITL (zakres do potwierdzenia, nie tworzymy ich z góry): `auth`, `expenses`, `categories`, `budgets`, `reports`.

---

## 1. Zasady inżynieryjne

### Nazewnictwo

| Element | Konwencja | Przykład |
|---|---|---|
| Pakiet | `packages/<name>`, scope `@aitl/<name>` | `@aitl/core` |
| Folder konceptu | liczba mnoga, jedno słowo, zgodne z przestrzenią nazw zdarzeń | `expenses`, `budgets` |
| Encja | klasa PascalCase w liczbie pojedynczej, plik `<name>.entity.ts` w folderze konceptu | `Expense` → `db/src/entities/expenses/expense.entity.ts` |
| Tabela DB | snake_case, liczba mnoga | `expenses` |
| Kolumna DB | snake_case (mapowana z camelCase) | `created_at` ← `createdAt` |
| Serwis | PascalCase + `Service`, plik `<name>.service.ts` w folderze konceptu | `ExpenseService` → `core/src/services/expenses/expense.service.ts` |
| Port (interfejs zależności zewnętrznej, w tym repozytorium) | PascalCase + `Repository`/`Gateway`/`Port`, plik `<name>.port.ts` | `ExpenseRepository` → `core/src/services/expenses/expense-repository.port.ts` |
| Adapter portu | PascalCase z nazwą adaptera, w `db` (repozytoria) lub `adapters/` | `MikroOrmExpenseRepository` → `db/src/repositories/expenses/mikro-orm-expense.repository.ts` |
| Klucz cradle DI | camelCase, jeden wpis na zależność | `expenseService: ExpenseService` |
| Schemat Zod | camelCase + `Schema`, plik `<name>.schema.ts`, współdzielony klient/serwer | `expenseCreateSchema` → `core/src/validators/expenses/expense-create.schema.ts` |
| ID zdarzenia | `concept.entity.action`, czas przeszły, kropki | `expenses.expense.created` |
| Route API | jeden `route.ts` na zasób w `api/<concept>/...` | `api/expenses/route.ts` |
| Strona | `<segment>/page.tsx`, domyślny eksport `<Segment>Page` | `expenses/page.tsx` → `ExpensesPage` |
| Komponent UI | PascalCase; prymitywy shadcn w `components/ui/`, komponenty konceptu w `components/<concept>/`, generyczne klocki panelu w `backend/<category>/` | `ExpenseCard`, `CrudForm` |
| Błąd domenowy | PascalCase + `Error`, dziedziczy po `AppError`, plik `core/src/http/errors.ts` | `NotFoundError` |
| Builder handlera API | `makeCrudRoute` (CRUD) lub `apiHandler` (własny workflow), oba z `core/src/http` | `export const { GET, POST } = makeCrudRoute({ ... })` |
| Helper fetch po stronie klienta | `apiCall`/`apiCallOrThrow` z `ui/src/backend/api`, nigdy surowy `fetch` | `const res = await apiCall<Expense[]>('/api/expenses')` |

### Warstwa wielokrotnego użytku (API i UI)

Dodawanie kolejnych konceptów po jednym grozi tym, że każda route i strona zaimplementuje fetch, walidację, auth i obsługę błędów po swojemu. Zapobiegają temu dwie wspólne warstwy. **Nowe tworzymy tylko dla naprawdę nowego wzorca, nigdy nie powielamy istniejącego inline.**

**Serwer, `packages/core/src/http/`** (bez zależności od Next.js: pracuje na standardowych `Request`/`Response`):

- `errors.ts`: typowana hierarchia (`AppError`; `NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ValidationError`, `ConflictError`). Serwisy rzucają wyłącznie te błędy i nigdy nie budują odpowiedzi HTTP.
- `apiHandler.ts`: opakowuje handler route. Mapuje `AppError` na status i spójną kopertę JSON (`{ ok: true, data }` / `{ ok: false, error: { code, message, fieldErrors? } }`), loguje nieoczekiwane błędy przez wspólny logger i nigdy nie zwraca stack trace. Żadna route nie ma własnego `try/catch`.
- `makeCrudRoute.ts`: dla zasobu będącego zwykłym list/create/update/delete (np. `categories`) przyjmuje schematy Zod i referencje do metod serwisu, zwraca `{ GET, POST, PUT, DELETE }`. Workflow niepasujące do CRUD używają `apiHandler`.
- `auth.ts`: `requireSession(req)` (rzuca `UnauthorizedError`), `requireRole`, asercje własności (np. `assertOwnsExpense`, rzucają `ForbiddenError`). Każda route niepubliczna wywołuje je pierwsza.

**Klient, `packages/ui/src/backend/`:**

- `api/apiCall.ts`: jedyne miejsce, gdzie wolno wywołać `fetch()` do `/api/*`. Defensywnie parsuje kopertę (`readJsonSafe`), zwraca typowany `ApiResult<T>`; `apiCallOrThrow` dla wywołań, które wolą rzucać.
- `forms/CrudForm.tsx`: formularz sterowany schematem Zod (tym samym co po stronie serwera), pokazuje `fieldErrors` przy właściwym polu, obsługuje submit/cancel/loading, `Cmd/Ctrl+Enter` zatwierdza, `Escape` anuluje.
- `tables/DataTable.tsx`: lista sterowana konfiguracją kolumn z obsługą loading/empty/error, paginacją i akcjami wiersza.
- `feedback/{LoadingMessage,ErrorMessage,EmptyState}.tsx`: jedyne dozwolone renderery tych stanów.

Koperta JSON to **konwencja kształtu**, a nie współdzielony typ TypeScript: `core/src/http` i `ui/src/backend/api` deklarują własne typy, bo `ui` nie może importować `core`. Jeśli duplikacja stanie się uciążliwa, rozważamy piąty pakiet `packages/shared`. To zmiana architektury wymagająca zgody usera (Ask First).

**Gdzie trafia nowy komponent wielokrotnego użytku:**

1. Surowy prymityw shadcn (bez logiki aplikacji) → `ui/src/components/ui/`, dodawany wyłącznie przez `npx shadcn@latest add <name>`.
2. Generyczny wzorzec panelu niezależny od konceptu → `ui/src/backend/<category>/`.
3. Komponent związany z kształtem domenowym jednego konceptu → `ui/src/components/<concept>/`.
4. Komponent używany przez dokładnie jedną stronę → obok jej `page.tsx`; przenosimy dopiero, gdy potrzebuje go druga strona.

### Architektura

- **Kierunek zależności**: `app → {ui, core, db}`, `db → core`, `ui` samodzielne (nie importuje `core` ani `db`), `core` nie importuje nic z pozostałych pakietów. Wymuszane przez ESLint `no-restricted-imports`; granicy nie luzujemy dla wygody.
- **Persystencja przez porty**: serwisy w `core` zależą od interfejsów repozytoriów (`*-repository.port.ts`), a `db` dostarcza ich implementacje oparte o MikroORM (encje i repozytoria). Implementacje wiąże kontener Awilix w `app`. Tylko `db` importuje `@mikro-orm/*`.
- Folder konceptu powstaje **dopiero z pierwszym plikiem** konceptu, bez pustych szkieletów.
- Integracje zewnętrzne (np. import z banku, powiadomienia) przez **port w `core`** z adapterem mock/in-memory na MVP i prawdziwym później, bez zmian po stronie wywołujących.
- Zdarzenia domenowe: lekki typowany emiter w `core/src/events`, singleton w cradle, bez kolejek. Tylko efekty uboczne w procesie (logowanie, unieważnienie cache).
- Współdzielone schematy Zod w `core/src/validators/<concept>/`, importowane przez route (walidacja serwerowa) i formularz (kliencka), nigdy nie definiowane ponownie.
- Dostęp do DB tylko w route/stronach z `export const dynamic = "force-dynamic"`; aplikacja musi się zbudować i wystartować bez dostępnej bazy.
- Operacje zmieniające współdzielony stan (np. sprawdzenie i zapis limitu budżetu) idą przez transakcję DB w warstwie serwisu, nigdy check-then-write w dwóch rundach bez transakcji.

### Zasady inżynieryjne

W razie konfliktu zasad wybieramy tę, która daje **mniejszą i bardziej jawną** zmianę.

- **SRP**: plik encji to wyłącznie schemat; serwis to reguły biznesowe jednego konceptu; route to tylko wiring HTTP (walidacja → auth → wywołanie serwisu → koperta).
- **DRY**: schemat Zod raz w `core/src/validators/<concept>/`; logika fetch/koperty raz w `apiCall`/`apiHandler`. Przed skopiowaniem `try/catch` lub bloku walidacji wydziel go.
- **Separation of Concerns**: persystencja w `db`, reguły biznesowe w `core`, HTTP/rendering w `app`, prezentacja w `ui`. `core` nie importuje `next`/`react`; strona nigdy nie wykonuje surowego zapytania MikroORM.
- **Dependency Inversion**: serwis zależy od portu, nie od SDK dostawcy ani ORM-a. Awilix wiąże wybrany adapter przy starcie.
- **Jawność ponad niejawność**: `container.ts` rejestruje każdą zależność ręcznie, bez `loadModules`; nowy serwis to nowa linia w `container.ts` i `cradle.ts`.
- **Konwencja ponad konfigurację, wąsko**: konwencja folderów `<concept>/` zastępuje system modułów, działa tylko przy konsekwentnym stosowaniu.
- **YAGNI**: żadnych folderów, ról, multi-tenant, kolejek, loaderów pluginów na zapas.
- **Kompozycja ponad dziedziczenie**: małe serwisy składane razem, bez bazowej klasy z metodami szablonowymi.
- **Fail closed**: błąd w sprawdzeniu autoryzacji lub własności oznacza odmowę (403), nigdy "allow".
- **Idempotentność tam, gdzie możliwe są ponowienia**: np. import transakcji (ponowny import tego samego wyciągu nie może dublować wydatków), co wymaga unikalnego klucza i transakcji, a nie tylko sprawdzenia w aplikacji.

### Bezpieczeństwo i walidacja (minimum)

- **Hasła**: `bcrypt`/`bcryptjs`, koszt **≥ 12**. Ewentualna ścieżka: `argon2id` (pamięć ≥ 19 MiB, iteracje ≥ 2, równoległość 1), bez trzeciej opcji.
- **JWT**: min. `HS256`, sekret ≥ 32 losowe bajty z `env.ts` (walidowany Zodem), nigdy w kodzie ani w repo. Krótka ważność (np. 24h), brak refresh tokenów w MVP (znane ograniczenie, nie wydłużamy tokenu).
- **Cookies**: `httpOnly`, `secure` na produkcji, `sameSite=lax` (lub `strict` dla tras auth), ograniczony `path`. Nigdy JWT w `localStorage` ani w cookie bez HttpOnly.
- **CSRF**: dla tras zmieniających stan `sameSite` plus wymagany własny nagłówek (`apiCall` zawsze go ustawia).
- **Rate limiting**: `login`, `register` i reset hasła mają kontrolę brute-force (licznik per IP+email z cooldownem na MVP).
- **Własność ponad rola**: bez RBAC, ale każda mutacja sprawdza własność (użytkownik edytuje tylko swoje wydatki, kategorie i budżety). Brak sprawdzenia własności to blocker tak samo jak brak auth.
- **Mass assignment**: route nigdy nie przekazuje surowego body do `em.create()`/`em.assign()`, tylko sparsowany, jawnie typowany wynik schematu Zod.
- **Injection**: persystencja wyłącznie przez API encji/zapytań MikroORM, bez sklejania SQL i `Knex.raw` z danymi użytkownika.
- **Poprawność kwot**: kwoty jako liczby całkowite w jednostce podstawowej (np. grosze) plus waluta, nigdy `float`. Sumy i salda zawsze liczone po stronie serwera; kwota od klienta jest parsowana, ale sumy od klienta nie są ufane.
- **Sekrety i logi**: wszystkie sekrety z env walidowanego Zodem, `.env` w `.gitignore`; `pino` nie loguje haseł, tokenów ani pełnych JWT (jawna redakcja w konfiguracji loggera).
- **Komunikaty auth**: ogólne ("invalid credentials"), bez ujawniania, czy e-mail jest zarejestrowany.
- **ID**: UUID (domyślnie w `base.entity.ts`), co utrudnia enumerację zasobów.
- **Higiena zależności**: `npm audit` w bramce walidacji; bez nowej zależności dla czegoś, co zastąpi 20 linii kodu.

### Jakość kodu

- Bez `any`; zawężaj typy `unknown` w runtime zamiast wyłączać sprawdzanie typów.
- Kod samoopisujący się; komentarz tylko za wyraźną zgodą usera (patrz `AGENTS.md`).
- Trzy podobne linie są w porządku, skopiowany blok z rozgałęzieniami nie, wydziel go.
- Funkcja robi jedną rzecz na jednym poziomie abstrakcji; wczesne `return` zamiast zagnieżdżonych `if`.
- Ścieżki błędów i pustych wartości obsługuj tam, gdzie powstają.
- Żadnych pustych `catch`: obsłuż, zaloguj z kontekstem przez wspólny logger albo rzuć dalej.
- Bez magicznych liczb i stringów: nazwana stała, a gdy wartość nieoczywista (okno rate limitu), uzasadnienie.
- Booleany czytają się pozytywnie (`isConfirmed`); gołe `true`/`false` w wywołaniu zastąp nazwaną opcją lub osobną funkcją.
- Martwy kod, zakomentowany kod i debugowe `console.log` usuwamy przed review.
- Diff PR-a w całości wynika z jego celu, bez przy okazji zmienianych nazw, formatowania czy spekulatywnych opcji.

### Checklist code review

**Struktura i konwencje**

- Nazwy folderów konceptów zgodne z tabelą; para encja/serwis istnieje po obu stronach (bez encji bez serwisu i odwrotnie).
- Żaden import nie łamie kierunku zależności ani nie sięga do wnętrza innego konceptu zamiast do jego publicznej metody serwisu.
- Nowe route używają `makeCrudRoute`/`apiHandler`, nowe formularze `CrudForm`, nowe listy `DataTable`; własna implementacja wymaga uzasadnienia w opisie PR.
- `npm run lint`, `npm run typecheck` i odpowiednie testy przechodzą przed review.

**Bezpieczeństwo**

- [ ] Auth wymuszane **po stronie serwera** na każdej niepublicznej route. (blocker)
- [ ] Autoryzacja sprawdza **konkretny rekord**, nie tylko "zalogowany" (brak IDOR). (blocker)
- [ ] Check-then-act na współdzielonym zasobie chroniony transakcją i/lub unikalnym ograniczeniem. (blocker)
- [ ] Żaden sekret, token, hasło ani pełny JWT w logu, błędzie czy payloadzie dla klienta. (blocker)
- [ ] Brak niezparametryzowanych danych w zapytaniu, komendzie shell czy ścieżce pliku. (blocker)
- [ ] Endpoint zapisu parsuje jawny kształt Zod, bez spread surowego body. (blocker)
- [ ] Flagi cookie (`httpOnly`, `secure`, `sameSite`) zachowane przy zmianach w kodzie auth. (major)
- [ ] Błąd wokół decyzji bezpieczeństwa kończy się odmową. (blocker)
- [ ] Poprawka błędu w przepływie istotnym dla bezpieczeństwa ma test regresyjny, który bez niej pada. (major)
- [ ] Rate limiting na login/register/reset hasła, których dotyka zmiana. (major)

**Poprawność i testy**

- Przepływy wrażliwe na wyścigi pokryte testem integracyjnym symulującym współbieżność, nie tylko happy path.
- Rewalidacja po stronie serwera dla wszystkiego od klienta, co wpływa na kwoty lub własność (kwota, ID kategorii, ID użytkownika).
- Zmiana zachowania ma test padający na starym kodzie; poprawka błędu ma test regresyjny odtwarzający błąd.

---

## 2. Jak dodać nowy koncept (dla agenta)

Przy prośbie o nowy koncept (np. "dodaj budgets"):

1. Utwórz `packages/db/src/entities/<concept>/<name>.entity.ts` i zarejestruj w `entities/index.ts`.
2. Utwórz port repozytorium `packages/core/src/services/<concept>/<name>-repository.port.ts` oraz serwis `<name>.service.ts` zależny od portu; w `db` dodaj adapter `repositories/<concept>/mikro-orm-<name>.repository.ts`. Zarejestruj serwis i adapter w `container.ts` w `app` i typy w `cradle.ts`.
3. Dodaj walidację w `packages/core/src/validators/<concept>/<name>-<action>.schema.ts` (obowiązkowe, gdy istnieje wejście create/update).
4. Jeśli koncept emituje zdarzenia, dodaj je w `core/src/events` (nazwy `concept.entity.action`) i emituj z serwisu po udanej mutacji.
5. Dodaj powierzchnię HTTP w `packages/app/src/app/api/<concept>/route.ts`:
   - zwykły CRUD → `export const { GET, POST, PUT, DELETE } = makeCrudRoute({ schema, service })`,
   - własny workflow → opakuj handler w `apiHandler`, wywołaj `requireSession`/asercje własności z `core/src/http/auth.ts`, potem metody serwisu.
   - Nigdy gołe `try/catch` + ręczne `NextResponse.json`.
6. Dodaj strony w grupie route'ów odpowiedniej dla kontekstu (frontend z Tailwindem, panel z shadcn/ui):
   - dane przez `apiCall`/`apiCallOrThrow`, nigdy surowy `fetch`,
   - tworzenie/edycja → `CrudForm` z tym samym schematem co w kroku 3,
   - listy → `DataTable`,
   - stany loading/error/empty → komponenty z `feedback/`.
   - Przed nowym komponentem sprawdź `ui/src/backend/` i `ui/src/components/<concept>/`.
7. Nigdy nie twórz `modules/<concept>/`, per-konceptowego `setup.ts`/`acl.ts` ani mechanizmu auto-discovery.

---

## 3. Struktura pakietów (docelowa, tworzona stopniowo)

```
packages/
  app/src/app/
    (marketing)/ ...        # strony publiczne (Tailwind)
    (auth)/login, register
    (admin)/ ...            # panel (shadcn/ui)
    api/<concept>/route.ts
  app/src/container/{container.ts,cradle.ts}   # composition root Awilix
  core/src/
    config/env.ts
    logger.ts
    http/{errors,apiHandler,makeCrudRoute,auth}.ts
    events/{event-bus,event-map}.ts
    services/<concept>/{<name>.service.ts,<name>-repository.port.ts}
    validators/<concept>/<name>-<action>.schema.ts
  db/src/
    entities/{base.entity.ts,define.ts,<concept>/<name>.entity.ts}
    repositories/<concept>/mikro-orm-<name>.repository.ts
    migrations/
  ui/src/
    components/ui/          # tylko prymitywy shadcn
    components/<concept>/   # komponenty konceptów
    backend/{api,forms,tables,feedback}/
```

Zależności: `app → {ui, core, db}`, `db → core`, `ui` samodzielne. Nowe są tylko podfoldery konceptów, bez nowych pakietów ani granic. `ui/src/backend/` to jedyny folder niezależny od konceptów: punkt wzrostu dla wspólnych klocków panelu, odpowiednik `core/src/http/` po stronie serwera.

---

## 4. Kolejność wdrożenia

Stopniowo, jeden budowalny krok naraz, nie jednym wielkim commitem. Fazy odpowiadają `.ai/specs/2026-11-02-monorepo-migration.md`.

1. Zasady z tego speca w `AGENTS.md` (zrobione).
2. `core/src/http/errors.ts` (bez zależności zewnętrznych; zrobione).
3. ESLint z `no-restricted-imports` wymuszającym kierunek zależności oraz skrypty `lint`/`test` (przy fazie 2, po inicjalizacji Next.js).
4. `core/src/http/{apiHandler,makeCrudRoute,auth}.ts` i `ui/src/backend/*` przed dodaniem drugiego konceptu, zbudowane na jednym realnym przykładzie.
5. `core/src/events/` i `core/src/validators/` dopiero przy pierwszej funkcji, która ich potrzebuje.
6. Każdy kolejny koncept według sekcji 2, bez wcześniejszych szkieletów.
7. Po każdym kroku: `npm run typecheck`, `npm run lint` i `npm run build` przechodzą.
