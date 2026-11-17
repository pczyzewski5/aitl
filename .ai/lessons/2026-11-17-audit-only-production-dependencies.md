# The dependency audit gate must cover production dependencies only

## Co się stało
Po merge'u PR-a na `main` job Lint padł na kroku `npm audit --audit-level=high`. Dnia 2026-11-17 opublikowano podatność GHSA-fc5q-39xc-vjpf (ReDoS w `picomatch`, severity high) dla wszystkich wersji, także najnowszej, więc nie było wersji naprawczej. `picomatch` wchodzi tylko przez narzędzia deweloperskie (Vitest, Vite). Wymagany check Lint zablokował wszystkie nowe PR-y.

## Przyczyna
Pełny audyt (z zależnościami deweloperskimi) oblewa przy każdej nowej podatności w narzędziach, na które nie ma wpływu ani poprawki, a które nie trafiają do działającej aplikacji. Lokalnie audyt przechodził przy wprowadzaniu bramki, więc problem pojawił się dopiero z nową publikacją advisory.

## Wniosek
Bramka audytu obejmuje tylko zależności produkcyjne: `npm audit --omit=dev --audit-level=high`. Podatności w narzędziach deweloperskich sprawdzamy ręcznie przy aktualizacji zależności i nie blokują merge'a. Nie używaj `npm audit fix --force`, bo proponuje obniżenie wersji narzędzi (np. Vitest) zamiast prawdziwej poprawki.
