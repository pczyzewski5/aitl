# POSTEP: design system AITL i jego Storybook

Plik prowadzi prace nad design systemem w `packages/ui` (prompt "Storybook Twojego design systemu", etapy 0-5). Każda sesja zaczyna od przeczytania tego pliku i kontynuuje od "Następny krok". Po każdym etapie agent zatrzymuje się i czeka na "dalej" właściciela.

Etap 0 (ten plik) niczego nie instaluje i nie zmienia kodu. Zainstalowane zależności i kod pojawią się dopiero w osobnych PR-ach z sekcji "Plan PR-ów".

## Tabela postępu

| Etap | Zakres | Status |
|---|---|---|
| 0 | Inwentaryzacja i plan (ten plik) | PR A, do przeglądu |
| 1 | Fundamenty: Storybook, tokeny, Tailwind, przełącznik motywu, Foundations, skrypt `check:tokens` | zrobiony: PR B, PR C i PR D (Foundations, `check:tokens`, joby CI); PR D do przeglądu |
| 2 | Komponenty bazowe, partiami po ok. sześć | ZAKOŃCZONY (PR N, Toast, ostatni komponent bazowy): partia 1 (Button, Input, Label+Field, Card, Badge, Alert; PR E, F i G), partia 2 (Checkbox + `lucide-react`, Select, RadioGroup; PR H, I i J), PR K (TextLink, Skeleton, EmptyState, ErrorState), PR L (Dialog + ConfirmDialog), PR M (Menu), PR N (Toast); Textarea i Tabs celowo nie zbudowane (brak, gdy ekran zażąda); patrz sekcja "Etap 2 zakończony i plan etapu 3" |
| 3 | Komponenty produktu, wzorce, ekrany epików | w toku: plan zatwierdzony 2026-11-18; PR O (wzorzec formularza), PR P (E01) i PR Q (przegląd miesiąca) zrobione; PR R (tabela wpisów) zrobiony i zatwierdzony; PR S (EntryForm, SeriesActions, potwierdzenia, Toast po zapisie) zrobiony i zatwierdzony; PR T (`AppShell`, ekrany E02 i E03) zrobiony, do przeglądu; etap 3 zakończony po jego zatwierdzeniu |
| 4 | Strony, które uczą, plik dla agentów | zrobiony: PR U (11 stron w "System projektowy", `docs/design-system.md`, sekcja w `AGENTS.md`), do przeglądu |
| 5 | Sprawdzenie i raport | zrobiony: PR V (raport `.ai/specs/design/2026-11-24-raport-etapu-5.md`); test agentem przygotowany, NIE wykonany; do przeglądu |

Następny krok: właściciel przegląda PR U (etap 4, patrz sekcja "Notatki z PR U"); wcześniej PR T (`AppShell`, ekrany "Konto z wpisami" i "Przegląd miesiąca", propozycje w pliku tokenów, sekcja "AppShell i ekrany pełnoekranowe (PR T)"); po jego zatwierdzeniu etap 3 jest zakończony, a po "dalej" właściciela zaczyna się etap 4 (strony, które uczą, plik dla agentów).

## Materiały (źródła)

- Brief: `.ai/specs/product-brief.md`; badania: `.ai/specs/research/` (wywiady, decyzje).
- Backlog: `.ai/specs/backlog.md` (E01 Dostęp i logowanie, E02 Zapis wpływów i wydatków, E03 Ile zostanie w miesiącu; E04 i E05 zaparkowane, bez historii).
- Specyfikacje: `.ai/specs/2026-11-17-auth-and-app-foundation.md`, `.ai/specs/2026-11-17-entries-income-expenses.md`, `.ai/specs/2026-11-17-monthly-remainder.md`, standardy: `.ai/specs/2026-09-01-engineering-standards.md`.
- Referencje: `.ai/specs/design/2026-11-17-referencje.md` (R01.1-R01.8, A1-A5, K1-K3, luki L1-L7).
- Tokeny: `.ai/specs/design/2026-11-17-tokeny.md` (trzy warstwy, tabela kontrastu WCAG).
- Audyt i makieta wyjściowa leżą poza repo (lokalnie u właściciela); ich wnioski są już w referencjach i tokenach.

## Decyzje

Decyzje właściciela produktu, 2026-11-17:

1. Instalacja zależności zatwierdzona, ale w osobnych, późniejszych PR-ach (nie w PR A): Storybook 10.6.7 z `@storybook/react-vite` (nie `nextjs-vite`, bo `packages/ui` jest samodzielny i nie zależy od Next.js), Tailwind 4.3.5, Playwright 1.65.1 wraz z pobraniem Chromium, Vitest przypięty na 5.0.5 (pakiety przeglądarkowe muszą mieć tę samą wersję).
2. Dokumentacja Storybooka po polsku; nazwy komponentów, propsów i plików w kodzie po angielsku. Nazwy w menu po polsku, tam gdzie prompt podaje angielskie sekcje (Start here itd.) dopasowane do języka dokumentacji.
3. Tryb ciemny: tylko struktura (drugi zestaw zmiennych pod `[data-theme="dark"]`, przełącznik), wartości ciemne później. Luka L3 pozostaje otwarta; kontrasty trzeba policzyć od nowa, gdy wartości powstaną.
4. Decyzje projektowe żyją w repo: referencje i tokeny w `.ai/specs/design/`, dalsze decyzje w tym pliku.

Decyzje z referencji (skrót, 10 linii):

1. Słowa charakteru: praktyczny, czytelny, spokojny, rzeczowy.
2. Antycharakter: generyczny, korporacyjny/bankowy, efekciarski, ciasny/nieczytelny, chaotyczny.
3. R01.1: jasne tło, białe powierzchnie, jeden kolor akcji; R01.2: zielony/czerwony stanu przyciemnione do >= 4,5:1, niebieska/fioletowa plakietka konta.
4. R01.3: czcionka systemowa, 4-5 rozmiarów (14/16/20/28 px); R01.4: jedna kolumna do 960 px, siatka 4 px.
5. R01.5: karta konta, rozwijany formularz z widoczną etykietą, tabela wpisów, stan pusty, ramka zamiast samego cienia.
6. R01.6: prawie bez ruchu, jedynie hover i potwierdzenie po zapisie; R01.7: ton po polsku, rozkaźnik, bez ozdobników; R01.8: wynik zawsze osobno per konto.
7. Antyreferencje: A1 generyczny wygląd AI, A2 cień jako jedyny separator, A3 kolor jako jedyny nośnik, A4 jedna łączna liczba, A5 dane udające prawdziwe.
8. K1: niebieski `#2563eb` zostaje, wartości stają się tokenami; K2: czytelność wygrywa nad odcieniem; K3: marka nierozstrzygnięta (L4).
9. Luki otwarte: L3 tryb ciemny, L4 marka, L5 zestaw ikon, L6 brak zrzutów.
10. Waluta i dane w przykładach: PLN, kwoty w formacie "3 975,50 zł", dane oznaczone "(przykład)".

## Inwentaryzacja repozytorium

- Menedżer pakietów: npm workspaces; Node 26; framework aplikacji: Next.js 16 z React 19 w `packages/app`.
- `packages/ui` dziś ma tylko `src/index.ts` (jedna stała) i `src/index.test.ts`; brak komponentów, stylów, tokenów, Storybooka, shadcn/ui i Tailwinda (design system nie istnieje, więc nie ma nic do zachowania ani usunięcia).
- Testy: Vitest w korzeniu (`vitest.config.ts`, jsdom, `packages/*/src/**/*.test.{ts,tsx}`), pokrycie 100% dla źródeł wymuszone w konfiguracji.
- ESLint (`eslint.config.mjs`): `ui` nie może importować `@aitl/*`; globalne ignorowane katalogi zdefiniowane w jednym miejscu.
- Backend-owe komponenty współdzielone (`CrudForm`, `DataTable`, `LoadingMessage`, `ErrorMessage`, `EmptyState`, `apiCall`) są opisane w `AGENTS.md` jako docelowe miejsce w `packages/ui/src/backend/`, ale jeszcze nie istnieją.
- Strona `/` jest dziś stylowana Tailwindem w aplikacji; Tailwind w repo jeszcze nie jest zainstalowany (stan do potwierdzenia przy PR C).

## Plan techniczny

- Pakiet: `packages/ui` (bez zależności od `@aitl/*`); Storybook w `packages/ui/.storybook`.
- Storybook 10.6.7 z `@storybook/react-vite`; dodatki: dokumentacja (MDX z obsługą tabel przez `remark-gfm`), dostępność (`a11y: { test: 'error' }`), testy interakcji, dodatek Vitest do Storybooka (przeglądarkowy, Playwright 1.65.1 + Chromium). Symulowanie API (MSW lub dekoratory) dopiero w etapie 3, gdy powstaną wzorce formularza; wymaga osobnej zgody na zależność.
- Tailwind 4.3.5 z tokenami jako zmienne CSS (`@theme`), fonty systemowe (bez CDN i bez plików fontów).
- Tokeny: jeden plik (surowe wartości, znaczenia, tokeny komponentów), źródło w `2026-11-17-tokeny.md`; kontrast przeliczony przed zapisem; ciemny motyw tylko struktura.
- Przełącznik motywu ustawia `data-theme` na elemencie `html` dokumentu, więc dialogi, menu i popovery go dostają.
- Skrypt `check:tokens`: znajduje kolory poza plikiem tokenów, klasy palety Tailwinda i arbitralne wartości; kończy się błędem; podpinany do CI.
- Zasady zachowane z wcześniejszego planu:
  - pokrycie 100% źródeł zostaje; stories są wyłączone z pokrycia przez `coverage.exclude` z wzorcem `**/*.stories.*`;
  - testy Storybooka mają osobną konfigurację Vitest, więc `npm test` nie wymaga przeglądarki;
  - ESLint nadal zabrania importów `@aitl/*` w `ui`;
  - `storybook-static` trafia do `.gitignore` (`**/storybook-static/`) i do `globalIgnores` w ESLint (`**/storybook-static/**`);
  - `npm audit` może zacząć padać po dodaniu zależności: ocena każdego znaleziska w PR, który je wprowadza, bez cichego wyciszania.
- Skrypty (docelowo, w `packages/ui`): `storybook`, `build-storybook`, `test:storybook`, `check:tokens`. W korzeniu skróty przez workspace.

## Plan PR-ów (kolejność)

| PR | Zakres | Czego potrzeba od właściciela |
|---|---|---|
| A (ten) | Tylko dokumenty: referencje, tokeny, POSTEP.md, wpis w dzienniku | przegląd i odpowiedzi na pytania poniżej |
| B (zrobiony, do przeglądu) | Narzędzia Storybooka: Storybook 10.6.7 (`react-vite`), Vitest 5.0.5 i Playwright 1.65.1 z Chromium, osobna konfiguracja testów Storybooka, `.gitignore` i `globalIgnores`, pusta strona startowa; bez tokenów | "dalej" do etapu 1; zgoda na pobranie Chromium (już udzielona w zasadzie, potwierdzenie przy PR); decyzja o `npm audit` jeśli padnie |
| C (zrobiony, do przeglądu) | Tokeny (`packages/ui/src/tokens.css`, trzy warstwy, wartości bez zmian względem `2026-11-17-tokeny.md`) + Tailwind 4.3.5 (`styles.css`, `@theme inline`) + przełącznik motywu w Storybooku (jasny; ciemny tylko pusty blok `[data-theme='dark']`, pozycja w menu opisana jako brak wartości, L3); bez komponentów | zatwierdzenie przeliczonego kontrastu, jeśli jakaś para spadnie poniżej progu; potwierdzenie, że aplikacja nie ma mieć jeszcze motywu ciemnego |
| D (zrobiony, do przeglądu) | Strony Fundamenty: Kolory (z tabelą kontrastu liczoną na żywo z tokenów), Typografia, Odstępy, Promienie i powierzchnie, Ruch, Motyw (ciemny = luka L3); skrypt `check:tokens` (ui + korzeń) z testami; joby CI "Storybook tests" i "Check tokens"; `test:storybook` bez `passWithNoTests`. Ikony i układ (szerokości 320/768/1440) bez osobnych stron: ikony dojdą z etapem 2 (`lucide-react`), układ czeka na decyzje o tabeli na wąskim ekranie | decyzja, czy joby "Storybook tests" i "Check tokens" wchodzą do wymaganych checków `main` (ustawienie ochrony gałęzi robi właściciel; zrobione, sześć wymaganych checków) |
| E (zrobiony) | Infrastruktura komponentów (ręczny `components.json`, `cn` z testami, zależności `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`, peer `react`/`react-dom`) + Button (shadcn dopasowany do tokenów, strona dokumentacji z 13 sekcjami, stories, testy interakcji); nowe tokeny jako propozycje | tokeny zaakceptowane 2026-11-17 (`--muted-hover`, `--destructive-foreground`, `--control-height`, `--line-height-base`, `prefers-reduced-motion`); kolor hover dla `destructive` nadal otwarty |
| F (zrobiony) | Input (text, email, password, amount) + Label + Field (etykieta, podpowiedź, błąd pod polem, "(opcjonalne)"), token `--space-label-field` 4 px, tekst pól 16 px poniżej 768 px i 14 px od 768 px, dwie strony dokumentacji z 13 sekcjami, stories i testy interakcji | propozycje zatwierdzone 2026-11-17: `readOnly` (tło `--form-surface`), odstęp podpowiedź-błąd 4 px, brak hovera pól, `aria-required` zamiast natywnego `required` |
| G (zrobiony, do przeglądu) | Card (Card, CardHeader, CardTitle, CardContent), Badge (shared, personal, neutral), Alert (neutral `status`, error `alert`; Title, Description), token `--space-card-gap` 12 px, trzy strony dokumentacji z 13 sekcjami, stories (320 px, długi tekst, logowanie: błąd i blokada 429), testy interakcji | przegląd; decyzje zatwierdzone 2026-11-17 (patrz niżej) |
| H (zrobiony, do przeglądu) | Checkbox (Radix + `Check`/`Minus` z `lucide-react` 1.74.0), token `--checkbox-size` 20 px, strona dokumentacji z 13 sekcjami, stories (stany, 320 px, tabela, Field, grupa "Wszystkie") i testy interakcji; usunięta nieużywana zależność `cn` | przegląd; decyzje zatwierdzone 2026-11-17 (patrz niżej) |
| I (zrobiony, do przeglądu) | Select (natywny `select`, strzałka `ChevronDown`, opcjonalna pusta opcja), strona dokumentacji z 13 sekcjami, stories i testy interakcji; `Field` bez zmian | przegląd; decyzje zatwierdzone 2026-11-18 (patrz niżej) |
| J (zrobiony, do przeglądu) | RadioGroup (Radix, `fieldset` z `legend`, opcje z etykietą w celu 36 px, podpowiedź i błąd pod grupą, układ z zapytania kontenerowego), strona dokumentacji z 13 sekcjami, stories (stany, 320 px, formularz wpisu) i testy interakcji (strzałki, `Tab`, spacja); bez nowych zależności i tokenów | przegląd; decyzje zatwierdzone 2026-11-18 (patrz niżej) |
| K (zrobiony, do przeglądu) | TextLink (podkreślenie zawsze, kolor `--primary`, hover `--primary-hover`), Skeleton (statyczny blok `--muted`, bez animacji), EmptyState (tytuł, opis, jedna akcja przez Button, bez ikony), ErrorState (tytuł, opis, "Spróbuj ponownie", `announce` nadaje `role="alert"`), cztery strony dokumentacji z 13 sekcjami, stories (320 px, długi tekst, podglądy fokusu) i testy interakcji; bez nowych zależności i tokenów | przegląd; decyzje zatwierdzone 2026-11-18 (patrz niżej) |

Każdy PR: jeden temat, zielone checki (typecheck, lint, test:coverage, build, audit), wpis w `.ai/runs/`, lekcja przy napotkanej pułapce.

## Pytania otwarte (do właściciela)

Rozstrzygnięte przez właściciela produktu, 2026-11-17:

1. Baza komponentów: shadcn/ui na Radix (zgodnie ze stackiem z `AGENTS.md`).
2. Ikony (L5): `lucide-react`, dodawany dopiero w etapie 2, gdy komponenty go potrzebują.
3. Marka (L4): w Storybooku sam tekst "AITL", bez logo; luka o marce zostaje otwarta.
5. CI Storybooka: build i testy dostępności w przeglądarce jako osobne joby wymagane do merge, a11y blokuje.

4. Odwołanie do `docs/design-system.md` (etap 4) w lokalnym `AGENTS.md` repozytorium AITL (nie w plikach globalnych): tak; krótka sekcja trafi do PR-a etapu 4 i jest zatwierdzana przy review.

Decyzje właściciela produktu, 2026-11-17 (PR F):

6. Tokeny z PR E zatwierdzone: `--muted-hover`, `--destructive-foreground`, `--control-height` 36 px, `--line-height-base` 1,5, globalne `prefers-reduced-motion`. Zapisane w `.ai/specs/design/2026-11-17-tokeny.md`.
7. Odstęp etykieta-pole 4 px jako token znaczeniowy `--space-label-field` (= `var(--space-1)`).
8. Wymagane/opcjonalne: tekst "(opcjonalne)" zamiast gwiazdki, pola wymagane domyślnie. Błąd pola pod polem (nie w dymku), z `aria-describedby` i `aria-invalid`, treść mówi co zrobić.
9. Tekst w polach 16 px poniżej 768 px i 14 px od 768 px; wysokość 36 px; tło `bg-card`, ramka `--input`; pole musi leżeć na `--card` lub `--form-surface` (na tle strony ramka ma 2,89:1); bez cieni; fokus globalny 2 px; wagi 400/600. Hover `destructive` bez zmian (luka).

Decyzje właściciela produktu, 2026-11-17 (PR G), zatwierdzone przez właściciela produktu:

10. Cztery propozycje z PR F zatwierdzone: wygląd `readOnly` (tło `--form-surface`), odstęp podpowiedź-błąd 4 px (ten sam token), brak hovera pól, `aria-required` zamiast natywnego `required` (formularze dostaną `noValidate` w etapie 3).
11. Badge: `shared` (`--badge-shared-bg/fg`), `personal` (`--badge-personal-bg/fg`), `neutral` (tło `--background`, tekst `--foreground`, jak w makiecie, bez nowego tokenu); znaczenie niesie tekst (A3); `rounded-pill`; waga 400.
12. Card: ramka `--border` bez cienia (A2), `bg-card`, `rounded-card`, padding 16 px (`--space-panel`), odstęp wewnętrzny 12 px jako nowy token `--space-card-gap` (= `var(--space-3)`, pochodzenie: odstęp nagłówka panelu w makiecie).
13. Alert: warianty `neutral` (`role="status"`) i `error` (`role="alert"`); tekst i ramka odróżniają rodzaj; bez ikony w partii 1; tytuł opcjonalny plus opis; treść "co się stało i co zrobić".

Decyzje właściciela produktu, 2026-11-17 (PR H), zatwierdzone przez właściciela produktu:

14. `lucide-react` zatwierdzony wyłącznie tam, gdzie komponent wymaga ikony (Checkbox: `Check`, `Minus`; później strzałka w Select); Alert i Badge zostają bez ikon.
15. Checkbox: pole 20 px (token `--checkbox-size`) z celem kliknięcia 36 px (etykieta jest częścią celu), zaznaczony = wypełnienie `--primary` i biała ikona `Check`, pośredni = kreska, fokus globalny 2 px, ramka `--input`, bez cienia, `rounded-control`, stany disabled i invalid, etykieta zawsze widoczna (w tabeli nazwa dostępna z opisu wpisu), kolor nigdy jedynym nośnikiem.
16. Natywny `<select>` dla Select i układ RadioGroup rozstrzygane w PR I i J. Kolor hover dla `destructive` nadal otwarty.

Decyzje właściciela produktu, 2026-11-18 (PR I), zatwierdzone przez właściciela produktu, 2026-11-18:

17. Select to natywny `<select>` (nie Radix), stylowany tylko na polu: tło `--card`, ramka `--input`, wysokość 36 px (`--control-height`), `rounded-control`, tekst 16 px poniżej 768 px i 14 px od 768 px (jak Input), bez cienia, wagi 400/600, bez zmiany wyglądu przy najechaniu, fokus globalny 2 px.
18. Strzałka: `ChevronDown` z `lucide-react` 16 px, import z podścieżki `lucide-react/icons/chevron-down` (jak `check` i `minus`), dekoracyjna (`aria-hidden`), z prawej margines 32 px (`pr-8`), więc nie nachodzi na tekst; bez nowego tokenu.
19. Listę opcji rysuje system operacyjny; nie stylujemy jej (ograniczenie opisane na stronie "Czego brakuje"). Stany: domyślny, fokus, zablokowany, błąd (czerwona ramka `--destructive`, komunikat pod polem przez Field z `aria-describedby` i `aria-invalid`), długa opcja przy 320 px (obcięta wielokropkiem).
20. Opcjonalna postać z pustą opcją "Wybierz…" (prop `placeholder`) istnieje, ale nie jest używana na pierwszych ekranach (miesiąc i typ wpisu mają wartości domyślne). Kolor nigdy nie jest jedynym nośnikiem.
21. Select działa w `Field` tak jak Input (etykieta, podpowiedź, błąd, znacznik "(opcjonalne)", identyfikatory): `Field` bez zmian, bo przekazuje właściwości przez `cloneElement`. RadioGroup to PR J. Kolor hover `destructive` nadal otwarty.

Decyzje właściciela produktu, 2026-11-18 (PR J), zatwierdzone przez właściciela produktu, 2026-11-18:

22. RadioGroup: układ poziomy dla dwóch opcji, pionowy dla więcej niż dwóch i zawsze pionowy przy 320 px; grupa to `fieldset` z widoczną `legend` (uzasadnienie wyboru Radix z `fieldset` jako elementem głównym: strona dokumentacji i opis PR).
23. Wygląd jak Checkbox: koło 20 px (`--checkbox-size`) w celu 36 px (etykieta w celu), ramka `--input`, wybrana = wypełnienie `--primary` z białą kropką (kształt, nie sam kolor), disabled, invalid (ramka `--destructive`, komunikat pod grupą, `aria-describedby` i `aria-invalid` na `fieldset`), fokus globalny 2 px, bez cienia i bez hovera koła, wagi 400/600; szczegóły wybranej opcji i odstępy to rekomendacja agenta zatwierdzona domyślnie (kropka 8 px = `size-2`, koło `rounded-pill`, odstępy z istniejących tokenów, brak nowych tokenów). Klawiatura: strzałki przenoszą i wybierają, `Tab` raz, spacja wybiera. Kolor hover `destructive` nadal otwarty.

Nadal otwarte: kolor hover dla `destructive`.

## Komponenty (lista wyprowadzona z ekranów w specyfikacjach)

Bazowe (Primitives), z ekranem, który ich potrzebuje:

| Komponent | Ekran / epik |
|---|---|
| Button (główny, drugoplanowy, ghost) | logowanie, formularz wpisu, dialog usuwania (E01, E02) |
| TextLink | logowanie, nawigacja (E01) |
| Input (tekst, hasło, kwota) | logowanie, formularz wpisu (E01, E02) |
| Textarea | opis wpisu, jeśli wielowierszowy (E02); nie budowany, brak, gdy ekran zażąda (decyzja 2026-11-18) |
| Select | wybór miesiąca/typu wpisu (E02) |
| Checkbox | "Zapłacone" w wierszu (E02-S04) |
| RadioGroup | typ wpisu wpływ/wydatek, cykliczność (E02) |
| Label, FormField (podpowiedź, błąd, wymagane/opcjonalne) | logowanie, formularz wpisu (E01, E02) |
| Card/Panel | karta konta, panel listy (E02, E03) |
| Badge | plakietka "wspólne"/"osobiste" (E01, E03) |
| Alert | błąd logowania, 422 zbyt wiele wpisów (E01, E02) |
| Dialog, ConfirmDialog | usuwanie wpisu/serii (E02-S03) |
| Menu | akcje serii "Zakończ od miesiąca", "Zmień kwotę od miesiąca" (E02-S03) |
| Tabs | nie budowany, brak, gdy ekran zażąda (decyzja 2026-11-18) |
| Skeleton, EmptyState, ErrorState | stany listy i karty konta (E02, E03) |
| Toast | potwierdzenie po zapisie wpisu (R01.6, P5) |
| Popover, Tooltip, Avatar | poza zakresem specyfikacji; wpisane do "Czego brakuje", dopóki nie ma ekranu, który ich potrzebuje |

Produktu (Product), według epików:

| Komponent | Epik |
|---|---|
| LoginForm, ListaKontBankowych (BankAccountList) | E01 |
| MonthSwitcher | E02, E03 |
| EntryTable / EntryRow (z przełącznikiem zapłacone, znakiem +/-, oznaczeniem cykliczności) | E02 |
| EntryForm (rozwijany, nad listą) | E02 |
| SeriesActions (zakończ, zmień kwotę, usuń całkowicie) | E02 |
| AccountRemainderCard ("ile zostanie" per konto, aktywne konto z aria-pressed) | E03 |

Wzorce (Patterns): formularz (ze stanami odpowiedzi API), lista z filtrami (miesiąc zamiast filtrów; stany "brak wyników" i "pusto"), widok szczegółów konta, potwierdzenie usunięcia, przegląd miesiąca per konto (R03).

Przybliżona liczba stories: bazowe ok. 21 komponentów x ok. 5 = 105; produktu ok. 7 x ok. 6 = 42; wzorce ok. 5 x ok. 6 = 30; ekrany epików ok. 6; razem ok. 180 stories. Szacunek do weryfikacji w etapach 2-3.

## Drzewo menu Storybooka (nazwy po polsku, do zatwierdzenia)

```
System projektowy
  Start: jak zbudować ekran
  Komponenty: katalog
  Jak wybrać komponent
  Użycie i dostępność
  Treść i komunikaty
  Czego unikać
  Czego brakuje
  Współtworzenie
  Epik E01: Dostęp i logowanie
  Epik E02: Zapis wpływów i wydatków
  Epik E03: Ile zostanie w miesiącu
Fundamenty: kolor, typografia, odstępy i układ, kształt i głębia, ruch, ikony, motywy
Elementy bazowe (Primitives)
Elementy produktu (Product): E01, E02, E03
Wzorce (Patterns): formularz, lista z filtrami, widok szczegółów, potwierdzenie usunięcia, przegląd miesiąca per konto
```

## Czego brakuje w materiałach

- L3 wartości trybu ciemnego, L4 marka, L5 zestaw ikon, L6 zrzuty ekranu.
- Brak ekranów dla Popover, Tooltip, Avatar, Tabs w specyfikacjach (patrz lista komponentów).
- Brak decyzji o układzie na wąskim ekranie tabeli wpisów poza regułą z tokenów (karty lub przewijany kontener poniżej ok. 600 px).
- Specyfikacja E01 nie opisuje szczegółów strony logowania poza jej istnieniem i Tailwindem.

## Co zostaje, zmienia się i znika (design system już istnieje?)

Design system nie istnieje. Nic do usunięcia. Jedyny istniejący element, `packages/ui/src/index.ts`, zostaje bez zmian do czasu, gdy pierwszy komponent wymusi eksporty.

## Zasady pracy (przypomnienie)

Reguły bez źródła są propozycjami do decyzji. Każda wartość z tokenu. Stories używają prawdziwych komponentów. Nowa zależność tylko po zatwierdzeniu w planie. Niczego nie publikujemy poza PR-ami do `main` z zielonymi checkami.

## Notatki z PR C (tokeny i Tailwind)

- Pochodzenie wartości tokenów jest w `.ai/specs/design/2026-11-17-tokeny.md` (kolumna Pochodzenie); w kodzie nie ma komentarzy, a strony Foundations (PR D) pokażą to samo z tabelą kontrastu.
- Odstępstwa od nazw z tabeli tokenów, wymuszone przez Tailwinda: rozmiary czcionki to `--font-size-sm/base/lg/xl` (nazwy `--text-*` kolidują z przestrzenią nazw Tailwinda i tworzyłyby zapętlone `var()`); w Tailwindzie klasy to `text-sm`...`text-xl`. Promienie w Tailwindzie: `rounded-control` (6 px), `rounded-card` (8 px), `rounded-pill` (10 px). Skala odstępów to `--space-1, 2, 3, 4, 6, 8, 12` (mnożnik 4 px). `--shadow-card: none` jest tokenem, bez klasy Tailwinda (zwykły `shadow-none` wystarcza).
- Do warstwy 1 dodano `--raw-white` i `--raw-gray-300` (źródła dla `--card`, `--primary-foreground`, `--border`), żeby znaczenia nie zawierały surowych wartości.
- Domyślna paleta, cienie, promienie i rozmiary Tailwinda są wyzerowane (`initial`), więc klasy typu `bg-blue-500` nie istnieją; dostępne są tylko znaczenia.
- Tryb ciemny (L3): `[data-theme='dark']` jest pustym blokiem, bez wymyślonych wartości. Przełącznik w Storybooku ustawia `data-theme` na `html`; pozycja "Ciemny" ma w nazwie informację, że wartości nie istnieją i wygląd jest jak jasny. Po powstaniu wartości trzeba policzyć kontrasty od nowa.

## Notatki z PR D (Foundations, check:tokens, CI)

- Strony Fundamenty to pary: `*.stories.tsx` (testowane przez `test:storybook`, a11y blokuje) i `*.mdx` podpięty przez `<Meta of>`. Bloki podglądu leżą w `packages/ui/.storybook/blocks/` (bez eksportu z pakietu), katalog tokenów z pochodzeniem R/A/K w `token-catalog.ts`.
- Wartości na stronach są czytane na żywo z `tokens.css` (`?raw`). Kontrast liczy przetestowany kod w `packages/ui/src/design-tokens/` (100% pokrycia); test porównuje wyniki z wartościami zatwierdzonymi w dokumencie tokenów, więc strona i dokument nie mogą się rozjechać.
- Dwie pary spoza progu 3:1 są pokazane jako znane przypadki z dokumentu tokenów: pole `--input` na tle strony (niedozwolone) i `--border` (dekoracja).
- Luki zapisane na stronach, nie uzupełniane: ciemny motyw (L3), `prefers-reduced-motion`, wysokość i długość linii tekstu, zakres użycia grubości 400 i 600, obramowania i cienie poza zatwierdzonymi.
- `check:tokens` (`packages/ui/scripts/check-tokens.ts`, logika w `packages/ui/src/check-tokens/`): skanuje `packages/ui/src`, `packages/ui/.storybook` i `packages/app/src` (`.ts`, `.tsx`, `.css`, `.mdx`; bez `*.test.*`, `*.d.ts` i `tokens.css`); wykrywa kolory hex i funkcje kolorów, klasy palety Tailwinda (w tym `text-white`, `bg-black`) i wartości arbitralne (z wyjątkiem `[var(--...)]`); wypisuje `plik:linia`, kończy kodem 1. Aplikacja ma dziś zero trafień.
- CI: dwa nowe joby z `timeout-minutes`: "Storybook tests" (Chromium przez `npx playwright install --with-deps chromium`, potem `npm run test:storybook`) i "Check tokens". Nie zmieniano ochrony gałęzi.

## Decyzje właściciela z etapu 2 (2026-11-17)

1. Partia 1: Button, Input, Label+Field, Alert, Card, Badge (PR E: infrastruktura i Button; F: Input i Label/Field; G: Card, Badge, Alert); Checkbox, Select i RadioGroup w partii 2.
2. Wysokość kontrolek 36 px; tekst pól formularza 16 px poniżej 768 px i 14 px od 768 px.
3. Fokus: globalny obrys 2 px ze `styles.css`, odstęp 2 px, bez pierścienia 3 px.
4. Wagi 400, 600, 700 (bez 500); bez cieni (A2: ramka); promienie tylko `rounded-control`, `rounded-card`, `rounded-pill`.
5. Warianty Button: default (główny), secondary, ghost, destructive; rozmiary default i icon; strzałki miesiąca używają `secondary`.
6. `lucide-react` dopiero z Checkboxem (partia 2); do demonstracji rozmiaru `icon` używamy znaków tekstowych.
7. `prefers-reduced-motion: reduce` zeruje przejścia; dodać token wysokości linii (propozycja 1,5).
8. Zatwierdzone zależności `@aitl/ui`: `class-variance-authority`, `clsx`, `tailwind-merge`, `radix-ui`; `@testing-library/user-event` i `jest-dom` nie były potrzebne.

## Notatki z PR E (infrastruktura komponentów i Button)

- `components.json` napisany ręcznie (bez `shadcn init`). `shadcn@4.23.0 add button` zadziałał nieinteraktywnie (`--cwd . --yes`, wersja przypięta w `npx`), ale zapisał plik pod literalnym katalogiem `@/components/ui/` z importem `cn` z placeholdera `"cn"`; plik przeniesiono do `src/components/ui/button.tsx` i przepisano (importy względne, `cn` z `src/lib/utils.ts`). CLI nie zmienił `package.json` poza zależnościami z planu.
- Z shadcn usunięto: cienie, `ring-[3px]`, `font-medium`, `rounded-md`, `text-white`, `dark:*`, `transition-all`, warianty `outline` i `link`, rozmiary poza `default` i `icon`, selektory `svg` (brak ikon). Dodano prop `loading` (aria-busy, aria-disabled, ignorowanie kliknięć) zgodnie ze stanem "wysyłanie" z E01.
- `cn` używa `extendTailwindMerge` z nazwami `rounded-control/card/pill` i `h-control`/`size-control`, inaczej tailwind-merge nie zna naszych klas i nie rozwiązuje konfliktów.
- Najechanie nie da się przetestować w `play` (user-event nie uruchamia `:hover` w CSS); hover jest pokazany jako zamrożony podgląd (`data-preview-state`, `.storybook/preview-states.css`), a istnienie reguły sprawdzone w zbudowanym CSS.
- Nowe tokeny (propozycje): `--muted-hover`, `--destructive-foreground`, `--control-height`, `--line-height-base`; szczegóły i kontrast w `.ai/specs/design/2026-11-17-tokeny.md`. Brak koloru hover dla `destructive` zapisany jako luka.

## Notatki z PR G (Card, Badge, Alert)

- Komponenty napisane ręcznie na wzorcu shadcn (bez CLI), bez martwego kodu: z Card tylko `Card`, `CardHeader`, `CardTitle` (prop `as` dla poziomu nagłówka, domyślnie `h3`) i `CardContent`; `CardDescription`, `CardFooter` i `CardAction` zapisane w "Czego brakuje". Bez nowych zależności.
- Neutralny Badge używa istniejących tokenów (`--background`/`--foreground`), więc na karcie ma tylko 1,10:1 jako kształt; znaczenie niesie tekst. Zapisane jako luka na stronie Badge.
- Alert: rola wynika z wariantu (`ALERT_ROLES`), można ją nadpisać atrybutem `role`. Brak ikony, brak przycisku zamknięcia, brak odliczania czasu blokady (luki na stronie Alert).
- Karta i Alert używają `border-border`/`border-destructive` jawnie (Tailwind 4: `border` bez koloru to `currentColor`).

## Notatki z PR H (Checkbox i lucide-react)

- Checkbox na `Checkbox` z `radix-ui` (przycisk `role="checkbox"`): daje spację jako przełącznik, `aria-checked="mixed"` dla stanu pośredniego, ukryte pole formularza i poprawne `data-state`; natywne `input` wymagałoby ręcznego `indeterminate` i atrapy znacznika. Radix jest już zatwierdzoną zależnością, więc koszt to zero nowych pakietów. Wada: w jsdom spacja nie wywołuje kliknięcia przycisku, więc spacja i Enter są sprawdzone w testach Storybooka (prawdziwa przeglądarka), a nie w jednostkowych.
- `lucide-react` 1.74.0 przypięte dokładnie (peer React do 19), ikony importowane z podścieżek (`lucide-react/icons/check`, `.../minus`), więc do paczki trafiają tylko dwie ikony. `npm audit --omit=dev` bez zmian (0).
- Usunięto nieużywaną zależność `cn` (^0.5.2): zaciągnął ją placeholder `"cn"` z kodu shadcn (lekcja w `.ai/lessons/`).
- Prop `label` jest opcjonalny (typ nie wymusza nazwy dostępnej, bo unia typów psuje typowanie stories); brak `label` i `aria-label` łapie test a11y w Storybooku.
- Obrys fokusu przechodzi przez `transition-colors` (kolor obrysu też jest animowany 150 ms), więc test mierzy szerokość, odstęp i styl obrysu, nie jego kolor tuż po fokusie.

## Notatki z PR I (Select)

- Komponent: `Select` w `src/components/ui/select.tsx`, natywny `select` w kontenerze z absolutnie ustawioną strzałką `ChevronDown` (`aria-hidden`, `pointer-events-none`). Opcje to dane (`options`), nazwy miesięcy i typów są w stories, nie w komponencie. `Field` bez zmian (działa przez `cloneElement`), test integracji z Field jest w `select.test.tsx`.
- Bez nowych zależności ani tokenów: 32 px prawego marginesu to `pr-8` ze skali odstępów (8 + 16 + 8 px).
- Testy w Storybooku nie sprawdzają strzałek ani wpisywania nazwy: `user-event` nie uruchamia natywnej obsługi klawiszy w zamkniętym `select`; test sprawdza fokus przez `Tab`, `selectOptions` i `change`.
- Luki (strona "Czego brakuje"): lista opcji rysowana przez system, kolor pustej opcji, `optgroup`, hover pola.

## Notatki z PR J (RadioGroup)

- Komponent: `RadioGroup` w `src/components/ui/radio-group.tsx`, API z danymi `options` (jak Select): `legend`, `options` (`value`, `label`, `hint`, `disabled`), `hint`, `error`, `optional`, `optionalText`, `disabled`. Własna legenda, podpowiedź i błąd (jak Field), więc nie wchodzi w `Field` (Field łączy `label` z jednym polem przez `htmlFor`).
- Radix `RadioGroup.Root` z `asChild` na `fieldset` (rola `radiogroup` jawnie, nazwa przez `aria-labelledby` na `legend`): daje strzałki z zawijaniem, `Tab` raz, spację, pomijanie zablokowanych i ukryte pole formularza. Natywne `input type="radio"` odrzucone: ten sam wygląd i zachowanie we wszystkich przeglądarkach, spójność z Checkbox, kropka jako kształt.
- Układ z zapytania kontenerowego Tailwinda (`@container`, `@sm:flex-row`), nie z okna: wąska kolumna na szerokim ekranie też jest pionowa. Wymaga szerokości kontenera (`w-full`).
- Błąd: ramka `--destructive` tylko na niewybranych opcjach (`group-aria-invalid/radio-group:data-[state=unchecked]:`); po wyborze ramka wraca do `--primary`.
- Bez nowych zależności ani tokenów; `npm audit --omit=dev` bez zmian.
- W jsdom działają kliknięcie, strzałki (Radix przenosi fokus w `setTimeout`, test czeka `waitFor`) i `FormData`; kolejność `Tab` i fokus klawiaturą sprawdzają testy Storybooka (prawdziwa przeglądarka).
- Pułapki (lekcje w `.ai/lessons/`): `user-event` wysyła `keyup` zaraz po `keydown`, a Radix wybiera opcję strzałką dopiero w odroczonym fokusie, więc test musi przytrzymać klawisz; `waitFor` ze Storybooka wywołuje callback przy każdej mutacji DOM, więc callback tworzący element pomocniczy (`resolveToken`) zapętla się i zawiesza przeglądarkę.

## Notatki z PR K (TextLink, Skeleton, EmptyState, ErrorState)

- Komponenty napisane ręcznie na wzorcu istniejących, bez nowych zależności i bez nowych tokenów. Wszystkie odstępy z istniejących tokenów semantycznych (`--space-within-group`), promień `rounded-control`, tło `--muted`, kolory `--primary`, `--primary-hover`, `--muted-foreground`.
- TextLink: `a` z `asChild` (Radix `Slot`, jak Button), potrzebny dla `Link` z Next.js i dla `button` w wyglądzie linku (wylogowanie jako żądanie). Link zewnętrzny bez `target`, `rel` i ikony.
- Skeleton: jedyny komponent to blok; kontener z `aria-busy` jest wzorcem w dokumentacji, a kompozycje (linie tekstu, karta konta, wiersze wpisów) tylko przykładami w stories z dokumentowanych ekranów (E01-E03), nie eksportem.
- EmptyState i ErrorState: teksty przekazuje aplikacja (`title`, `description`, `action`, `retryLabel`); poziom nagłówka przez `titleLevel` (h2-h4, domyślnie h3); typ `StateTitleLevel` wspólny. ErrorState ma `retrying` (Button `loading`) i `announce` (`role="alert"`). Przyciski używają wariantu głównego (jedna akcja na widok).
- Zawijanie: `wrap-anywhere` zamiast `break-words` w tytule i opisie: element `flex-col items-start` ma szerokość `fit-content`, a `break-words` nie zmniejsza szerokości minimalnej, więc długi adres bez spacji rozpychał kontener (410 px przy 320 px).
- Podgląd najechania i fokusu TextLink w `.storybook/preview-states.css` (`data-preview-state`).

## Decyzje właściciela z 2026-11-18 (PR K i dalsza kolejność)

Zatwierdzone przez właściciela produktu, 2026-11-18:

1. Pozostałe komponenty bazowe budujemy wyłącznie tam, gdzie ekran ich potrzebuje: **Textarea** i **Tabs** nie są budowane (brak, gdy ekran zażąda).
2. Kolejność: PR K (ten), PR L Dialog + ConfirmDialog, PR M Menu, PR N Toast (Radix Toast z zainstalowanego `radix-ui`, bez nowej zależności; czas wyświetlania jako token).
3. TextLink: podkreślenie ZAWSZE (nie tylko przy najechaniu), kolor akcji, globalny obrys fokusu 2 px, link zewnętrzny w tej samej karcie bez specjalnej ikony w tej partii, najechanie bez usuwania podkreślenia, kolor nigdy jedynym nośnikiem.
4. Skeleton: statyczny blok `--muted`, bez pulsowania i animacji (R01.6, `prefers-reduced-motion`); cały kontener ładowania ma `aria-busy` i nie jest ogłaszany blok po bloku; kompozycje tylko jako udokumentowane przykłady z dokumentowanych ekranów; promienie z istniejących tokenów.
5. EmptyState i ErrorState: bez ikon i ilustracji; tekst mówi, co się stało i co zrobić; EmptyState ma jedną akcję (Button, np. "Dodaj wpis"); ErrorState ma "Spróbuj ponownie" i wyraźne rozgraniczenie od Alertu (Alert: komunikat przy formularzu lub polu; ErrorState: zastępuje treść widoku, której nie da się pokazać); nagłówki z poziomem (h2-h4) jak CardTitle; EmptyState bez roli live; ErrorState z `role="alert"` tylko, gdy pojawia się dynamicznie po nieudanym wczytaniu.
6. Wagi 400/600/700, bez cieni, promienie tylko z istniejących tokenów, odstępy z istniejących tokenów semantycznych. Kolor hover dla `destructive` nadal otwarty.

## Decyzje właściciela z 2026-11-18 po PR K (akceptacja propozycji)

Zatwierdzone przez właściciela produktu, 2026-11-18:

1. Link samodzielny w osobnym wierszu (np. "Wyloguj") ma cel co najmniej 24 px wysokości; link na tle `--primary` (pasek nagłówka) ma kolor `--primary-foreground` z podkreśleniem; ładowanie ogłaszane wyłącznie przez `aria-busy` na kontenerze. Dokumentacja TextLink i Skeleton zaktualizowana w PR L (stories z testami: pasek nagłówka, cel 24 px).
2. Dialog na Radix Dialog z zainstalowanego `radix-ui` (bez nowej zależności), przesłona jako nowy token znaczeniowy z istniejącej palety, ConfirmDialog z fokusem domyślnym na "Anuluj" i bez zamykania przesłoną (pełna lista w pliku tokenów).

## Propozycje z PR L (zatwierdzone przez właściciela produktu, 2026-11-18)

Wszystkie cztery pozycje poniżej oraz rola `dialog` zamiast `alertdialog` dla ConfirmDialog zostały zatwierdzone (patrz też plik tokenów).

- `--destructive-hover` = nowy surowy `--raw-red-800` #991b1b (tylko w `tokens.css`): biały tekst 8,31:1, na `--card` 8,31:1, na `--background` 7,55:1. Zamyka lukę "hover destructive" z PR E.
- `--overlay` = `--raw-gray-900` z krytością 60% (`color-mix`): okno `--card` względem przyciemnionej strony 4,33:1 nad `--background`, 4,04:1 nad `--card`, 9,98:1 nad paskiem `--primary`. Nazwa i rola tokenu zatwierdzone, krycie 60% to propozycja.
- Maksymalna szerokość okna 448 px (`max-w-md`).

## Notatki z PR L (Dialog, ConfirmDialog)

- Komponenty: `Dialog` (z `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`) i `ConfirmDialog` w `src/components/ui/`, na Radix Dialog z `radix-ui`; ikona `X` z `lucide-react/icons/x`. Bez nowych zależności; `npm audit --omit=dev` bez zmian.
- Budowa: przesłona (`DialogPrimitive.Overlay`) jest elementem flex, który centruje okno i daje margines 16 px (`p-(--space-4)`); okno ma `max-h-full`, a przewija się wewnątrz obszar treści (`dialog-body`), więc przycisk zamknięcia zostaje w rogu, a strona za oknem stoi (blokada przewijania Radix). Bez wartości arbitralnych Tailwinda.
- Przycisk zamknięcia: Button `ghost` `icon` (36 px) z `aria-label` z propsa `closeLabel`; leży w DOM za treścią, więc fokus początkowy trafia na pierwsze pole, a nie na "X". `dismissOnOverlayClick` (domyślnie `true`) wyłącza zamykanie przesłoną; ConfirmDialog ustawia `false`.
- ConfirmDialog: sterowany (`open`, `onOpenChange`), `onConfirm` nie zamyka okna, fokus domyślny na "Anuluj" przez `onOpenAutoFocus`, a powrót fokusu na element otwierający zapamiętany przy otwarciu (Radix wraca fokusem tylko na `DialogTrigger`, a ConfirmDialog nie ma wyzwalacza). Potwierdzenie to Button `destructive` z `loading`. Stan "zablokowany" dotyczy wyzwalacza z powodem obok (E02-Q15), nie samego okna.
- Pułapka (nie lekcja): Radix Dialog zamyka przesłoną dopiero po zdarzeniu `click` po `pointerdown` (odroczone `pointerdown` poza oknem), więc test jednostkowy musi wysłać oba zdarzenia, a test Storybooka używa `userEvent.click` na przesłonie.
- 320 px w Storybooku: `globals: { viewport: { value: 'mobile1' } }` w story (dodatek Vitest ustawia wtedy `page.viewport(320, 568)`); test sprawdza `window.innerWidth`, margines 16 px, przewijanie wewnątrz okna i brak przewijania strony.
- Button `destructive`: hover `--destructive-hover` (klasa, podgląd `data-preview-state` w `preview-states.css`, test klasy, dokumentacja, katalog tokenów).
- Foundations: katalog tokenów ma `--raw-red-800`, `--destructive-hover`, `--overlay`; strona Kształt ma sekcję "Przesłona za oknem"; nowe pary kontrastu `--destructive-hover` są w teście `contrast-pairs.test.ts`.

## Notatki z PR M (Menu)

- Komponent: `Menu` w `src/components/ui/menu.tsx`, jeden komponent z danymi (`items`: `id`, `label`, `onSelect`, `destructive`, `disabled` + `disabledReason`), bez części do składania. Radix DropdownMenu z `radix-ui` (bez nowej zależności), wyzwalacz Button `ghost` `icon` z `lucide-react/icons/ellipsis`, nazwa dostępna w `triggerLabel`. Bez nowych tokenów; `npm audit --omit=dev` bez zmian.
- Pozycja zablokowana jest widoczna z powodem w tekście: `aria-disabled` + `data-disabled` zamiast `disabled` Radixa (które pomija pozycję przy strzałkach i czytnik nie dotarłby do powodu); wybór takiej pozycji jest ignorowany, menu zostaje otwarte. Typ (unia) wymusza `disabledReason` przy `disabled`.
- Menu jest niemodalne (`modal={false}`): modalne wygaszało stronę przez `aria-hidden`, a przycisk wewnątrz pozostawał fokusowalny, więc axe (a11y `test: 'error'`) zgłaszał błąd na każdej story z otwartym menu. Efekt uboczny: kliknięcie poza menu je zamyka, strona się nie blokuje.
- Powrót fokusu: akcja pozycji (`onSelect`) jest uruchamiana w `onCloseAutoFocus` menu przez `queueMicrotask`, czyli po zamknięciu menu i powrocie fokusu na przycisk. Bez tego okno otwierane z pozycji zapamiętywało `body` (pozycja już zniknęła z DOM) i po zamknięciu fokus ginął.
- Zmiana w Dialogu: `DialogContent` zapamiętuje element z fokusem przy otwarciu i oddaje mu fokus po zamknięciu, gdy konsument nie zablokował `onCloseAutoFocus` (Radix wracał tylko na `DialogTrigger`); przy samym `body` zostawia zachowanie Radixa. Testy jednostkowe w `dialog.test.tsx`, opis w `dialog.mdx`. Tak samo działa `ConfirmDialog` (jego własne obsługi mają pierwszeństwo).
- Obrys fokusu pozycji: globalny 2 px z ujemnym odstępem (`-outline-offset-2`), żeby nie wychodził poza ramkę menu; tło `--muted` przy najechaniu i fokusie (`--muted-hover` nieużywany).
- Podgląd najechania i fokusu pozycji to zamrożone stany w dokumentacji: hook w pliku stories ustawia `data-preview-state` na pozycjach otwartego menu (`defaultOpen`), reguły w `preview-states.css`. `defaultOpen` w API istnieje tylko dla dokumentacji i testów.
- Testy jednostkowe w jsdom wymagają stubów `ResizeObserver` i `scrollIntoView`; powrót fokusu, strzałki, `Home`/`End` i wpisywanie liter sprawdza Storybook w prawdziwej przeglądarce.
- Propozycje z PR M (separator ramką `--border`, niemodalność, ujemny odstęp obrysu, `aria-disabled` zamiast `disabled`, odstępy 4/16 px, szerokość powodu `max-w-72`, brak zawijania fokusu strzałkami): zatwierdzone przez właściciela produktu, 2026-11-18 (plik tokenów i strona Menu zaktualizowane w PR N).

## Notatki z PR N (Toast)

- Decyzje właściciela, zatwierdzone przez właściciela produktu, 2026-11-18: propozycje z PR M zatwierdzone (separator ramką `--border`, menu niemodalne, ujemny odstęp obrysu w pozycjach, `aria-disabled` zamiast `disabled`, odstępy 4/16 px, `max-w-72` dla powodu, brak zawijania fokusu strzałkami); Toast na Radix Toast bez nowej zależności, czas jako tokeny (3 s, 6 s dla toastu z akcją), bez ikon, u dołu przy 320 px i w prawym dolnym rogu od 768 px, `polite` dla potwierdzeń, jeden widoczny naraz, wstrzymanie przy najechaniu i fokusie, błąd wymagający działania nigdy nie jest toastem, bez akcji w tej partii, przycisk zamknięcia jako tekst 36 px. Pełny zapis w pliku tokenów, sekcja "Toast (PR N)".

- Komponent: `ToastProvider` + `useToast()` (`toast({ message, announce? })` zwraca identyfikator, `dismiss(id)`) w `src/components/ui/toast.tsx`; Radix Toast z `radix-ui`, bez nowej zależności. Najprostsze API wystarczające dla przykładów: provider trzyma kolejkę, renderuje jeden `Toast.Root` z kluczem identyfikatora; teksty (`closeLabel`, `viewportLabel` ze znacznikiem `{hotkey}`, `announcementLabel`) przekazuje aplikacja, bo domyślne teksty Radixa są angielskie ("Notifications ({hotkey})", "Notification").
- Ogłaszanie: Radix nie nadaje roli `status` samemu toastowi, tylko dokłada niewidoczny element w `body` (`role="status"`, `aria-live` `polite` dla `type="background"`, `assertive` dla `type="foreground"`) na 1 s. Potwierdzenie = `background` (polite); `announce: 'assertive'` = `foreground`, opisane i przetestowane, na ekranach nieużywane.
- Czas: token `--toast-duration` (3000ms) odczytywany z `getComputedStyle(documentElement)` przy pokazaniu toastu i przekazywany do Radixa jako liczba ms; testy i dokumentacja nadpisują token na `documentElement` (krótki czas w testach, godzina w dokumentacji, zawsze sprzątane w `finally`/efekcie). Tokeny `--toast-duration-with-action` (6 s, na razie nieużywany) i `--toast-viewport-offset` (16 px) dodane do `tokens.css`, katalogu Foundations i pliku tokenów.
- Wstrzymanie (WCAG 2.2.1) zweryfikowane w przeglądarce: Radix wstrzymuje przy `pointermove` nad regionem i `focusin` w regionie, wznawia po `pointerleave`/wyjściu fokusu; `F8` (zdarzenie `keydown` z `code: 'F8'`) fokusuje region, `Tab` prowadzi do toastu i przycisku "Zamknij". Gest przesunięcia wyłączony przez `swipeThreshold` równy nieskończoności (test przeciągnięcia o 300 px). Brak animacji, więc reduced-motion nie wymaga obsługi.
- Położenie: region `fixed`, `left`/`right`/`bottom` = `--toast-viewport-offset`; od `md` (768 px) `left-auto` i `w-96`. W Storybooku wąski widok to `mobile1` (320 px), a `desktop` ma 1280 px (nie 1024), więc test szerokiego ekranu sprawdza 1280 px.
- Znane ograniczenie: gdy wskaźnik albo fokus pozostaje w regionie po zamknięciu toastu, kolejny z kolejki czeka z odliczaniem do zjechania lub wyjścia fokusu (wspólna flaga wstrzymania w Radixie). Otwarty Dialog wygasza resztę strony dla czytnika ekranu, więc toast wywołuj po zamknięciu okna.
- Propozycje PR N (plik tokenów, sekcja "Toast (PR N)"): szerokość 384 px, granica `md`, przycisk zamknięcia jako Button `secondary`, prop `announcementLabel`, odczyt tokenu z CSS, wyłączenie przesunięcia przez próg: zatwierdzone przez właściciela produktu, 2026-11-18.
- Token `--toast-duration-with-action` (6 s) usunięty w PR O jako martwy kod (zatwierdzone przez właściciela produktu, 2026-11-18); wraca razem z akcją w toaście.

## Etap 2 zakończony i plan etapu 3

### Co zbudowano, a czego celowo nie

Zbudowane (18 plików komponentów w `packages/ui/src/components/ui/`, każdy z testami jednostkowymi 100%, stories ze stanami, testami `play` w przeglądarce, stroną dokumentacji po polsku z 13 sekcjami i "Czego brakuje"): Button, Input, Label + Field, Card, Badge, Alert, Checkbox, Select, RadioGroup, TextLink, Skeleton, EmptyState, ErrorState, Dialog + ConfirmDialog, Menu, Toast.

Celowo niezbudowane (brak, gdy ekran zażąda): Textarea, Tabs, Tooltip, Popover, Avatar; Toast bez akcji ("Cofnij") i bez ikony; ciemny motyw (L3).

Dług z etapu 2: układ poziomy etykiety w Field dla Checkboxa i RadioGroup oraz wspólny komponent grupy pól wyboru: rozstrzygnięty propozycją w PR O (bez układu poziomego i bez wspólnego komponentu, patrz niżej, do decyzji właściciela); zdanie w `Shape.mdx` o 60% `--overlay` odświeżone w PR O (zatwierdzone 2026-11-18).

### Decyzje właściciela z 2026-11-18 (plan etapu 3)

Zatwierdzone przez właściciela produktu, 2026-11-18: plan etapu 3 w poniższym podziale (O formularz, P E01, Q przegląd miesiąca równolegle z P po O, R tabela wpisów E02, S EntryForm + SeriesActions + potwierdzenie usunięcia + Toast po zapisie, T ekrany pełnoekranowe i pozostałe wzorce); propozycje z PR N (szerokość toastu 384 px, granica `md`, przycisk zamknięcia Button `secondary`, prop `announcementLabel`, odczyt tokenu z CSS, wyłączony gest przesunięcia); usunięcie nieużywanego tokenu `--toast-duration-with-action` do czasu akcji w toaście; reguły wzorca formularza (patrz "Notatki z PR O").

### Notatki z PR O (wzorzec formularza)

- Kod w `packages/ui/src/backend/forms/` (zgodnie z `AGENTS.md`: generyczne wzorce panelu w `ui/src/backend/<kategoria>/`): `useFormValidation` (stan wartości, "dotknięte", wysłanie, fokus na pierwszym błędzie, błędy serwera, blokada podwójnego wysłania, `reset`), `ErrorSummary` (Alert `error` z linkami przenoszącymi fokus), `focusControl` (wewnętrzny: fokus na polu albo pierwszym elemencie grupy), `parseAmountToMinor` ("12,50" daje 1250; powody odrzucenia jako dane, komunikaty po polsku dają aplikacja i story). Wszystko eksportowane z `index.ts`, relatywne importy, bez zależności od `@aitl/*`, bez nowych zależności i tokenów; testy jednostkowe 100% w jsdom.
- Zod: pomocnik przyjmuje `validate(values) => mapa pole -> komunikat`, więc `app` podepnie wspólne schematy z `core` bez importu w `ui`.
- Reguły (zatwierdzone przez właściciela produktu, 2026-11-18): sprawdzanie po opuszczeniu dotkniętego pola i przy wysłaniu; fokus na pierwszym nieprawidłowym polu; podsumowanie tylko przy więcej niż jednym błędzie; komunikaty "co się stało i co zrobić"; `noValidate` + `aria-required`; `loading` blokuje podwójne wysłanie; błąd serwera niezwiązany z polem jako Alert u góry (logowanie: komunikat ogólny, blokada 429 z sekundami); Toast po zapisie jako udokumentowana kompozycja, nie część formularza; kwota jako tekst z `inputMode="decimal"` parsowany w formularzu do groszy.
- Pułapki: `Field` nadpisuje `id` kontrolki własnym, więc `id` do fokusu trzeba przekazać do `Field` (stąd `getFieldProps` zwraca `{ id, error }` dla `Field` i `RadioGroup`, a `getInputProps` samo `name`, `value`, `onChange`, `onBlur`); typ wartości formularza musi być aliasem `type`, nie `interface` (indeksowa sygnatura); długi nieprzerwany tekst w błędzie i podpowiedzi `Field` wypychał stronę przy 320 px, więc dostały `wrap-anywhere` (jak w lekcji o `break-words`).
- Stories w `Wzorce/Formularz`: logowanie (czysty, pole po opuszczeniu, jeden błąd, kilka błędów, wysyłanie, błąd ogólny, blokada 429 z sekundami, brak sieci, sukces; kontrolka `scenario` w polu do zabawy), wpis (czysty, jeden błąd, kilka błędów z podsumowaniem, zapisany z Toastem, błąd pola z serwera, błąd serwera), długie etykiety przy 320 px, testy (`noValidate`, powiązanie błędu z polem, znikanie błędu po poprawie, blokada podwójnego wysłania, linki podsumowania), "Dobrze i źle". Strona dokumentacji `form-pattern.mdx` z sekcjami wzorca i "Czego brakuje".
- Propozycje do decyzji właściciela (plik tokenów, "Wzorzec formularza (PR O)"): format kwoty (przecinek i kropka; odrzucane ujemna, zero, ponad dwa miejsca, separator tysięcy, ponad 8 cyfr), układ pól wyboru (bez układu poziomego etykiety i bez wspólnego komponentu grupy), data jako tekst RRRR-MM-DD, podsumowanie znikające przy jednym błędzie, komunikat ogólny jako jeden tekst, `wrap-anywhere` w `Field`.
- PR N: statusy propozycji uzupełnione (zatwierdzone), strony Kształt (60% `--overlay` zatwierdzone) i Ruch oraz `toast.mdx` zaktualizowane.

### Proponowany podział etapu 3 na PR-y

Wejście: backlog E01-E03 (`.ai/specs/backlog.md`) i specyfikacje w `.ai/specs/`. Każdy PR: komponenty z testami jednostkowymi 100%, stories ze stanami danych (ładowanie, pusto, błąd, częściowe dane, dużo danych, długie teksty, 320 px), testy `play`, dokumentacja po polsku.

| PR | Zakres | Czego potrzeba od właściciela |
|---|---|---|
| O (zrobiony, do przeglądu) | Wzorzec formularza (bez ekranu): etykiety zawsze widoczne, walidacja po opuszczeniu pola i przy wysłaniu, fokus na pierwszym błędzie po nieudanym wysłaniu, dane zostają, blokada podwójnego wysłania, sukces po potwierdzeniu z serwera; odpowiedzi API symulowane (sukces, oczekiwanie, błąd pola, błąd serwera, brak sieci); rozstrzygnięcie układu poziomego etykiety dla pól wyboru | decyzje: kiedy walidować (po opuszczeniu pola czy przy wysłaniu), treść komunikatów błędów po polsku, czy fokus po błędzie ma też czytelny komunikat zbiorczy |
| P (zrobiony, do przeglądu) | E01: LoginForm (stany: wysyłanie, błąd ogólny, blokada z czasem 429), BankAccountList (plakietki "Wspólne"/"Osobiste", stan pusty, błąd wczytania) + stories ekranów `/login` i `/` z mapą stanów | akceptacja treści komunikatów logowania (R01.7; w PR O są robocze: "Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.", "Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund.") i zachowania blokady z czasem (czy odliczać na żywo, czy tylko podać sekundy); czy lista kont ma kolejność inną niż z API; przegląd propozycji z PR O |
| Q (zrobiony, do przeglądu) | MonthSwitcher (strzałki miesiąca, nazwa miesiąca, granice) i AccountRemainderCard ("ile zostanie" per konto, aktywne konto `aria-pressed`, stany: ładowanie, brak wpisów, wynik ujemny; R01.8), `formatMoneyMinor`, wzorzec "Przegląd miesiąca per konto" (stories); patrz "Notatki z PR Q" | decyzje o wyglądzie stanu aktywnego, kwotach i znaku podjęte 2026-11-18 (patrz "Decyzje właściciela z 2026-11-18 (PR Q)"); propozycje z PR Q zatwierdzone przez właściciela produktu, 2026-11-18 |
| R (zrobiony, zatwierdzony) | E02 wpisy: EntryTable / EntryRow (przełącznik "zapłacone", znak +/-, oznaczenie cykliczności, długie nazwy, dużo wierszy, wąski ekran: przewijany kontener), wzorzec "Lista wpisów konta" (stories); patrz "Notatki z PR R" | decyzje o układzie poniżej ok. 600 px, wyglądzie wiersza zapłaconego i kolumnach podjęte 2026-11-18 (patrz "Decyzje właściciela z 2026-11-18 (PR R)"); propozycje z PR R zatwierdzone przez właściciela produktu, 2026-11-18 |
| S (zrobiony, do przeglądu) | EntryForm (okno modalne; Typ, Opis, Kwota, Data, Powtarzanie, Zapłacone), SeriesActions (Menu + okna: zakończ, zmień kwotę, usuń całkowicie), potwierdzenie usunięcia, Toast po zapisie, rozszerzona kompozycja "Lista wpisów konta"; patrz "Notatki z PR S" | decyzje podjęte 2026-11-18 (formularz zamyka się po zapisie, bez "Cofnij", akcja w pustym miesiącu, dzień efektywny); do decyzji: propozycje z PR S |
| T | Ekrany epików jako stories pełnoekranowe: `/login`, `/` (lista kont), strona konta z wpisami (E02), przegląd miesiąca per konto (E03), z mapą stanów (która story pokazuje który stan); wzorce: lista z filtrami (miesiąc zamiast filtrów, "brak wyników" i "jeszcze nic tu nie ma"), widok szczegółów, przegląd miesiąca per konto | przegląd ekranów po złożeniu; decyzja, czy ekrany trafiają też do aplikacji (`packages/app`) w tym etapie, czy dopiero po etapie 5 |

Kolejność O, P, Q, R, S, T wynika z zależności (formularz przed LoginForm i EntryForm, Q i R przed ekranem konta). PR P i Q można równolegle po O.


### Decyzje właściciela z 2026-11-18 (propozycje z PR O i komunikaty logowania)

Zatwierdzone przez właściciela produktu, 2026-11-18: wszystkie propozycje z PR O (format kwoty: przecinek i kropka, odrzucane ujemna, zero, więcej niż dwa miejsca po przecinku, separator tysięcy i więcej niż 8 cyfr; pola wyboru bez układu poziomego, legenda nad RadioGroup i etykieta obok Checkboxa; data jako tekst RRRR-MM-DD; podsumowanie znikające przy jednym błędzie; komunikat ogólny serwera jako jeden tekst bez tytułu; `wrap-anywhere` w Field). Logowanie: robocze komunikaty zatwierdzone ("Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie." dla nieznanego e-maila i złego hasła oraz "Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund."), blokada ze statyczną liczbą sekund bez odliczania na żywo (poprawna odmiana sekundę/sekundy/sekund), kolejność listy kont jak z API, teksty komponentów produktu jako nazwane stałe w `messages.ts` nadpisywalne propem. Szczegóły w pliku tokenów, sekcja "E01 (PR P): decyzje".

### Notatki z PR P (E01: LoginForm, BankAccountList, ekrany `/login` i `/`)

- Kod: `packages/ui/src/components/auth/` (`login-form.tsx`, `messages.ts`, `login-failure.ts`, `format-seconds.ts`) i `packages/ui/src/components/bank-accounts/` (`bank-account-list.tsx`, `messages.ts`), eksporty dopisane na końcu `index.ts`. Testy jednostkowe 100%, bez nowych zależności i tokenów.
- Kontrakt dla `app`: `LoginForm.onSubmit(values) => Promise<{ ok: true } | { ok: false; kind: 'invalid-credentials' | 'too-many-attempts' | 'network'; retryAfterSeconds?: number }>`; `app` mapuje kopertę API (`invalid_credentials`, `too_many_attempts` z `error.retryAfterSeconds`) na ten kształt (tabela na stronie LoginForm). `BankAccountList` dostaje `status`, `accounts` (`{ id, name, type, href }` w kolejności z API, `href` dodaje `app`), `onRetry`, opcjonalnie `retrying`, `emptyAction`, `messages`, `headingLevel`.
- Ekrany jako stories pełnoekranowe w `packages/ui/src/screens/e01/` (`Ekrany / E01 Dostęp i logowanie`) z mapą stanów w dokumentacji; pasek "AITL" + "Wyloguj" zapisany w samych stories (bez komponentu `AppShell`, bo drugi ekran z tym paskiem to dopiero E02). Prawdziwych stron w `packages/app` nie budujemy: decyzja na etap 5 (wraz z adapterem `apiCall`, przekierowaniami, wylogowaniem jako `POST` i nawigacją `href` kont, np. `TextLink asChild` z `Link` Next).
- Zgodność ze specyfikacją: kontrakt UI zakłada, że `app` zawsze poda `retryAfterSeconds` przy 429 (spec: nowe pole koperty błędu, Step 2.4b); bez niego komponent pokazuje wersję "za chwilę". Spec mówi "lista kont, `EmptyState` gdy pusta" i nie przewiduje akcji w pustym stanie, więc domyślnie jej nie ma.
- Czego potrzebują kolejne PR-y: R, S i T mogą użyć gotowego wzorca `messages.ts` (domyślne teksty jako stałe, nadpisywalne propem) i adaptera wyniku w stylu `LoginResult`; T wyodrębnia `AppShell` (pasek z "AITL" i "Wyloguj") z ekranów E01, gdy doda ekran konta i przegląd miesiąca, oraz decyduje o `max-w-240` jako wspólnym kontenerze treści.

### Decyzje właściciela z 2026-11-18 (PR Q)

Zatwierdzone przez właściciela produktu, 2026-11-18: AccountRemainderCard to element przełączany do wyboru konta (`aria-pressed`); stan aktywny to stała ramka 2 px w kolorze akcji (`--primary`), karta nieaktywna ma też ramkę 2 px (`--border`), więc układ nie skacze; aktywna karta ma dodatkowo napis "Wybrane" (stan nie zależy od koloru, A3); kwoty ujemne "−1 234,50 zł" z prawdziwym minusem U+2212, twardą spacją jako separatorem tysięcy, przecinkiem dziesiętnym i kolorem `--expense`; wpływy z jawnym plusem i kolorem `--income`; znak niesie znaczenie, kolor tylko je wzmacnia; wartość "ile zostanie" 28 px z wagą 700 tylko dla niej, pod nią wiersze "Wpływy:" i "Wydatki:"; nigdy suma łączna (R03); kolejność kont jak z API. MonthSwitcher: strzałki Button `secondary` rozmiaru `icon`, etykieta miesiąca po polsku w mianowniku małą literą z `aria-live="polite"`, bieżący miesiąc podaje wołający (serwer, Europe/Warsaw), nie zegar przeglądarki; granice `min`/`max` opcjonalne; bez selecta i pola daty w tym PR.

### Notatki z PR Q (przegląd miesiąca)

- Kod: `packages/ui/src/components/months/` (`month.ts`: `addMonths`, `compareMonths`, `formatMonthLabel`, `parseMonthKey`, `isMonthKey`; `month-switcher.tsx` z `month-switcher.messages.ts`), `packages/ui/src/components/bank-accounts/` (`account-remainder-card.tsx` z `account-remainder-card.messages.ts`; własne nazwy plików, folder wspólny z PR P) i `packages/ui/src/lib/format-money-minor.ts` (`formatMoneyMinor(amountMinor, { sign })`: tylko PLN, grosze jako `number` bezpieczny lub `bigint`, bez zaokrąglania, `sign: 'negative' | 'always'`). Eksporty dopisane na końcu `index.ts`; bez nowych zależności i tokenów; testy jednostkowe 100% w jsdom.
- Teksty domyślne po polsku w jednym `*.messages.ts` na komponent (stałe, w JSX nie ma polskich literałów), nadpisywane propem `messages`; nazwy miesięcy to stała w `month-switcher.messages.ts`, nie `Intl` (deterministyczne w jsdom i Chromium).
- AccountRemainderCard: `status` `ready`/`loading`/`error` jako suma typów; ładowanie zostaje przyciskiem (`aria-busy`, wybór działa, Skeleton zamiast kwot); błąd to zwykła karta z ErrorState (przycisk w przycisku jest niedozwolony), więc nie da się jej wybrać. Kwoty przychodzą gotowe z serwera (`remainderMinor`, `incomeMinor`, `expensesMinor`), komponent niczego nie sumuje.
- Strony dokumentacji: "Elementy produktu / MonthSwitcher", "Elementy produktu / AccountRemainderCard" i wzorzec "Wzorce / Przegląd miesiąca per konto" (stories: dwa konta, jedno konto, wynik ujemny, miesiąc bez wpisów, ładowanie, błąd, brak kont, 320 px, długie nazwy; testy `play` w przeglądarce, m.in. pomiar rozmiaru karty przed i po wybraniu).
- Propozycje z PR Q (plik tokenów, "Przegląd miesiąca (PR Q)"): dodatni wynik w kolorze `--income`, zero neutralne; karta błędu to zwykła, niewybieralna karta; hover karty `--background`; nazwy miesięcy ze stałej, nie z `Intl`; `min`/`max` bez wbudowanego zakresu; karta w ładowaniu nieco niższa: wszystkie zatwierdzone przez właściciela produktu, 2026-11-18.
- Czego potrzebują kolejne PR-y: R (tabela wpisów) reużywa `formatMoneyMinor` (plus dla wpływów, minus U+2212 dla wydatków, `sign: 'always'`) i `MonthSwitcher` nad listą; S (EntryForm) reużywa `parseAmountToMinor` z PR O w parze z `formatMoneyMinor`; T składa ekran `/` z sekcji z tego PR i `BankAccountList` z PR P. Decyzje właściciela potrzebne przed R: układ tabeli poniżej ok. 600 px, liczba wierszy w "dużo danych", wygląd wiersza zapłaconego; przed T: czy karta konta ma być też linkiem do strony konta.

### Decyzje właściciela z 2026-11-18 (PR R)

Zatwierdzone przez właściciela produktu, 2026-11-18: propozycje z PR Q (patrz wyżej). Tabela wpisów: poniżej ok. 600 px przewija się sama tabela w kontenerze (strona nigdy w poziomie; widoczna podpowiedź, `tabindex="0"`, nazwa, rola `region`), bez układu kartowego; wiersz zapłaconego wydatku to wyłącznie zaznaczone pole z nazwą z opisu wpisu (bez wyszarzenia, przekreślenia, zmiany koloru); flaga jest informacyjna i nigdy nie zmienia sum (R02); wpływ bez kontrolki "Zapłacone"; kwoty przez `formatMoneyMinor(kwota, { sign: 'always' })` (plus `--income`, minus U+2212 `--expense`); cykliczność jako neutralna plakietka tekstowa "Co miesiąc"; kolumny Opis, Kwota, Data, Zapłacone, Akcje (slot `actions(entry)`); limit 500 jako ostrzeżenie nad tabelą. Szczegóły w pliku tokenów, sekcja "Tabela wpisów (PR R)".

### Notatki z PR R (tabela wpisów, E02)

- Kod: `packages/ui/src/components/entries/` (`entry-table.tsx`, `entry-row.tsx`, `entry-table.messages.ts` jedyny plik tekstów dla obu komponentów, `format-entry-date.ts`); eksporty dopisane na końcu `index.ts`; bez nowych zależności i tokenów; testy jednostkowe 100% w jsdom.
- Kontrakt dla `app`: `EntryTable` jest sterowany propsami: `status` (`loading`/`error`/`loaded`/`limit-exceeded`), `caption` (wymagany), `entries` (`EntryRowData`: `id`, `type`, `description`, `amountMinor` (grosze, dodatnie), `occurredOn` `RRRR-MM-DD`, `recurrence` `none`/`monthly` z `dayOfMonth`, `paid` `boolean | null`), `onPaidChange(entryId, paid)`, `savingEntryIds`, `actions(entry)`, `onRetry`, `emptyAction`, `limit`, `messages`. Kształt wiersza odpowiada odpowiedzi `GET .../entries?month=`; `paid` dla serii to stan w wyświetlanym miesiącu. `app` mapuje 422 `result_limit_exceeded` na `status="limit-exceeded"` (bez wpisów).
- Błąd zapisu flagi pokazuje wołający (Toast), nie tabela; pole zostaje w poprzednim stanie (bez aktualizacji optymistycznej), a w czasie zapisu ma `aria-busy` i `aria-disabled` (zamiast `disabled`, żeby nie zgubić fokusu).
- Strony dokumentacji: "Elementy produktu / EntryTable" (z notami o EntryRow) i wzorzec "Wzorce / Lista wpisów konta" (stories: konto wspólne i osobiste, pusty miesiąc, ładowanie, błąd, limit, błąd zapisu flagi, 320 px; testy `play`: m.in. brak wpływu flagi na wynik konta).
- Pułapki: region przewijany nazwany stałym tekstem łamał axe (`landmark-unique`) przy dwóch tabelach na stronie, więc nazwę dostaje z podpisu tabeli (`aria-labelledby`); dwa `ToastProvider` na jednej stronie też dają zdublowany landmark.
- Propozycje do decyzji właściciela (plik tokenów, "Tabela wpisów (PR R)"): `tabular-nums` w kolumnie kwoty, `aria-disabled` + `aria-busy` zamiast `disabled` w czasie zapisu flagi, region przewijany nazwany podpisem tabeli, próg podpowiedzi 36 rem z zapytania kontenerowego, bez aktualizacji optymistycznej, ostrzeżenie o limicie jako Alert `error` bez tabeli, dzień miesiąca z API zamiast dnia efektywnego, treść komunikatów (stałe w `entry-table.messages.ts`).
- Luki między specyfikacją E02 a kontraktem UI: spec sortuje po dniu efektywnym (przyciętym do długości miesiąca), ale lista zwraca surowy `dayOfMonth`; spec nie opisuje akcji w pustym miesiącu ani zachowania UI w trakcie zapisu flagi; komunikat limitu nie może podpowiedzieć zawężenia, bo miesiąc jest już najwęższym filtrem (Q10).
- Czego potrzebuje PR S: `EntryForm` reużywa `parseAmountToMinor` i `useFormValidation`; `SeriesActions` to `Menu` przekazywany przez slot `actions` (wzorzec w story "Kolumna akcji"; reguła "Usuń całkowicie" jako pozycja zablokowana z powodem, gdy `deletable` jest fałszem) oraz `ConfirmDialog`; Toast po zapisie jak w story "Błąd zapisu flagi". Do decyzji właściciela przed S: treść pytań potwierdzających i etykiet, czy formularz zostaje otwarty po zapisie, czy Toast ma akcję "Cofnij", czy pusty miesiąc ma akcję "Dodaj wpis". PR T: ekran konta składa `MonthSwitcher`, karty wyniku i `EntryTable` jak we wzorcu "Lista wpisów konta" i wyodrębnia `AppShell`.

### Decyzje właściciela z 2026-11-18 (PR S)

Zatwierdzone przez właściciela produktu, 2026-11-18: propozycje z PR R (`tabular-nums` w kolumnie kwoty; `aria-disabled` + `aria-busy` w czasie zapisu flagi; region przewijany nazwany podpisem tabeli; próg podpowiedzi 36 rem; limit jako Alert `error` zamiast tabeli; komunikat błędu zapisu flagi "Nie udało się zapisać zmiany. Flaga „Zapłacone” została taka, jak była. Spróbuj ponownie."). Dzień miesiąca wpisu cyklicznego to **dzień efektywny z API** (przycięty do długości miesiąca): semantyka propa `dayOfMonth` w `EntryRowData` udokumentowana, specyfikacja E02 uzupełniona w osobnym commicie. Po zapisie formularz się zamyka, lista się odświeża i pokazuje się Toast "Wpis zapisany."; pusty miesiąc ma jedną akcję "Dodaj wpis" (`emptyAction`); bez "Cofnij" i bez akcji w Toaście (usuwanie twarde, chronione `ConfirmDialog`). Szczegóły w pliku tokenów, sekcje "Tabela wpisów (PR R)" i "Wpisy: formularz i akcje serii (PR S)".

### Notatki z PR S (EntryForm, SeriesActions, potwierdzenia)

- Kod: `packages/ui/src/components/entries/` (`entry-form.tsx` + `entry-form.messages.ts`, `series-actions.tsx` + `series-actions.messages.ts`, wewnętrzne `series-change-dialog.tsx`, `action-confirm-dialog.tsx`, `amount-input.tsx`, `entry-failure.ts`, `entry-validation.ts`, `format-amount-input.ts`); eksporty dopisane na końcu `index.ts`; bez nowych zależności i tokenów; testy jednostkowe 100% w jsdom.
- Kontrakt dla `app`: komponenty nie wołają API i nie importują `@aitl/*`. Każda operacja to prop zwracający `Promise<EntryActionResult>`: `{ ok: true }` albo `{ ok: false, kind: 'validation' | 'conflict' | 'network' | 'limit', fieldErrors? }` (wyjątek = `network`). `app` mapuje kopertę API: `validation_error` z `fieldErrors` na `kind: 'validation'` z polami (`amountMinor` na `amount`, `occurredOn` na `date`), `conflict` (409, w tym `expectedUpdatedAt` i `DELETE` serii z przeszłością) na `conflict`, `result_limit_exceeded` (422) na `limit`, brak odpowiedzi/5xx na `network`. `EntryForm.onSubmit` dostaje `EntrySubmission` (`create` z `draft` i `paid`, `update-one-off`, `update-series-description`); `SeriesActions` dostaje `onEdit`, `onDelete`, `onCompleted` i dla serii `series` (`deletable`, `endMonthOptions`, `amountMonthOptions`, `onEnd`, `onChangeAmount`). `onSaved`/`onCompleted` są wołane po zamknięciu okna: odświeżenie listy i Toast.
- Luki między specyfikacją E02 a kontraktem UI (do uzupełnienia w specyfikacji): (1) `POST .../entries` nie przyjmuje `paid`, a formularz ma pole "Zapłacone" przy dodawaniu wydatku: `app` robi `POST` i potem `PATCH .../paid` (Faza 4) albo spec dodaje `paid` do `POST`; (2) odpowiedź listy nie ma `updatedAt`, a `PUT` serii, `end` i `revisions` wymagają `expectedUpdatedAt`; (3) lista miesięcy do wyboru w "Zakończ"/"Zmień kwotę" wymaga `seriesStartMonth`/`seriesEndMonth` (spec zwraca je w liście, ale `EntryRowData` ich nie niesie: `app` liczy `endMonthOptions` i `amountMonthOptions` z odpowiedzi API); (4) spec nie opisuje zachowania po udanym usunięciu (fokus ginie razem z wierszem).
- Decyzje wykonawcze (do przeglądu, patrz plik tokenów): okno modalne zamiast panelu; "Zapłacone" ukryte dla wpływu i nieobecne przy edycji; typ i powtarzanie w edycji tylko jako tekst; wpis cykliczny edytowalny tylko w opisie; "Anuluj" przed przyciskiem głównym; okna z miesiącem to `Dialog` z formularzem (fokus na polu), a `ConfirmDialog` (fokus na "Anuluj") tylko dla usunięć; dodatkowa pozycja "Edytuj opis" dla serii; `onCompleted`/`onSaved` po zamknięciu okna.
- Strony dokumentacji: "Elementy produktu / EntryForm", "Elementy produktu / SeriesActions", wzorzec "Wzorce / Potwierdzenie usunięcia" (reguły; stories z SeriesActions) i rozszerzony wzorzec "Wzorce / Lista wpisów konta" (dodawanie, edycja, usuwanie, błędy zapisu i usuwania, pusty miesiąc z jedną akcją). Testy `play` w przeglądarce: moment walidacji, fokus na pierwszym błędzie, "12,50" na 1250, "Zapłacone" tylko dla wydatku, podwójne wysłanie, powrót fokusu (Anuluj, Escape, menu), domyślny fokus potwierdzeń na "Anuluj", błąd zostaje w oknie, powód zablokowanej pozycji, Toast po zapisie bez kradzieży fokusu, 320 px.
- Pułapki: dialog z formularzem trzyma stan w ciele renderowanym wewnątrz `DialogContent` (każde otwarcie to świeży stan); `RadioGroup` w jsdom wymaga stubu `ResizeObserver`; tekst przycisku zmienia się na "Zapisywanie…", więc selektor testu nie może zakładać "Zapisz" w trakcie zapisu; `getByText` z twardą spacją w jsdom wymaga wyrażenia regularnego (normalizacja spacji).
- Czego potrzebuje PR T: `AppShell` (pasek "AITL" + "Wyloguj", wyodrębniony ze stories E01) i ekrany pełnoekranowe: konto z wpisami (E02: `MonthSwitcher`, karty wyniku, `EntryTable`, `EntryForm`, `SeriesActions`, Toast), przegląd miesiąca per konto (E03), z mapą stanów. Decyzje właściciela przed T: (a) czy karta konta jest też linkiem do strony konta (dziś karta tylko wybiera konto), (b) czy wybór konta trafia do adresu URL (`?account=`) razem z miesiącem, (c) gdzie ląduje fokus po usunięciu wpisu, (d) czy ekrany trafiają do `packages/app` w tym etapie, czy po etapie 5.

### Decyzje właściciela z 2026-11-24 (PR T)

Obowiązujące dla T: stan ekranu w adresie (`?account=…&month=RRRR-MM`); jedna strona bez osobnej strony per konto (karta konta wybiera konto, nie jest linkiem); fokus po usunięciu wpisu na nagłówku listy; prawdziwych stron w `packages/app` nie budujemy (decyzja na etap 5); propozycje z PR S przyjęte.

### Notatki z PR T (AppShell, ekrany E02 i E03)

- Kod: `packages/ui/src/components/layout/` (`app-shell.tsx`, `app-shell.messages.ts`, testy jednostkowe 100%, story i strona "Elementy produktu / AppShell"); eksporty dopisane na końcu `index.ts`. Stories E01 przepięte na `AppShell` (strona logowania bez `logoutHref`). Bez nowych zależności i tokenów.
- Ekrany: `screens/e02/account-entries-screen` (strona konta z wpisami: MonthSwitcher, karty, EntryTable, EntryForm, SeriesActions, Toast; harness `MonthPage` zawiera adres URL jako symulację i wszystkie scenariusze) i `screens/e03/month-overview-screen` (ta sama strona widziana od strony kart wyniku: ładowanie, błąd, błąd listy kont, brak kont, jedno konto, wynik ujemny, miesiąc bez wpisów). Mapy stanów na stronach dokumentacji obu ekranów. Harness jest współdzielony przez `excludeStories` w E02 i import w E03.
- Kontrakt dla `app` (etap 5): `month` i `account` z adresu (błędne wartości wracają do domyślnych, patrz plik tokenów); karty i lista to osobne żądania; po zapisie odświeżyć obie sekcje; po `onCompleted('delete')` przenieść fokus na nagłówek listy w `setTimeout(0)` (efekt po zatwierdzeniu renderu).
- Pozostałe wzorce: nowych nie dodano, bo nic z ekranów ich nie wymagało; reguła fokusu po usunięciu trafiła do wzorca "Potwierdzenie usunięcia".
- Pułapki (lekcje w `.ai/lessons/`): Radix FocusScope nadpisuje fokus ustawiony synchronicznie po usunięciu wiersza; oczekiwane kwoty w story budować przez `formatMoneyMinor`; karty (`h3`) pod `h1` wymagają ukrytego `h2` dla axe; współdzielony harness story musi być w `excludeStories`.
- Do decyzji właściciela: patrz plik tokenów (tabela propozycji PR T), zwłaszcza: czy karty zastępują `BankAccountList` na `/`, zapasowy wybór konta przy błędzie kart, kontener 960 px dla wszystkich stron, historia przeglądarki dla zmian adresu.

## Notatki z PR U (etap 4: strony, które uczą, plik dla agentów)

- Strony w `packages/ui/src/stories/system/` (menu "System projektowy", kolejność przez `storySort` w `preview.ts`): Start (charakter w trzech zdaniach, pięć kroków, tabela "czego użyć"), Komponenty (katalog), Jak wybrać komponent, Użycie i dostępność, Treść i komunikaty, Czego unikać (antywzorce produktu, generyczny wygląd AI, błędy implementacji), Czego brakuje (pokrycie backlogu, luki), Współtworzenie, Epiki E01, E02, E03. Dawna strona "Wprowadzenie" zastąpiona stroną Start.
- Plik dla agentów: `docs/design-system.md` (reguły oznaczone REGUŁA, PRZYKŁAD, LUKA), odwołanie w lokalnym `AGENTS.md` (decyzja właściciela nr 4). Opisuje tylko to, co istnieje w kodzie (nazwy eksportów i propsów sprawdzone w źródłach).
- Linki między stronami to `?path=/docs/<id>`; identyfikatory sprawdzone względem `index.json` zbudowanego Storybooka (skrypt jednorazowy, poza repo). `check:tokens` skanuje też `.mdx`, więc przykładów zakazanych wartości nie wpisujemy w dokumentacji literalnie.
- Do decyzji właściciela: czy plik `docs/design-system.md` ma być utrzymywany ręcznie (dziś tak), czy wymagać jego aktualizacji w checklistcie PR-a; czy etap 5 ma zawierać test agentem na ekranie z backlogu.

## Notatki z PR V (etap 5: sprawdzenie i raport)

- Raport: `.ai/specs/design/2026-11-24-raport-etapu-5.md` (liczby: 50 stron dokumentacji, 26 komponentów, 611 stories, 358 z testem interakcji; typecheck, lint, 560 testów jednostkowych z pokryciem 100%, build Storybooka, 611/611 testów Storybooka z axe, audit i `check:tokens` zielone; sweep 320/768/1440 px w obu motywach).
- Usterka naprawiona w tym PR-ze: przepełnienie poziome strony przy 320 px przez `sr-only` w niepozycjonowanym kontenerze `EntryTable` (test regresyjny, lekcja w `.ai/lessons/`).
- Decyzja właściciela przyjęta: zmiana w `packages/ui` wymaga aktualizacji `docs/design-system.md` (pozycja w liście "Przed prośbą o review" w `AGENTS.md`).
- Test agentem: PRZYGOTOWANY, nie wykonany. Ekran: "Prognoza na kolejne miesiące" (E04, zaparkowany, bez specyfikacji). Opis zadania i kryteria oceny (REGUŁA / PRZYKŁAD / ZGADUJĘ): `.ai/specs/design/2026-11-24-test-agentem-prognoza.md`. Wykonać w NOWEJ sesji (`/clear`), z promptem "Kontynuacja w nowej sesji"; każde ZGADUJĘ zamienić w zasadę albo wpis "Czego brakuje", potem powtórzyć.
- Czego nie sprawdzono (szczegóły w raporcie): wyglądu ciemnego motywu (L3), natywnego `Select` ręcznie, prawdziwego okna 320 px (sprawdzono w `iframe`), czytników ekranu, innych przeglądarek.
- Następny krok: właściciel przegląda PR V i decyduje o propozycjach z raportu (pkt 7), potem test agentem w nowej sesji; etap 5 jest domknięty dopiero po teście agentem i uzupełnieniu luk.
