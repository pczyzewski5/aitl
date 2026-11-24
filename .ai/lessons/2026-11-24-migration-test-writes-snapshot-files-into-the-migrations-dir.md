# The migrations integration test leaves `.snapshot-migrations_<hash>.json` in `packages/db/migrations`

Data: 2026-11-24

## Co się stało

Po `npm run test:integration` w `git status` pojawił się nowy plik `packages/db/migrations/.snapshot-migrations_<hash>.json`. Jeden taki plik (`.snapshot-migrations_2b46dfa620218d4a3accdf3c6b358aee.json`) jest już wersjonowany w stosie PR-ów, czyli trafił tam przypadkiem.

## Przyczyna

`tests/integration/migrations.test.ts` działa na własnej bazie `migrations_<losowa>`, a MikroORM nazywa plik snapshotu po nazwie bazy, więc każdy przebieg tworzy nowy plik obok migracji.

## Wniosek

Przed `git add` sprawdzaj `git status` po integracjach i usuwaj nowe pliki `.snapshot-migrations_*.json`; dodawaj ścieżki jawnie, nie `git add -A`. Do rozważenia (decyzja właściciela): wpis w `.gitignore` dla `packages/db/migrations/.snapshot-migrations_*.json` i usunięcie wersjonowanego pliku w osobnym PR-ze.
