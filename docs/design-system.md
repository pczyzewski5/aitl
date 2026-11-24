# System projektowy AITL: skrót dla agentów

Czytaj ten plik jako pierwszy, zanim zbudujesz lub zmienisz ekran. Pełna dokumentacja jest w Storybooku (`packages/ui`), decyzje i ich źródła w `.ai/specs/design/` (`2026-11-17-referencje.md`, `2026-11-17-tokeny.md`) i w `packages/ui/POSTEP.md`. Gdy ten plik i kod się rozjeżdżają, wygrywa kod; popraw wtedy ten plik.

## Jak czytać oznaczenia

- **[REGUŁA]**: obowiązuje zawsze, pochodzi z decyzji właściciela, z tokenów albo z kodu. Stosuj bez zgadywania.
- **[PRZYKŁAD]**: ilustracja reguły. Nie kopiuj wartości (kwot, nazw, tekstów) jak leci; zachowaj wzorzec.
- **[LUKA]**: system nie ma odpowiedzi. Nie zgaduj i nie wymyślaj komponentu. Zbuduj z istniejących elementów albo zgłoś lukę userowi (wpis na stronie "Czego brakuje" w Storybooku i w `packages/ui/POSTEP.md`).

## Charakter produktu

- **[REGUŁA]** AITL to praktyczne, czytelne, spokojne i rzeczowe narzędzie dwóch osób do śledzenia wpływów i wydatków oraz do odpowiedzi na pytanie "ile zostanie w miesiącu".
- **[REGUŁA]** Wynik "ile zostanie" jest zawsze osobno per konto bankowe (wspólne albo osobiste). Nigdy jednej łącznej liczby.
- **[REGUŁA]** Antycharakter: generyczny, korporacyjny/bankowy, efekciarski, ciasny/nieczytelny, chaotyczny.
- **[REGUŁA]** Interfejs po polsku, w trybie rozkazującym, bez ozdobników i wykrzykników. Kwoty w PLN w formacie "3 975,50 zł". Dane przykładowe zawsze z dopiskiem "(przykład)".

## Pięć kroków budowy ekranu

1. **[REGUŁA]** Znajdź ekran w specyfikacji z `.ai/specs/` (UI/UX i kontrakt API) i w Storybooku w sekcji "Ekrany". Jeśli istnieje podobny ekran, zacznij od niego.
2. **[REGUŁA]** Wybierz elementy z tabel poniżej: najpierw element produktu, potem wzorzec, na końcu element bazowy. Importuj wyłącznie z `@aitl/ui`.
3. **[REGUŁA]** Dobierz tokeny znaczeniowe (kolor, odstęp, kształt) z tabeli tokenów. Żadnej wartości spoza tokenów.
4. **[REGUŁA]** Obsłuż wszystkie stany danych: ładowanie, pusto, błąd, dużo danych i długie teksty. Teksty po polsku z gotowych `messages` komponentów, własne tylko gdy komponent ich nie ma.
5. **[REGUŁA]** Sprawdź: 320, 768 i 1440 px, klawiaturę i fokus, a11y w Storybooku, `check:tokens`. Brakującego komponentu nie wymyślaj: patrz [LUKA].

## Tabela komponentów

Wszystkie importy: `import { ... } from '@aitl/ui'`. Strona dokumentacji komponentu w Storybooku ma pełne API, anatomię i stany.

### Elementy bazowe

| Import | Kiedy | Kiedy nie |
|---|---|---|
| `Button` (`variant`: `default`, `secondary`, `ghost`, `destructive`; `size`: `default`, `icon`; `loading`; `asChild`) | akcja na bieżącej stronie: zapisz, anuluj, usuń | nawigacja (użyj `TextLink`), lista akcji wiersza (`Menu`), ustawienie włącz/wyłącz (`Checkbox`) |
| `TextLink` | przejście do innej strony | akcja zmieniająca dane (`Button`) |
| `Input` (`type`: `text`, `email`, `password`, `amount`) | jednowierszowy tekst, e-mail, hasło, kwota | wybór z listy (`Select`), wybór jednej z kilku opcji (`RadioGroup`) |
| `Label`, `Field` (`label`, `hint`, `error`, `optional`) | każde pole formularza ma widoczną etykietę przez `Field`; błąd pod polem | etykieta zastąpiona placeholderem; `Field` dla grupy radio (`RadioGroup` ma własną `legend`) |
| `Select` (`options`, `placeholder`) | wybór jednej wartości z krótkiej, znanej listy | kilka opcji, które użytkownik ma widzieć naraz (`RadioGroup`) |
| `Checkbox` (`label`) | zaznaczenie niezależnej opcji, np. "Zapłacone" | wybór jednej z kilku wykluczających się opcji (`RadioGroup`) |
| `RadioGroup` (`legend`, `options`) | wybór jednej opcji z 2 do kilku, np. wpływ albo wydatek | dłuższa lista (`Select`) |
| `Card`, `CardHeader`, `CardTitle` (`as`), `CardContent` | powierzchnia grupująca treść (konto, panel) | tło całej strony (`--background`); separacja samym cieniem |
| `Badge` (`variant`: `shared`, `personal`, `neutral`) | krótka etykieta tekstowa, np. typ konta | akcja; informacja przekazywana samym kolorem |
| `Alert` (`variant`: `neutral`, `error`; `AlertTitle`, `AlertDescription`) | komunikat o wyniku operacji wewnątrz formularza lub strony | stan pustej lub niewczytanej sekcji (`EmptyState`, `ErrorState`); potwierdzenie zapisu (`Toast`) |
| `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`, `DialogTrigger` | krótka, osobna interakcja przerywająca bieżący widok (formularz w oknie) | zwykła treść strony; potwierdzenie nieodwracalnej akcji (`ConfirmDialog`) |
| `ConfirmDialog` (`title`, `description`, `confirmLabel`, `cancelLabel`, `confirming`) | potwierdzenie akcji nieodwracalnej, przycisk nazwany czasownikiem | akcja odwracalna lub zwykła |
| `Menu` (`triggerLabel`, `items`) | akcje jednego wiersza lub obiektu | główna akcja strony (`Button`) |
| `Skeleton` | miejsce na treść, która się ładuje (kontener z `aria-busy`) | informacja o błędzie lub braku danych |
| `EmptyState` (`title`, `description`, `action`) | sekcja pusta, najwyżej jedna akcja | błąd wczytania (`ErrorState`) |
| `ErrorState` (`title`, `retryLabel`, `onRetry`, `announce`) | sekcja, której nie udało się wczytać, z "Spróbuj ponownie" | błąd walidacji pola (`Field`); błąd w formularzu (`Alert`) |
| `ToastProvider`, `useToast` (`toast({ message, announce })`) | krótkie potwierdzenie po zapisie | błąd wymagający decyzji lub ponowienia (`Alert` lub `ErrorState`) |

### Elementy produktu

| Import | Kiedy | Kiedy nie |
|---|---|---|
| `AppShell` (`logoutHref`) | rama każdej strony: pasek "AITL", opcjonalny "Wyloguj", jedna kolumna do 960 px | strona bez ramy produktu |
| `LoginForm` (`onSubmit`) | logowanie e-mailem i hasłem | inne formularze (użyj wzorca formularza) |
| `BankAccountList` (`status`, `accounts`, `onRetry`) | lista kont bankowych użytkownika ze stanami | przegląd wyniku miesiąca (`AccountRemainderCard`) |
| `AccountRemainderCard` (`status`, `name`, `accountType`, `remainderMinor`, `incomeMinor`, `expensesMinor`, `selected`, `onSelect`) | wynik "ile zostanie" jednego konta, wybór aktywnego konta | suma kont; konto bez stanu `selected` jako przycisk |
| `MonthSwitcher` (`month`, `onMonthChange`, `min`, `max`) | zmiana oglądanego miesiąca | wybór dowolnej daty (`Input`) |
| `EntryTable` (`status`, `caption`, `entries`, `onPaidChange`, `actions`) | tabela wpisów konta z flagą "Zapłacone" | inne tabele danych (brak ogólnej tabeli: [LUKA]) |
| `EntryForm` (`open`, `mode`, `onSubmit`) | dodanie i edycja wpisu w oknie | zmiana serii (`SeriesActions`) |
| `SeriesActions` (`entry`, `series`, `onEdit`, `onDelete`) | akcje wiersza: edytuj, usuń, zakończ serię, zmień kwotę | akcje spoza wpisów |
| `ErrorSummary`, `useFormValidation` | podsumowanie błędów i walidacja formularza ze stanami odpowiedzi API | formularze bez pól |

### Pomocnicze

- **[REGUŁA]** `formatMoneyMinor` formatuje każdą kwotę (kwoty jako liczby całkowite w jednostce podstawowej, bez `float`). `parseAmountToMinor` parsuje tekst wpisany w polu. `addMonths`, `formatMonthLabel`, `isMonthKey` obsługują klucz miesiąca `RRRR-MM`. `cn` skleja klasy.
- **[REGUŁA]** Brak wymaganego elementu (np. `Textarea`, `Tabs`, `Tooltip`, `Popover`, `Avatar`) oznacza [LUKA]: patrz "Czego brakuje".

## Tokeny znaczeniowe

Klasy Tailwinda są dostępne tylko dla znaczeń (domyślna paleta jest wyzerowana): `bg-background`, `text-muted-foreground` itd. Surowe wartości (`--raw-*`) są wyłącznie w `packages/ui/src/tokens.css`.

| Token | Przeznaczenie | Nie używaj do |
|---|---|---|
| `--background` | tło strony | tło kart |
| `--card`, `--card-foreground` | karta, panel, tło pól formularza | tło strony |
| `--foreground` | tekst podstawowy | tekst pomocniczy |
| `--muted-foreground` | notki, nagłówki tabel, podpisy | ważne treści i kwoty |
| `--muted`, `--muted-hover` | przycisk drugoplanowy, stan nieaktywny | separacja kart |
| `--form-surface` | tło rozwijanego formularza, pola tylko do odczytu | tło strony |
| `--primary`, `--primary-foreground`, `--primary-hover` | jedyna akcja główna, pasek nagłówka, zaznaczenie, linki | tekst stanu finansowego |
| `--ring` | obrys fokusu (2 px) | dekoracja |
| `--input` | ramka pól i pól wyboru | separator kart |
| `--border` | ramka kart, linie wierszy | niesienie informacji o stanie |
| `--income` | kwota wpływu, dodatni wynik | kwota bez znaku "+" lub etykiety |
| `--expense`, `--destructive` | kwota wydatku, ujemny wynik, błąd, akcja destrukcyjna | kolor jako jedyny nośnik |
| `--destructive-foreground`, `--destructive-hover` | tekst i hover na przycisku destrukcyjnym | inne przyciski |
| `--overlay` | przesłona za oknem Dialog | tło kart |
| `--badge-shared-*`, `--badge-personal-*` | plakietki "wspólne" i "osobiste" | akcje |
| `--space-1`...`--space-12` (4, 8, 12, 16, 24, 32, 48 px) | źródło dla odstępów znaczeniowych | wartości spoza skali (2, 6, 14 px) |
| `--space-label-field` (4 px), `--space-within-group` (8 px), `--space-between-fields` (12 px), `--space-between-groups` i `--space-panel` (16 px), `--space-card-gap` (12 px), `--space-section` (32 px) | odstępy według roli | losowe wartości |
| `--font-size-sm/base/lg/xl` (14/16/20/28 px) | skala tekstu; `xl` tylko dla kwoty wyniku | rozmiary 12, 13 i 18 px |
| `--font-weight-normal/semibold/bold` (400/600/700) | wagi; 700 tylko dla kwoty wyniku | waga 500 |
| `--radius` (`rounded-control`), `--radius-surface` (`rounded-card`), `--radius-badge` (`rounded-pill`) | promienie pól, kart, plakietek | cienie |
| `--control-height` (36 px) | wysokość przycisków i pól | niższe cele (minimum 24 px) |
| `--duration-feedback` (150 ms), `--toast-duration` | hover i czas Toasta | animacje dekoracyjne |

## Przewodniki "jeśli... to..."

- **[REGUŁA]** Jeśli użytkownik ma wykonać akcję na stronie, to `Button`; jeśli przejść gdzie indziej, to `TextLink`.
- **[REGUŁA]** Jeśli na ekranie jest kilka przycisków, to jeden `default` (główny), reszta `secondary` lub `ghost`; `destructive` tylko do akcji nieodwracalnej, zwykle w `ConfirmDialog`.
- **[REGUŁA]** Jeśli pole ma etykietę, to przez `Field` (widoczna etykieta, `hint`, `error` pod polem). Pola leżą na `--card` albo `--form-surface`, nigdy bezpośrednio na `--background`.
- **[REGUŁA]** Jeśli pole jest opcjonalne, to `optional` na `Field` (tekst "(opcjonalne)"). Domyślnie pola są wymagane. Formularze mają `noValidate`, a błędy pokazuje `useFormValidation` z `ErrorSummary`.
- **[REGUŁA]** Jeśli wybierasz jedną opcję: do kilku `RadioGroup`, więcej `Select`. Jeśli niezależną opcję: `Checkbox`.
- **[REGUŁA]** Jeśli sekcja się ładuje, to `Skeleton` w kontenerze z `aria-busy`; jeśli jest pusta, `EmptyState` z najwyżej jedną akcją; jeśli się nie wczytała, `ErrorState` z ponowieniem.
- **[REGUŁA]** Jeśli operacja się powiodła, to `Toast` (krótkie potwierdzenie); jeśli się nie powiodła w oknie lub formularzu, to komunikat w oknie lub formularzu, z danymi zachowanymi.
- **[REGUŁA]** Jeśli akcja jest nieodwracalna, to `ConfirmDialog` z nazwą obiektu w tytule i czasownikiem na przycisku ("Usuń wpis"), fokus domyślny na "Anuluj".
- **[REGUŁA]** Jeśli pokazujesz kwotę, to przez `formatMoneyMinor`, ze znakiem "+" lub "-" albo etykietą, nie samym kolorem.
- **[REGUŁA]** Jeśli pokazujesz wynik miesiąca, to jedna karta `AccountRemainderCard` na konto; aktywne konto ma `selected` (`aria-pressed`) i znacznik tekstowy.
- **[REGUŁA]** Jeśli po usunięciu wiersza znika element z fokusem, to fokus idzie na nagłówek listy (odroczony do efektu, `setTimeout(0)`).
- **[REGUŁA]** Jeśli dodajesz nagłówki, to bez przeskoków poziomów: pod `h1` najpierw `h2` (karty z `h3` pod `h1` wymagają ukrytego `h2`).
- **[PRZYKŁAD]** Usunięcie wpisu: `ConfirmDialog` z tytułem "Usunąć wpis „Czynsz (przykład)”?", przyciskiem "Usuń wpis" i "Anuluj", po sukcesie Toast "Wpis usunięty.".

## Czego unikać

- **[REGUŁA]** Generyczny wygląd AI (A1): gradienty, indygo lub fiolet jako kolor akcji, ciemnogranatowe tło z poświatą, pigułka "nowość" nad nagłówkiem, rząd wielkich liczb, trzy identyczne karty z ikoną, iskierki AI, kolorowe słowo w nagłówku, wymyślone opinie i liczby.
- **[REGUŁA]** Cień jako jedyny separator (A2): powierzchnię oddziela ramka `--border` lub tło. Bez `shadow-*`.
- **[REGUŁA]** Kolor jako jedyny nośnik informacji (A3): kwoty ze znakiem lub etykietą, aktywne konto ze znacznikiem tekstowym i `aria-pressed`, błąd z tekstem.
- **[REGUŁA]** Jedna łączna liczba "ile zostanie" (A4): zawsze osobno per konto.
- **[REGUŁA]** Dane udające prawdziwe (A5): przykłady z dopiskiem "(przykład)".
- **[REGUŁA]** Wartości spoza tokenów: kolory hex i funkcje kolorów, klasy palety Tailwinda (`bg-blue-500`, `text-white`), wartości arbitralne (`w-[13px]`, `text-[#fff]`). Wykrywa je `npm run check:tokens`.
- **[REGUŁA]** Zahardkodowane teksty dla użytkownika w komponentach produktu: teksty są w plikach `messages` i przekazywane propsem `messages`.
- **[REGUŁA]** `div` zamiast `button`, `a` bez `href`, cele klikalne poniżej 24 px, ikona bez nazwy dostępnej, placeholder zamiast etykiety, błąd walidacji w dymku zamiast pod polem.
- **[REGUŁA]** Poziome przewijanie całej strony przy 320 px; długi tekst bez zawijania (`wrap-anywhere`).
- **[REGUŁA]** Ozdobniki w treści: wykrzykniki, "Ups!", obietnice, żargon, przyciski "OK".
- **[REGUŁA]** Wymyślanie komponentów, tokenów i wzorców bez zgody właściciela: nowy token albo nowa zależność wymaga decyzji właściciela produktu.
- **[REGUŁA]** Ciemny motyw: brak wartości (L3). Nie dopisuj ręcznie stylów dla `[data-theme='dark']`.
- **[REGUŁA]** Komentarze w kodzie (kod ma być czytelny sam z siebie).

## Komendy

Wszystkie z korzenia repozytorium:

```bash
npm run storybook --workspace @aitl/ui   # Storybook na http://localhost:6006
npm run build-storybook                  # statyczna wersja do packages/ui/storybook-static
npm run test:storybook                   # stories jako testy w przeglądarce (a11y blokuje: test 'error')
npm run check:tokens                     # wartości spoza tokenów; kończy się błędem
npm run typecheck && npm run lint && npm run test:coverage && npm run build
```

- **[REGUŁA]** Przed prośbą o review uruchom też `npm audit --omit=dev --audit-level=high`.
- **[REGUŁA]** Komponent ma stories (Playground, warianty, macierz stanów, 320 px, długi tekst, test `play`), stronę dokumentacji `.mdx` obok i testy jednostkowe z pokryciem 100%. Szczegóły: strona "Współtworzenie" w Storybooku.

## Ekrany, które już istnieją

| Epik | Ekran w Storybooku | Elementy |
|---|---|---|
| E01 Dostęp i logowanie | "Ekrany / E01": logowanie `/login`, strona główna `/` | `AppShell`, `LoginForm`, `BankAccountList` |
| E02 Zapis wpływów i wydatków | "Ekrany / E02": konto z wpisami `/?account=...&month=...` | `MonthSwitcher`, `EntryTable`, `EntryForm`, `SeriesActions`, `ConfirmDialog`, `Toast` |
| E03 Ile zostanie w miesiącu | "Ekrany / E03": przegląd miesiąca (ta sama strona co E02) | `AccountRemainderCard`, `MonthSwitcher` |

- **[REGUŁA]** Stan ekranu E02 i E03 jest w adresie (`?account=...&month=RRRR-MM`); błędne wartości wracają do domyślnych.
- **[LUKA]** Strony w `packages/app` korzystające z tych ekranów powstaną w etapie 5; do tego czasu ekrany istnieją tylko w Storybooku.
