# Klikalny prototyp E01: logowanie i lista kont

Prototyp przepływu z zatwierdzonej mapy ekranów (`.ai/specs/design/2026-11-24-mapa-ekranow-e01.md`), zbudowany z komponentów `@aitl/ui`. Nie jest częścią aplikacji, nie jest w workspace, CI ani w progu pokrycia. Stan prac: `POSTEP.md`.

## Uruchomienie (z korzenia repozytorium, po `npm ci`)

```bash
# tryb deweloperski, http://localhost:5180/
npx vite --config prototypes/e01-logowanie-konta/vite.config.ts

# wersja do przeglądu: build do prototypes/e01-logowanie-konta/dist/ (ignorowane przez git) i podgląd na tym samym porcie
npx vite build --config prototypes/e01-logowanie-konta/vite.config.ts
npx vite preview --config prototypes/e01-logowanie-konta/vite.config.ts

# kontrola ręczna (poza npm test i CI)
npx tsc -p prototypes/e01-logowanie-konta/tsconfig.json
npx vitest run --config prototypes/e01-logowanie-konta/vitest.config.ts
```

Używaj zawsze adresu `http://localhost:5180`: komentarze recenzentów są w `localStorage` danego originu.

## Jak przeklikać (dla właściciela produktu)

1. Otwórz `http://localhost:5180/` (zawsze ten adres, nie `127.0.0.1`). Domyślnie jest tryb prezentacji: jeden ekran naraz.
2. Zaloguj się: wpisz dowolny poprawny adres e-mail i dowolne hasło, "Zaloguj się". Kto zostanie zalogowany, wybiera kontrolka "Kto się loguje" (nie wpisany adres).
3. Na liście kont kliknij konto (atrapa s03), wróć, "Wyloguj".
4. Scenariusze (błędy, blokada, pusta lista, dwie sesje) są w zwiniętym panelu "Scenariusze (symulacja)" pod paskiem przeglądu: rozwiń go i zmieniaj wartości. "Resetuj symulację" przywraca stan początkowy.
5. Komentarze: "Comment", kliknij element, napisz uwagę, wpisz imię w polu na dole panelu. Notatki przy ekranach (historie, symulacje, czego prototyp nie rozstrzyga) widać po wyłączeniu "Presentation".
6. Eksport: "Export Markdown" daje `prototype-feedback.md` (uwagi pogrupowane po ekranach, do wklejenia w zadanie), "Export for repository" daje nowy `engine/comments.js` do commita. Usunięcie komentarza ("Delete") pyta natywnym oknem potwierdzenia.

## Co jest w prototypie

Ścieżka: s01 Logowanie -> s02 Lista kont -> s03 atrapa ekranu konta (poza E01) -> wylogowanie. Pasek przeglądu: wybór ekranu, reset symulacji, motyw, tryb komentarzy, mapa ekranów, prezentacja, Back. Przy każdym ekranie (widoczne bez prezentacji) są trzy notatki: numery historii i kryteriów z mapy, co jest symulacją, czego prototyp nie rozstrzyga.

## Konta demo

Paweł (przykład, właściciel: wspólne i osobiste), Żona (przykład: tylko wspólne), Gość bez kont (przykład: pusta lista). Wybór w "Kto się loguje"; adres e-mail i hasło są dowolne (poprawny format e-maila).

## Scenariusze (panel "Scenariusze (symulacja)")

| Kontrolka | Wartości | Efekt |
|---|---|---|
| Kto się loguje | Paweł / Żona / Gość | kto zostanie zalogowany po poprawnym logowaniu |
| Wynik logowania | poprawne, złe hasło, nieznany e-mail, zbyt wiele prób, brak sieci, 500 | komunikat nad formularzem, wpisane dane zostają, fokus na polu e-mail; 5 nieudanych prób blokuje (900 s, statycznie) |
| Wygaś sesję | 30 dni nieaktywności, 90 dni od logowania | wyloguje i pokaże zwykłe s01, bez komunikatu (P4); aktywne po zalogowaniu |
| Lista kont | wczytane, ładowanie (zatrzymane), pusta, błąd | "Spróbuj ponownie" po 0,6 s wczytuje listę |
| Nazwa konta wspólnego | krótka, bardzo długa | zawijanie na s02 i s03 |
| Liczba kont wspólnych | jedno, dwa | kolejność: wspólne przed osobistymi, potem alfabetycznie |
| Dwie sesje naraz | wyłączone, obok siebie | s02 pokazuje ramki Paweł i Żona z niezależnym wylogowaniem |
| Żądanie konta po id (tylko API) | własne, cudze, bez sesji | wskaźnik tekstowy 200 / 403 / 401, bez ekranu odmowy (P14) |

Bramki: bez sesji s02 i s03 przekierowują na s01; zalogowany na s01 trafia na s02. Założenia do akceptacji: tekst błędu 500 (A-P1, luka DS LDS4), fokus na polu e-mail po błędzie (A-P6), blokada po 5. próbie (A-P2).

## Ograniczenia symulacji

- Hasło nie jest sprawdzane ani zapisywane; wynik logowania i zalogowane konto wybierają kontrolki panelu scenariuszy, nie wpisane dane.
- "Teraz" jest stałe: 2026-11-24, 10:00 (Europe/Warsaw). Dane są fikcyjne i oznaczone "(przykład)".
- Stany błędów, blokada, wygasanie sesji, lista i dwie sesje naraz są symulowane kontrolkami panelu scenariuszy; nic nie jest wysyłane do żadnej usługi.
- Ciemny motyw nie ma jeszcze wartości w design systemie (L3, LDS6): przełącznik ustawia `data-theme="dark"` i zmienia etykietę, wygląd jest taki sam jak jasny. To sprawdza tylko strukturę, nie kontrast.
- Przycisk "Back" silnika po przekierowaniu bramki może krążyć między s01 a s02 (silnik zapisuje historię i nie jest edytowany).
- Po zmianie ekranu (np. po zalogowaniu) fokus nie jest przenoszony na nagłówek nowego ekranu; to zachowanie silnika i prototypu, nie decyzja produktowa.
- Wszystkie ekrany są zawsze zamontowane; bez prezentacji (widok stosu) na stronie jest kilka `h1` (N2). W trybie prezentacji widać jeden ekran.
- Komentarze zapisują się w `localStorage` przeglądarki recenzenta i tylko dla originu `http://localhost:5180`; inny adres lub port to osobny, pusty zbiór. Współpracy na żywo nie ma: każdy recenzent eksportuje swoje uwagi sam. Komentarze przypięte do elementu mogą osierocieć, gdy po zmianie scenariusza element zostanie przemontowany (np. formularz po wylogowaniu); przycisk "Re-anchor" w wątku przypina go ponownie.
- "Dwie sesje naraz" to dwie ramki w jednej karcie przeglądarki, nie dwie realne sesje; linki kont w tym widoku niczego nie otwierają.
- Blokada po 5. nieudanej próbie trzyma się także po przełączeniu wyniku na "Poprawne dane", do wylogowania lub resetu; czas blokady (900 s) jest stały, bez odliczania (LDS5).
- Kontrolki scenariuszy leżą w zwiniętym panelu; linia statusu (kto zalogowany, sesja, próby) jest widoczna dopiero po jego rozwinięciu.
- Przy 320 px sticky pasek przeglądu zajmuje dużą część ekranu (silnik i kontrolki zawijają się w kilka wierszy); sprawdzane w ramce iframe, bo okno Chrome nie schodzi poniżej około 500 px.
- Silnik przeglądu (`engine/`) pochodzi z lekcji 7 i nie jest edytowany (poza `mostek.css` i `comments.js`); komentarze zespołu trafiają do repozytorium przez "Export for repository" i commit `engine/comments.js`.

## Sprawdzenie (etap 3)

Kontrola ręczna, poza CI: `npx tsc -p ...`, `npx vitest run --config ...` (45 testów, w tym nawigacja i bramki) oraz jednorazowy skan tokenów `src/` logiką `check:tokens` (bez naruszeń). Opis przeglądarkowego sprawdzenia i luk: `RAPORT.md`.
