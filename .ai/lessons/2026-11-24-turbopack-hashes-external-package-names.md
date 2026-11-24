# Turbopack externalizes native packages under a hashed name, and health 200 proves the binding loads

Co sie stalo: `@node-rs/argon2` z `serverExternalPackages` nie jest wbudowany w chunki serwera, ale Turbopack zamienia go na `require("@node-rs/argon2-<hash>")` i dolacza symlink `.next/node_modules/@node-rs/argon2-<hash>` do hoistowanego pakietu w `node_modules`.

Przyczyna: Turbopack nadaje zewnetrznym pakietom hashowane nazwy; szukanie w buildzie dokladnej nazwy `@node-rs/argon2` zawodzi, a w route nie ma jeszcze handlera uzywajacego hashera.

Wniosek: sprawdzaj wzorcem `require("@node-rs/argon2...")` i realpath symlinka (`tests/integration/bundling.test.ts`). Lancuch importow `health -> api-handler -> container -> adapter` laduje natywny binding przy pierwszym zadaniu: po zepsuciu `node_modules/@node-rs/argon2/index.js` `GET /api/health` zwraca 500, wiec zielone `/api/health` pod `next start` dowodzi, ze binding sie laduje. Symlink wymaga, by pakiet byl w `node_modules` na tej samej sciezce wzgledem `.next` (przy deployu bez hoistingu trzeba to sprawdzic ponownie).
