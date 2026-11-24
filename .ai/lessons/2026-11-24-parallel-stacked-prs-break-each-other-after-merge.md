# Two parallel PRs can each be green and break each other after the merge

Date: 2026-11-24

**Symptom:** After merging the seed PR (#76) into the sessions stack (#77-#79), `tests/integration/seed.test.ts` failed with `Invalid environment variables: SESSION_SECRET`, and the real `npm run seed:user` would fail the same way without `SESSION_SECRET` in `.env`.

**Cause:** #77 made `SESSION_SECRET` required by the env schema; #76 was written and tested before that, so its seed script and test never set it. Each branch was green alone.

**Lesson:**
- After merging a sibling branch into a stack, run the whole `npm run test:integration`, not only the new tests.
- A script that builds the container needs every required env variable; document them where the script is documented (README) and set them in the spawning test.
- Open point: the seed does not use sessions, so requiring `SESSION_SECRET` there is incidental (owner decision whether to relax it).
