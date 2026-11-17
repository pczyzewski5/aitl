# Zasady code review

Reguły review dla AITL (Next.js, TypeScript, MikroORM, Awilix; monorepo `packages/{app,core,db,ui}`). Uzupełniają pole `reviewChecklist` w `.ai/agentic.config.json` i są stosowane przez `om-code-review` oraz `om-auto-review-pr`. Źródła: `AGENTS.md`, `.ai/specs/2026-09-01-engineering-standards.md`, `eslint.config.mjs`, `.github/workflows/ci.yml`. W razie rozbieżności wygrywa kod wymuszany przez lint i CI.

## Priorytety review

1. **Poprawność**: zmiana robi to, co deklaruje, w tym ścieżki błędów i wartości puste. Kwoty to liczby całkowite w jednostce podstawowej plus waluta, bez `float`; sumy liczone po stronie serwera.
2. **Bezpieczeństwo**: auth i własność rekordu po stronie serwera, brak wycieku sekretów, brak mass assignment, brak sklejania SQL.
3. **Kontrakty**: zgodność wsteczna powierzchni opisanych w `BACKWARD_COMPATIBILITY.md` (kształt odpowiedzi API, schemat DB, zmienne środowiskowe, ID zdarzeń).
4. **Architektura**: kierunek zależności między pakietami i podział odpowiedzialności.
5. **Testy**: regresja ma test, który pada bez zmiany; 100% pokrycia nowego kodu.
6. **Styl i czytelność**: nazwy, brak magicznych wartości, brak martwego kodu.

## Sprawdzenia specyficzne dla repo

### Granice pakietów (wymuszane przez ESLint `no-restricted-imports`)

- `core` nie importuje `@aitl/*`, `next`, `react`, `react-dom` ani `@mikro-orm/*`.
- `db` nie importuje `@aitl/app`, `@aitl/ui`, `next` ani `react`; zależy najwyżej od `core`.
- `ui` nie importuje `@aitl/*` ani `@mikro-orm/*`.
- `app` nie importuje `@mikro-orm/*`; tylko `db` używa MikroORM.
- Żaden pakiet nie zależy od `app`. Luzowanie reguł lintu dla wygody to blocker.
- Serwis w `core` zależy od portu (`*-repository.port.ts`), nie od implementacji; adapter jest w `db`, a wiązanie w kontenerze Awilix w `app`.

### Konwencje konceptów domenowych

- Brak `modules/`; koncept to podfolder o tej samej nazwie w warstwach, które go potrzebują (`entities/<concept>/`, `services/<concept>/`, `validators/<concept>/`, `api/<concept>/`).
- Folder konceptu powstaje dopiero z pierwszym plikiem; puste szkielety to uwaga.
- Para encja/serwis istnieje po obu stronach; żaden import nie sięga do wnętrza innego konceptu zamiast do publicznej metody serwisu.
- Nazwy zgodne z tabelą w specyfikacji standardów (`<name>.entity.ts`, `<name>.service.ts`, `<name>.schema.ts`, ID zdarzeń `concept.entity.action`).

### Warstwa API i UI

- Route nie ma własnego `try/catch` ani ręcznego `NextResponse.json`; używa `apiHandler`/`makeCrudRoute` z `packages/core/src/http/`.
- Serwisy rzucają tylko `AppError` i podklasy, nigdy nie budują odpowiedzi HTTP.
- Walidacja wejścia schematem Zod współdzielonym z `packages/core/src/validators/<concept>/`; route nie przekazuje surowego body do `em.create()`/`em.assign()`.
- Dostęp do `/api/*` z klienta wyłącznie przez `apiCall`/`apiCallOrThrow` z `packages/ui/src/backend/api`, nigdy surowy `fetch`.
- Nowe formularze, listy i stany używają `CrudForm`, `DataTable`, `feedback/*`; własna implementacja wymaga uzasadnienia w opisie PR-a.
- Prymitywy shadcn dodawane wyłącznie przez `npx shadcn@latest add`, w `ui/src/components/ui/`. Strony publiczne stylowane Tailwindem, panel admina na shadcn/ui.
- Route i strony czytające DB mają `export const dynamic = 'force-dynamic'`; aplikacja musi się zbudować i wystartować bez bazy.

### Baza danych

- Zmiany schematu wyłącznie przez migracje w `packages/db/migrations` (`npm run migration:create`), nigdy ręcznie ani przez synchronizację schematu. Migracja ma działać w górę i w dół; sprawdza to `tests/integration/migrations.test.ts`.
- Tabele i kolumny w snake_case, tabele w liczbie mnogiej; ID jako UUID z `base.entity.ts`.
- Operacje check-then-write na współdzielonym stanie w transakcji w warstwie serwisu lub chronione unikalnym ograniczeniem.

### Bezpieczeństwo

- Auth wymuszone po stronie serwera na każdej niepublicznej route (blocker). Autoryzacja sprawdza konkretny rekord, nie tylko "zalogowany" (blocker). Błąd decyzji bezpieczeństwa oznacza odmowę (blocker).
- Sekrety tylko z env walidowanego Zodem; żaden sekret, token, hasło ani JWT w logu, błędzie czy odpowiedzi (blocker).
- Zachowane flagi cookie `httpOnly`, `secure`, `sameSite` w kodzie auth (major); rate limiting na login/register/reset hasła, których dotyka zmiana (major).
- Komunikaty auth ogólne, bez ujawniania, czy e-mail jest zarejestrowany.
- Zależności: `npm audit --audit-level=high` zielone; nowa zależność tylko, gdy zastępuje więcej niż ok. 20 linii kodu.

### Testy

- Poprawka błędu i zmiana zachowania mają test regresyjny, który pada bez zmiany; jego brak to major.
- Każda nowa funkcja ma 100% pokrycia jednostkowego (statements, branches, functions, lines), bez wyłączania plików z pokrycia i bez obniżania progu w `vitest.config.ts`.
- Testy jednostkowe w `*.test.ts(x)` obok kodu; testy integracyjne w `tests/integration/` dla DB, migracji i współbieżności.
- Przepływy wrażliwe na wyścigi pokryte testem integracyjnym, nie tylko happy path.

### Jakość kodu

- Brak `any` bez uzasadnienia (`@typescript-eslint/no-explicit-any` jest błędem lintu), brak `console.log` (`no-console`), brak pustych `catch` (`no-empty`).
- Brak magicznych liczb i stringów, brak martwego i zakomentowanego kodu.
- Komentarze w kodzie tylko za wyraźną zgodą właściciela repo (patrz `AGENTS.md`).
- Diff w całości wynika z celu PR-a: bez przy okazji zmienianych nazw, formatowania i spekulatywnych opcji.
- DRY i SRP: encja to schemat, serwis to reguły biznesowe jednego konceptu, route to tylko wiring HTTP (walidacja, auth, serwis, koperta).

### Proces

- Zmiana zawiera wpis w `.ai/runs/` oraz, po poprawce błędu lub odkrytej pułapce, lekcję w `.ai/lessons/` z wpisem w `.ai/lessons.md`.
- Commit i tytuł PR-a w stylu opisanym w `SDLC.md` (krótki opis po angielsku w trybie rozkazującym).
- Pre-commit nie był omijany (`--no-verify`).
- Bramka walidacji z `SDLC.md` jest zielona; etykiety pipeline, kategorii, QA, priorytetu i ryzyka zgodne z `SDLC.md`.

## Wagi uwag

| Waga | Kiedy | Skutek |
|---|---|---|
| **blocker** | Luka bezpieczeństwa (brak auth/własności, wyciek sekretu, mass assignment, SQL z danych użytkownika), złamany kierunek zależności, naruszenie kontraktu z `BACKWARD_COMPATIBILITY.md` bez ścieżki migracji, migracja bez możliwości cofnięcia, utrata lub zdublowanie danych, kwoty jako `float`, czerwona bramka walidacji | `changes-requested`, merge zablokowany |
| **major** | Brak testu regresyjnego, brak testu dla ścieżki błędu, brak obsługi null/pustych wartości, powielenie istniejącego wzorca inline zamiast wspólnej warstwy, brak flag cookie lub rate limitu w dotkniętym kodzie auth | `changes-requested`, chyba że maintainer zwolni jawnie |
| **minor** | Nazewnictwo, czytelność, drobne naruszenia konwencji, zbędna złożoność | Do poprawy; nie blokuje, gdy autor uzasadni |
| **nit** | Preferencje stylistyczne | Nie blokuje; w razie potrzeby `om-followup-issue-from-pr` zakłada zgłoszenie follow-up |

Review zbiera wszystkie uwagi i niezielone sygnały (failujący check, konflikt) w jednym przebiegu, zamiast zatrzymywać się na pierwszym. Pewność ma być wyrażona: uwaga niepewna jest oznaczona jako pytanie, nie jako blocker.
