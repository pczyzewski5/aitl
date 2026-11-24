# `.claude/` is ignored by the owner's global gitignore

Co się stało: `git add .claude/settings.json` odmówił ("paths are ignored"), choć `.gitignore` repozytorium nie wspomina `.claude`. Regułę `.claude/` ma globalny `~/.gitignore_global`.

Przyczyna: globalna reguła działa na każde repozytorium właściciela, a w AITL `.claude/` ma teraz śledzone pliki (`settings.json`, `hooks/`). Lokalne `.claude/skills` i `.claude/worktrees` pozostają nieśledzone.

Wniosek: dodawaj te pliki z `git add -f <konkretna ścieżka>`, nigdy `git add -f .claude`, żeby nie wciągnąć skilli ani worktrees. Nowy plik w `.claude/` sprawdzaj w `git status` po dodaniu.
