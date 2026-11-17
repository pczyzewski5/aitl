# Referencje wyglądu i tonu AITL

- Data: 2026-11-17
- Kto wybierał: właściciel produktu (jedyna referencja: jego makieta). Konflikty i propozycje rozstrzygnął właściciel produktu, 2026-11-17.
- Słowa charakteru (przyjęte): praktyczny, czytelny, spokojny, rzeczowy. („swojski" skreślone przez właściciela.)
- Antycharakter (przyjęty): generyczny, korporacyjny/bankowy, efekciarski, ciasny/nieczytelny, chaotyczny.
- Podstawa: `.ai/specs/product-brief.md`, makieta ekranu głównego (poza repo) (kod i CSS), audyt wyglądu makiety (poza repo). Zrzutów brak: wszystkie obserwacje pochodzą z kodu i z pomiarów audytu, nie z obrazu.
- Rodziny bez własnego opisu właściciela są wyprowadzone z kodu makiety i oznaczone w kolumnie Status (przyjęte przez właściciela jako całość: „zgodne, bez zastrzeżeń").

## Referencje

Źródło wszystkich wierszy: makieta ekranu głównego (poza repo) (makieta ekranu głównego AITL zbudowana przez agenta bez design systemu). Kto wybrał: właściciel. Waga: musi być. Status: przyjęte.
Pole „Nie podoba mi się" właściciel zostawił puste; kolumny „Nie bierzemy" i „Robimy zamiast tego" wypełnione na podstawie audytu wyglądu makiety (poza repo) i przyjęte przez właściciela.

| # | Referencja | Źródło | Kto wybrał | Obserwacja | Bierzemy | Nie bierzemy | Robimy zamiast tego | Dlaczego pasuje do produktu | Rodzina | Waga | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| R01.1 | Makieta: jasne tło i jeden kolor akcji | makieta ekranu głównego | właściciel | Jasnoszare tło strony `#f3f4f6`, białe powierzchnie, tekst w kolorze atramentu `#1f2937`, jeden kolor akcji `#2563eb` (pasek nagłówka, przyciski, ramka aktywnej karty), bez gradientu. | Stonowane jasne tło, białe powierzchnie, jeden kolor akcji w roli akcji i zaznaczenia | 14 kolorów wpisanych na sztywno, bez zmiennych i tokenów (paleta domyślna Tailwinda) | Ten sam wygląd, ale każdy kolor jako token znaczeniowy; niebieski akcji `#2563eb` zostaje (K1) | Spokojne narzędzie do prywatnych finansów dwóch osób; „praktyczny" to słowo właściciela | kolor | musi być | przyjęte |
| R01.2 | Makieta: kolory stanu finansowego i typu konta | makieta ekranu głównego | właściciel | Zielony `#16a34a` dla wpływu i dodatniej reszty, czerwony `#dc2626` dla wydatku i ujemnej reszty; plakietka niebieska = konto wspólne, fioletowa `#6d28d9` = osobiste. | Odróżnianie wpływu od wydatku oraz konta wspólnego od osobistego kolorem | Zielony 3,30:1 na bieli dla kwot 14 px; kolor jako jedyny nośnik aktywnego konta (sama niebieska ramka) | Zielony i czerwony stanu zostają odcieniami, przyciemnione do >= 4,5:1 na używanych tłach; drugi nośnik zawsze (znak +/-, etykieta lub znacznik tekstowy aktywnego konta) (K2) | Dwie główne osie produktu to wpływ/wydatek i konto wspólne/osobiste (brief, R02, R03) | kolor | musi być | przyjęte |
| R01.3 | Makieta: typografia | makieta ekranu głównego | właściciel | Czcionka systemowa (-apple-system, Segoe UI, Roboto), 7 rozmiarów (12, 13, 14, 16, 18, 20, 28 px), kwota „ile zostanie" 28 px/700, nagłówki tabeli 12 px wersalikami. | Czcionka systemowa i hierarchia: duża kwota wyniku > nagłówek > tekst | Rozrzut 12/13 i 14/16 oraz 18/20 bez skali | Czcionka systemowa, 4-5 rozmiarów zamiast 7 | Czytelność dla dwóch osób bez przygotowania; brak powodu do czcionki z zewnątrz (nie uzasadniam więcej: w briefie nic o typografii) | typografia | musi być | przyjęte |
| R01.4 | Makieta: kompozycja i gęstość | makieta ekranu głównego | właściciel | Jedna kolumna do 960 px; nagłówek „AITL" + „Wyloguj"; pasek miesiąca ← →; dwie karty kont obok siebie (auto-fit, min 260 px); pod nimi panel z listą wpisów; odstępy 12-32 px, średnia gęstość. | Układ: miesiąc u góry, dwie osobne karty „ile zostanie", pod nimi lista wpisów wybranego konta | Poziome przewijanie strony przy 320 px (scrollWidth 390); odstępy 2, 6, 14 px spoza siatki 4 px | Układ kartowy lub przewijany kontener tabeli na wąskim ekranie; odstępy wyłącznie z siatki 4 px | Przegląd miesiąca per konto to główny ekran produktu (R03) | kompozycja i gęstość | musi być | przyjęte |
| R01.5 | Makieta: komponenty | makieta ekranu głównego | właściciel | Karta konta (nazwa, plakietka typu, kwota 28 px, wpływy/wydatki); panel z nagłówkiem i „Dodaj wpis"; rozwijany formularz nad listą z widocznymi etykietami; tabela wpisów z checkboxem „Zapłacone"; stan pusty. Promienie 6/8/10 px; separacja tylko cieniem 1 px. | Karta konta, rozwijany formularz z widoczną etykietą przy każdym polu, tabela wpisów, stan pusty | Cień jako jedyny separator; `div` w `button`; checkbox o ramce 13 px; błąd walidacji bez wskazania pola; brak stanów ładowania i błędu; brak treści bez JS | Ramka lub tło o zdefiniowanym tokenie zamiast samego cienia; poprawna semantyka; cele min. 24 px; komunikat przy polu z `aria-invalid`/`aria-describedby`; jawne stany ładowania i błędu; `noscript` lub render po stronie serwera | Dodawanie wpisów jest głównym problemem właściciela w arkuszu (P01); wygodny formularz to sedno | komponenty | musi być | przyjęte |
| R01.6 | Makieta: ruch i reakcja | makieta ekranu głównego | właściciel | Praktycznie brak ruchu: tylko hover przycisków (ciemnieje, szarzeje); formularz pojawia się i znika bez animacji; brak potwierdzenia po zapisie. | Prawie bez animacji, tylko hover | Brak jakiegokolwiek potwierdzenia po zapisie wpisu | Jedyny dodatek: potwierdzenie po zapisie wpisu (P5) | Spokój i rzeczowość; potwierdzenie zapisu zastępuje brak informacji zwrotnej | ruch i reakcja | musi być | przyjęte |
| R01.7 | Makieta: ton wypowiedzi | makieta ekranu głównego | właściciel | Polski, rzeczowy, bez marketingu: „Ile zostanie w miesiącu", „Dodaj wpis", „Zapłacone"; notka „Kwoty w złotych (PLN)…"; dane oznaczone „(przykład)"; błędy mówią, co zrobić („Podaj opis.", „Podaj poprawną kwotę większą od zera.", „Podaj datę."); kwoty „3 975,50 zł". | Cały ton: krótko, po polsku, rozkaźnik „Podaj…", bez obietnic | Ozdobniki i wykrzykniki (propozycja przyjęta, P-H) | Bez ozdobników i wykrzykników; dane przykładowe zawsze oznaczone | Właściciel odchodzi od niewygodnego arkusza; ton ma nie przeszkadzać | ton wypowiedzi | musi być | przyjęte |
| R01.8 | Makieta: wynik „ile zostanie" zawsze osobno per konto | makieta ekranu głównego | właściciel | Dwie osobne liczby 28 px, po jednej na konto; brak sumy łącznej; flaga „zapłacone" nie zmienia sumy. | Zasada wyglądu: nigdy jednej łącznej liczby | Jedna łączna liczba obu kont | Dwie osobne liczby, każda w kontekście swojego konta | Reguły produktu R02 i R03 z briefu, nie gust | kompozycja i gęstość | musi być | przyjęte |

## Antyreferencje

Wszystkie przyjęte przez właściciela 2026-11-17 (właściciel sam nic nie wpisał; wszystkie były propozycją agenta).

| # | Antyreferencja | Podpis na ekranie | Podpis w kodzie | Powód (produkt/użytkownik) | Status |
|---|---|---|---|---|---|
| A1 | Generyczny wygląd AI | Gradient w nagłówku/tle/przycisku; indygo lub fiolet jako kolor akcji; ciemnogranatowe tło z poświatą; pigułka „nowość" nad nagłówkiem; rząd wielkich liczb; trzy identyczne karty z ikoną; iskierki AI; kolorowe słowo w nagłówku; wymyślone opinie i liczby | `linear-gradient`, `backdrop-filter`, kolory z domyślnej palety Tailwinda wpisane na sztywno, 0 zmiennych CSS | Antycharakter „generyczny"; audyt: makieta nie ma efektów, ale jest generyczna przez brak wyborów (paleta Tailwinda, szablon admina), co K1 rozwiązuje tokenami | przyjęte |
| A2 | Cień jako jedyny separator kart | Białe karty na szarym tle, bez ramki, tylko miękki cień | `box-shadow: 0 1px 3px rgba(0,0,0,.1)` na `.card` i `.panel` bez `border` | Audyt: występuje w makiecie; granica powierzchni ma być widoczna | przyjęte |
| A3 | Kolor jako jedyny nośnik informacji | Aktywne konto tylko niebieską ramką; kwota tylko zielona lub czerwona bez znaku/etykiety | Stan wyłącznie w klasie `.active`, brak `aria-pressed`; kwota rozróżniona wyłącznie `color` | Audyt; zasada dostępności, brak danych o wzroku użytkowników | przyjęte |
| A4 | Jedna łączna liczba „ile zostanie" | Jeden wielki kafelek z sumą obu kont | Funkcja sumująca konta w widoku wyniku | R03 w briefie: wynik osobno per konto | przyjęte |
| A5 | Wymyślone dane udające prawdziwe | Kwoty i opisy bez oznaczenia, że są przykładowe | Dane testowe bez sufiksu „(przykład)" i bez notki | Makieta oznacza „(przykład)"; ton rzeczowy bez udawania | przyjęte |

## Konflikty i rozstrzygnięcia

| # | Konflikt | Rozstrzygnięcie (właściciel, 2026-11-17) |
|---|---|---|
| K1 | „Zostaje wygląd i ton jak w makiecie" vs audyt: makieta jest generyczna przez brak wyborów, zalecana zmiana koloru akcji | Wygląd zostaje; niebieski akcji `#2563eb` zostaje; wartości stają się tokenami |
| K2 | „Czytelna" vs błędy czytelności w makiecie (`.note` 4,39:1, zielone kwoty 3,30:1, tabela przewijana poziomo na 320 px) | „Czytelna" wygrywa nad dokładnym odcieniem: zielony i czerwony stanu przyciemnione do >= 4,5:1 na używanych tłach |
| K3 | „Charakter jak w makiecie" vs brak jakiejkolwiek marki (sam tekst „AITL") | Nie rozstrzygnięte: otwarta luka (marka, logo, wyróżnik AITL), bez wymyślania |

## Luki

- L1. Typografia: rodzina bez osobnej referencji właściciela; decyzja: czcionka systemowa, 4-5 rozmiarów zamiast 7 (wyprowadzone z makiety, przyjęte).
- L2. Ruch: decyzja: prawie bez animacji, tylko potwierdzenie po zapisie wpisu (przyjęte).
- L3. Tryb ciemny: otwarta luka. Panel ma mieć tryb jasny i ciemny, makieta jest tylko jasna; brak referencji i wartości. W tokenach tylko struktura; drugi zestaw wartości w kolejnym kroku.
- L4. Marka (logo, wyróżnik „AITL", dawne K3): otwarta luka (P-I), bez wymyślania.
- L5. Ikony: makieta używa tylko znaków ← →; brak decyzji o zestawie.
- L6. Brak zrzutów: obserwacje z kodu i pomiarów audytu; zrzut z 1440 i 320 px mógłby potwierdzić wrażenie wizualne.
- L7. Brak innych referencji i antyreferencji: świadomy wybór właściciela, nie ma pomysłów.
- Odrzucona propozycja: A6 „wygląd banku/korporacji" jako antyreferencja (P-E). Odrzucona przez właściciela, nie zapisana w Antyreferencjach.

## Obrazy

Brak: nie ma zrzutów ekranu ani plików obrazów. Obserwacje oparte na kodzie makiety ekranu głównego i pomiarach z audytu wyglądu makiety (poza repo).
