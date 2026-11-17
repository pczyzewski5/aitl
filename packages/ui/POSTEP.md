# POSTEP: design system AITL i jego Storybook

Plik prowadzi prace nad design systemem w `packages/ui` (prompt "Storybook Twojego design systemu", etapy 0-5). Każda sesja zaczyna od przeczytania tego pliku i kontynuuje od "Następny krok". Po każdym etapie agent zatrzymuje się i czeka na "dalej" właściciela.

Etap 0 (ten plik) niczego nie instaluje i nie zmienia kodu. Zainstalowane zależności i kod pojawią się dopiero w osobnych PR-ach z sekcji "Plan PR-ów".

## Tabela postępu

| Etap | Zakres | Status |
|---|---|---|
| 0 | Inwentaryzacja i plan (ten plik) | PR A, do przeglądu |
| 1 | Fundamenty: Storybook, tokeny, Tailwind, przełącznik motywu, Foundations, skrypt `check:tokens` | w toku: PR B (narzędzia Storybooka) zrobiony; PR C (tokeny, Tailwind, przełącznik motywu) do przeglądu; PR D czeka |
| 2 | Komponenty bazowe, partiami po ok. sześć | nie rozpoczęty |
| 3 | Komponenty produktu, wzorce, ekrany epików | nie rozpoczęty |
| 4 | Strony, które uczą, plik dla agentów | nie rozpoczęty |
| 5 | Sprawdzenie i raport | nie rozpoczęty |

Następny krok: właściciel przegląda PR C (tokeny, Tailwind, przełącznik motywu) i pisze "dalej" do PR D (Foundations, `check:tokens`, CI).

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
| D | Strony Foundations (kolor z tabelą kontrastu, typografia, odstępy, kształt i głębia, ruch, ikony, układ, motywy) + skrypt `check:tokens` + zadania CI | decyzja o zestawie ikon (L5); decyzja, czy zadania Storybooka (testy przeglądarkowe, `check:tokens`) wchodzą do wymaganych checków `main` |

Każdy PR: jeden temat, zielone checki (typecheck, lint, test:coverage, build, audit), wpis w `.ai/runs/`, lekcja przy napotkanej pułapce.

## Pytania otwarte (do właściciela)

Rozstrzygnięte przez właściciela produktu, 2026-11-17:

1. Baza komponentów: shadcn/ui na Radix (zgodnie ze stackiem z `AGENTS.md`).
2. Ikony (L5): `lucide-react`, dodawany dopiero w etapie 2, gdy komponenty go potrzebują.
3. Marka (L4): w Storybooku sam tekst "AITL", bez logo; luka o marce zostaje otwarta.
5. CI Storybooka: build i testy dostępności w przeglądarce jako osobne joby wymagane do merge, a11y blokuje.

4. Odwołanie do `docs/design-system.md` (etap 4) w lokalnym `AGENTS.md` repozytorium AITL (nie w plikach globalnych): tak; krótka sekcja trafi do PR-a etapu 4 i jest zatwierdzana przy review.

Nadal otwarte: brak.

## Komponenty (lista wyprowadzona z ekranów w specyfikacjach)

Bazowe (Primitives), z ekranem, który ich potrzebuje:

| Komponent | Ekran / epik |
|---|---|
| Button (główny, drugoplanowy, ghost) | logowanie, formularz wpisu, dialog usuwania (E01, E02) |
| TextLink | logowanie, nawigacja (E01) |
| Input (tekst, hasło, kwota) | logowanie, formularz wpisu (E01, E02) |
| Textarea | opis wpisu, jeśli wielowierszowy (E02, do potwierdzenia) |
| Select | wybór miesiąca/typu wpisu (E02) |
| Checkbox | "Zapłacone" w wierszu (E02-S04) |
| RadioGroup | typ wpisu wpływ/wydatek, cykliczność (E02) |
| Label, FormField (podpowiedź, błąd, wymagane/opcjonalne) | logowanie, formularz wpisu (E01, E02) |
| Card/Panel | karta konta, panel listy (E02, E03) |
| Badge | plakietka "wspólne"/"osobiste" (E01, E03) |
| Alert | błąd logowania, 422 zbyt wiele wpisów (E01, E02) |
| Dialog, ConfirmDialog | usuwanie wpisu/serii (E02-S03) |
| Menu | akcje serii "Zakończ od miesiąca", "Zmień kwotę od miesiąca" (E02-S03) |
| Tabs | opcjonalnie, jeśli przełączanie widoków wejdzie (do decyzji) |
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
