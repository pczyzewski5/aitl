# Tailwind 4 in the Next app needs the PostCSS plugin and an explicit @source for the workspace UI package

## Co się stało
Podłączenie stylów `@aitl/ui` do `packages/app` (krok 2.6b). Storybook używa `@tailwindcss/vite`, a Next potrzebuje `@tailwindcss/postcss` i `postcss.config.mjs`.

## Przyczyna
Tailwind 4 skanuje źródła od katalogu projektu (`packages/app`), więc klasy użyte w komponentach `packages/ui` nie trafiają do CSS, jeśli nie dodamy `@source`.

## Wniosek
W `packages/app/src/app/globals.css` importuj `@aitl/ui/src/styles.css` (pakiet nie ma pola `exports`, więc działa ścieżka do pliku) i dodaj `@source '../../../ui/src'`. Weryfikuj zbudowany CSS (np. obecność `.bg-primary` i `--raw-blue-600`), co pilnuje test integracyjny w `tests/integration/app.test.ts`.
