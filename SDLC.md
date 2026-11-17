# Proces dostarczania oprogramowania

## Cel

Ten plik opisuje, jak praca przechodzi od zgłoszenia do zmergowanego PR-a w tym repozytorium. Procesu pilnują skille agentów skonfigurowane w `.ai/agentic.config.json`; ludzie czytają go tutaj. Nowe PR-y domyślnie trafiają do `main`; istniejące PR-y używają własnej bieżącej gałęzi docelowej (`baseRefName`) do aktualizacji bazy, review, wymaganych checków i mergowania. Zgłoszenia i PR-y żyją w GitHubie, a każda operacja na trackerze wykonywana przez skille jest zdefiniowana w `.ai/trackers/github.md` (edytuj ten plik, żeby rozszerzyć lub nadpisać zachowanie trackera).

Praca wchodzi dwiema ścieżkami: swobodnym opisem zadania przekazanym agentowi albo zgłoszeniem w trackerze. Obie schodzą się w tej samej pętli review, tej samej bramce walidacji i tych samych bramkach merge.

Przed przyjęciem zadania praca jest kształtowana: `om-brainstorm` zamienia pomysł lub pytanie w decyzję o dalszej drodze i krótki brief, a skille specyfikacji (`om-spec-writing`, `om-auto-write-spec`) zamieniają funkcję w dokument projektowy zanim cokolwiek powstanie. Specyfikacje trafiają do `.ai/specs/` (aktywne), po wdrożeniu do `.ai/specs/implemented/`, po porzuceniu do `.ai/specs/archive/`. Te kroki zasilają tabelę poniżej, ale nie są samym przepływem zgłoszenia.

<!-- discovery:start -->
Zanim cokolwiek z tego nastąpi, `om-discover` ustala kontekst produktu, z którego korzysta każda późniejsza decyzja: `.ai/specs/product-brief.md` opisuje, kim są użytkownicy, co ich boli, czym produkt nie jest oraz jakie reguły i decyzje wiążą pracę. Definicja gotowości poniżej jest umową między tym kontekstem a przyjęciem zgłoszenia.
<!-- discovery:end -->

## Konwencje

- **Gałąź**: `feature/<opis>` (patrz `AGENTS.md`). `main` jest chroniona: zmiany wchodzą wyłącznie przez PR, z zielonymi checkami (Build, Lint, Unit tests, Integration tests) i aktualną gałęzią. Bezpośredni push na `main`, force-push i usuwanie są zablokowane, także dla administratorów.
- **Commity i tytuł PR-a**: krótki opis po angielsku w trybie rozkazującym, bez prefiksu typu, bez klucza zgłoszenia i bez nazw klas, np. `Set up MikroORM with PostgreSQL, migrations and integration test`. Tytuł PR-a ma ten sam styl (konfiguracja `prTitleTemplate`: `{summary}{issueRef}`). Bez linii `Co-Authored-By`.
- **Dziennik zadania**: każdy commit zadania zawiera wpis w `.ai/runs/YYYY-MM-DD-slug.md` (zasady w `AGENTS.md`). Po naprawie błędu lub odkryciu pułapki dodaj lekcję w `.ai/lessons/` i wpis w `.ai/lessons.md`.
- **Hook pre-commit** (`.githooks/pre-commit`) uruchamia lint, typecheck i testy z pokryciem 100%. Nie omijaj go przez `--no-verify`.

## Role

- **Autor**: człowiek lub agent piszący zmianę. Odpowiada za zgłoszenie od przejęcia do PR-a gotowego do merge.
- **Reviewer**: czyta diff i zatwierdza albo żąda zmian. Może to być człowiek lub skill `om-auto-review-pr`; checklista `om-code-review` obowiązuje w obu przypadkach (reguły repo w `CODE_REVIEW.md`). Reviewer jest też drugą osobą, której wymaga zmiana `risk-high`, i akceptuje specyfikację, gdy funkcja jej wymaga.
- **Designer**: odpowiada za przepływ i jego stany, zanim powstanie kod. Może to być człowiek, `om-ux-shape`, `om-ux-design` albo `om-ux-review-pr`.
- **Recenzent QA**: sprawdza zmiany widoczne dla użytkownika przed merge, używając `om-prepare-test-env` (jednorazowy start aplikacji) i `om-auto-qa-pr` (przejście w prawdziwej przeglądarce). Odwołujemy się do roli, nigdy do imienia ani loginu.
- **Product owner**: odpowiada za "dlaczego" i wartość: brief produktu, podział zakresu (teraz, później, nie robimy), kryteria sukcesu oraz poziom zgłoszenia w Definicji gotowości. Potwierdza brief przed jego zapisaniem i drzewo backlogu przed założeniem zgłoszeń; jest właścicielem każdej decyzji w briefie, która nie wskazuje innego właściciela. Odwołujemy się do roli, nigdy do imienia. <!-- discovery -->
- **Maintainer**: rozstrzyga spory, może zwolnić z wymogu na PR-ze (jawnie i z uzasadnieniem), czyści osierocone claimy, prowadzi changelog.

## Etapy przepływu

| Etap | Co się dzieje | Prowadzi | Gotowe, gdy |
|---|---|---|---|
| Odkrywanie | Pomysł lub pytanie jest omawiane, zanim powstanie jakikolwiek artefakt: kwestionujemy problem, ważymy alternatywy (w tym nic nie budować), kończymy decyzją o drodze. | `om-brainstorm` lub człowiek | Rozmowa skierowana dalej; brief, gdy praca trwa |
| Przyjęcie | Zgłoszenie lub brief zadania jest założone w GitHubie i spełnia Definicję gotowości poniżej. `om-prepare-issue` i `om-backlog` zakładają je z etykietami SDLC i wymaganymi sekcjami; `om-auto-manage-issues` raportuje, czego istniejącemu zgłoszeniu jeszcze brakuje. | Każdy, `om-prepare-issue`, `om-backlog`, `om-auto-manage-issues` | Zgłoszenie istnieje i jest gotowe albo jego braki są nazwane na zgłoszeniu <!-- discovery --> |
| Triage | Potwierdzenie, że problem jest realny, nadal nienaprawiony na `main`, nieprzejęty i nieobjęty otwartym PR-em. Tylko odczyt. | `om-verify-in-repo` lub człowiek | Potwierdzone jako do zrobienia albo zamknięte jako bez akcji |
| Claim | Autor przejmuje zgłoszenie, by współbieżni agenci się wycofali (protokół poniżej). | `om-fix` / `om-auto-create-pr` lub człowiek | Claim widoczny na zgłoszeniu |
| Projekt | Dla zmiany widocznej w UI przepływ i jego stany są ustalone przed kodem: stan pusty, ładowanie, błąd, brak uprawnień, czego zmiana celowo nie robi. Zgłoszenie bez UI pomija etap. | `om-ux-shape`, opcjonalnie `om-ux-design`, lub człowiek | Przepływ i stany ustalone albo zgłoszenie bez UI |
| Implementacja | Wyznaczenie minimalnej powierzchni zmiany (`om-root-cause`, tylko odczyt), implementacja z testami regresyjnymi i bramka walidacji. Zadania bez zgłoszenia przechodzą przez `om-auto-create-pr` (plan, fazy, izolowany worktree). | `om-root-cause` + `om-fix`, `om-auto-create-pr` lub człowiek | Zmiana kompletna, bramka walidacji zielona |
| PR | Commit, push i otwarcie PR-a do `main` ze znormalizowanymi etykietami. Na ręcznie prowadzonej gałęzi `om-check-and-commit` uruchamia bramkę i pushuje, gdy jest zielona. | `om-open-pr`, `om-auto-create-pr` lub `om-check-and-commit` | Otwarty, oznaczony PR |
| Pętla review | Reviewer czyta diff względem `om-code-review` i `CODE_REVIEW.md`, zatwierdza albo żąda zmian. Poprawki są wprowadzane (`om-auto-continue-pr` wznawia PR-y agentów z planu) i PR wraca do review aż do akceptacji. Zmiana UI dostaje też doradcze przejście `om-ux-review-pr`. | `om-auto-review-pr`, `om-review-prs` (przegląd zbiorczy), `om-ux-review-pr` lub człowiek | Zatwierdzający review złożony |
| QA | PR z `needs-qa` czeka na QA: recenzent uruchamia aplikację (`om-prepare-test-env`), przechodzi zmianę w przeglądarce (`om-auto-qa-pr`, który dołącza zrzuty i raport pass/fail i domyślnie nie dotyka etykiet) i zapisuje wynik. Wartościowy przepływ staje się testem z `om-integration-tests`. Patrz bramka QA. | Recenzent QA | `qa-approved` od recenzenta QA albo dozwolony wyjątek self-QA; `qa-failed` kieruje z powrotem |
| Merge | `om-merge-buddy` raportuje (tylko odczyt), które PR-y można zmergować. `om-approve-merge-pr` ponownie sprawdza wszystkie bramki, zatwierdza i robi squash-merge. `om-auto-merge-buddy` obsługuje PR-y z etykietą `automerge`. | `om-merge-buddy` + `om-approve-merge-pr`, `om-auto-merge-buddy` lub człowiek | PR zsquashowany do gałęzi docelowej |
| Sprzątanie po merge | Zamknięcie zgłoszeń naprawionych przez PR, komentarz przy zgłoszeniach, których PR zamknięto bez merge, zgłoszenia follow-up dla pozostałych uwag. | `om-close-fixed-issues`, `om-followup-issue-from-pr` | Tracker uzgodniony, follow-upy założone |

Po merge ten proces się kończy. Wdrożenie, monitoring i rollback należą do procesu wydawniczego zespołu, nie do tego dokumentu; maintainer redaguje changelog przez `om-auto-update-changelog`, a `om-pipeline-retro` czyta zakończone przebiegi.

<!-- discovery:start -->
## Definicja gotowości

Zgłoszenie jest gotowe do implementacji, gdy odpowiedzi poniżej znajdują się na zgłoszeniu albo w linkowanej specyfikacji. Są dwa poziomy, bo specyfikacja może uzupełnić drugi, ale nigdy pierwszy.

**Poziom zgłoszenia, który może dostarczyć tylko człowiek:**

- problem lub potrzeba oraz to, kto ją ma (użytkownik lub rola);
- oczekiwany rezultat i sposób jego sprawdzenia;
- co jest poza zakresem;
- otwarte pytania, każde oznaczone jako blokujące lub nieblokujące, bez żadnego blokującego pytania bez odpowiedzi;
- każde autonomiczne założenie potwierdzone przez człowieka (komentarz z rozstrzygniętymi założeniami na PR-ze specyfikacji).

**Poziom specyfikacji, który dostarcza pokrywająca ją specyfikacja (`om-auto-write-spec` pisze go, gdy brakuje):**

- kryteria akceptacji;
- reguły biznesowe;
- ścieżka szczęśliwa i główne ścieżki błędów;
- wpływ na dane i uprawnienia;
- zależności;
- link do prototypu lub makiet, gdy zmiana jest widoczna dla użytkownika.

Dla błędu gotowość oznacza możliwość odtworzenia: bramką jest `om-verify-in-repo`, a powyższa lista dotyczy tylko jego elementów poziomu zgłoszenia. Egzekwowanie: `om-prepare-issue` zakłada zgłoszenia z tymi sekcjami; `om-auto-manage-issues` zapisuje `READY_STATUS` dla każdego zgłoszenia i dodaje komentarz o braku gotowości z wymienionymi brakami; ścieżka funkcji w `om-auto-fix-issue` zatrzymuje się na zgłoszeniu, które nie spełnia poziomu zgłoszenia, zamiast pisać specyfikację wokół luki, tak jak `om-verify-in-repo` zatrzymuje się na błędzie, który nie jest realny. Braki poziomu specyfikacji nie zatrzymują pracy, bo specyfikacja jest pisana. Maintainer może zwolnić z pojedynczego elementu, mówiąc o tym na zgłoszeniu. Ta sekcja jest tym, co czytają wymienione skille: repozytorium, którego `SDLC.md` nie ma Definicji gotowości, nie dostaje sprawdzenia gotowości.

## Decyzje produktowe jako chroniony kontrakt

Gdy `om-discover` zapisał `.ai/specs/product-brief.md`, jego tabele **Non-goals**, **Business rules** i **Decisions** są chronione tak, jak `BACKWARD_COMPATIBILITY.md` chroni powierzchnie kontraktowe. Każdy wpis ma stabilne id (`N01`, `R03`, `D07`), właściciela, status (`active` lub `superseded`), datę przeglądu i wymaganą ścieżkę zmiany. Zasady:

- PR, który buduje coś, co wyklucza non-goal, albo przeczy regule biznesowej lub decyzji, bez wpisu zastępującego w tym samym PR-ze, jest **blokerem** w review, z cytatem wpisu i jego id. Wyjściem nigdy nie jest "usuń kod", tylko "zmień decyzję jawnie": wiersz zastępujący zatwierdzony przez właściciela wpisu, a spór rozstrzyga maintainer, jak w sekcji Role.
- Decyzje w grze są pokazywane tam, gdzie ludzie pracują, a nie zapamiętywane: `om-auto-manage-issues` wymienia je w komentarzu z notatkami implementacyjnymi, `om-spec-writing` prowadzi sekcję *Decisions in play*, a każdy opis PR-a zawiera *Decisions touched*. Nowa osoba lub nowy agent czyta je na zgłoszeniu, w specyfikacji albo na PR-ze, nie w historii czatu.
- Autonomiczne założenie potwierdzone przez człowieka na PR-ze specyfikacji (komentarz z rozstrzygniętymi założeniami) jest zapisywane jako decyzja przy następnym `om-discover --refresh`, z potwierdzającym jako właścicielem, żeby powód obecnego stanu rzeczy przetrwał osoby, które go ustaliły.
- Decyzje się starzeją: wpis po dacie przeglądu jest w review oznaczany jako wymagający przeglądu, a nie egzekwowany na ślepo. Które wpisy blokują bardziej, niż chronią, to pytanie na retro.
<!-- discovery:end -->

## Maszyna stanów etykiet

Etykiety pipeline są wzajemnie wykluczające się: PR ma co najwyżej jedną i wskazuje ona, gdzie PR jest w przepływie.

- Gotowy, niebędący draftem PR ma `review`.
- Reviewer przesuwa go: żądanie zmian to `changes-requested`; po poprawkach wraca do `review`; akceptacja to `merge-queue`.
- `merge-queue` to routing, nie dowód QA: PR z `needs-qa` zasadnie w niej czeka na akceptację QA.
- Etykietę `qa` ustawia wyłącznie recenzent QA: przesuwa PR z `merge-queue` do `qa` na czas testów, potem z powrotem do `merge-queue` z `qa-approved` po sukcesie albo do `qa-failed` po porażce. Skille automatyczne żądają QA przez `needs-qa`, nigdy nie ustawiają `qa`.
- `blocked` i `do-not-merge` ustawiają i zdejmują ludzie; zatrzymują przepływ w dowolnym miejscu.

| Grupa | Etykiety | Wykluczanie | Znaczenie |
|---|---|---|---|
| Pipeline | `review`, `changes-requested`, `qa`, `qa-failed`, `merge-queue`, `blocked`, `do-not-merge` | jedna naraz | Stan przepływu |
| Kategoria | `bug`, `feature`, `refactor`, `security`, `dependencies`, `documentation` | addytywne | Rodzaj zmiany |
| Meta | `needs-qa`, `skip-qa`, `qa-approved`, `qa-self-verified`, `in-progress`, `ci-monitoring` | addytywne | Sygnały procesu |
| Priorytet | `priority-low`, `priority-medium`, `priority-high`, `priority-extreme` | jedna naraz; brak = medium | Pilność pracy |
| Ryzyko | `risk-low`, `risk-medium`, `risk-high` | jedna naraz; brak = medium | Zasięg szkód zmiany |

Priorytet to pilność pracy, ryzyko to niebezpieczeństwo wdrożenia zmiany. PR dziedziczy oba po zgłoszeniu źródłowym, chyba że zakres wyraźnie się zmienił. Gdy skill automatyczny dodaje lub zmienia etykietę pipeline lub meta, zostawia krótki komentarz z powodem.

Gdy brak etykiety priorytetu, wnioskuj:

- `priority-extreme`: awaria produkcji, utrata danych lub aktywny incydent bezpieczeństwa.
- `priority-high`: utwardzanie bezpieczeństwa lub regresja blokująca wydanie.
- `priority-medium`: zwykłe poprawki błędów i nowe funkcje (także domyślna interpretacja braku etykiety).
- `priority-low`: kosmetyka, tylko dokumentacja, podbicia zależności, sprzątanie po zadaniach.

Gdy brak etykiety ryzyka, wnioskuj:

- `risk-high`: uwierzytelnianie i sesje, zakres danych (własność rekordów użytkownika), kwoty i waluty, migracje schematu, współdzielone powierzchnie kontraktowe (patrz `BACKWARD_COMPATIBILITY.md`) albo szerokie zmiany przekrojowe.
- `risk-medium`: zwykła zmiana w jednym obszarze z testami (także domyślna interpretacja braku etykiety).
- `risk-low`: tylko dokumentacja, tylko testy, literówki, odizolowane zmiany kosmetyczne.

Przy sprzecznych sygnałach wybierz wyższą etykietę i uzasadnij w komentarzu. PR `risk-high` uruchamia bramki:

| Obszar za `risk-high` | Co PR musi zawierać |
|---|---|
| Auth, sesje, uprawnienia | test integracyjny ścieżki odmowy i odczytu cudzego rekordu; review drugiej osoby |
| Zakres danych | test izolacji dowodzący, że jeden użytkownik nie czyta danych drugiego |
| Kwoty | testy ścieżek błędu, ponowienia i idempotentności; review drugiej osoby |
| Migracje schematu | test migracji w górę i w dół (`tests/integration/migrations.test.ts`) oraz plan wycofania w opisie PR-a |
| Współdzielone kontrakty | sprawdzona strona konsumująca, zgodnie z `BACKWARD_COMPATIBILITY.md` |
| Każde `risk-high` | `needs-qa`, gdy zmiana widoczna dla użytkownika; brak self-QA; `om-code-review` blokuje bez powyższych dowodów, chyba że maintainer zwolni na PR-ze |

Dwie etykiety poza taksonomią stosują wyłącznie ludzie (etykiety sygnałów automerge stosuje tylko `om-auto-merge-buddy`):

- `do-not-close`: na zgłoszeniach, których skille porządkowe nie mogą zamykać automatycznie. Skille tylko ją czytają.
- `automerge`: na PR-ze, który człowiek chce zmergować bez dalszej uwagi. `om-auto-merge-buddy` obsługuje je w oknie czasowym (domyślnie 120 minut, do 3 prób na PR). Gotowość to trzy sygnały, każdy zapisany jako etykieta:
  - `automerge-signal-1-cr`: `om-auto-review-pr` zatwierdził bieżący head.
  - `automerge-signal-2-qa`: QA niewymagane (`skip-qa` lub brak `needs-qa`) albo `qa-approved` przypięte do bieżącego headu linią `QA head:`.
  - `automerge-signal-3-ci`: każdy check na bieżącym headzie zakończył się zielono, bez konfliktów.

  Tryb (`automerge.mode`) to `prepare-and-merge`: PR z trzema sygnałami jest squash-mergowany. PR, którego nie da się naprawić w limicie prób, dostaje `automerge-blocked`; zdjęcie tej etykiety wznawia próby. Zdjęcie `automerge` zatrzymuje automatyzację.

## Bramka QA

Jedyna twarda reguła tego procesu: **PR z `needs-qa` nie może zostać zmergowany, dopóki nie ma też `qa-approved`, nawet gdy wszystkie inne checki są zielone.** `om-merge-buddy` klasyfikuje taki PR jako zablokowany, a `om-approve-merge-pr` odmawia mergowania.

- `needs-qa` dla zmian UI, nowych funkcji i innego zachowania widocznego dla użytkownika.
- Dla zmiany UI QA obejmuje więcej niż "działa": macierz stanów (domyślny, pusty, ładowanie, błąd, brak uprawnień, długa treść, wąski viewport) jest częścią pass/fail. Brakujący stan oblewa QA.
- `skip-qa` to jawna rezygnacja dla zmian tylko dokumentacyjnych, tylko zależności, tylko CI, tylko testów i podobnie niskiego ryzyka. Nigdy razem z `needs-qa`.
- `qa-failed`, `do-not-merge` i `blocked` to twarde blokady niezależnie od reszty. Aktywna etykieta `qa` oznacza, że tester pracuje nad PR-em właśnie teraz: nie mergujemy pod aktywnym testerem.
- **`qa-approved` jest przypięte do commita.** Komentarz je nadający zawiera linię `QA head: <sha>` testowanego headu. Push po tej linii zostawia etykietę, ale ją unieważnia: `om-merge-buddy` raportuje "QA evidence older than head", a `om-approve-merge-pr` prosi o potwierdzenie. Droga powrotna to ponowny test albo stwierdzenie na PR-ze, że nowe commity nie dotykają testowanego zakresu, z nową linią `QA head:`.
- **Wyjątek self-QA**: gdy recenzent QA nie ma czasu, dowolny inżynier (lub `om-auto-qa-pr --self-qa-signoff`) może zatwierdzić, wyłącznie na PR-ze `risk-low` lub `risk-medium`. Dowód na PR-ze podaje scenariusz, środowisko, dane testowe, obserwowany wynik, wypróbowane przypadki negatywne i linię `QA head:`. Wtedy stosujemy `qa-approved` i `qa-self-verified`. Brak dowodu oznacza brak `qa-approved`.
- **Brak self-QA na `risk-high`.** PR z `risk-high` albo dotykający auth, sesji, zakresu danych, kwot, migracji schematu lub współdzielonych kontraktów wymaga recenzenta QA albo jawnego wyjątku maintainera na PR-ze. Zmiana auth lub kwot wymaga też review drugiej osoby niezależnie od ścieżki QA.

## Protokół claim

Przed zmianą zgłoszenia lub PR-a agent przejmuje je trzema sygnałami: przypisuje się, dodaje etykietę `in-progress` i pisze komentarz claim z opisem, co robi. Agent zastający claim wycofuje się zamiast kolidować. PR z `in-progress` jest pomijany przez narzędzia merge.

`in-progress` znaczy **aktywnie pracuję**. Gdy praca agenta jest skończona i w pełni zaraportowana (etykiety, review, komentarze), zamienia `in-progress` na `ci-monitoring`, jeśli nadal zamierza zgłosić wynik CI. `ci-monitoring` nie jest claimem i nikogo nie blokuje: mówi tylko, że komentarz z wynikiem CI jest jeszcze należny. Etykieta znika, gdy follow-up trafi na PR albo gdy agent zrezygnuje z czekania po `ci.maxWaitMinutes` (40 minut) i napisze o tym.

Claim jest zwalniany po zakończeniu pracy, zarówno przy sukcesie, jak i porażce. Przeterminowane `in-progress` bez świeżej aktywności może zdjąć maintainer.

### Raportowanie niezależne od CI

Agenci stosują etykiety, składają review i piszą komentarze **zaraz po skończeniu pracy**, bez czekania na zielone CI. Review złożone przy trwających checkach mówi o tym w treści: faktyczny merge trzyma ochrona gałęzi i bramka QA, a akceptacja dotyczy kodu, nie zielonego przebiegu. Wynik CI dociera później jako komentarz uzupełniający, który koryguje etykietę pipeline, jeśli zmienia werdykt.

Czerwony sygnał nie skraca review: nieprzechodzący wymagany check lub konflikt jest zbierany jako **blocker** i zgłaszany razem z pełnym review, nigdy zamiast niego. Raportowanie wcześnie jest bezpieczne; mergowanie wcześnie nie: wymagane checki nadal bramkują każdy merge.

## Kontrakt automatyzacji

Skille `om-auto-*` prowadzą ten proces bez nadzoru i można je łączyć w łańcuch: każdy przyjmuje artefakt poprzedniego (id zgłoszenia, ścieżkę specyfikacji albo numer PR-a z linii `PR: #<number> (link: <url>)`) i wykrywa już rozpoczętą pracę (otwarty PR odnoszący się do zgłoszenia lub planu), kontynuując ją zamiast otwierać duplikat. Zakończony przebieg autonomiczny zostawia **gotowy** (niebędący draftem), w pełni oznaczony PR (jedna etykieta pipeline, kategoria, meta QA, jeden priorytet, jedno ryzyko) z komentarzem podsumowującym i, dla zmian UI, zrzutami z działającej aplikacji. Drafty są zarezerwowane dla stanów jawnie niekompletnych. Automatyzacja stosuje `qa-approved` wyłącznie przez wyjątek self-QA (zawsze razem z `qa-self-verified`); żaden skill autorski, review ani merge go nie nakłada.

## Bramka walidacji

Każdy PR przechodzi pełną bramkę walidacji przed akceptacją review, w tej kolejności:

- `npm run typecheck`
- `npm run lint`
- `npm run test:coverage`
- `npm run build`
- `npm run test:integration`
- `npm audit --audit-level=high`

Każdy niezerowy kod wyjścia oblewa bramkę i blokuje PR. Skille implementujące uruchamiają bramkę przed otwarciem PR-a, a `om-check-and-commit` przed pushem ręcznie prowadzonej gałęzi. Testy jednostkowe wymagają 100% pokrycia (statements, branches, functions, lines), próg jest wymuszony w `vitest.config.ts`. Testy integracyjne wymagają Dockera i wcześniejszego `npm run build`.

CI (`.github/workflows/ci.yml`) odtwarza bramkę na każdym PR-ze: job `Build` (typecheck i `next build`), `Lint` (lint oraz `npm audit --audit-level=high`, który oblewa przy podatnościach o poziomie high i wyższym), `Unit tests (100% coverage)` i `Integration tests`. Lista komend żyje w `.ai/agentic.config.json`; przy jej zmianie zaktualizuj ją tam i w tej sekcji razem.

## Zmiana tego procesu

Ten dokument i `.ai/agentic.config.json` opisują ten sam proces: zmieniaj je razem i uruchom ponownie skill `om-setup-agent-pipeline`, gdy zmienia się toolchain lub taksonomia etykiet.

<!-- discovery:start -->
Bloki warstwy produktowej między `<!-- discovery:start -->` a `<!-- discovery:end -->` należą do `om-setup-discovery-pipeline`: uruchom go ponownie, żeby je dodać lub odświeżyć, a wszystko inne edytuj ręcznie.
<!-- discovery:end -->

Odstępstwa od pojedynczych skilli (dodatkowe reguły review, inny szablon opisu PR-a, dodatkowy krok bramki) należą do repo-lokalnego skilla o tej samej nazwie w `.ai/skills/<skill-name>/SKILL.md`, który ma pierwszeństwo przed zainstalowanym; nie może jednak przyznać tego, czego zabraniają reguły bezpieczeństwa zainstalowanego skilla.

Kontrakt projektowy czytany na etapach Projekt i Review jest ustawiany raz: `om-ux-setup` wyciąga go z repozytorium i uruchamia się ponownie przy zmianie systemu designu.

## Kolejka autofix potwierdzana przez człowieka

`om-auto-issue-triage` proponuje użyteczne otwarte zgłoszenia o ustalonym zakresie i ograniczonej pracy. Etykietę `cez-autofix` nakłada wyłącznie na zgłoszenia potwierdzone przez człowieka po zobaczeniu dowodów, pomija aktywne lub niepewne claimy i zachowuje przypisania. Implementacja pozostaje po stronie `om-auto-fix-issue`, ze wszystkimi zwykłymi bramkami specyfikacji, review, QA i CI.
