# Integration tests hang when the app is started through npx

Date: 2026-11-02

**Symptom:** the CI integration job passed all tests but never finished (Vitest reported "Timeout terminating forks worker"), and ran until cancelled.

**Cause:** the app was spawned with `npx next start`. `npx` starts the server as a child process, so `SIGTERM` sent to `npx` did not reach the server. The orphaned server kept the Vitest worker alive. It did not reproduce locally.

**Lesson:**
- Spawn long-running processes directly with the Node binary (`process.execPath`) so signals reach them, never through a wrapper such as `npx` or `npm run`.
- Every CI job needs `timeout-minutes` so a hang fails fast instead of running for hours.
- A hang that passes locally can still happen in CI: after the first push, watch the CI run instead of assuming it is green.
