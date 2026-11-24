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

## Co jest w etapie 1

Ścieżka bez błędów: s01 Logowanie -> s02 Lista kont -> s03 atrapa ekranu konta (poza E01) -> wylogowanie. Pasek przeglądu: wybór ekranu, "Kto się loguje", reset symulacji, motyw, tryb komentarzy, mapa ekranów, prezentacja, Back.

## Ograniczenia symulacji (stan po etapie 1)

- Hasło nie jest sprawdzane ani zapisywane; wynik logowania i zalogowane konto wybiera kontrolka na pasku, nie wpisane dane.
- "Teraz" jest stałe: 2026-11-24, 10:00 (Europe/Warsaw). Dane są fikcyjne i oznaczone "(przykład)".
- Błędy, stany ładowania, blokada, wygasanie sesji i dwie sesje naraz: etap 2.
- Ciemny motyw nie ma jeszcze wartości w design systemie (L3): przełącznik działa, wygląd bez zmian.
- Silnik przeglądu (`engine/`) pochodzi z lekcji 7 i nie jest edytowany (poza `mostek.css` i `comments.js`); komentarze zespołu trafiają do repozytorium przez "Export for repository" i commit `engine/comments.js`.
