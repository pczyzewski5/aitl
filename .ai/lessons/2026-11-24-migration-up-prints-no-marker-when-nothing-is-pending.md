# MikroORM migration:up prints no "nothing pending" message

Date: 2026-11-24

**Symptom:** the setup installer reported the migrations step as `done` on the second run, although nothing was applied.

**Cause:** the installer looked for a "No pending migrations" text. MikroORM 7 prints only `Successfully migrated up to the latest version` when the database is current, and adds one `Applied '<name>'` line per applied migration.

**Lesson:**
- Detect applied migrations by the `Applied '` line, not by the absence of a message; verify output markers against a real first and second run before writing the logic.
- A unit test with an invented tool output proves nothing: run the real command twice at least once.
