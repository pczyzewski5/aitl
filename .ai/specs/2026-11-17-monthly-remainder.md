# Ile zostanie w miesiącu (E03)

Status: DRAFT po decyzjach właściciela, bez otwartych pytań.
Źródła: epik #8 (E03), historia #16, zadanie #23; `.ai/specs/product-brief.md` (R01, R02, R03, A01, D01); `.ai/specs/2026-11-17-entries-income-expenses.md` (E02: encja `Entry`, `findActiveInMonth`, `core/months`, `MonthSwitcher`, reguła aktywności); `.ai/specs/implemented/2026-11-17-auth-and-app-foundation.md` (`BankAccountService.listForUser`, sesja, `apiHandler`); `AGENTS.md`; `BACKWARD_COMPATIBILITY.md`.

## 📝 TLDR

Użytkownik wybiera miesiąc i widzi, ile zostanie, osobno dla każdego konta bankowego, do którego ma dostęp: wpływy minus wydatki tego konta w miesiącu, liczone po stronie serwera czystą funkcją w `core`, bez wyniku łącznego (R03) i niezależnie od flagi "zapłacone" (R02). Dziś właściciel poprawia te reguły ręcznie w arkuszu Google (P02). To przyszłe zachowanie. Spec nie ma sensu bez E02 (czyta jego dane) i niczego w nim nie zmienia poza dodaniem jednego konsumenta istniejącego portu.

## 📝 Problem Statement

R02: ile zostanie = wpływy minus wydatki w miesiącu; R03: osobno dla każdego konta, bez sumy łącznej; R01: liczby całkowite groszy plus waluta, sumy po stronie serwera. Błąd sumy podważa zaufanie (risk-high), a A01 (cykliczne i wynik wystarczą, by zastąpić arkusz) jest nietestowane; jedyne dane to relacja właściciela.

Stan dziś: brak serwisu wyników, brak widoku; E02 dostarcza `Entry`, regułę aktywności w miesiącu i `core/months`.

## 📝 Decisions

Wybory właściciela produktu, 2026-11-17. Wszystkie jak rekomendacje szkicu. Pytania współdzielone zadano raz, w E02 (poniżej wskaźniki).

| Id | Decyzja | Właściciel | Data |
|---|---|---|---|
| E03-Q1 | (shared, E02-Q1) dwa osobne specy | właściciel produktu | 2026-11-17 |
| E03-Q2 | (shared, E02-Q2) DATE bez strefy, miesiąc kalendarzowy, granice włącznie, Europe/Warsaw | właściciel produktu | 2026-11-17 |
| E03-Q3 | (shared, E02-Q3, zmienione) tylko PLN: jedna waluta, bez wyniku per waluta; odpowiedź niesie `currency: "PLN"`; dodanie waluty = zmiana schematu i kontraktu, decyzja na przyszłość | właściciel produktu | 2026-11-17 |
| E03-Q3a | (shared, E02-Q16) waluta zostaje na wpisie (PLN); kryterium #16 "w walucie konta" = PLN jako jedyna waluta, konto nie ma własnej waluty | właściciel produktu | 2026-11-17 |
| E03-Q4 | (shared, E02-Q4) definicja cykliczna aktywna w M gdy `startMonth <= M <= endMonth` (puste = bez końca), liczona raz, dzień bez wpływu na sumę | właściciel produktu | 2026-11-17 |
| E03-Q5 | `GET /api/monthly-remainder?month=YYYY-MM` zwraca listę wyników per konto z członkostwa, bez sumy łącznej | właściciel produktu | 2026-11-17 |
| E03-Q6 | Sumowanie czystą funkcją w `core` na wpisach aktywnych w miesiącu, nie agregacja SQL | właściciel produktu | 2026-11-17 |
| E03-Q7 | Odpowiedź: wpływy, wydatki, wynik (wynik może być ujemny) | właściciel produktu | 2026-11-17 |
| E03-Q8 | Dowolny miesiąc z zakresu 2000-01..2100-12, bez wyróżniania prognozy; prognoza i przenoszenie salda w E04 | właściciel produktu | 2026-11-17 |
| E03-Q9 | Sekcja na `/`: karta na konto plus przełącznik miesiąca | właściciel produktu | 2026-11-17 |
| E03-Q10 | Test A01 jako "golden" z danych dostarczonych przez właściciela; bez nich blokuje się tylko #23, nie implementacja | właściciel produktu | 2026-11-17 |

Powiązane: R01, R02, R03, D01, A01. Spec ich nie zmienia.

## 📝 Research (skrót)

Z wiedzy o produktach (bez weryfikacji online w tej sesji). Actual Budget i Firefly III pokazują saldo/wynik okresu per konto i budżetują per miesiąc. Przejmujemy: wynik per konto i okres. Pomijamy: przenoszenie salda między miesiącami, budżety kategorii, saldo łączne, prognozy.

## 📝 Architecture

Kierunek zależności bez zmian. Nowe elementy (wszystkie mają konsumenta w tym specu):

- `core/services/monthly-remainder/compute-remainder.ts`: czysta funkcja `computeRemainder(entries): { incomeMinor, expensesMinor, remainderMinor }` na liczbach całkowitych; wejście `{ type, amountMinor, currency }`, nie zna flagi zapłacone (R02 wymuszone typem), nie filtruje po datach (filtr to reguła aktywności z E02 w adapterze). Waluta inna niż `CURRENCY` ('PLN') -> błąd (fail loud, nie ciche sumowanie); wynik niesie `CURRENCY`.
- `core/services/monthly-remainder/monthly-remainder.service.ts`: `MonthlyRemainderService.forUser(userId, month)`: `BankAccountService.listForUser`, następnie publiczna metoda E02 `EntryService.listActiveForRemainder(bankAccountIds, month)` (jedno zapytanie `IN` przez `findActiveInMonth(ids, month)` bez limitu, zwraca `{ bankAccountId, type, amountMinor, currency }`); E03 nie woła repozytorium bezpośrednio. Metoda `listActiveForRemainder` jest dopisywana w E03 Step 1.1 jako jedyny konsument.
- `core/validators/monthly-remainder/`: schemat `month` (reużywa `core/months` z E02).
- `app`: `api/monthly-remainder/route.ts` przez `apiHandler` + `requireSession`; dostęp wynika z członkostwa w `listForUser` (brak identyfikatora konta w ścieżce, więc brak asercji `assertMemberOfBankAccount`; cudze konto nie może zostać zażądane).
- `ui`: generyczne komponenty bez polskich literałów i bez importów `@aitl/*` (teksty, formatowanie kwoty i funkcje miesięcy z `app` jako propsy); `RemainderCard` w `ui/components/monthly-remainder/`, reużycie `MonthSwitcher` i `apiCall`; sekcja na `/` w `app`.

Reguła aktywności i granice miesiąca mają jedno źródło: adapter z E02. E03 jej nie powiela.

## 📝 Data Model

Brak nowych encji ani migracji. Czyta `Entry` i `BankAccount` (E02 i spec auth). Diagram pominięty (brak zmian w modelu).

## 📝 API Contracts

Koperta wg `BACKWARD_COMPATIBILITY.md` §2.

- `GET /api/monthly-remainder?month=YYYY-MM` (sesja) -> `{ ok:true, data:{ month, accounts:[{ bankAccountId, name, type, currency, incomeMinor, expensesMinor, remainderMinor }] } }`. Kwoty: liczby całkowite groszy (R01); `remainderMinor` ze znakiem. Kolejność: konta wspólne przed osobistymi, potem nazwa. Brak pola łącznego (R03). Użytkownik bez kont -> `accounts: []`. Zły lub brakujący `month` -> 400 `validation_error` (spójnie z listą E02); brak sesji -> 401. `currency` zawsze `"PLN"` (E02-Q16). Konto bez wpisów -> same zera.
- Nowy route (zmiana zgodna, §2); `BACKWARD_COMPATIBILITY.md` aktualizowany w Step 1.1.

## 📝 UI/UX

Sekcja "Ile zostanie" na `/` pod listą kont: `MonthSwitcher` (domyślnie bieżący miesiąc w Europe/Warsaw), karta na każde konto (nazwa, typ, wpływy, wydatki, wynik; wynik ujemny wyróżniony tekstem, nie tylko kolorem), link karty do `/bank-accounts/{id}?month=...` z E02. Stany: `LoadingMessage`, `ErrorMessage`, `EmptyState` (brak kont), miesiąc bez wpisów pokazuje zera. Dostępność: `MonthSwitcher` z `aria-label` i `aria-live="polite"`, każda karta jako region z nazwą konta. Żona widzi tylko kartę konta wspólnego (wynika z danych, bez osobnej logiki UI). Teksty jako nazwane stałe. Prototype: brak zaakceptowanej wersji.

## 📝 Edge Cases & Failure Scenarios

- **Granice miesiąca.** Wpis z ostatniego dnia M liczy się w M, z pierwszego dnia M+1 nie; cykliczny w miesiącu końca (`endMonth = M`) liczy się, w M+1 nie (testy na `computeRemainder` przez serwis z prawdziwym adapterem).
- **Cykliczny dokładnie raz** niezależnie od dnia miesiąca i długości miesiąca (31 stycznia -> luty).
- **Flaga zapłacone (R02)** nie wchodzi do wyniku: zapłacony i niezapłacony wydatek liczą się oba (test po wdrożeniu E02 Fazy 4, patrz Phasing).
- **Izolacja (R03).** Wpisy jednego konta nigdy nie wchodzą do wyniku drugiego; w odpowiedzi nie ma sumy obu; żona nie dostaje wyniku konta osobistego właściciela.
- **Liczba wpisów.** Limit 500 dotyczy listy E02 (Q13), nie E03: E03 nie ma limitu, bo obcięcie zafałszowałoby sumę. Sumowanie w `core` jest szybkie przy tysiącach wpisów; suma bezpieczna jako liczba całkowita do ok. 900 000 wpisów po maksymalnej kwocie (9 999 999 999 x 900 000 < 2^53), a `Number.isSafeInteger` jest asercją w `computeRemainder`. Przejście na agregację SQL to zmiana adaptera za tym samym portem.
- **Skutek twardego usuwania (E02-Q8).** Usunięcie wpisu jednorazowego z przeszłości zmienia wynik tamtego miesiąca (seria z przeszłością nie może być usunięta, E02-Q15).
- Baza niedostępna -> 500 `internal`. Miesiąc poza zakresem -> 400.

## 📝 Risks & Impact Review

- Brak zmian schematu, env, zależności; tylko nowa route (§2) i konsument portu (§4).
- Poprawność liczb to główne ryzyko (risk-high): jedna funkcja czysta z testami tablicowymi, jedno źródło reguły aktywności, test "golden" z danych właściciela (A01).
- Zależność od E02: zmiana semantyki aktywności lub usuwanie wpisów (twarde, Q8 E02) zmienia wyniki historyczne; to skutek zaakceptowany w E02.
- Prezentacja liczb jako "prawdy" przy nietestowanym A01: dopóki #23 nie ma danych, wynik jest sprawdzony tylko testami własnymi.

## 📋 Phasing

Zależności (backlog): E03-S01 zależy od E02-S01..S03 (#12-#14), nie od #15. Kolejność wdrożenia (wspólna z E02): E02 Fazy 1-3 -> E03 Step 1.1 -> E02 Faza 4 -> E03 Step 1.2; E03 Faza 2 po E02 Fazie 2 (`MonthSwitcher`, strona konta) i E03 Step 1.1. Test R02 (flaga) wymaga E02 Fazy 4, więc jest osobnym Stepem; #15 zamykane po nim.

- **Faza 1: serwis i endpoint** (#16): funkcja, serwis, route.
- **Faza 2: widok** (#16): sekcja na `/`.
- **Faza 3: weryfikacja A01** (#23).

## 📋 Implementation Plan

Jeden PR na Step, każdy zielony i wdrażalny osobno; każdy Step: testy 100% pokrycia, `typecheck`, `lint`, `test:coverage`, `build`, wpis w `.ai/runs/`.

### Faza 1

- **Step 1.1 (#16)** `computeRemainder`, `EntryService.listActiveForRemainder`, `MonthlyRemainderService`, walidator `month`, `GET /api/monthly-remainder`, rejestracja w kontenerze, aktualizacja `BACKWARD_COMPATIBILITY.md` (nowa route i pola odpowiedzi). Testy jednostkowe (tablicowe): 1000-400=600 (PLN); 500-200=300; ujemny wynik; same zera; tylko wpływy; tylko wydatki; waluta inna niż PLN -> błąd. Integracyjne (HTTP): kryteria #16 (konto wspólne 600, osobiste 300 osobno, brak sumy łącznej, wpis jednego konta nie wchodzi do drugiego, cykliczny raz, pusty miesiąc = zera, kwoty całkowite plus `currency`), granice miesiąca włącznie, miesiąc bez wpisów, żona widzi tylko konto wspólne (seed `--shared-only`), 401, zły `month` -> 400.
- **Step 1.2 (#16)** Test R02 po wdrożeniu E02 Fazy 4: wydatek zapłacony i niezapłacony w tym samym miesiącu liczą się oba; oznaczenie zapłacone nie zmienia wyniku. Test regresyjny pada, gdyby wynik filtrował po fladze. Zależy od E02 Step 4.1.

### Faza 2

- **Step 2.1 (#16)** `RemainderCard`, sekcja na `/` z `MonthSwitcher` i `apiCall`, stany, link do listy wpisów konta. Testy komponentów (stany, wynik ujemny, brak sumy łącznej); scenariusz w przeglądarce: dwa konta, zmiana miesiąca, żona widzi jedną kartę.

### Faza 3

- **Step 3.1 (#23)** Właściciel dostarcza dane z arkusza (anonimizowany zrzut >= 3 miesięcy: wpisy i oczekiwany wynik per konto). Fixture JSON w `.ai/specs/research/` (format: konta, wpisy, oczekiwane wyniki per miesiąc i konto) i test integracyjny "golden" przepuszczający fixture przez prawdziwy serwis i bazę; wynik porównania i zapis (`[DATA]`/`[DOCUMENT]`) w `.ai/specs/research/`; status A01 aktualizuje `om-discover --refresh`; kryteria zabicia ustalane przy okazji. Bez dostarczonych danych blokuje się tylko ten Step, nie Fazy 1-2.
