# Postęp: klikalny prototyp E01 "Dostęp i logowanie" (ćwiczenie 2b, lekcja 7)

Prompt i plan etapu 0 są poza repozytorium (scratchpad sesji); najważniejsze decyzje właściciela są poniżej. Kontynuacja w nowej sesji: przeczytaj ten plik, `README.md`, mapę `.ai/specs/design/2026-11-24-mapa-ekranow-e01.md` i zacznij od następnego etapu.

## Etapy

- [x] Etap 0: plan (zatwierdzony przez właściciela wg rekomendacji).
- [x] Etap 1: szkielet i ścieżka bez błędów (s01 -> s02 -> s03 -> wylogowanie).
- [ ] Etap 2: wszystkie stany z mapy, konta demo z przełączaniem, bramki, scenariusze (błędy logowania, blokada, brak sieci, 500, sesja wygasła, lista: ładowanie/pusta/błąd, długa nazwa, dwa konta wspólne, dwie sesje obok siebie na s02, wskaźnik żądania konta po id).
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

## Znane ograniczenia i pułapki

- Przycisk "Back" silnika po bramce może krążyć między s01 a s02 (silnik zapisuje historię i nie wolno go edytować).
- Wszystkie ekrany są zawsze zamontowane; w widoku stosu (bez prezentacji) jest kilka `h1` (N2).
- Dane komentarzy żyją w `localStorage` per origin: używaj zawsze `http://localhost:5180`.

## Luki DS (z mapy i nowe)

LDS1/LDS2 (pasek sesji lokalny: `SessionShell`), LDS4 (500, etap 2), LDS6 (ciemny motyw bez wartości: przełącznik działa, wygląd taki sam), N1 (dwie sesje obok siebie, etap 2), N2 (`AppShell` zakłada pełną stronę: nadpisano `min-height` przez CSS), N3 (brak kontrolek paska przeglądu w DS: klasy `.btn`, `.segmented`, `.toast` w `src/chrome.css`; brak tokenu ostrzeżenia dla `--status-warning-*` w moście).
