# Generate schema migrations against a throwaway database, not with the blank script

Date: 2026-11-24

**Symptom:** the `migration:create` script in `packages/db` always passes `--blank`, so it produces an empty migration instead of the schema diff of new entities.

**Cause:** the script was written for the empty initial migration. A diff needs a database that is at the current migrated state, and the CLI compares the entity metadata with it and also refreshes `.snapshot-aitl.json`.

**Lesson:**
- Start a disposable Postgres container, run `migration:up`, then call the CLI directly with `migration:create --name <slug>` and `DATABASE_URL` pointing at it; commit the migration together with the updated snapshot.
- Read the generated `down`: it must drop foreign keys before tables and match the `up`; `defineEntity` `checks`, `uniques` with `where` and `deleteRule` all appear in the diff, so verify them in the output.
- Entity ids have no database default, so integration tests that insert raw rows must pass an explicit UUID.
