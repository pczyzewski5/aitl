# Backlogs

## .ai/specs/product-brief.md
Backlog source: .ai/specs/product-brief.md
Last filed: 2026-11-17

Wstrzymane (held back): brak. Zaparkowany: E04 (Later, bez historii i bez checklisty).

| Id | Issue | Title | Epic | Depends on | Adopted |
|---|---|---|---|---|---|
| E01 | [#6](https://github.com/pczyzewski5/aitl/issues/6) | Dostęp i logowanie | — | — | no |
| E02 | [#7](https://github.com/pczyzewski5/aitl/issues/7) | Zapis wpływów i wydatków | — | — | no |
| E03 | [#8](https://github.com/pczyzewski5/aitl/issues/8) | Ile zostanie w miesiącu | — | — | no |
| E04 | [#9](https://github.com/pczyzewski5/aitl/issues/9) | Later (zaparkowany) | — | — | no |
| E01-S01 | [#10](https://github.com/pczyzewski5/aitl/issues/10) | Właściciel loguje się własnym kontem i widzi swoje konta | #6 | — | no |
| E01-S02 | [#11](https://github.com/pczyzewski5/aitl/issues/11) | Żona loguje się własnym kontem i widzi tylko konto wspólne | #6 | E01-S01 (#10) | no |
| E02-S01 | [#12](https://github.com/pczyzewski5/aitl/issues/12) | Właściciel zapisuje wydatek jednorazowy na koncie wspólnym lub osobistym | #7 | E01-S01 (#10) | no |
| E02-S02 | [#13](https://github.com/pczyzewski5/aitl/issues/13) | Właściciel zapisuje wpływ jednorazowy na koncie | #7 | E02-S01 (#12) | no |
| E02-S03 | [#14](https://github.com/pczyzewski5/aitl/issues/14) | Właściciel zapisuje wpis cykliczny raz i widzi go w każdym miesiącu | #7 | E02-S01 (#12) | no |
| E02-S04 | [#15](https://github.com/pczyzewski5/aitl/issues/15) | Użytkownik oznacza wydatek jako zapłacony | #7 | E02-S01 (#12) | no |
| E03-S01 | [#16](https://github.com/pczyzewski5/aitl/issues/16) | Użytkownik widzi, ile zostanie w miesiącu, osobno dla każdego konta | #8 | E02-S01 (#12), E02-S02 (#13), E02-S03 (#14) | no |
| E01-S01-T01 | [#17](https://github.com/pczyzewski5/aitl/issues/17) | Skonfigurować kontener Awilix (composition root) | #10 | — | no |
| E01-S01-T02 | [#18](https://github.com/pczyzewski5/aitl/issues/18) | Warstwa HTTP, uwierzytelnianie, env i logger | #10 | E01-S01-T01 (#17) | no |
| E01-S01-T03 | [#19](https://github.com/pczyzewski5/aitl/issues/19) | Strona logowania w Tailwind | #10 | E01-S01-T02 (#18) | no |
| E01-S01-T04 | [#20](https://github.com/pczyzewski5/aitl/issues/20) | Encja User i migracja | #10 | — | no |
| E02-S01-T01 | [#21](https://github.com/pczyzewski5/aitl/issues/21) | Encja wpisu (wpływ/wydatek) i migracja | #12 | E01-S01-T04 (#20) | no |
| E02-S01-T02 | [#22](https://github.com/pczyzewski5/aitl/issues/22) | Szkielet listy i formularza z ui/backend na realnym przykładzie | #12 | E02-S01-T01 (#21) | no |
| E03-S01-T01 | [#23](https://github.com/pczyzewski5/aitl/issues/23) | Porównać wynik z arkuszem Google właściciela (test A01) | #16 | E03-S01 (#16) | no |
