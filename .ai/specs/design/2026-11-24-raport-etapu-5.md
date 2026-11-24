# Raport etapu 5: sprawdzenie systemu projektowego

Data: 2026-11-24. Zakres: `packages/ui` (Storybook, komponenty, tokeny, dokumentacja). Wszystkie wyniki poniżej pochodzą z poleceń uruchomionych w tej sesji na gałęzi `feature/design-system-verification` (po poprawce opisanej w pkt 4).

## 1. Co zbudowano (liczby)

| Wielkość | Wartość | Źródło |
|---|---|---|
| Strony dokumentacji (MDX) | 50: System projektowy 11, Fundamenty 6, Elementy bazowe 17, Elementy produktu 8, Wzorce 4, Ekrany 4 | `storybook-static/index.json`, wpisy typu `docs` |
| Komponenty | 26: 18 bazowych (`Alert`, `Badge`, `Button`, `Card`, `Checkbox`, `ConfirmDialog`, `Dialog`, `EmptyState`, `ErrorState`, `Field`, `Input`, `Label`, `Menu`, `RadioGroup`, `Select`, `Skeleton`, `TextLink`, `Toast`) i 8 produktu (`LoginForm`, `BankAccountList`, `AccountRemainderCard`, `EntryForm`, `EntryTable`, `SeriesActions`, `AppShell`, `MonthSwitcher`) | `src/components/**` |
| Stories | 611 (Fundamenty 16, Elementy bazowe 296, Elementy produktu 169, Wzorce 71, Ekrany 59) | `index.json`, wpisy typu `story` |
| Stories z testem interakcji (`play`) | 358 (tag `play-fn`) | `index.json` |
| Testy jednostkowe (jsdom) | 560 w 55 plikach | `npm run test:coverage` |
| Testy Storybooka (przeglądarka, Chromium) | 611 w 38 plikach | `npm run test:storybook` |

## 2. Co sprawdzono (dowody)

| Sprawdzenie | Wynik |
|---|---|
| `npm run typecheck` | bez błędów |
| `npm run lint` | bez uwag |
| `npm run test:coverage` | 560 testów zielonych; Statements 100% (706/706), Branches 100% (502/502), Functions 100% (205/205), Lines 100% (688/688) |
| `npm run build-storybook` | "Storybook build completed successfully" |
| `npm run test:storybook` (z `a11y: { test: 'error' }` w `preview.ts`) | 611/611 zielonych = zero naruszeń axe we wszystkich stories; stories nie mają wyjątków `a11y` (grep po `src` i `.storybook`) |
| Dowód, że a11y rzeczywiście blokuje | tymczasowa story z `<img>` bez `alt` padła na "image-alt" (611 zielonych + 1 czerwona); story usunięta |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities |
| `npm run check:tokens` | "no values outside tokens" |
| Niezależna kontrola grepem z kursu (ścieżki `packages/app/src`, `packages/ui/src/components`, bez testów i stories) | 0 trafień; dodatkowo brak literałów `NNpx` w kodzie komponentów |

### check:tokens: zakres i granice

Skrypt (`packages/ui/scripts/check-tokens.ts`, reguły w `src/check-tokens/rules.ts`) skanuje `packages/ui/src`, `packages/ui/.storybook` i `packages/app/src` (z pominięciem `tokens.css`), wypisuje plik i linię i kończy się błędem. Łapie: kolory hex, funkcje koloru (`rgb`, `hsl`, `oklch` i pokrewne), klasy domyślnej palety Tailwinda, arbitralne wartości Tailwinda spoza `var(--…)`. Wynik: brak naruszeń, brak wyjątków do opisania. Granice: nie łapie pikseli w zwykłym CSS (`padding: 13px`) ani liczb w stylach inline; kontrola grepem na literały `px` w komponentach nic nie znalazła, ale to kontrola jednorazowa. Job CI "Check tokens" już istnieje i jest wymagany.

## 3. Weryfikacja w przeglądarce (Chrome, lokalny build Storybooka)

Metoda: każda story z grup "Ekrany" i "Wzorce" (114, bez wariantów "tablet", "narrow" i "focus-order", które same wymuszają szerokość) załadowana w `iframe` o szerokości 320, 768 i 1440 px, w motywie jasnym i ciemnym; mierzone `documentElement.scrollWidth` względem szerokości okna.

| Szerokość | Motyw jasny | Motyw ciemny |
|---|---|---|
| 320 px | 113 z 114 bez przepełnienia; 1 wyjątek: wzorzec "Przegląd miesiąca per konto", story "long-account-names" (336 px) | jak jasny |
| 768 px | 114 z 114 bez przepełnienia | 114 z 114 |
| 1440 px | 114 z 114 bez przepełnienia | 114 z 114 |

- Wyjątek 336 px: wyjaśniony. Przyczyną jest sama przystawka testowa story (stały kontener `w-80`, czyli 320 px, plus margines strony 8 px z każdej strony), a nie komponent; inne stories z kartami przy 320 px są czyste, a zrzut ekranu E02 przy 320 px wyglądał poprawnie. Do wyprostowania w stories jako drobna uwaga (propozycja nr 3).
- Ciemny motyw: zgodnie z decyzją właściciela z 2026-11-17 (luka L3) to tylko struktura, czyli `data-theme="dark"` ustawia się poprawnie (potwierdzone w `document.documentElement.dataset.theme`), ale wartości są jasne: okno dialogowe w motywie ciemnym ma `rgb(255, 255, 255)`. Z tego wynika, że ten przebieg sprawdza tylko, że przełączenie nie psuje układu; NIE sprawdza wyglądu ani kontrastu w ciemnym motywie. Kryterium kursu "oba motywy działają także w dialogach i menu" jest spełnione tylko strukturalnie.
- Klawiatura i nakładki (ręcznie, klawiszami w przeglądarce, okno min. 500 px):
  - `Dialog`: otwarcie klawiszem Enter, fokus trafia na pole w oknie, sześć kolejnych Tab zostaje w oknie (fokus na "Zapisz kwotę", obrys 2 px), Escape zamyka i oddaje fokus na przycisk, który okno otworzył. Sprawdzone w motywie ciemnym.
  - `Menu`: Enter otwiera, strzałki przesuwają po pozycjach ("Zmień kwotę od miesiąca" po dwóch strzałkach), Escape zamyka i oddaje fokus na przycisk menu.
  - `Toast`: Enter na przycisku pokazuje potwierdzenie jako `role="status"` z `aria-live="polite"`, fokus zostaje na przycisku (toast nie kradnie fokusu); przycisk "Zamknij" widoczny.
- Poprawka wykryta tą metodą: patrz pkt 4.

### Czego NIE sprawdzono

- Wyglądu ani kontrastu w ciemnym motywie (brak wartości, L3).
- `Select` w przeglądarce: to natywny `<select>`, jego lista jest elementem systemu operacyjnego, którego nie dało się obejrzeć ani obsłużyć przez automatyzację; zachowanie pokrywają testy `play` w Storybooku (zielone), ale nie obejrzałem go ręcznie.
- Prawdziwego okna 320 px: najmniejsze okno przeglądarki w tym środowisku miało 500 px, więc 320 i 768 px sprawdzono w `iframe` o tej szerokości (zapytania `@media` i kontenerowe działają tak samo, ale nie sprawdzono dotykowych rozmiarów celów na urządzeniu).
- Klawiatury poza trzema nakładkami (Dialog, Menu, Toast); kolejność fokusu na ekranach pełnych pokrywają stories "focus-order" i ich testy `play`, nie przechodziłem ich ręcznie.
- Wzrokowej oceny większości stories (przegląd zrzutów ograniczył się do jednego ekranu E02 przy 320 px); sprawdzono pomiarem przepełnienia i axe, nie okiem.
- Czytników ekranu, trybu wysokiego kontrastu, powiększenia tekstu 200%, `prefers-reduced-motion`, Firefoxa i Safari.
- Jobów CI w zakładce Checks: wynik po wypchnięciu gałęzi jest w zgłoszeniu PR-a.
- Stron `packages/app` (nie zbudowane, decyzja z PR T).

## 4. Znaleziona i naprawiona usterka

Przy 320 px strona z `EntryTable` przewijała się poziomo (`scrollWidth` 567 przy oknie 320). Przyczyna: ukryte teksty `sr-only` (pozycjonowane absolutnie) w kontenerze z `overflow-x-auto`, który nie był pozycjonowany, więc nie przycinał ich. Poprawka: `relative` na kontenerze w `entry-table.tsx`. Test regresyjny: story "Wąski ekran (320 px)" sprawdza, że `offsetParent` ukrytych tekstów to kontener (pada bez poprawki: potwierdzone, "1 failed", przechodzi z poprawką) oraz asercja klasy w teście jednostkowym. Po poprawce sweep: zero przepełnień poza opisanym wyjątkiem harnessu. Lekcja: `.ai/lessons/2026-11-24-sr-only-in-a-scroll-region-needs-a-positioned-container.md`. Wcześniejsze testy Storybooka i axe tego nie łapały, bo działają w szerokim oknie.

## 5. Test agentem (przygotowany, niewykonany)

Ekran: "Prognoza na kolejne miesiące" (E04, zaparkowany, bez historii). Wszystkie historie E01-E03 mają już ekrany, więc nowy ekran musi pochodzić z E04 albo spoza backlogu. Opis zadania i kryteria oceny (REGUŁA / PRZYKŁAD / ZGADUJĘ): `.ai/specs/design/2026-11-24-test-agentem-prognoza.md`, skrót w `packages/ui/POSTEP.md`. Uczciwe zastrzeżenie: E04 nie ma specyfikacji, więc część zgadnięć będzie produktowa, a nie systemowa; alternatywa spec-owa (strona odmowy dostępu 403) opisana w pliku. Test trzeba puścić w nowej sesji.

## 6. Kryteria "design system gotowy" (kurs) a stan

| Kryterium | Stan |
|---|---|
| Każdy komponent ze stroną 13 sekcji i macierzą stanów | strony istnieją dla wszystkich komponentów (25 stron komponentów bazowych i produktu); zgodność z 13 sekcjami nie była tu liczona od nowa (przyjęta z PR-ów komponentów) |
| Wzorce ze wszystkimi stanami | 4 wzorce, 71 stories |
| Każdy kluczowy ekran ma story i mapę stanów | 4 ekrany, 59 stories, mapy stanów na stronach (PR T) |
| Skrypt nie znajduje wartości spoza tokenów | spełnione (pkt 2) |
| Brak naruszeń a11y albo opisane | spełnione dla stories (611/611); poza stories nie sprawdzano |
| Oba motywy działają także w dialogach i menu | tylko strukturalnie (ciemny = brak wartości, L3) |
| Agent zbudował nowy ekran z dokumentacji, miejsca zgadywania uzupełnione | NIE: test przygotowany, niewykonany |

## 7. Propozycje do decyzji właściciela

1. Wykonać test agentem w nowej sesji na ekranie prognozy, albo wybrać inny (np. 403) i zamienić każde ZGADUJĘ w zasadę lub wpis "Czego brakuje".
2. Ciemny motyw (L3): to jedyna luka blokująca kryterium "oba motywy"; wymaga wartości i przeliczenia kontrastu.
3. Drobna poprawka harnessu: story "long-account-names" wzorca "Przegląd miesiąca per konto" ma stały kontener 320 px plus margines, co daje 336 px; zmniejszyć kontener albo użyć `max-w-full`.
4. Dodać do CI sprawdzenie przepełnienia poziomego przy 320 px (test w przeglądarce z ustawionym viewportem, bo okno testowe jest szerokie); dziś wykrywa to tylko ręczny sweep jak w tym raporcie.
5. Rozszerzyć `check:tokens` o piksele w zwykłym CSS i stylach inline, jeśli w `packages/app` pojawią się takie style.

## 8. Braki

Ciemny motyw (L3), marka (L4), zestaw ikon poza wymaganymi (L5), brak zrzutów referencyjnych (L6), `Textarea`, `Tabs`, `Tooltip`, `Popover`, `Avatar` (świadomie niezbudowane), pole daty, ogólna tabela danych, wykres (nie ma i nie ma jeszcze ekranu, który go wymaga). Prawdziwe strony w `packages/app` nie istnieją (decyzja: po etapie 5). Pełna lista: strona "Czego brakuje" w Storybooku.

## 9. Decyzja przyjęta w tym PR-ze

Aktualizacja `docs/design-system.md` przy zmianach w `packages/ui` jest wymagana: dopisana do listy "Przed prośbą o review" w `AGENTS.md` (repozytorium nie ma `.github/pull_request_template.md`).
