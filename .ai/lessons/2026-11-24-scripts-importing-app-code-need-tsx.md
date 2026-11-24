# A root script that imports app code must run under tsx, not bare Node

Co sie stalo: `scripts/setup.ts` dziala na natywnym wycinaniu typow Node (`node scripts/setup.ts`, importy z rozszerzeniem `.ts`), ale wrapper seeda importuje kontener z `packages/app`, a tam importy sa bez rozszerzen (`./cradle`) i bez `.ts`.

Przyczyna: Node nie rozwiazuje importow bez rozszerzenia; kod `app` jest pisany pod bundler Next.js.

Wniosek: skrypt uzywajacy kodu z `packages/*` odpalaj przez `node --import tsx --env-file-if-exists=.env`, a `tsx` trzymaj w `devDependencies` roota. Pula polaczen MikroORM trzyma proces przy zyciu, wiec wrapper musi sledzic ORM przez `init` kontenera i zamykac go w `finally`. Test integracyjny (`tests/integration/seed.test.ts`) uruchamia prawdziwy skrypt jako proces potomny, bo tylko to wykrywa zawieszenie procesu i brak zaladowania `tsx`.
