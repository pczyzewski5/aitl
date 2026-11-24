# Postęp: klikalny prototyp E01 "Dostęp i logowanie" (ćwiczenie 2b, lekcja 7)

Prompt i plan etapu 0 są poza repozytorium (scratchpad sesji); najważniejsze decyzje właściciela są poniżej. Kontynuacja w nowej sesji: przeczytaj ten plik, `README.md`, mapę `.ai/specs/design/2026-11-24-mapa-ekranow-e01.md` i zacznij od następnego etapu.

## Etapy

- [x] Etap 0: plan (zatwierdzony przez właściciela wg rekomendacji).
- [x] Etap 1: szkielet i ścieżka bez błędów (s01 -> s02 -> s03 -> wylogowanie).
- [x] Etap 2: wszystkie stany z mapy, konta demo z przełączaniem, bramki, scenariusze (błędy logowania, blokada, brak sieci, 500, sesja wygasła, lista: ładowanie/pusta/błąd, długa nazwa, dwa konta wspólne, dwie sesje obok siebie na s02, wskaźnik żądania konta po id).
- [ ] Etap 3: notatki przy ekranach, README (konta demo, scenariusze, "Ograniczenia symulacji"), rozszerzone testy, sprawdzenie 320/768/1440, ciemny motyw, klawiatura, każda kontrolka; jednorazowy skan tokenów na `src/`.

## Decyzje właściciela (obowiązują)

- Podgląd: osobny Vite na porcie 5180, bez zmian w `.storybook/main.ts` i w systemie projektowym (staticDirs w Storybooku dopiero po osobnej zgodzie).
- Prototyp poza CI i progiem 100%; własne testy i typecheck uruchamiane ręcznie; brak nowych zależności, brak zmian w `packages/*`.
- Katalog `prototypes/e01-logowanie-konta/`; źródło, kopia silnika (`engine/`) i `comments.js` są commitowane, `dist/` nie.
- Jedna linia `ignores` w `eslint.config.mjs` dla `prototypes/*/engine/**` (silnik to ES5 z pustymi `catch`).
- s03 = atrapa ekranu konta, oznaczona jako spoza E01; ID s01/s02 bez zmian.
- Chrome silnika (`engine/mostek.css`, `src/chrome.css`) na tokenach DS, bez cieni.
- Lokalny pasek sesji z `displayName` i przyciskiem wyglądającym jak link (LDS1, LDS2).
- Tekst błędu 500 z szarego prototypu jako założenie (etap 2). Domyślny tryb: prezentacja. "Dwie sesje naraz": dwie ramki obok siebie na s02.

## Etap 1: co zbudowano

- Vite (port 5180) + React 19 + Tailwind 4 z `@aitl/ui`; silnik przeglądu podłączony (komentarze, mapa ekranów, prezentacja, Back; `prototypeId` = `e01-logowanie-konta`); `mostek.css` dopasowany do tokenów.
- Pasek przeglądu: plakietka "Prototyp", wybór ekranu, "Kto się loguje (symulacja)" (Paweł / Żona / Gość bez kont), "Resetuj symulację", przełącznik motywu, baner "symulacja" ze stałym "teraz" 2026-11-24 10:00.
- Ścieżka: s01 (`LoginForm`, 0,7 s "Logowanie…", dowolny poprawny e-mail i hasło) -> s02 (`BankAccountList`, wspólne przed osobistymi) -> klik konta -> s03 -> "Wróć do listy kont" -> "Wyloguj" -> s01.
- Bramki (P5): bez sesji s02/s03 przekierowują na s01; zalogowany na s01 trafia na s02. Bramka przechwytuje kliknięcia w linki i pasek (przed silnikiem) oraz zmianę ekranu (hash, Back).
- Testy: `src/navigation.test.tsx` (4 testy). Sprawdzono typecheck, build, testy, lint, `check:tokens` i ręczne przejście w Chrome (patrz opis PR).

## Etap 2: co zbudowano

- Panel "Scenariusze (symulacja)" (osobno od nawigacji produktu, pod paskiem przeglądu): kto się loguje, wynik logowania (poprawne / złe hasło / nieznany e-mail / blokada / brak sieci / 500), lista kont (wczytane / ładowanie zatrzymane / pusta / błąd), nazwa konta (krótka / bardzo długa), liczba kont wspólnych (1 / 2), dwie sesje naraz, wygaszanie sesji (30 dni nieaktywności / 90 dni od logowania), żądanie konta po id (własne 200 / cudze 403 / bez sesji 401, tylko wskaźnik tekstowy), linia statusu (zalogowany, sesja, próby 0 z 5).
- Logika: `store.ts` (stan scenariuszy, `attemptLogin`), `api-probe.ts`, `account-list-view.tsx` (lista dla s02 i dla ramek), `fixtures.ts` (`accountsOf`). Blokada: 5. nieudana próba zwraca blokadę, kolejne próby też (nawet z poprawnymi danymi) do wylogowania lub Resetu; wynik "Zbyt wiele prób" zwraca blokadę wprost, bez licznika. Czas statyczny 900 s (LDS5).
- Błąd logowania przenosi fokus na pole e-mail (ZAŁOŻENIE A-P6 z szarego prototypu, `LoginForm` tego nie robi); tekst 500 to ZAŁOŻENIE A-P1 (LDS4), wstawiony jako komunikat "brak sieci".
- Wygaśnięcie sesji i wylogowanie: zwykłe s01 bez komunikatu (P4). Bramki bez zmian (+ s02 dostępne bez sesji tylko w widoku dwóch sesji).
- "Dwie sesje naraz": dwie ramki obok siebie na s02 (Paweł, Żona), niezależne wylogowania; linki kont w tym widoku prowadzą w to samo miejsce (opisane na ekranie).
- "Ponów" na liście kończy się powodzeniem po 0,6 s (scenariusz wraca na "wczytane", jak w szarym prototypie).
- Testy: `src/states.test.tsx` (27 testów) + 4 z etapu 1.

## Do zrobienia w etapie 3

Notatki przy ekranach (historie, symulacje, czego nie rozstrzyga), README z kontami demo i "Ograniczenia symulacji" (częściowo już jest), sprawdzenie 320/768/1440 (panel scenariuszy nie był oglądany w wąskim oknie), ciemny motyw, klawiatura, każda kontrolka, skan tokenów na `src/`. Nie sprawdzono jeszcze: widok stosu bez prezentacji, tryb komentarzy z panelem scenariuszy.

## Znane ograniczenia i pułapki

- Przycisk "Back" silnika po bramce może krążyć między s01 a s02 (silnik zapisuje historię i nie wolno go edytować).
- Wszystkie ekrany są zawsze zamontowane; w widoku stosu (bez prezentacji) jest kilka `h1` (N2).
- Dane komentarzy żyją w `localStorage` per origin: używaj zawsze `http://localhost:5180`.

## Luki DS (z mapy i nowe)

LDS1/LDS2 (pasek sesji lokalny: `SessionShell`), LDS4 (500: tekst z szarego prototypu przez nadpisanie komunikatu sieci, założenie), LDS6 (ciemny motyw bez wartości: przełącznik działa, wygląd taki sam), N1 (dwie sesje obok siebie: siatka z tokenów w `home-screen.tsx`), N2 (`AppShell` zakłada pełną stronę: nadpisano `min-height` przez CSS), N3 (brak kontrolek paska przeglądu w DS: klasy `.btn`, `.segmented`, `.toast` w `src/chrome.css`; brak tokenu ostrzeżenia dla `--status-warning-*` w moście).
