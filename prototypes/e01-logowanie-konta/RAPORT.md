# Raport końcowy: klikalny prototyp E01 "Dostęp i logowanie" (ćwiczenie 2b, lekcja 7)

Data: 2026-11-24. Stan: prototyp ukończony (etapy 0-3). Uruchomienie i scenariusze: `README.md`, historia prac: `POSTEP.md`.

## 1. Co zbudowano

- Klikalny prototyp przepływu z mapy ekranów (`.ai/specs/design/2026-11-24-mapa-ekranow-e01.md`) z komponentów i tokenów `@aitl/ui`: s01 Logowanie, s02 Lista kont, s03 atrapa ekranu konta (poza E01). ID ekranów bez zmian.
- Silnik przeglądu: komentarze, mapa ekranów, prezentacja, Back, eksport (`engine/`, `prototypeId` = `e01-logowanie-konta`).
- Wszystkie stany z mapy osiągalne kliknięciem lub kontrolką scenariusza: błędy logowania (złe hasło, nieznany e-mail, blokada po 5. próbie, brak sieci, 500), wygaśnięcie sesji (30 i 90 dni), lista (wczytana, ładowanie, pusta, błąd z ponowieniem), długa nazwa, dwa konta wspólne, dwie sesje obok siebie, wskaźnik żądania konta po id (200/403/401), trzy konta demo, bramki dostępu.
- Etap 3: notatki przy każdym ekranie (historie, symulacja, czego nie rozstrzyga), panel scenariuszy zwinięty w `<details>`, README z sekcją "Ograniczenia symulacji", 45 testów (14 nowych: nawigacja i bramki), poprawka zawijania paska silnika przy 320 px, usunięcie surowego tokenu `--space-1` z `chrome.css`.

## 2. Co sprawdzono (z dowodami)

Narzędzia: Chrome (rozszerzenie), strona `http://localhost:5180/` (Vite dev), skrypty JS w stronie oraz prawdziwe klawisze i kliknięcia.

| Obszar | Wynik |
|---|---|
| `tsc`, `vitest` (45 testów), lint, build, `check:tokens` repozytorium | zielone, wyniki w opisie PR |
| Skan tokenów `prototypes/e01-logowanie-konta/src` (logika `runCheckTokens`, skrypt tymczasowy poza repo) | 0 naruszeń; `--space-1` zamieniono na `--space-label-field`; `calc(var(--space-12) * N)` w szerokościach (siatka scenariuszy, maks. szerokość notatki) zostaje: to token skali, nie surowa wartość |
| 1440 px | `scrollWidth` = 1440 (bez przewijania poziomego), dwie ramki sesji obok siebie, zrzut ekranu |
| 320 px (iframe, bo okno Chrome nie schodzi poniżej około 500 px) | przed poprawką `scrollWidth` 491 (pasek silnika `.proto-toolbar`), po poprawce 320; bez przewijania poziomego także z otwartym panelem, widokiem stosu, listą w czterech stanach, długą nazwą, dwoma kontami wspólnymi i dwiema sesjami |
| 768 px (iframe) | `scrollWidth` = 768 na s01 |
| Jasny / ciemny motyw | przełącznik ustawia `data-theme` (light/dark), `aria-pressed` i etykietę; wygląd ciemnego jest taki sam jak jasnego (LDS6), więc sprawdzono wyłącznie strukturę, nie kontrast |
| Klawiatura (s01) | kolejność Tab: pasek (s01, s02, s03, Resetuj, Clickable, Comment, Show hotspots, Presentation, Threads, Hide pins, Motyw) -> summary panelu scenariuszy -> e-mail -> hasło -> "Zaloguj się"; Enter na summary rozwija panel; wpisanie danych klawiaturą i Enter loguje i przechodzi na s02 |
| Logowanie, każdy wynik | złe hasło, nieznany e-mail (ten sam tekst), blokada, brak sieci, 500: komunikat zgodny, fokus na polu e-mail; 4. próba = "4 z 5", 5. = blokada; blokada trzyma po przełączeniu na "Poprawne dane"; Reset zeruje licznik i wraca na s01 |
| Konta demo | Paweł: wspólne + osobiste; Żona: tylko wspólne; Gość: stan pusty; wylogowanie wraca na s01 z czystym formularzem |
| s03 i powrót | klik konta -> s03 z nazwą konta; "Wróć do listy kont" -> s02 |
| Wygaśnięcie sesji | 30 i 90 dni: s01 bez komunikatu, linia statusu pokazuje przyczynę |
| Wskaźnik żądania konta po id | 200 (własne), 403 (cudze), 401 (bez sesji): teksty z kryteriami |
| Przyciski silnika | Clickable, Comment, Show hotspots, Threads, Hide pins, Presentation: klasy `body` przełączają się poprawnie |
| Tryb komentarzy z panelem | komentarz przypięty do nagłówka "Logowanie" przy otwartym panelu wątków, plakietka licznika przy s01 |
| "Export Markdown" i "Export for repository" | wywołane z przechwyceniem pobrania (żaden plik nie trafił na dysk): `prototype-feedback.md` pogrupowany po ekranie, `comments.js` z `prototypeId` = `e01-logowanie-konta` |
| Widok stosu (bez prezentacji) | wszystkie trzy ekrany i notatki widoczne, bez przewijania poziomego |
| Sprzątanie | `localStorage` originu 5180 wyczyszczony, zakładki zamknięte, serwer zatrzymany |

Zrzuty ekranu są poza repozytorium (katalog tymczasowy Chrome: `/var/folders/zk/bffvljgd06q5x20m58956sjm0000gn/T/claude-chrome-screenshots-1JFlHe/`).

## 3. Czego nie sprawdzono

- Wygląd w ciemnym motywie (brak wartości w DS) i kontrast.
- Klawisza Escape (kompozytor komentarza, zamykanie paneli), kolejności fokusu klawiaturą na s02 i s03 oraz Shift+Tab. Przyciski s02 sprawdzono tylko skryptowo.
- Usuwania komentarza ("Delete"): natywne okno `confirm()` zawiesiło automatyczną kartę, więc nie zweryfikowano go w przeglądarce; komentarz usunięto czyszcząc `localStorage`.
- Przycisku "Back" silnika, "Re-anchor", odpowiedzi w wątkach, "Resolve", mapy ekranów silnika.
- Wersji zbudowanej (`vite build` + `preview`) w przeglądarce: sprawdzano tryb deweloperski (build przechodzi).
- Czytnika ekranu, innych przeglądarek (tylko Chrome), urządzeń dotykowych, prawdziwego okna 320 px (użyto iframe).
- Przenoszenia fokusu po zmianie ekranu: po zalogowaniu `activeElement` to `body`; to obserwacja, nie ocena zgodności z WCAG.
- Pierwszy element po przycisku "Zaloguj się" w kolejności Tab to pusty `div` bez klasy i rozmiaru, którego nie zidentyfikowano (prawdopodobnie element pomocniczy przeglądarki lub silnika).

## 4. Luki w systemie projektowym (etapy 1-3)

| Nr | Luka | Obejście w prototypie |
|---|---|---|
| LDS1 | wylogowanie to akcja (POST), a DS ma tylko `TextLink` | lokalny przycisk wyglądający jak link (`SessionShell`) |
| LDS2 | brak miejsca na `displayName` w `AppShell` | lokalny pasek sesji |
| LDS3 | brak wzorca "brak dostępu" (403/404) | pominięte, wskaźnik tekstowy w panelu; potrzebne od E02/E03 |
| LDS4 | brak komunikatu błędu 500 w `LoginForm` | tekst z szarego prototypu przez nadpisanie komunikatu sieci (założenie A-P1) |
| LDS5 | blokada ze stałym czasem, bez odliczania i bez stanu przycisku | stałe 900 s |
| LDS6 | ciemny motyw bez wartości | przełącznik zmienia tylko atrybut |
| LDS7 | brak marki i ikon | sam tekst "AITL", bez ikon |
| LDS8 | brak komunikatu "sesja wygasła" | zwykłe s01 (P4) |
| N1 | brak wzorca dwóch ramek obok siebie | siatka z tokenów w `home-screen.tsx` |
| N2 | `AppShell` zakłada pełną stronę (`min-height`), kilka `h1` w widoku stosu | nadpisanie CSS, `headingLevel` |
| N3 | brak kontrolek paska przeglądu i tokenu ostrzeżenia w moście | klasy `.btn`, `.segmented`, `.toast` w `chrome.css` |
| N4 (nowa) | brak tokenów punktów przerwania; sticky pasek przeglądu zajmuje dużą część ekranu przy 320 px | zostawione, opisane w README |
| N5 (nowa) | brak komponentu zwijanego panelu (Collapsible) w DS | natywny `<details>` ostylowany tokenami |
| N6 (nowa) | kontrolki scenariuszy (`Select`) wymagają własnej etykiety obok | lokalny `ScenarioSelect` |

## 5. Pytania do specyfikacji z budowy (kandydaci na "decyzje do specyfikacji")

1. Tekst błędu 500 na s01 i na liście (A-P1): przyjąć tekst z prototypu czy ustalić inny? Czy lista (s02) ma osobny komunikat 500, czy wspólny "błąd wczytania"?
2. Czy po błędzie logowania fokus ma wracać na pole e-mail (A-P6), czy na komunikat błędu (spec mówi tylko "fokus na błędzie")?
3. Czy blokada (po 5. próbie) obejmuje też poprawne hasło w trakcie okna blokady? Prototyp tak zakłada do wylogowania lub resetu (A-P2); spec milczy.
4. Dokąd przenosić fokus po zalogowaniu i po wylogowaniu (nagłówek nowego ekranu)? W prototypie fokus ląduje na `body`.
5. Czy "dwie sesje naraz" (S02-K5) mają być testowane w jednej przeglądarce (osobne ciasteczka, dwa profile), czy wystarczy test API? Wpływa na sposób testów E2E.
6. Czy sesja wygasła ma dostać komunikat (P4), skoro dwie osoby na jednym urządzeniu nie odróżnią wygaśnięcia od wylogowania?
7. Co po wygaśnięciu sesji w trakcie wypełniania formularza (E02): czy dane zostają? Poza E01, ale wyszło przy bramkach.
8. Czy lista kont (P8) po E03 zostaje osobnym widokiem, skoro ekran konta i lista dzielą adres `/`?
9. Wielkość liter w e-mailu (Q8/P3): prototyp nie sprawdza danych, więc decyzja nadal należy do specyfikacji.
10. Czy stan pusty ("Nie masz jeszcze żadnego konta") ma wskazywać, do kogo się zwrócić, skoro nie ma rejestracji ani resetu hasła?

## 6. Instrukcja dla właściciela

Przeklikanie (szczegóły w `README.md`):

1. `npm ci`, potem `npx vite --config prototypes/e01-logowanie-konta/vite.config.ts` i otwórz `http://localhost:5180/` (zawsze ten adres).
2. Zaloguj się dowolnym poprawnym e-mailem i hasłem; konto wybiera kontrolka "Kto się loguje" w rozwiniętym panelu scenariuszy.
3. Przejdź: lista kont -> konto -> wróć -> wyloguj. Potem w panelu przełącz wynik logowania na każdy błąd, listę na "pusta" i "błąd", włącz "dwie sesje naraz", wygaś sesję.
4. Wyłącz "Presentation", żeby zobaczyć notatki przy ekranach.

Zadanie domowe: test z prawdziwą osobą i eksport uwag.

1. Usiądź obok osoby (bez podpowiadania), poproś o zalogowanie i znalezienie wspólnego konta; zapisuj, gdzie się zawahała.
2. Osoba lub Ty włącza "Comment", klika element, którego dotyczy uwaga, pisze komentarz i wpisuje imię w polu na dole panelu.
3. Na koniec "Export Markdown": powstaje `prototype-feedback.md` pogrupowany po ekranach (wklej go do zadania lub do rozmowy z Claude'em). Opcjonalnie "Export for repository": podmień `engine/comments.js` i zrób commit przez PR.
4. Komentarze są tylko w przeglądarce, w której je napisano, i tylko dla `http://localhost:5180`. Po zmianie adresu lub przeglądarki ich nie zobaczysz.
5. "Delete" pyta natywnym oknem potwierdzenia i usuwa wątek; używaj świadomie.

## Adnotacja 2026-11-24

Decyzje właściciela z sekcji 5 (kandydaci 1-5, 7 i 10) wprowadzone do specyfikacji w PR #62 jako Q29-Q35 w `.ai/specs/implemented/2026-11-17-auth-and-app-foundation.md`; kandydaci 6, 8 i 9 były już rozstrzygnięte w Q23-Q28. Prototyp zaakceptowany przez właściciela (s01, s02 i atrapa s03).
