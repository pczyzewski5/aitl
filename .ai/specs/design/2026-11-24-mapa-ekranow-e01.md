# Mapa ekranów: Epik E01 "Dostęp i logowanie" (AITL)

Status: PROJEKT do zatwierdzenia. Źródła: `.ai/specs/product-brief.md` (Key flows, Business rules, Decisions), `.ai/specs/backlog.md`, issues #6, #10, #11, #17-#20, `.ai/specs/implemented/2026-11-17-auth-and-app-foundation.md`, `packages/ui/POSTEP.md`, `docs/design-system.md`, `packages/ui/src/screens/e01/`, `packages/ui/src/stories/system/`. Brak person (nie wymyślano). Niczego nie rozstrzygam: wszystko niejasne trafiło do sekcji 7.

Konwencja: S01-K3 = historia E01-S01, kryterium nr 3 (numeracja kryteriów według kolejności w issue na GitHubie). Terminologia za backlogiem: "konto użytkownika" = login (User), "konto bankowe" = BankAccount (wspólne albo osobiste).

---

## 1. Historie E01 i kryteria akceptacji

Epik E01 (#6): obie osoby logują się własnym kontem użytkownika; żona widzi wyłącznie wspólne konto bankowe, właściciel oba. Decyzje w grze: D01, D02; założenie A02 (żona chce wspólnego widoku) jest tylko częściowo wsparte.

### E01-S01 (#10): Właściciel loguje się własnym kontem i widzi swoje konta bankowe

| Nr | Kryterium (skrót) | Typ |
|---|---|---|
| S01-K1 | Poprawne dane właściciela: zalogowany, widzi wspólne i swoje osobiste konto bankowe | pozytywne |
| S01-K2 | Błędne hasło: odrzucone, komunikat nie ujawnia, czy użytkownik istnieje, brak sesji | negatywne |
| S01-K3 | Brak sesji + niepubliczna trasa API lub strona kont: 401 (API) albo przekierowanie do logowania (strona), bez danych kont | negatywne |
| S01-K4 | Wylogowanie: sesja wygasa, kolejne żądanie do niepublicznej trasy kończy się 401 | negatywne |
| S01-K5 | Logowanie: hasła i tokeny nie trafiają do loggera | niefunkcjonalne (bez ekranu) |
| S01-K6 | `GET /api/bank-accounts/{id}`: własne konto 200; konto innego użytkownika 403 bez danych | negatywne (API) |

### E01-S02 (#11): Żona loguje się własnym kontem i widzi tylko wspólne konto bankowe (zależy od S01; D02, A02)

| Nr | Kryterium (skrót) | Typ |
|---|---|---|
| S02-K1 | Poprawne dane żony: zalogowana, widzi wspólne konto bankowe | pozytywne |
| S02-K2 | Widok kont lub API listy: osobiste konto właściciela nie występuje w odpowiedzi ani w interfejsie | negatywne |
| S02-K3 | Bezpośrednie żądanie zasobu osobistego konta właściciela po id: odmowa (403 lub 404), zero danych | negatywne (API) |
| S02-K4 | Brak sesji + niepubliczna trasa z danymi wspólnego konta: 401 | negatywne (API) |
| S02-K5 | Jednoczesne sesje żony i właściciela są niezależne, żadna nie widzi danych drugiej | negatywne |

### Zadania techniczne (nie mają własnych ekranów, tylko wskazują, kto je realizuje)

| Zadanie | Treść | Związek z ekranami |
|---|---|---|
| E01-S01-T01 (#17) | Awilix (composition root) | brak |
| E01-S01-T02 (#18) | Warstwa HTTP, auth, env, logger (kroki 1.1-2.5) | źródło kontraktów API i kodów błędów (401, 403, 429) |
| E01-S01-T03 (#19) | Strona logowania w Tailwind (krok 2.6) | s01 (i s02 wg kroku 2.6: "widok kont na `/`") |
| E01-S01-T04 (#20) | Encje i migracja | brak (model: członkostwo wyznacza dostęp) |

Zasady biznesowe z briefu dotykające E01: R03 (wynik per konto bankowe, dlatego konto bankowe jest pojęciem pierwszej klasy), D01 (osobne logowania), D02 (S02 zakładana mimo częściowego A02). R01/R02 dotyczą E02/E03, nie E01.

---

## 2. Ekrany i stałe ID

| ID | Ekran | Adres | Kto widzi | Historie | Stan w DS |
|---|---|---|---|---|---|
| s01 | Logowanie | `/login` | niezalogowany (jedyna strona publiczna) | S01-K1, K2, K3(cel przekierowania), K4(cel po wylogowaniu), S02-K1 | gotowy w Storybooku (`screens/e01/login-screen`) |
| s02 | Strona główna: lista kont bankowych | `/` | zalogowany (właściciel: 2 konta, żona: 1 konto) | S01-K1, S01-K3, S01-K4, S02-K1, S02-K2, S02-K5 | gotowy w Storybooku (`screens/e01/home-screen`) |

Nie ma ekranów dla: S01-K5 (logi), S01-K6, S02-K3, S02-K4 (tylko API). Zadania T01, T02, T04 nie mają UI. Nie dodaję ekranów spoza materiałów (rejestracja, reset i zmiana hasła, ustawienia konta, strona szczegółów konta: poza zakresem, Q1, Q9, Q17). Czy potrzebny jest ekran "brak dostępu" przy wejściu na cudze konto przez adres: P14.

Przepływy między ekranami: brak sesji, dowolny adres -> s01. s01 sukces -> s02. s02 "Wyloguj" -> s01 (spec: "`/` przekierowuje" po wylogowaniu). s02 wybór konta -> ekran konta z E02/E03 (poza E01, cel linku nierozstrzygnięty: P8).

---

## 3. Stany per ekran

Legenda: kolumna "Odwołanie" wskazuje historię i kryterium; "brak kryterium" oznacza stan z specyfikacji technicznej lub DS bez kryterium w issue (zob. sekcja 7). Stany "nie dotyczy" są uzasadnione.

### s01 Logowanie

| Stan | Opis | Odwołanie | Story DS |
|---|---|---|---|
| domyślny | pusty formularz: e-mail, hasło, "Zaloguj się" | S01-K1, S02-K1 | "Stan: pusty formularz" |
| błąd walidacji (jedno pole / kilka) | puste lub niepełne pola, błąd pod polem, podsumowanie przy kilku | brak kryterium (spec: 400 `validation_error`, "fokus na błędzie"); P3 | "błąd pola po opuszczeniu", "kilka błędów z podsumowaniem" |
| ładowanie | wysyłanie, przycisk "Logowanie…" | S01-K1 (stan "wysyłanie" wg spec UI/UX) | "Stan: wysyłanie" |
| błąd: złe dane | komunikat ogólny (401 `invalid_credentials`), identyczny dla nieznanego e-maila i złego hasła | S01-K2 | "błędny e-mail lub hasło" |
| błąd: blokada po zbyt wielu próbach | 429 `too_many_attempts` z czasem ("za 87 sekund") | brak kryterium (Q14 i Edge Cases w spec); P2 | "blokada po zbyt wielu próbach" |
| błąd: brak sieci | komunikat o połączeniu, wpisane dane zostają | brak kryterium; P3 | "brak sieci" |
| błąd: serwer (500 `internal`, np. baza niedostępna) | brak komunikatu w DS | brak kryterium (Edge Cases w spec); P3, luka DS | brak story |
| pusty | nie dotyczy: brak danych do wczytania | n/a | n/a |
| brak dostępu | nie dotyczy: strona publiczna; zalogowany na `/login`: propozycja przekierowania, P5 | n/a / P5 | brak |
| konflikt | nie dotyczy: brak współbieżnej edycji; sesje niezależne (S02-K5) nie dają stanu na s01 | n/a | n/a |
| wynik usługi zewnętrznej | nie dotyczy: brak usług zewnętrznych w E01 | n/a | n/a |
| wejście z przekierowania (brak sesji, sesja wygasła 30 dni nieaktywności lub 90 dni od logowania) | ten sam ekran co domyślny; spec: tylko redirect, bez komunikatu; P4 | S01-K3 | brak odrębnego stanu |
| po wylogowaniu | ekran domyślny po `POST /api/auth/logout` | S01-K4 | brak odrębnego stanu |
| sukces | przekierowanie na s02 | S01-K1, S02-K1 | (przekierowanie) |
| szerokości | 320 px, 768 px, 1440 px | wymóg DS | "Szerokość: 768 px", "320 px" |

### s02 Strona główna (lista kont bankowych)

| Stan | Opis | Odwołanie | Story DS |
|---|---|---|---|
| domyślny: właściciel | wspólne i osobiste konto, plakietki "Wspólne" / "Osobiste", link "Wyloguj" | S01-K1 | "wczytane konta" |
| domyślny: żona | tylko wspólne konto; brak osobistego konta właściciela | S02-K1, S02-K2 | "członek tylko konta wspólnego" |
| ładowanie | szkielety listy, `aria-busy` | brak kryterium (spec UI/UX); P1 | "ładowanie" |
| pusty (brak członkostwa) | "Nie masz jeszcze żadnego konta bankowego" | brak kryterium (spec UI/UX: `EmptyState` gdy pusta); P1, P15 | "brak kont" |
| błąd wczytania | "Nie udało się wczytać kont bankowych" + "Spróbuj ponownie" (500/baza) | brak kryterium (Edge Cases w spec); P3 | "błąd wczytania" |
| brak dostępu: brak/wygasła sesja | nie jest stanem s02: przekierowanie na s01, bez danych kont | S01-K3, S02-K4 | (przekierowanie) |
| brak dostępu: cudze konto po id | nie jest stanem s02 (lista pokazuje tylko własne); odmowa tylko w API, brak ekranu; P14 | S01-K6, S02-K3 | brak |
| konflikt | nie dotyczy (lista tylko do odczytu); niezależność jednoczesnych sesji pokazuje scenariusz z sekcji 5 | S02-K5 | n/a |
| wynik usługi zewnętrznej | nie dotyczy | n/a | n/a |
| długa nazwa konta, 320 px, 768 px | zawijanie, pasek w jednym wierszu | wymóg DS | "320 px, długa nazwa konta", "768 px" |
| po wylogowaniu | s02 przekierowuje na s01 | S01-K4 | (przekierowanie) |

---

## 4. Role i widoczność

W AITL nie ma ról (Q7: "bez ról; dostęp wyłącznie z członkostwa"). Różnice wynikają z członkostwa w kontach bankowych.

| Kto | s01 `/login` | s02 `/` | Dane widoczne |
|---|---|---|---|
| Niezalogowany (brak lub wygasła sesja) | widzi formularz | przekierowanie na s01 | zero danych kont; API 401 (S01-K3, S02-K4) |
| Zalogowany, członek wspólnego i osobistego (właściciel) | spec milczy, propozycja przekierowania na `/` (P5) | lista: wspólne + osobiste | oba konta; cudze konta 403 (S01-K6) |
| Zalogowany, członek tylko wspólnego (żona, seed `--shared-only`) | j.w. | lista: tylko wspólne | wspólne; osobiste konto właściciela niewidoczne, żądanie po id 403 lub 404 (S02-K2, K3) |
| Zalogowany bez żadnego członkostwa | j.w. | stan pusty | nic (model: seed zawsze tworzy członkostwo, więc stan osiągalny tylko anomalią, P15) |

Niezmiennik modelu: członkiem konta osobistego jest wyłącznie jego właściciel; błąd decyzji dostępu oznacza odmowę (fail-closed).

---

## 5. Scenariusze (kontrolki prototypu) i dane demo

### Scenariusze do przełączania

| Kontrolka | Wartości | Ekran | Odwołanie |
|---|---|---|---|
| Użytkownik zalogowany | brak sesji / właściciel / żona / bez członkostwa | s01, s02 | S01-K1, S02-K1, K2 |
| Sesja | aktywna / wygasła po 30 dniach nieaktywności / wygasła po 90 dniach od logowania / wylogowana | s01 (cel redirectu), s02 | S01-K3, K4 |
| Wynik logowania | poprawne dane / złe hasło / nieznany e-mail (ten sam komunikat) | s01 | S01-K2 |
| Liczba prób | 1-4 błędne / zbyt wiele prób (blokada, czas 15 min, pokazuje sekundy) | s01 | brak kryterium (P2) |
| Sieć i serwer | normalnie / brak sieci / błąd serwera 500 | s01, s02 | brak kryterium (P3) |
| Lista kont | wczytane / ładowanie / pusta / błąd wczytania | s02 | brak kryteriów (P1, P3) |
| Nazwa konta | krótka / bardzo długa (320 px) | s02 | wymóg DS |
| Liczba kont wspólnych | jedno / dwa (model dopuszcza wiele, Q19) | s02 | P10 |
| Dwie sesje naraz | wyłączone / właściciel i żona obok siebie | s02 | S02-K5 |
| Żądanie konta po id | własne / cudze (odmowa) | poza UI, tylko wskaźnik w panelu prototypu | S01-K6, S02-K3 (P14) |
| Szerokość | 320 / 768 / 1440 px | oba | wymóg DS |

### Dane demo (fikcyjne, oznaczone "(przykład)", zgodnie z A5)

Stały "teraz" prototypu: **2026-11-24, 10:00 (Europe/Warsaw)**, zamrożony (jedyny element zależny od czasu w E01 to sekundy blokady i wygasanie sesji; sesja demo została założona 2026-11-20 10:00, więc ani limit 30, ani 90 dni nie zbliża się do końca, dopóki scenariusz "sesja wygasła" go nie wymusi).

Użytkownicy: po jednym na kombinację członkostwa.

| Użytkownik (fikcyjny) | e-mail (przykład) | Członkostwa | Kombinacja |
|---|---|---|---|
| Paweł (przykład) | pawel@example.com | "Konto wspólne (przykład)" + "Konto osobiste Pawła (przykład)" | właściciel |
| Żona (przykład) | zona@example.com | "Konto wspólne (przykład)" | tylko wspólne |
| Gość bez kont (przykład) | gosc@example.com | brak | bez członkostwa |

Dodatkowo, dla scenariuszy nazwy: konto z bardzo długą nazwą (jak w istniejącej story: "KontoWspólneRodzinyKowalskichNowakówNaWydatkiDomoweRachunkiIWakacje (przykład)") oraz drugie konto wspólne "Konto wspólne: wakacje (przykład)" (tylko dla scenariusza "dwa konta wspólne"). Hasła w prototypie: dowolny literał oznaczony "(przykład)", nigdy prawdziwy; w demo "poprawne dane" i "złe dane" rozstrzyga kontrolka scenariusza, nie wpisana wartość. Kwot nie ma, E01 ich nie pokazuje.

---

## 6. Komponenty systemu projektowego per ekran i luki DS

### Komponenty

| Ekran | Komponenty z DS | Uwagi |
|---|---|---|
| s01 | `AppShell` (bez `logoutHref`), `LoginForm` (w środku: `Card`, `Field`, `Input` typ `email` i `password`, `Button` ze `loading`, `Alert` wariant `error`, `ErrorSummary`, `useFormValidation`), `formatSeconds` | blokada, złe dane i brak sieci jako `Alert` na górze formularza; brak "pokaż hasło" i resetu (poza zakresem) |
| s02 | `AppShell` (z `logoutHref`), `BankAccountList` (w środku: `Card`, `Badge` wariant `shared`/`personal`, `Skeleton`, `EmptyState`, `ErrorState`), `TextLink` | plakietki oznaczone tekstem, nie samym kolorem |

Tokeny: tylko znaczeniowe (`--primary` na pasku, `--badge-shared-*`, `--badge-personal-*`, `--destructive` w błędach); kolumna do 960 px.

### Luki DS (zapisane, nierozstrzygnięte; nic nie wymyślam)

| Nr | Luka | Kontekst |
|---|---|---|
| LDS1 | Wylogowanie jako akcja zmieniająca stan (`POST` z nagłówkiem CSRF `X-Requested-With`) jest dziś `TextLink`, czyli linkiem; brak wariantu przycisku wyglądającego jak link | s02; zob. P6 (DS sam zapisał "do decyzji w etapie 5") |
| LDS2 | Brak miejsca w `AppShell` na informację o zalogowanej osobie (`displayName`) | s02; zob. P7 |
| LDS3 | Brak wzorca stanu "brak dostępu" (403/404) bez ponawiania: `ErrorState` jest zbudowany z "Spróbuj ponownie" (do sprawdzenia, czy `onRetry` jest opcjonalne); `EmptyState` nie pasuje znaczeniowo | zob. P14; potrzebne dopiero od E02/E03 |
| LDS4 | `LoginForm` nie ma komunikatu ani story dla błędu serwera 500 (są: złe dane, blokada, sieć) | s01; zob. P3 |
| LDS5 | Blokada pokazuje stały tekst z sekundami; brak odliczania na żywo i brak stanu przycisku "zablokowany do …" | s01; zob. P2 |
| LDS6 | Ciemny motyw (L3): tylko struktura, brak wartości i kontrastu | oba ekrany |
| LDS7 | Marka (L4) i zestaw ikon (L5): nagłówek to sam tekst "AITL", `Alert` i `EmptyState` bez ikon | oba ekrany |
| LDS8 | Brak odrębnego komunikatu "sesja wygasła" (technicznie dałby się złożyć z `Alert` wariant `neutral` nad formularzem; wzorzec nieopisany, istniejący `Alert` siedzi wewnątrz `LoginForm`) | s01; zob. P4 |

Strony w `packages/app` (route `(auth)/login`, widok na `/`, przekierowania) jeszcze nie istnieją (etap 5): to brak implementacji, nie luka DS.

---

## 7. Luki w specyfikacji i pytania do właściciela produktu

Nic poniżej nie jest rozstrzygnięte; rekomendacja to moja propozycja do przyjęcia lub odrzucenia. Typy: (A) kryterium bez ekranu, (B) stan bez kryterium, (C) sprzeczność, (D) nierozstrzygnięta decyzja.

### P1 (B). Stany "ładowanie" i "pusta lista" na s02 nie mają kryterium
Spec UI/UX mówi "`EmptyState` gdy pusta", DS ma story, a żadne kryterium S01/S02 tego nie opisuje.
Rekomendacja: dopisać do S01 jedno kryterium (np. "Given użytkownik bez żadnego członkostwa, When otwiera `/`, Then widzi komunikat o braku kont, bez błędu") i zostawić stan ładowania jako szczegół implementacji bez kryterium.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P2 (B). Blokada po zbyt wielu próbach (429) nie ma kryterium
Stan jest w spec (Q14, Edge Cases: próg 5 prób ip+email, 20 na sam e-mail, okno i blokada 15 min, pole `retryAfterSeconds`) i w DS, ale issue #10 nie ma kryterium. Dodatkowo blokada dotyczy też nieistniejących e-maili.
Rekomendacja: dodać do S01 kryterium negatywne: po 5 nieudanych próbach logowanie jest blokowane na 15 min, komunikat pokazuje czas i nie ujawnia, czy użytkownik istnieje; czas statyczny (bez odliczania na żywo, LDS5).
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P3 (B). Błąd walidacji pól, brak sieci i błąd serwera (500) na s01/s02 nie mają kryterium; 500 nie ma komunikatu w DS
Walidacja (400), brak sieci (komunikat DS: "wpisane dane zostały w formularzu"), 500 (baza niedostępna): w spec są tylko jako kody lub edge case. Dodatkowo Q8 (login = e-mail małymi literami) nie mówi, czy wpisanie "Jan@Example.com" ma działać.
Rekomendacja: jedno zbiorcze kryterium "błędy walidacji, sieci i serwera nie tracą wpisanych danych i nie ujawniają szczegółów"; dopisać komunikat i story dla 500 w `LoginForm` i `BankAccountList` (błąd wczytania już jest); wielkość liter e-maila normalizować po stronie serwera bez komunikatu.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P4 (D). Czy po wygaśnięciu sesji (30 dni nieaktywności lub 90 dni od logowania) pokazać komunikat na `/login`?
Spec: "401 i redirect", bez komunikatu; użytkownik nie odróżni, czy został wylogowany, czy nigdy się nie logował.
Rekomendacja: w pierwszej wersji bez komunikatu (zgodnie ze spec, dwie osoby, lokalnie); w prototypie scenariusz "sesja wygasła" pokazuje zwykły s01. Jeśli właściciel chce komunikat: neutralny `Alert` ("Sesja wygasła. Zaloguj się ponownie."), wymaga rozróżnienia przyczyn przekierowania (LDS8).
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P5 (D). Zalogowany użytkownik wchodzi na `/login`
Spec milczy; strona DS zapisuje to jako propozycję do etapu 5 (przekierowanie na `/`).
Rekomendacja: przekierować na `/`.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P6 (D). Wylogowanie: link czy przycisk
`POST /api/auth/logout` wymaga nagłówka `X-Requested-With`, więc nie może być zwykłym `<a href>`; DS pokazuje `TextLink` jako wzorzec wyglądu i zostawia decyzję na etap 5.
Rekomendacja: przycisk obsługujący `fetch` z nagłówkiem, wyglądający jak link na pasku (LDS1); po sukcesie przekierowanie na `/login`.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P7 (D). Czy pokazywać, kto jest zalogowany
API logowania zwraca `displayName`, a `AppShell` pokazuje tylko "AITL" i "Wyloguj". Przy dwóch osobach na jednym urządzeniu nie widać, na którym koncie się jest; spec i kryteria tego nie wymagają.
Rekomendacja: pokazać `displayName` tekstem na pasku (LDS2), ale tylko jeśli właściciel uzna to za część E01; inaczej zostawić jak jest.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P8 (D). Dokąd prowadzi wybór konta na liście i co ze stroną `/`
Lista (s02) jest na `/`, a ekran konta z wpisami (E02) i przegląd miesiąca (E03) w DS leżą na `/?account=...&month=...`, czyli na tym samym adresie. DS zapisał "do decyzji właściciela", czy po E03 lista przestaje być osobnym widokiem. S01-K1 wymaga widoku kont na `/`.
Rekomendacja: w E01 cel linku konta to adres `/?account=<id>` z E02/E03; bez parametru `account` `/` pokazuje listę; wobec E03 decyzja osobno. W prototypie link konta prowadzi do atrapy "ekran konta (E02/E03)".
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P9 (D). Kolejność kont na liście
API zwraca "tylko z członkostwa" bez zdefiniowanej kolejności; DS zachowuje "kolejność z API" (także dla fokusu).
Rekomendacja: wspólne przed osobistymi, potem alfabetycznie po nazwie.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P10 (C). "Wspólne konto" w liczbie pojedynczej vs wiele kont wspólnych
Kryteria S01/S02 mówią o "wspólnym koncie bankowym" (jedno), brief o jednym wspólnym koncie, a Q19 (spec): "model dopuszcza wiele kont wspólnych", seed z nazwą z konfiguracji.
Rekomendacja: kryteria bez zmian (jedno konto na start), lista i prototyp generyczne (kontrolka "dwa konta wspólne"), dopisać do spec, że UI listy nie zakłada jednego.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P11 (C). Nieaktualne "Pytania otwarte" w issues #6, #10, #11
Issues nadal podają jako nierozstrzygnięty mechanizm zakładania kont użytkowników ("zasiew, skrypt CLI, rejestracja"), a spec rozstrzygnął to w Q1/Q6 (skrypt seed, bez rejestracji; T04 już to odnotowuje). #6 wymienia też "Poza zakresem" bez non-goals.
Rekomendacja: zaktualizować pytania otwarte w #6, #10, #11 zgodnie ze specem (Q1, Q6, Q9, Q17).
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P12 (C). "Bez UI żony" (Q13, TLDR spec) vs kryteria S02 wymagające interfejsu
Spec: "model gotowy na żonę + test 403, bez UI żony", a S02-K1 i K2 mówią o tym, co żona "widzi w interfejsie", i DS ma story "członek tylko konta wspólnego". Krok 2.7 testuje tylko przez route, a scenariusz w przeglądarce istnieje tylko dla S01.
Rekomendacja: odczytać "bez UI żony" jako "bez odrębnych ekranów, ten sam s01 i s02"; dopisać do kroku 2.7 przeglądarkowy scenariusz żony albo zapisać, że S02-K1/K2 w UI weryfikuje się ręcznie.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P13 (C). Kod odmowy: 403 vs "403 lub 404"
S01-K6 i Q14, Q20: 403; S02-K3: "403 lub 404". Edge case spec: asercja na koncie osobistym -> 403.
Rekomendacja: ujednolicić na 403 dla istniejącego cudzego konta (zgodnie z Q14, Q20) i zawęzić S02-K3 do 403.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P14 (A). Kryteria S01-K6 i S02-K3 (odmowa dostępu do cudzego konta) nie mają ekranu
Odmowa istnieje tylko w API. Gdy E02/E03 pozwolą wejść na konto przez adres `?account=<id>`, użytkownik trafi na odmowę bez zdefiniowanego widoku (LDS3). E01 nie ma strony konta, więc zakres E01 kończy się na API.
Rekomendacja: w E01 bez ekranu (poza zakresem), a ekran "brak dostępu" zdefiniować w E02/E03; w prototypie tylko wskaźnik w panelu scenariuszy.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P15 (D). Użytkownik bez członkostwa jest nieosiągalny przez seed
Seed (Q6, Q19) zawsze tworzy członkostwo (właściciel: wspólne + osobiste; żona: wspólne), więc stan pusty s02 powstaje tylko przez anomalię (np. ręcznie usunięte członkostwo). Prośba o "konta po jednym na kombinację" i stan pusty z DS wymagają jednak takiego konta.
Rekomendacja: zachować stan jako obronny (fail-safe) i pokazać go w prototypie jako scenariusz "bez członkostwa"; bez dodatkowych funkcji.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P16 (D). Ryzyko A02 dla historii S02
D02 zakłada S02 mimo częściowego A02 (relacja z drugiej ręki, notatka z rozmowy nadal brak). Jeśli A02 okaże się fałszywe, S02 i s02 w wariancie "żona" mogą zniknąć.
Rekomendacja: prototypować wariant żony jako zatwierdzony (D02), oznaczyć go w prototypie notką "ryzyko A02", a materiał z rozmowy z żoną zebrać przed wdrożeniem S02.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

### P17 (A). S02-K5 (niezależne sesje) i S01-K5 (logi) bez ekranu
S01-K5 jest niefunkcjonalne (bez ekranu, słusznie). S02-K5 nie ma stanu ekranu, tylko test integracyjny; prototyp może to pokazać jedynie kontrolką "dwie sesje naraz".
Rekomendacja: S01-K5 pominąć w prototypie; S02-K5 pokazać kontrolką dwóch sesji obok siebie (właściciel i żona), bez nowych ekranów.
Decyzja: przyjęta rekomendacja (właściciel produktu, 2026-11-24).

---

Podsumowanie liczb: 2 ekrany (s01, s02), 2 historie (11 kryteriów łącznie: 6 + 5) i 4 zadania techniczne, 17 luk i pytań w specyfikacji (P1-P17), 8 luk DS (LDS1-LDS8).

**Mapa zatwierdzona przez właściciela produktu 2026-11-24: wszystkie luki P1-P17 rozstrzygnięte zgodnie z rekomendacjami (w tym P7: imię zalogowanego na pasku, P8: link konta `/?account=<id>`, P12: te same ekrany dla żony).**
