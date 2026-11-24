# Next reads `.env` from `packages/app`, and `loadEnvConfig` returns the first result unless it is forced

Co sie stalo: `.env` w korzeniu monorepo (do ktorego odsylaja README i `npm run setup`) nie byl widoczny w aplikacji, bo Next czyta pliki env z katalogu projektu `packages/app`. Wywolanie `loadEnvConfig(<korzen>)` z `@next/env` w `next.config.ts` bez czwartego argumentu nic nie zmienia, bo Next wola je wczesniej dla `packages/app` i kolejne wywolanie zwraca wynik z pamieci podrecznej.

Przyczyna: `loadEnvConfig(dir, dev, log, forceReload)` zapamietuje wynik pierwszego wywolania; bez `forceReload = true` drugi katalog jest ignorowany. Zmienne z procesu (takze ustawione na pusty ciag) maja pierwszenstwo przed plikiem, wiec test "zmienna niezdefiniowana" przez `delete process.env.X` przestaje dzialac, gdy w korzeniu jest prawdziwy `.env` (uzywaj `X: ''`).

Wniosek: `next.config.ts` wywoluje `loadEnvConfig(REPOSITORY_ROOT, dev, console, true)` (Q39); test `tests/integration/env-loading.test.ts` zapisuje tymczasowy korzeniowy `.env` i uruchamia aplikacje bez tych zmiennych w procesie. Vitest ustawia `NODE_ENV=test` i potomny `next start` to dziedziczy, wiec test domyslnej flagi `secure` w produkcji musi jawnie ustawic `NODE_ENV=production`.
