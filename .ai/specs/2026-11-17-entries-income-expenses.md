# Zapis wpływów i wydatków (E02)

Status: DRAFT po decyzjach właściciela i review, bez otwartych pytań.
Źródła: epik #7 (E02), historie #12-#15, zadania #21, #22; `.ai/specs/product-brief.md` (D01, R01, R02, R03, A03); `.ai/specs/implemented/2026-11-17-auth-and-app-foundation.md` (zależność: `BankAccount`, członkostwo, `apiHandler`, `assertMemberOfBankAccount`, `apiCall`, `ui/backend/feedback`, wzorzec `/api/bank-accounts/{id}`); `AGENTS.md`; `.ai/specs/2026-09-01-engineering-standards.md` (faza 4b); `BACKWARD_COMPATIBILITY.md`.
Spec siostrzany: `.ai/specs/2026-11-17-monthly-remainder.md` (E03, czyta dane z tego specu).

## 📝 TLDR

Zalogowany użytkownik zapisuje wpływy i wydatki (jednorazowe oraz cykliczne miesięczne, zapisane raz jako seria) na koncie bankowym wspólnym lub osobistym, z kwotą jako liczba całkowita groszy plus waluta (R01, tylko PLN) i informacyjną flagą "zapłacone" (R02), i widzi je na liście konta dla wybranego miesiąca. Dziś wpisy żyją w arkuszu Google, bez automatyzacji cyklicznych (P01, P02, A03). To przyszłe zachowanie. Ta sama praca daje pierwszy realny użytek `makeCrudRoute`, `DataTable` i `CrudForm` (#22). Spec zakłada fundament z specu auth (nie powtarza go).

## 📝 Problem Statement

Arkusz Google: wydatki dodawane ręcznie z oznaczeniem zapłacone, cykliczne powtarzane ręcznie (P01, P02; A03 nietestowane). Wpis należy do `BankAccount` i jest chroniony członkostwem (R03: nigdy lista łączna obu kont); kwoty wg R01; flaga "zapłacone" tylko informuje (R02).

Stan dziś: w kodzie nie ma encji domenowych poza `baseEntityProperties`; `core/http` ma tylko `errors.ts`; `makeCrudRoute`, `DataTable`, `CrudForm` nie istnieją. Z specu auth wymagane: `apiHandler`, `auth.ts`, `BankAccount`, `apiCall`.

## 📝 Decisions

Wybory właściciela produktu, 2026-11-17. E02-Q1..Q12 jak rekomendacje szkicu (z jedną zmianą w Q3); Q13-Q16 po review.

| Id | Decyzja | Właściciel | Data |
|---|---|---|---|
| E02-Q1 | Dwa osobne specy: E02 (ten) i E03 (`2026-11-17-monthly-remainder.md`) | właściciel produktu | 2026-11-17 |
| E02-Q2 | `occurred_on` jako DATE bez strefy; miesiąc = miesiąc kalendarzowy tej daty, granice włącznie; domyślny miesiąc w UI liczony w Europe/Warsaw | właściciel produktu | 2026-11-17 |
| E02-Q3 | Tylko PLN. Kwota w groszach: `amount_minor` (liczba całkowita) plus `currency` z `CHECK (currency = 'PLN')`; 100 + PLN = 1 zł (R01). Bez listy walut i przeliczeń. Dodanie waluty to zmiana schematu (CHECK, Zod) i osobna decyzja w przyszłości | właściciel produktu | 2026-11-17 |
| E02-Q4 | Wpis cykliczny aktywny w miesiącu M gdy `startMonth <= M` i (`endMonth` puste lub `M <= endMonth`); puste = bez końca; dzień miesiąca informacyjny, bez wpływu na sumę | właściciel produktu | 2026-11-17 |
| E02-Q5 | Zmiana kwoty od miesiąca X = zamknięcie starej definicji w X-1 i nowa od X; bez edycji wstecz | właściciel produktu | 2026-11-17 |
| E02-Q6 | Flaga "zapłacone" tylko dla wydatków; per miesiąc (`entry_paid_months`). Uzupełnienie po review: jeden magazyn także dla jednorazowych (miesiąc = miesiąc `occurred_on`), bez kolumny `paid` (jedna ścieżka odczytu, zapisu i testów R02); semantyka Q6 bez zmian | właściciel produktu | 2026-11-17 |
| E02-Q7 | Jedna tabela `entries` z `type` (`income`/`expense`) | właściciel produktu | 2026-11-17 |
| E02-Q8 | Każdy członek konta edytuje i usuwa; twarde usuwanie, bez historii zmian (z ograniczeniem serii w Q15) | właściciel produktu | 2026-11-17 |
| E02-Q9 | Bez kategorii i dodatkowych pól; tylko `description` (max 200) | właściciel produktu | 2026-11-17 |
| E02-Q10 | Lista tylko per konto: `GET /api/bank-accounts/{id}/entries?month=YYYY-MM`, bez paginacji | właściciel produktu | 2026-11-17 |
| E02-Q11 | Kwota w UI "12,50" parsowana w formularzu; serwer przyjmuje tylko liczbę całkowitą > 0 | właściciel produktu | 2026-11-17 |
| E02-Q12 | CRUD przez `makeCrudRoute` z hookiem autoryzacji członkostwa, PATCH flagi przez `apiHandler`; kształt ustalany na #22 (dopuszczalne, że w `makeCrudRoute` zostaną tylko `POST` i `DELETE`) | właściciel produktu | 2026-11-17 |
| E02-Q13 | Limit 500 wpisów w odpowiedzi listy zostaje: 422 `result_limit_exceeded`, błąd `ResultLimitExceededError` w `core/http/errors.ts` | właściciel produktu | 2026-11-17 |
| E02-Q14 | Seria cykliczna to jedna pozycja w UI (kwota z wyświetlanego miesiąca); akcje działają na serii: "Zakończ od miesiąca", "Zmień kwotę od miesiąca" | właściciel produktu | 2026-11-17 |
| E02-Q15 | "Usuń całkowicie" tylko dla serii z `seriesStartMonth > currentMonth(Europe/Warsaw)` (żaden miesiąc <= bieżącego nie należy do serii); inaczej tylko "Zakończ od miesiąca" | właściciel produktu | 2026-11-17 |
| E02-Q16 | Waluta zostaje na wpisie (PLN). Kryterium #16 "w walucie konta" = PLN jako jedyna waluta; konto nie ma własnej waluty | właściciel produktu | 2026-11-17 |

Powiązane: D01, R01, R02, R03. Spec ich nie zmienia.

## 📝 Research (skrót)

Z wiedzy o produktach (bez weryfikacji online w tej sesji). Firefly III: wpisy cykliczne jako "recurrences" materializowane przez cron, z początkiem, końcem i dniem miesiąca. Actual Budget: harmonogramy z regułami. Przejmujemy: definicja z początkiem i opcjonalnym końcem. Pomijamy: materializację (liczymy z definicji: brak dryfu i zadań tła), cykle inne niż miesięczne, reguły, kategorie, wielowalutowość. Koszt: edycja kwoty tworzy kolejną definicję w serii (niezmiennik w serwisie), flaga per miesiąc ma osobną tabelę.

## 📝 Architecture

Kierunek zależności bez zmian. Koncept `entries`. Nowe elementy (każdy dochodzi w Stepie z konsumentem):

- `core/months/month.ts`: typ `Month` (`YYYY-MM`), `monthStart`, `nextMonthStart` (Step 1.1); `currentMonth(now: Date)` w `Europe/Warsaw` (stała `APP_TIME_ZONE`), `previousMonth`, `nextMonth` (Step 2.1); zakres 2000-01..2100-12. Reużywane przez E03.
- `core/money/`: `CURRENCY = 'PLN'`, `MAX_AMOUNT_MINOR = 9_999_999_999`, `parseAmountToMinor` (Step 2.2, patrz UI/UX).
- `core/validators/entries/`: schematy Zod serwera (`amountMinor` int 1..MAX strict, `currency: literal('PLN')`, `description` trim 1..200, `occurredOn` realna data `YYYY-MM-DD` 2000-01-01..2100-12-31, `type`, `month`, `endMonth`, `fromMonth` jako `YYYY-MM`, `expectedUpdatedAt`) oraz schemat formularza (tekst kwoty -> `amountMinor`, potem schemat serwera). Params ścieżki: `z.uuid()`.
- `core/services/entries/`: `EntryService`, `entry-repository.port.ts`: `findActiveInMonth(bankAccountIds: string[], month, limit?)`, `findByIdInAccount(bankAccountId, entryId)` (null -> 404), zapis, `withLockedSeries(bankAccountId, seriesId, fn)` i `withLockedEntry(bankAccountId, entryId, fn)` (transakcja z blokadą; adapter: `em.transactional` + `LockMode.PESSIMISTIC_WRITE`); `Clock` (`now()`) od Stepu 3.2. `ResultLimitExceededError` (422, `result_limit_exceeded`) w `core/http/errors.ts`.
- `db`: encje `Entry`, `EntryPaidMonth`, adapter MikroORM (jedyne miejsce z predykatem "aktywny w miesiącu").
- `makeCrudRoute` (Step 2.3, wyciągnięty z działających route'ów): `makeCrudRoute({ schema, service, authorize, resolveSession }) => { collection: { GET, POST }, item: { PUT, DELETE } }`; handler ma typ kontekstu `{ params: Promise<Record<string, string>> }` zdefiniowany lokalnie (bez importu `next`), sesja przez wstrzyknięty `resolveSession`, CSRF (`X-Requested-With`) sprawdza `apiHandler` dla metod mutujących (jedno miejsce, nie powielane); plik route eksportuje `export const dynamic = 'force-dynamic'` jako literał. Gdy abstrakcja okaże się za wąska, zostają w niej tylko `POST` i `DELETE`, a `GET`/`PUT`/`PATCH` idą przez `apiHandler` (wniosek do `.ai/lessons/`).
- `ui` (generyczne, bez polskich literałów i bez importów `@aitl/*`; teksty, schematy i funkcje miesięcy dostarcza `app` jako propsy): `backend/tables/DataTable`, `backend/forms/CrudForm` (pola, `validate`, etykiety z propsów), `components/months/MonthSwitcher` (label, prev/next, aria z propsów).
- `app`: `api/bank-accounts/[id]/entries/...`; `app/bank-accounts/[bankAccountId]/page.tsx` jako komponent serwerowy: `await params`/`searchParams`, walidacja `month`, `currentMonth(new Date())` po stronie serwera, sprawdzenie członkostwa (brak -> redirect/403), dane i propsy do komponentów klienckich.

Reguła aktywności (jedno źródło, adapter): jednorazowy aktywny w M gdy `occurred_on >= M-01` i `< następny miesiąc-01`; cykliczny gdy `occurred_on < następny miesiąc-01` i (`end_month IS NULL` lub `end_month >= M-01`). Granice włącznie po obu stronach.

## 📝 Data Model

Tabele liczba mnoga snake_case, UUID z `baseEntityProperties`. Kolumny dochodzą migracjami w fazie z konsumentem (bez martwych kolumn).

- `entries` (Faza 1, #21): `bank_account_id` (FK `bank_accounts`, `ON DELETE RESTRICT`), `type` (`income`|`expense`, `CHECK`), `amount_minor` (bigint, `CHECK BETWEEN 1 AND 9999999999`; w encji `p.bigint('number')`: MAX ~1e10 < 2^53, domyślny `BigIntType` w MikroORM 7 to natywny bigint, a `JSON.stringify` na nim rzuca; test: `typeof amountMinor === 'number'` w odpowiedzi JSON), `currency` (`CHECK = 'PLN'`), `description` (varchar 200, `CHECK char_length(trim(description)) > 0`), `occurred_on` (DATE, zakres 2000-01-01..2100-12-31). Indeks `(bank_account_id, occurred_on)`.
- Faza 3 (#14), rozszerzenie `entries`: `recurrence` (`none`|`monthly`, NOT NULL DEFAULT `none`), `series_id` (uuid, indeks; pierwsza definicja ma `series_id` = własne `id`, nadawane w serwisie przed zapisem), `day_of_month` (smallint 1..31), `end_month` (DATE). `CHECK`: `series_id` i `day_of_month` NOT NULL <=> `recurrence = 'monthly'`; `end_month` null dla jednorazowych, dzień = 1, `<= '2100-12-01'`, `>= date_trunc('month', occurred_on)`.
- Seria = zbiór definicji o wspólnym `series_id`, ułożonych bez nakładania i bez luk: kolejna zaczyna się w miesiącu po końcu poprzedniej; tylko ostatnia (ogon) ma `end_month` dowolne lub puste. Definicja zmiany (revision) ma `occurred_on = X-01`, dzień zostaje w `day_of_month`. Niezmiennik wymuszany w serwisie pod blokadą serii + test integracyjny (ograniczenie wykluczające w DB odrzucone: wymaga rozszerzenia `btree_gist`, a skala nie uzasadnia).
- Faza 4 (#15): `entry_paid_months`: `entry_id` (FK `entries`, `ON DELETE CASCADE`), `month` (DATE, `CHECK` dzień = 1), klucz główny `(entry_id, month)`. Tylko dla `type = 'expense'` i miesiąca w zakresie definicji (jednorazowy: miesiąc `occurred_on`); niezmiennik w `EntryService`.
- Migracje Faz 3 i 4: `down` przerywa się błędem, gdy istnieją wiersze cykliczne lub `entry_paid_months` (zamiast po cichu kasować dane); test w `tests/integration/migrations.test.ts` rozszerzony o up/down (dziś tylko up), z danymi i bez.
- Odstępstwo od brzmienia #21 (jedna migracja ze wszystkimi polami): pola cykliczności i flagi dochodzą w Fazach 3 i 4, by nie wprowadzać pól bez konsumenta.
- DATE: mapowanie MikroORM 7 na string `YYYY-MM-DD` ma test z `TZ` innym niż UTC (Step 1.1) i potwierdza brak przesunięcia dnia.

```mermaid
flowchart LR
    classDef newEntity fill:#2f6feb,color:#fff,stroke:#1b4fb0
    classDef existingEntity fill:#e5e7eb,color:#111,stroke:#9ca3af
    entity_1["Entry (+ series_id: definicje jednej serii)"]:::newEntity
    entity_2["EntryPaidMonth"]:::newEntity
    entity_3["BankAccount (spec auth, jeszcze nie w kodzie)"]:::existingEntity
    entity_3 -->|1-n| entity_1
    entity_1 -->|"1-n (tylko wydatek)"| entity_2
```

Widok: `.ai/data-model/2026-11-17-entries-income-expenses.html`.

## 📝 API Contracts

Koperta wg `BACKWARD_COMPATIBILITY.md` §2. Każda route: sesja, `assertMemberOfBankAccount` (nieznane i cudze `{id}` -> 403, fail closed, jak w auth-specu), mutacje z CSRF; `entryId` niebędący uuid lub spoza konta -> 404 `not_found`. Formaty: `occurredOn` = `YYYY-MM-DD`; `month`, `fromMonth`, `endMonth` = `YYYY-MM` (w DB DATE z dniem 1). Wszędzie, gdzie przyjmowane jest `amountMinor`, wymagane jest `currency: "PLN"` (R01: kwota zawsze z walutą).

- `GET /api/bank-accounts/{id}/entries?month=YYYY-MM` -> `{ ok:true, data:{ month, entries:[{ id, seriesId, type, amountMinor, currency, description, occurredOn, recurrence, dayOfMonth, seriesStartMonth, seriesEndMonth, paid, deletable, updatedAt }] } }`. `updatedAt` (ISO) to `updatedAt` zwróconej definicji, którą klient odsyła jako `expectedUpdatedAt`. Seria cykliczna występuje raz: jej definicja aktywna w M. `paid` dla wydatku (dla cyklicznego: stan w M), `null` dla wpływu. `deletable`: jednorazowy zawsze; seria gdy `seriesStartMonth > currentMonth(Europe/Warsaw)` (Q15, liczone w `core` przez `Clock`). `dayOfMonth` w odpowiedzi to dzień **efektywny** w żądanym miesiącu M (`min(day_of_month, długość M)`, np. 28 w lutym 2027 dla serii z dniem 31), ten sam, po którym sortuje lista; surowy `day_of_month` definicji nie jest zwracany, a klient niczego nie przycina. Sortowanie: dzień efektywny, `created_at`, `id`. Brak lub zły `month` -> 400. Więcej niż 500 aktywnych wpisów -> 422 `result_limit_exceeded` (zapytanie z `limit+1`).
- `POST .../entries` `{ type, amountMinor, currency, description, occurredOn, recurrence?, endMonth?, paid? }` -> 201. `paid` (domyślnie `false`) tylko dla `type = 'expense'`; dla wpływu `paid: true` -> 400. Przy `recurrence: "monthly"` dotyczy miesiąca `occurredOn`; zapisuje wiersz w `entry_paid_months` (Faza 4). `endMonth` tylko z `recurrence: "monthly"`, `>=` miesiąc `occurredOn` i `<= 2100-12`, inaczej 400 (nie 500). Błędy 400 (float, ujemna, zero, string, brak lub inna waluta, ponad maksimum, zła data), 401, 403. W UI waluta to stałe, ukryte pole.
- `PUT .../entries/{entryId}`: jednorazowy: `amountMinor`, `currency`, `description`, `occurredOn` (zmiana miesiąca przenosi wiersz flagi zapłacone, Faza 4); cykliczny (Faza 3): tylko `description` i `expectedUpdatedAt`, zapisywane na wszystkich definicjach serii; kwota, data, `endMonth`, `type`, `recurrence` w treści -> 400 `validation_error` z `fieldErrors`. `type`/`recurrence`/konto niezmienne.
- `POST .../entries/{entryId}/revisions` `{ fromMonth, amountMinor, currency, expectedUpdatedAt }` (Faza 3) -> 201 z nową definicją. `entryId` wskazuje serię; na wpisie jednorazowym -> 400. `fromMonth` musi leżeć w ogonie serii (`>= start ogona` i `<= jego koniec`), inaczej 400; `fromMonth =` start ogona -> kwota zmieniana w miejscu (200). Inaczej, w jednej transakcji pod blokadą serii: ogon kończy się w X-1, nowa definicja `occurred_on = X-01`, ten sam `type`/`description`/`day_of_month`, `end_month` odziedziczony, wiersze `entry_paid_months >= X` przeniesione na nową.
- `POST .../entries/{entryId}/end` `{ fromMonth, expectedUpdatedAt }` (Faza 3, "Zakończ od miesiąca") -> 200: `fromMonth` pierwszy miesiąc nieaktywny; wymaga `fromMonth > seriesStartMonth` (400 inaczej); pod blokadą serii kasuje definicje zaczynające się `>= fromMonth`, ogon dostaje `end_month = fromMonth-1`, kasuje `entry_paid_months >= fromMonth`.
- `DELETE .../entries/{entryId}` -> 200. Jednorazowy: zawsze (Q8). Seria: kasuje wszystkie definicje, tylko gdy `deletable`, inaczej 409 `conflict` (zamiast tego "Zakończ").
- `PATCH .../entries/{entryId}/paid` `{ paid, month? }` (Faza 4, `apiHandler`): wydatek jednorazowy bez `month`; cykliczny z `month` w zakresie serii; wpis typu wpływ, brak lub zły `month` -> 400. Transakcja z `FOR UPDATE` na wpisie (serii), `INSERT ... ON CONFLICT DO NOTHING` / `DELETE`; idempotentne.
- Współbieżność: `expectedUpdatedAt` (ISO) to `updatedAt` definicji, którą klient widział; niezgodność odczytana pod blokadą -> 409 `conflict`. Brak "wykonania na nowej definicji".
- Nowe kody: `result_limit_exceeded` (422). `BACKWARD_COMPATIBILITY.md` aktualizowany w Stepach 1.2, 1.3, 3.1, 3.2, 4.1 z listą pól i route danej fazy.

## 📝 UI/UX

Strona `/bank-accounts/[bankAccountId]?month=YYYY-MM` (Tailwind jak `/`): `MonthSwitcher`, `DataTable` wpisów (typ, opis, dzień, kwota "1 234,50 zł", cykliczny, zapłacone), "Dodaj" otwiera `CrudForm`; stany `LoadingMessage`/`ErrorMessage`/`EmptyState`; 422 jako komunikat o zbyt wielu wpisach. Teksty w `app` jako nazwane stałe. Bez paginacji `DataTable` (lista ograniczona miesiącem i limitem 500): świadome odstępstwo od standardu, jeśli ten wymaga paginacji.

Kwota (Q11): `parseAmountToMinor` w `core/money`, na łańcuchach, bez float: po przycięciu spacji (także NBSP) akceptuje `^\d{1,8}([.,]\d{1,2})?$`; "12" -> 1200, "12,5" -> 1250; odrzuca więcej niż dwa miejsca (bez zaokrąglania), separator tysięcy, minus, zero, puste i wartość powyżej maksimum. Prefill formularza edycji bez grupowania tysięcy ("1234,50"). `Intl.NumberFormat('pl-PL', PLN)` w `app` tylko do prezentacji, rachunki wyłącznie serwerowe.

Kolumna daty wpisu cyklicznego pokazuje `dayOfMonth` z odpowiedzi bez zmian, bo to już dzień efektywny.

Seria (Q14, Q15): jedna pozycja; akcje "Zakończ od miesiąca" i "Zmień kwotę od miesiąca" (wymaga miesiąca w ostatniej definicji serii, inaczej komunikat 400); "Usuń całkowicie" tylko gdy `deletable`, w dialogu z opisem skutków. Przełącznik zapłacone w wierszu wydatku (Faza 4), niewidoczny dla wpływu.

Dostępność: `MonthSwitcher` z `aria-label` przycisków i `aria-live="polite"` na etykiecie miesiąca; checkbox zapłacone z nazwą z opisu wpisu; dialog usuwania z pułapką fokusu i zamykaniem `Escape`; etykiety pól i fokus na pierwszym błędzie formularza. Prototype: brak zaakceptowanej wersji.

## 📝 Edge Cases & Failure Scenarios

- **Granice miesiąca (włącznie).** Wpis z 2026-01-31 należy do 2026-01, z 2026-02-01 do 2026-02; cykliczny z `day_of_month = 31` w lutym ma dzień 28/29 i liczy się raz. Testy: ostatni i pierwszy dzień sąsiednich miesięcy, rok przestępny, M-1 przed startem (brak), M = start, M = end (jest), M = end+1 (brak).
- **Strefa.** Domyślny miesiąc w Europe/Warsaw (2026-12-31 23:30 UTC = już styczeń); `occurred_on` bez konwersji.
- **Kwota.** JSON `12.5`, `"1200"`, `-1`, `0`, `1e100`, powyżej maksimum -> 400, nic nie zapisane; `1e2` jest liczbą całkowitą 100.
- **Wyścigi.** Operacje na serii (revision, end, PUT opisu, delete serii, PATCH paid) biorą blokadę serii i sprawdzają `expectedUpdatedAt`; dwie równoległe zmiany: druga dostaje 409. Test integracyjny równoległy: po próbach każdy miesiąc ma dokładnie jedną aktywną definicję serii (brak nakładania i luk). Wpis jednorazowy: ostatni zapis wygrywa (dwóch użytkowników, zaakceptowane).
- **Usunięcie serii w przeszłości jest niemożliwe** (Q15): seria z miesiącem `<=` bieżący tylko się kończy. Twarde usunięcie wpisu jednorazowego z miesiąca historycznego zmienia wynik tego miesiąca (świadomy skutek Q8, ryzyko niżej).
- Sesja wygasła w trakcie formularza: zapis zwraca 401, formularz pokazuje komunikat "Zaloguj się ponownie", wpisane dane zostają (decyzja Q34 ze specyfikacji auth; szczegóły, w tym zachowanie po ponownym zalogowaniu, do ustalenia przy E02).
- Dostęp: wpis konta B pod `{id}` konta A -> 404; brak członkostwa -> 403; brak sesji -> 401; żona na koncie osobistym -> 403 (HTTP).
- Baza niedostępna -> 500 `internal`; migracja nieudana -> `down` usuwa nową strukturę (poza przypadkiem z danymi: patrz Data Model).
- Usuwanie konta bankowego poza zakresem; `RESTRICT` blokuje je przy wpisach.

## 📝 Risks & Impact Review

- Schemat (§1): nowe tabele i kolumny rozszerzające z `DEFAULT`; `down` w każdej migracji (Fazy 3-4 przerywają się przy istniejących danych); test up/down. Waluta: `CHECK` na `'PLN'`; kolejna waluta to osobna migracja i decyzja.
- `/api/*` (§2): nowe route i kod `result_limit_exceeded`; pola odpowiedzi listy dochodzą fazami (`seriesId`, `dayOfMonth`, `seriesStartMonth`, `seriesEndMonth` w Stepie 3.1, `deletable` w 3.2, `paid` w 4.1); dodanie pola odpowiedzi to zmiana zgodna.
- **Twarde usuwanie (Q8)**: usunięcie wpisu jednorazowego z historii zmienia wynik E03 tego miesiąca, bez odtworzenia i historii; seria z przeszłością nie może być usunięta (Q15), tylko zakończona.
- Wyliczanie z definicji zamiast materializacji: zmiana semantyki aktywności po wdrożeniu zmienia wyniki historyczne; reguła ma jedno źródło i testy granic.
- `makeCrudRoute` może być za wąski dla zagnieżdżonego zasobu (Q12): fallback do `apiHandler`.
- Pakiety (§4): addytywne eksporty i porty; nowe zależności: brak.
- Dane: `description` to tekst wolny o wydatkach; body nie jest logowane (reguła auth-spec).

## 📋 Phasing

Zależność: fundament z specu auth (w tym Step 2.4b `GET /api/bank-accounts/{id}`). Dostarczanie jak w auth (Q22): jeden PR na Step.

**Kolejność wdrożenia (z E03):** E02 Faza 1 -> Faza 2 -> Faza 3 -> E03 Faza 1 (Step 1.1) -> E02 Faza 4 -> E03 Step 1.2; E03 Faza 2 po E02 Fazie 2 i E03 Step 1.1. Issue #15 zamykane po E03 Step 1.2 (kryterium #15 o niezmienności wyniku wymaga E03).

- **Faza 1: wpisy jednorazowe, API** (#21, #12, #13).
- **Faza 2: lista i formularz na komponentach współdzielonych** (#22).
- **Faza 3: seria cykliczna** (#14).
- **Faza 4: flaga "zapłacone"** (#15).

## 📋 Implementation Plan

Każdy Step: kod + testy 100% pokrycia, `typecheck`, `lint`, `test:coverage`, `build` zielone, wpis w `.ai/runs/`, aplikacja działa. Poprawka błędu dodaje test regresyjny.

### Faza 1

- **Step 1.1 (#21)** Encja `Entry` (`p.bigint('number')`), migracja `entries`, `core/months` (`Month`, `monthStart`, `nextMonthStart`), port i adapter (`findActiveInMonth(ids, month, limit?)` dla jednorazowych, `findByIdInAccount`, zapis). Testy integracyjne: migracja up/down (rozszerzony `migrations.test.ts`), naruszenia `CHECK` (zero, ujemna, `EUR`, pusty opis, data poza zakresem), granice miesiąca, DATE z `TZ != UTC`, `typeof` kwoty.
- **Step 1.2 (#12, #13)** `core/money` (stałe), walidatory (`type` oba), `EntryService.create/list`, `ResultLimitExceededError`, route `GET`/`POST` przez `apiHandler`, `BACKWARD_COMPATIBILITY.md`. Testy: kryteria #12 i #13 (wspólne vs osobiste, typ jawny, float/ujemna/bez waluty, żona 403, 401, kwota całkowita w odpowiedzi), limit (501 -> 422), brak `month` -> 400, nieznane `{id}` -> 403.
- **Step 1.3 (#12)** `PUT`/`DELETE` wpisu jednorazowego, `findByIdInAccount` -> 404, `BACKWARD_COMPATIBILITY.md`. Testy: edycja, twarde usunięcie, niezmienność `type`, malformed `entryId` -> 404.

### Faza 2

- **Step 2.1 (#22)** `currentMonth`/`previousMonth`/`nextMonth`, `DataTable`, `MonthSwitcher`, strona konta (serwerowa) z listą tylko do odczytu, link z `/`. Testy: komponenty (stany, aria), strona (zły `month`, brak członkostwa, domyślny miesiąc), `currentMonth` na granicy 2026-12-31 23:30 UTC; przeglądarka.
- **Step 2.2 (#22)** `parseAmountToMinor`, schemat formularza w `core`, `CrudForm`, dodawanie/edycja/usuwanie jednorazowych na stronie, dialog. Testy: parser (wszystkie przypadki), `CrudForm`, a11y; przeglądarka: dodaj wydatek i wpływ, edytuj, usuń; tylko `apiCall` (brak własnego `fetch`).
- **Step 2.3 (#22)** `makeCrudRoute` wyciągnięty z route'ów Fazy 1 (refaktor bez zmiany kontraktu, testy Fazy 1 zielone); wniosek o kształcie do `.ai/lessons/`.

### Faza 3

- **Step 3.1 (#14)** Migracja (`recurrence`, `series_id`, `day_of_month`, `end_month`), tworzenie serii, rozszerzenie `findActiveInMonth` i listy (`seriesId`, `dayOfMonth` jako dzień efektywny w żądanym miesiącu, `seriesStartMonth`, `seriesEndMonth`), `PUT` na cyklicznym (tylko opis, reszta 400), `BACKWARD_COMPATIBILITY.md`. Testy: kryteria #14 (M, M+1, M+2, brak w M-1, jeden wiersz definicji, kwota całkowita), granice (seria z dniem 31 w lutym zwraca `dayOfMonth` 28, a w lutym roku przestępnego 29), `endMonth` < start -> 400, żona nie widzi wpisu osobistego, `PUT` z kwotą -> 400, migracja up/down z danymi.
- **Step 3.2 (#14)** `Clock`, `withLockedSeries`, `revisions`, `end`, `DELETE` serii z regułą Q15, `expectedUpdatedAt`, `deletable`, `BACKWARD_COMPATIBILITY.md`. Testy: revision (stare miesiące bez zmian, od X nowa kwota, X = start ogona, X poza ogonem 400, jednorazowy 400), `end` (kasuje późniejsze definicje), delete serii przed i po `currentMonth` (409), równoległe revision/end (integracja; 409; brak nakładania i luk), niezmienność `end_month` nieostatnich definicji.
- **Step 3.3 (#14)** UI serii: pole cykliczności, "Zakończ od miesiąca", "Zmień kwotę od miesiąca", dialog usuwania zależny od `deletable`. Przeglądarka.

### Faza 4

- **Step 4.1 (#15)** Migracja `entry_paid_months`, `PATCH .../paid`, `paid` w liście, przeniesienie wiersza przy zmianie miesiąca wpisu jednorazowego, przeniesienie przy revision i czyszczenie przy `end`, `BACKWARD_COMPATIBILITY.md`. Testy: kryteria #15 (przełącz i odśwież, odznacz, żona 403, 401, wpływ 400, cykliczny per miesiąc, miesiąc poza zakresem), idempotencja i równoległe PATCH, kwoty listy bez zmian, migracja up/down z danymi.
- **Step 4.2 (#15)** UI: przełącznik w wierszu wydatku (checkbox z nazwą z opisu). Przeglądarka. Dziennik/lekcje.
