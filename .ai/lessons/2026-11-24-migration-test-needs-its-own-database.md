# The migrations integration test must run on its own database

Co sie stalo: `migrations.test.ts` oczekiwal, ze `migrator.up()` zastosuje cos na wspolnej bazie, a po dodaniu nowych plikow testowych vitest uruchomil go po testach, ktore same migruja ta baze (kolejnosc plikow zalezy od cache czasu i rozmiaru), wiec `applied.length` wyszlo 0.

Przyczyna: wszystkie pliki w `tests/integration/` dziela jedna baze z globalnego setupu, a test migracji zakladal, ze jest pierwszy.

Wniosek: test migracji tworzy wlasna baze (`CREATE DATABASE migrations_<losowy>`) i laczy sie z nia, a pozostale testy moga migrowac wspolna baze bez wplywu na kolejnosc.
