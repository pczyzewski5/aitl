# AITL — product brief

- Date: 2026-11-17
- Mode: own; Owner: właściciel produktu; Pass: Quick pass (jedna runda pytań, przegląd sceptyka wykonany w tym samym kontekście, bez niezależnego recenzenta)
- Evidence basis: relacja właściciela produktu, który jest też pierwszym użytkownikiem, oraz jego relacja z drugiej ręki, że zakres uzgodnił po rozmowie z żoną (bez notatki z tej rozmowy); brak danych i dokumentów. Najbardziej brzemienne nieprzetestowane przekonanie: że żona ma ten sam problem i potrzebuje własnego logowania (A02, częściowo wsparte).
- Coverage: 19 claims — 12 sourced (interview 8, data 0, document 2, product 2, benchmark 0), 0 synthetic, 7 assumed; 2 entries on the collection plan
- Synthetic hypotheses outside Coverage: 0
- Definition of Ready signed by: jeszcze niepodpisane; brak otwartych pytań blokujących, ale A02 jest nietestowane; ready for: planowanie implementacji zakresu Now oraz zebranie materiału (rozmowa z żoną)
- Sources: `.ai/specs/research/interviews/2026-11-17-wlasciciel-produktu.md`, `.ai/specs/research/decisions/D01-zakres-pierwszej-wersji.md`, `AGENTS.md`

## Decision summary

Do ustalenia było, co wchodzi do pierwszej wersji AITL. Zakres jest uzgodniony z właścicielem (D01), ale oparty na jego własnej relacji.
Problem ma właściciel: wydatki prowadzi w arkuszu Google, dodawanie jest niewygodne, reguły obliczania poprawia ręcznie, nic nie dzieje się automatycznie (P01, P02).
Teraz: zapisywanie wpływów i wydatków (cyklicznych i jednorazowych) z oznaczeniem zapłacone, z rozróżnieniem wspólnego i osobistego konta bankowego i z osobnym logowaniem żony, oraz pokazanie, ile zostanie, czyli wpływy minus wydatki w danym miesiącu (D01, R02). Flaga „zapłacone" jest tylko informacją i nie zmienia sumy.
Największa niepewność: zakres Now obejmuje własny dostęp żony; wsparciem jest tylko relacja właściciela z jego rozmowy z nią, bez notatki i bez jej własnych słów (A02).
Następny krok: właściciel zapisuje, co żona powiedziała o korzystaniu ze wspólnego konta bankowego, i dostarcza kopię arkusza do porównania wyników; termin otwarty.

## Vision

Wydatki i wpływy z konta wspólnego i osobistego w jednym miejscu, z planowaniem i prognozą, zamiast ręcznego arkusza. Kierunek właściciela, nie wykazana korzyść. `[ASSUMPTION]` relacja właściciela, 2026-11-17

## Target group and stakeholders

- Customer (pays): nie dotyczy, projekt osobisty bez płatnego klienta `[ASSUMPTION]` relacja właściciela, 2026-11-17
- User (uses): właściciel produktu, który dziś prowadzi wydatki w arkuszu Google `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md
- User (uses): żona właściciela, korzysta z widoku konta wspólnego; według właściciela zakres uzgodnił po rozmowie z nią, relacja z drugiej ręki bez notatki z rozmowy `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md (A02)
- Stakeholders (decides, blocks, operates): właściciel produktu decyduje o zakresie
- Decider for scope decisions: właściciel produktu

## Problems, with evidence

- P01: wydatki są dodawane ręcznie w arkuszu Google z oznaczeniem, czy zapłacone; dodawanie jest niewygodne. Jedna relacja, częstotliwość i koszt nieznane. `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md
- P02: reguły obliczania wydatków trzeba poprawiać ręcznie i nic nie dzieje się automatycznie. Jedna relacja; same reguły nieznane (Q03). `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md
- Zakładana przyczyna: brak automatyzacji cyklicznych wpisów jest głównym źródłem ręcznej pracy (A03). `[ASSUMPTION]` interviews/2026-11-17-wlasciciel-produktu.md

## Product and how it stands out

- What it is: aplikacja webowa do śledzenia i analizy wydatków; szczegóły w Scope `[PRODUCT]` README.md
- What makes it different: nie badano alternatyw poza obecnym arkuszem; różnica nie jest uzasadniona (zob. A01)

| reference | what it does well | where it falls short for our users | checked on | link |
|---|---|---|---|---|

Benchmark odłożony: niepotrzebny do bieżącej decyzji.

## Goals and success criteria

- Business goal: brak celu biznesowego, projekt osobisty (D01)
- User outcome: właściciel nie poprawia ręcznie obliczeń i widzi, ile pieniędzy zostanie. `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md
- Primary metric, baseline today, threshold, date: nieustalone; do określenia po wyjaśnieniu Q02, bez wymyślania progów
- What must not get worse: nieustalone

## Scope

- **Now:** zapisywanie wpływów i wydatków (powtarzających się co miesiąc i jednorazowych) z oznaczeniem, czy zapłacone, z rozróżnieniem wspólnego i osobistego konta bankowego, osobnym logowaniem (konto użytkownika) właściciela i żony, oraz pokazanie, ile zostanie w danym miesiącu (D01, R01, R02)
- **Later:** prognoza i planowanie wykraczające poza bieżący miesiąc
- **Not doing:** see Non-goals

## Domain glossary

| Term | Meaning | Owned by | Visible to |
|---|---|---|---|
| wpływ | pieniądze wpływające na konto bankowe | właściciel produktu | użytkownik |
| wydatek cykliczny | wydatek powtarzający się co miesiąc | właściciel produktu | użytkownik |
| ile zostanie | suma wpływów minus suma wydatków w danym miesiącu (R02) | właściciel produktu | użytkownik |
| konto użytkownika | dane logowania osoby (e-mail i hasło), dzięki którym wchodzi do aplikacji; właściciel i żona mają osobne konta użytkownika (D01) | właściciel produktu | użytkownik |
| konto bankowe | konto pieniędzy, z którego pochodzą wpisy; wspólne albo osobiste; w Now rozróżniane (D01); to samo co „konto wspólne / osobiste” w tym dokumencie | właściciel produktu | użytkownik |
| konto wspólne / osobiste | rodzaje konta bankowego: wspólne (dostępne dla właściciela i żony) i osobiste (tylko właściciel); w tym dokumencie samo „konto” bez przymiotnika oznacza konto bankowe, a logowanie to konto użytkownika | właściciel produktu | użytkownik |

## Key flows

- Current state: dodawanie wydatków w arkuszu Google, oznaczanie zapłacone lub nie, ręczna poprawa reguł obliczania. `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md
- Future state: wpływ lub wydatek (cykliczny zapisany raz), przypisany do konta wspólnego lub osobistego i oznaczany jako zapłacony, wlicza się do tego, ile zostanie w miesiącu. `[ASSUMPTION]` interviews/2026-11-17-wlasciciel-produktu.md (A03)

## Business rules

| Id | Rule | Applies to | Source | Status | Review by | Required path to change | Owner | Supersedes |
|---|---|---|---|---|---|---|---|---|
| R02 | Ile zostanie w miesiącu = suma wpływów minus suma wydatków w tym miesiącu (tak liczy dziś arkusz); flaga „zapłacone" jest tylko informacją i nie zmienia sumy | obliczenie „ile zostanie" | `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md | active | unknown | zgoda właściciela produktu na wiersz zastępujący | właściciel produktu | none |
| R03 | „Ile zostanie" liczy się osobno dla każdego konta bankowego (wspólnego i osobistego), nie łącznie; wzór jak w R02 | obliczenie „ile zostanie" | `[INTERVIEW]` interviews/2026-11-17-wlasciciel-produktu.md | active | unknown | zgoda właściciela produktu na wiersz zastępujący | właściciel produktu | none |
| R01 | Kwoty jako liczby całkowite w jednostce podstawowej plus waluta, bez float; sumy liczone po stronie serwera | wszystkie kwoty | `[PRODUCT]` AGENTS.md | active | unknown | zgoda właściciela produktu na wiersz zastępujący | właściciel produktu | none |

## Non-goals

| Id | We are not building | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|

Właściciel nie wykluczył jeszcze wprost żadnego zakresu; non-goals do uzupełnienia, gdy się pojawią.

## Decisions

| Id | Date | Decision | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D01 | 2026-11-17 | Pierwsza wersja: zapisywanie wpływów i wydatków (cyklicznych i jednorazowych) z flagą zapłacone, z rozróżnieniem konta wspólnego i osobistego, osobnym logowaniem właściciela i żony oraz pokazanie, ile zostanie w miesiącu (R02) | taki zakres wskazał właściciel jako pierwszą wersję; rozważanych alternatyw nie omawiano | właściciel produktu | active | unknown | zgoda właściciela na wiersz zastępujący | `[DOCUMENT]` research/decisions/D01-zakres-pierwszej-wersji.md | none |
| D02 | 2026-11-17 | Historia logowania żony jest zakładana w backlogu mimo częściowego wsparcia A02 | właściciel zdecydował o jej włączeniu do pierwszej wersji; wsparciem jest jego relacja z rozmowy z żoną, nadal bez notatki | właściciel produktu | active | unknown | zgoda właściciela na wiersz zastępujący | `[DOCUMENT]` research/decisions/D02-historia-zony-w-backlogu.md | none |

## Riskiest assumptions

| Id | Assumption | Importance | Evidence today | If false | Smallest test | Owner | By when | Result |
|---|---|---|---|---|---|---|---|---|
| A01 | Cykliczne wpisy i prognoza „ile zostanie" wystarczą, żeby zastąpić arkusz `[ASSUMPTION]` relacja właściciela | high | jedna relacja właściciela; brak porównania z arkuszem | zakres Now się zmienia | właściciel odtwarza w prototypie kilka miesięcy ze swojego arkusza i porównuje wynik; ograniczenie: jeden użytkownik | właściciel produktu | unknown | untested |
| A02 | Żona ma ten sam problem i chce wspólnego widoku `[ASSUMPTION]` relacja właściciela | high | relacja właściciela, że zakres uzgodnił po rozmowie z żoną; z drugiej ręki, bez notatki z rozmowy | zakres Now (osobne logowanie żony, widok wspólny) traci część uzasadnienia | zapis rozmowy z żoną: ostatni raz, gdy sprawdzała konto wspólne, i co wtedy zrobiła | właściciel produktu | unknown | partially supported (relacja z drugiej ręki) |
| A03 | Brak automatyzacji cyklicznych wpisów to główne źródło ręcznej pracy `[ASSUMPTION]` relacja właściciela | medium | relacja wymienia kilka niedogodności bez wskazania głównej | priorytet może zmienić się na reguły obliczania lub wygodę wprowadzania | przejrzenie arkusza: ile wpisów to powtórzenia | właściciel produktu | unknown | untested |

## Kill criteria

Nieustalone: nie określono, po czym stwierdzić, że aplikacja nie zastępuje arkusza. Do ustalenia przez właściciela przy teście A01.

## Hypotheses to test

Brak: nie użyto syntetycznych użytkowników.

## Open questions

| Id | Question | Blocking | Who can answer | Status |
|---|---|---|---|---|
| Q01 | Czy pierwsza wersja ma rozróżniać konto wspólne i osobiste? | rozstrzygnięte: tak (D01) | właściciel produktu | closed |
| Q02 | Co znaczy „ile zostanie"? | rozstrzygnięte: wpływy minus wydatki w danym miesiącu (R02) | właściciel produktu | closed |
| Q03 | Jakie reguły obliczania stosuje arkusz? | rozstrzygnięte w zarysie: suma wydatków odjęta od wpływów (R02); szczegóły arkusza do porównania z wynikiem | właściciel produktu | closed |
| Q04 | Czy oznaczanie „zapłacone" ma być w pierwszej wersji? | rozstrzygnięte: tak (D01) | właściciel produktu | closed |
| Q05 | Czy wydatki jednorazowe muszą być w pierwszej wersji? | rozstrzygnięte: tak (D01) | właściciel produktu | closed |
| Q06 | Czy żona ma mieć własne logowanie i widok w pierwszej wersji? | rozstrzygnięte: tak (D01) | właściciel produktu | closed |
| Q07 | Czy do sumy liczą się wszystkie wydatki, czy tylko zapłacone? | rozstrzygnięte: wszystkie; „zapłacone" to tylko flaga informacyjna (R02) | właściciel produktu | closed |
| Q08 | Czy „ile zostanie" liczy się osobno per konto, czy łącznie? | rozstrzygnięte: osobno per konto (R03) | właściciel produktu | closed |

## Definition of Ready addendum (own)

Problem i użytkownik (właściciel) opierają się na jednej własnej relacji. Zakres Now (D01, R02) obejmuje własny dostęp żony; jego wsparciem (A02) jest relacja właściciela z rozmowy z żoną, nie jej własne słowa. Brak otwartych pytań blokujących. Gotowe do planowania implementacji zakresu Now oraz do zebrania materiału.

## Collection plan

- Arkusz Google (kopia lub zrzut ekranu, bez danych wrażliwych) do porównania wyniku z R02 i testu A01: właściciel dostarcza do `.ai/specs/research/`, termin otwarty.
- Notatka z rozmowy z żoną (ostatni raz, gdy sprawdzała konto wspólne, i co zrobiła): właściciel spisuje do `.ai/specs/research/interviews/`, termin otwarty.
