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

## Co jest w prototypie (etapy 1-2)

Ścieżka: s01 Logowanie -> s02 Lista kont -> s03 atrapa ekranu konta (poza E01) -> wylogowanie. Pasek przeglądu: wybór ekranu, reset symulacji, motyw, tryb komentarzy, mapa ekranów, prezentacja, Back.

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

## Ograniczenia symulacji (stan po etapie 2)

- Hasło nie jest sprawdzane ani zapisywane; wynik logowania i zalogowane konto wybierają kontrolki panelu scenariuszy, nie wpisane dane.
- "Teraz" jest stałe: 2026-11-24, 10:00 (Europe/Warsaw). Dane są fikcyjne i oznaczone "(przykład)".
- Stany błędów, blokada, wygasanie sesji, lista i dwie sesje naraz są symulowane kontrolkami panelu scenariuszy; nic nie jest wysyłane do żadnej usługi.
- Ciemny motyw nie ma jeszcze wartości w design systemie (L3): przełącznik działa, wygląd bez zmian.
- Silnik przeglądu (`engine/`) pochodzi z lekcji 7 i nie jest edytowany (poza `mostek.css` i `comments.js`); komentarze zespołu trafiają do repozytorium przez "Export for repository" i commit `engine/comments.js`.
