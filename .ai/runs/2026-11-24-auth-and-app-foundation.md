# Auth i fundamenty aplikacji (implementacja)

Cele:
- Fundament (Faza 1): env z walidacją Zod, logger pino z redakcją, `createApiHandler` + health, kontener Awilix z leniwym ORM (#17, #18)
- Logowanie i konta (Faza 2): standardy, auth, model danych, sesja serwerowa, seed, strony `/login` i `/` (#18, #19, #20, #10)
- Izolacja i druga osoba: test własności przez route, niezależne sesje, E2E żony (#11)
- Instalator `npm run setup` (#2) jako osobny PR równoległy do Fazy 1

Spec: [.ai/specs/2026-11-17-auth-and-app-foundation.md](../specs/2026-11-17-auth-and-app-foundation.md)
Postęp i plan PR-ów: [.ai/pipeline-runs/2026-11-24-auth-and-app-foundation/track.md](../pipeline-runs/2026-11-24-auth-and-app-foundation/track.md)
Status: in-progress

---

## 2026-11-24
Ten PR (tylko dokumentacja): plan implementacji i plik postępu `track.md` (12 PR-ów + instalator), notatka w specu o podziale kroku 2.6 na trzy PR-y.
Decyzje właściciela: plan i kolejność zatwierdzone; AppShell i LoginForm rozszerzamy w `packages/ui`; krok 2.6 jako 2.6a/2.6b/2.6c (jednorazowy wyjątek od Q22).
Do zrobienia: PR-1 (krok 1.1: env, logger, instrumentation).

## 2026-11-24 (PR-#2, instalator)
`npm run setup` (#2): `scripts/setup.ts` + `scripts/setup/` (kroki z wstrzykiwanymi zależnościami), `scripts/tsconfig.json` w `npm run typecheck`, `vitest.config.ts` rozszerzony o `scripts/`. README: sekcja Getting started (dwie ścieżki).
Pułapka: MikroORM nie wypisuje "No pending migrations", przy aktualnej bazie jest tylko "Successfully migrated"; migracje rozpoznajemy po linii `Applied '...'`.
Decyzje właściciela: bez generowania sekretów, bez startu dev servera, miejsce na `seed:user` w następnych krokach (dopiero po kroku 2.5).
