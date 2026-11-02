# AGENTS.md

AITL: aplikacja webowa do śledzenia oraz analizy wydatków. Opis dla ludzi w `README.md`.

## Założenia techniczne (obowiązują agentów)

- **Stack**: najnowszy Next.js, TypeScript, React, PostgreSQL + MikroORM, Awilix (DI), Tailwind, shadcn/ui. Nie wprowadzaj zamienników (inny ORM, kontener DI, framework CSS) bez zgody usera.
- **TypeScript**: wszędzie, bez `any` bez uzasadnienia.
- **Monorepo** (workspaces), kod w `packages/`:
  - `packages/app` (`@aitl/app`): główny kod aplikacji, Next.js, composition root kontenera DI.
  - `packages/core` (`@aitl/core`): części wielokrotnego użytku (logika domenowa, serwisy, typy, helpery). Bez zależności od Next.js i MikroORM.
  - `packages/db` (`@aitl/db`): konfiguracja MikroORM, encje, migracje, pula połączeń. Może zależeć najwyżej od `core`.
  - `packages/ui` (`@aitl/ui`): komponenty interfejsu wielokrotnego użytku. Nie zależy od `db`.
  - `app` może zależeć od pozostałych pakietów, żaden pakiet nie zależy od `app`. Nowe pakiety dodawaj w `packages/` pod nazwą `@aitl/<nazwa>`.
- **Baza danych**: PostgreSQL przez MikroORM. Zmiany schematu wyłącznie przez migracje, nigdy ręcznie ani przez synchronizację schematu.
- **Dependency Injection**: Awilix. Zależności wstrzykiwane przez konstruktor, rejestracja w kontenerze w `app`. Bez globalnych singletonów i `new` serwisów w logice biznesowej.
- **Kierunek zależności** (wymuszany docelowo przez ESLint `no-restricted-imports`): `app → {ui, core, db}`, `db → core`, `ui` samodzielne (nie importuje `core` ani `db`). Tylko `db` importuje `@mikro-orm/*`. Serwisy w `core` zależą od portów repozytoriów (`*-repository.port.ts`), `db` dostarcza adaptery, a kontener Awilix w `app` je wiąże.
- **UI**: strony frontendowe stylujemy Tailwindem, strony backendowe (panel admina) budujemy na shadcn/ui. Komponenty współdzielone trafiają do `packages/ui`.

### Konwencja konceptów domenowych

Nie używamy `modules/`. Każdy koncept (np. `expenses`, `categories`, `budgets`) to podfolder o tej samej nazwie powtórzony w warstwach, które go potrzebują:

- `packages/db/src/entities/<concept>/<name>.entity.ts` i `packages/db/src/repositories/<concept>/mikro-orm-<name>.repository.ts`
- `packages/core/src/services/<concept>/<name>.service.ts` oraz `<name>-repository.port.ts`
- `packages/core/src/validators/<concept>/` (współdzielone schematy Zod)
- `packages/app/src/app/api/<concept>/route.ts` i odpowiadające `page.tsx`

Folder konceptu tworzymy dopiero z jego pierwszym plikiem, bez pustych szkieletów. To konwencja katalogów, a nie runtime modułów: bez per-konceptowego setupu, ACL i auto-discovery. ID zdarzeń: `concept.entity.action` (np. `expenses.expense.created`), emitowane przez typowany emiter w `packages/core/src/events`, tylko w procesie, bez kolejek. Pełna tabela nazewnictwa, zasady bezpieczeństwa, checklist code review i procedura dodawania konceptu: `.ai/specs/2026-09-01-engineering-standards.md`.

### Warstwa API i UI wielokrotnego użytku

Każda route i strona korzysta ze wspólnych warstw zamiast własnej obsługi fetch/walidacji/auth/błędów:

- `packages/core/src/http/`: `errors.ts` (hierarchia `AppError`), `apiHandler.ts` (mapuje błędy na status i kopertę JSON, loguje nieoczekiwane), `makeCrudRoute.ts` (CRUD ze schematu i serwisu), `auth.ts` (`requireSession`, `requireRole`, asercje własności).
- `packages/ui/src/backend/`: `api/apiCall.ts` (jedyne miejsce z `fetch()` do `/api/*`), `forms/CrudForm.tsx`, `tables/DataTable.tsx`, `feedback/{LoadingMessage,ErrorMessage,EmptyState}.tsx`.

Nowy komponent wielokrotnego użytku ma jedno miejsce: prymityw shadcn w `ui/src/components/ui/` (tylko przez `npx shadcn@latest add`), generyczny wzorzec panelu w `ui/src/backend/<category>/`, komponent konceptu w `ui/src/components/<concept>/`, komponent jednej strony obok jej `page.tsx`.

### Zasady jakości i bezpieczeństwa

- Serwisy rzucają tylko `AppError` i jego podklasy, nigdy nie budują odpowiedzi HTTP. Route nie ma własnego `try/catch`.
- Auth i sprawdzenie własności rekordu wymuszamy po stronie serwera na każdej niepublicznej route. Błąd w decyzji bezpieczeństwa oznacza odmowę.
- Route nie przekazuje surowego body do `em.create()`/`em.assign()`, tylko sparsowany wynik schematu Zod.
- Kwoty jako liczby całkowite w jednostce podstawowej plus waluta, bez `float`. Sumy liczone po stronie serwera.
- Sekrety tylko z env walidowanego Zodem. Logger nie zapisuje haseł ani tokenów.
- Brak magicznych liczb i stringów, brak pustych `catch`, brak martwego kodu i debugowych `console.log`.
- Poprawka błędu i zmiana zachowania wymagają testu regresyjnego, który pada bez zmiany.
- Przed prośbą o review: `npm run typecheck`, `npm run lint`, `npm run test:coverage`, `npm run build` oraz `npm audit`.

## Workflow git

- Gałąź `main` jest chroniona na GitHubie: zmiany wchodzą wyłącznie przez PR, z zielonymi checkami (Build, Lint, Unit tests, Integration tests) i aktualną gałęzią. Bezpośredni push na `main` jest zablokowany (także dla administratorów), force-push i usuwanie zabronione.
- Pracuj na gałęzi `feature/<opis>` i otwieraj PR przez `gh pr create`.

## Baza danych (lokalnie)

- `docker compose up -d postgres` startuje PostgreSQL, a `.env` (kopia `.env.example`, ignorowany przez git) przekazuje `DATABASE_URL`.
- Migracje: `npm run migration:create|migration:up|migration:down -w @aitl/db`. Pliki migracji są generowane do `packages/db/migrations` (poza `src`, więc poza progiem pokrycia); ich poprawność sprawdza test integracyjny `tests/integration/migrations.test.ts`.

## Testy i CI

- **Każda nowa funkcja musi mieć 100% pokrycia testami jednostkowymi** (statements, branches, functions, lines). Bez wyjątków i bez wyłączania plików z pokrycia. Próg 100% jest wymuszony w `vitest.config.ts`, a `npm run test:coverage` pada przy każdej niepokrytej linii lub gałęzi.
- Testy jednostkowe: Vitest, pliki `*.test.ts(x)` obok kodu w `packages/*/src`. Uruchomienie: `npm test` (lub `npm run test:coverage`).
- Testy integracyjne: Vitest + testcontainers w `tests/integration/`. Globalny setup startuje PostgreSQL w kontenerze i udostępnia `inject('databaseUrl')`; `tests/integration/support/app-server.ts` uruchamia tymczasową instancję zbudowanej aplikacji (`next start`) na wolnym porcie. Wymagają Dockera i wcześniejszego `npm run build`. Uruchomienie: `npm run test:integration`.
- Tymczasowa instancja aplikacji z bazą do testów przeglądarkowych (agent-browser): `npm run test:integration:app` wypisuje URL i działa do Ctrl+C.
- Hook pre-commit (`.githooks/pre-commit`, instalowany przez `npm install` skryptem `prepare`) uruchamia lint, typecheck i testy z pokryciem 100%. Nie omijaj go przez `--no-verify`.
- CI (`.github/workflows/ci.yml`) dla każdego PR-a: build (typecheck + `next build`), lint, testy jednostkowe z pokryciem, testy integracyjne. Przed prośbą o review uruchom lokalnie `npm run typecheck`, `npm run lint`, `npm run test:coverage` i `npm run build`.

## Struktura `.ai/`

```
.ai/
├── specs/                  # specyfikacje (SDD)
│   ├── YYYY-MM-DD-slug.md  # aktywne
│   ├── implemented/        # zaimplementowane
│   └── archive/            # porzucone / nieaktualne
├── runs/                   # dzienniki zadań wykonywanych z AI
│   └── YYYY-MM-DD-slug.md
├── lessons.md              # indeks lekcji
└── lessons/                # szczegółowe lekcje
    └── YYYY-MM-DD-slug.md
```

## Specyfikacje (`.ai/specs/`)

- Specyfikacje służą do Spec-Driven Development: najpierw spec, potem implementacja.
- Nazwa pliku: `YYYY-MM-DD-slug.md` (data utworzenia, slug w kebab-case).
- Po zaimplementowaniu przenieś spec do `implemented/`, po porzuceniu lub zdezaktualizowaniu do `archive/`. Nie zmieniaj nazwy pliku przy przenoszeniu.
- Jeśli zadanie ma specyfikację, trzymaj się jej; rozbieżność zgłoś userowi zamiast cicho odchodzić od speca.

## Dzienniki zadań (`.ai/runs/`)

Jeden plik na zadanie, uzupełniany przyrostowo.

1. **Utworzenie**: `.ai/runs/YYYY-MM-DD-slug.md` tworzysz przy pierwszym commicie zadania. Data w nazwie to dzień rozpoczęcia zadania. Nie zmieniaj nazwy pliku i nie twórz nowego przy kolejnej sesji, nawet jeśli praca trwa kilka dni.
2. **Nagłówek**: na początku pliku stały nagłówek z celami zadania, linkiem do specyfikacji (jeśli istnieje) i linią `Status: in-progress` albo `Status: done`. Aktualizuj cele i status w tym nagłówku. `done` ustaw dopiero po ukończeniu zadania.
3. **Wpisy**: przy każdym commicie dopisz na końcu tego samego pliku wpis o długości 2–5 linii: data, co obejmuje ten commit, decyzje lub napotkane pułapki oraz co zostało do zrobienia. Nie zmieniaj wcześniejszych wpisów.
4. **Kiedy**: przygotuj wpis przed commitem i dołącz go do tego samego commita co opisywane zmiany. Nie odkładaj zapisu do końca sesji.
5. **Wznowienie**: przy wznowieniu zadania lub przejęciu go od innej osoby przeczytaj istniejący dziennik i kontynuuj w tym samym pliku.

Szablon:

```markdown
# <tytuł zadania>

Cele:
- ...

Spec: [.ai/specs/YYYY-MM-DD-slug.md](../specs/YYYY-MM-DD-slug.md) (lub: brak)
Status: in-progress

---

## YYYY-MM-DD
Zakres commita, decyzje/pułapki, co zostało do zrobienia.
```

## Lekcje (`.ai/lessons.md` i `.ai/lessons/`)

- Zapisuj tu ustalenia, wnioski i usprawnienia, np. po naprawieniu błędu albo gdy coś warto zachować w pamięci długoterminowej.
- Jedna lekcja = jeden plik `.ai/lessons/YYYY-MM-DD-slug.md` (co się stało, przyczyna, wniosek / jak postępować następnym razem).
- Każdą nową lekcję dopisz też jako linię w indeksie `.ai/lessons.md`.
- **Na początku zadania** przeczytaj `.ai/lessons.md` i sięgnij do lekcji istotnych dla zadania.

## Sposób pracy

- **Planowanie**: zadanie złożone (wiele plików, zmiana architektury, niejasny zakres) zaczynaj od planu (tryb planowania) albo specyfikacji w `.ai/specs/`. Poświęć na plan najwięcej uwagi, żeby implementacja przeszła w jednym podejściu. Gdy coś się sypie, zrób nowy plan zamiast brnąć dalej.
- **Weryfikacja**: przed uznaniem zmiany za gotową uruchom testy, lint i type-check, a w przypadku UI sprawdź działanie w przeglądarce. Nie zgłaszaj sukcesu bez dowodu (output komend). Przy bugu najpierw odtwórz go i dodaj test regresyjny, a dopiero potem naprawiaj.
- **Krytyczny przegląd**: przed commitem sprawdź własny diff pod kątem błędów i zbędnych zmian. Jeśli poprawka jest łatą, a po poznaniu przyczyny widać czystsze rozwiązanie, przepisz ją.
- **Wnioski po poprawkach**: po każdej korekcie od usera lub naprawionym błędzie zapisz lekcję (patrz "Lekcje"), a jeśli dotyczy ona reguł pracy, uzupełnij także ten plik, żeby błąd się nie powtórzył.
- **Subagenty**: research, przeglądy i niezależne zadania zlecaj subagentom, żeby nie zaśmiecać głównego kontekstu.
- **Powtarzalne czynności**: jeśli ta sama procedura wraca wielokrotnie, zaproponuj zamianę jej na skill lub komendę trzymaną w repo.

## Obowiązkowe zasady

- Przed rozpoczęciem pracy: przeczytaj `.ai/lessons.md`, odpowiedni spec (jeśli jest) oraz istniejący dziennik w `.ai/runs/` (jeśli zadanie jest wznawiane).
- Każdy commit zadania zawiera aktualizację dziennika w `.ai/runs/`.
- Po naprawieniu błędu lub odkryciu nieoczywistej pułapki dodaj lekcję.
- Nie modyfikuj wcześniejszych wpisów w dziennikach.
