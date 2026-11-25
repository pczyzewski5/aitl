# Hook PreToolUse (Bash)

`pre-tool-use.sh` jest podpięty w `.claude/settings.json` i sprawdza każdą komendę, zanim narzędzie Bash ją uruchomi. Czyta JSON ze stdin (`tool_input.command`). Kod wyjścia `2` blokuje wywołanie, a komunikat ze stderr wraca do modelu. Każdy inny niezerowy kod (w tym `1`) NIE blokuje.

## Co blokuje

- `curl ... | sh` i `wget ... | sh` (także `bash`, `zsh`, `sudo`).
- Rekurencyjne `rm`: `-rf`, `-fr`, `-r`, `-R` i inne połączone flagi, oraz `--recursive`.
- Dostęp do `~/.ssh`, `~/.aws`, `$HOME/.ssh`, `$HOME/.aws` (także ścieżki bezwzględne `/Users/<nazwa>/` i `/home/<nazwa>/`).
- Każdy dostęp do plików `.env` oprócz `.env.example` i `.env.template`.
- Brak `jq`: komenda jest blokowana (fail closed), bo nie da się jej sprawdzić.

## Czego NIE łapie

Hook to prosty filtr tekstowy, a nie izolacja systemowa. Da się go obejść, np.:

- `python3 -c "import shutil; shutil.rmtree('x')"`, `find . -delete`, `find . -exec rm -r {} +`, `perl`, `node -e` czyli kasowanie i czytanie plików interpreterem zamiast `rm`/`cat`.
- `awk '{print}' ~/.ssh/id_rsa` jest łapane (ścieżka), ale `cd ~ && cat .ssh/id_rsa` albo ścieżka złożona ze zmiennych (`d=.ss; cat ~/$d"h"/id_rsa`) już nie.
- `curl ... -o x.sh && sh x.sh` albo `bash <(curl ...)` (pobranie i uruchomienie w dwóch krokach).
- Zakodowane komendy (`echo cm0gLXJm | base64 -d | sh`).
- Odczyt `.env` narzędziem Read (to pokrywają reguły `permissions.deny`, a nie ten hook).

Dlatego hook to jedna warstwa obrony, obok reguł `deny` i ochrony `main`.

## Praca z hookiem

- Zwykłe komendy (`npm ci`, `git status`, `git worktree remove`, `rm plik`) przechodzą.
- Czyszczenie katalogów (`rm -rf .next`) jest zablokowane: użyj `git clean -fdx -- <ścieżka>` albo zrób to ręcznie w swoim terminalu.
- Test: `scripts/pre-tool-use-hook.test.ts` (uruchamiany w `npm test`).
