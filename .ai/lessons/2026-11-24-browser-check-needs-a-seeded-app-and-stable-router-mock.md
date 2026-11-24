# A browser check needs a seeded app started through vitest, and a mocked useRouter must be stable

Date: 2026-11-24

**Symptom:** (1) `node` could not run a script importing `@aitl/core` sources (`ERR_MODULE_NOT_FOUND`, extensionless imports). (2) A client screen test looped on `apiCall` when `useRouter` was mocked as `() => ({ replace })`.

**Cause:** (1) Only vitest resolves the workspace sources; `npm run test:integration:app` starts an app with an empty database, so there is no user to log in with. (2) `load` depends on `router` in `useCallback`, the mock returned a new object on every render, so the effect re-ran forever (the real Next router is stable).

**Lesson:**
- For a real-browser check with a user, use a throwaway integration test (not committed) that migrates, provisions a user with a random password, starts the app with `startApp`, writes URL and password to the scratchpad and waits for a stop file; delete it afterwards.
- Mock `next/navigation` with one router object created once (`const router = { replace }; useRouter: () => router`).
- The migrations integration test leaves a `.snapshot-migrations_*.json` file: delete it before committing.
