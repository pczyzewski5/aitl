# Prototyp discovery: logowanie i lista kont bankowych (E01), rewizja 001

Data: 2026-11-24 (stały "teraz" prototypu: 2026-11-24 10:00). Brief: `.ai/specs/product-brief.md`. Przepływ: "logowanie i lista kont bankowych (E01)". Poprzednia rewizja: brak. Raport panelu: nie podano (brak sekcji `[SYNTHETIC]`).

Pytanie, na które prototyp odpowiada: ROLA, czyli czy właściciel i żona zalogują się własnymi kontami i zobaczą swoje konta bankowe oraz co zobaczą przy błędach. Nie dotyczy wyglądu ani implementacji.

## Jak uruchomić

Otwórz `index.html` lokalnie w przeglądarce (np. `open .ai/prototypes/discovery/e01-logowanie-konta/revision-001/index.html`). Bez serwera, bez sieci, bez zależności. Przycisk "Reset symulacji" w panelu scenariuszy przywraca stan początkowy (brak sesji, ekran logowania). Cały stan jest w pamięci strony; odświeżenie też resetuje.

Dane są fikcyjne (przykład): Paweł (pawel@example.com), Żona (zona@example.com), Gość bez kont (gosc@example.com). Hasło jest obojętne; wynik logowania wybiera panel scenariuszy, nie wpisana wartość. Logowanie, sesje, blokada, lista kont i żądania API to symulacja.

## Aktor, start, sukces

- Aktorzy: właściciel (konta: wspólne i osobiste), żona (tylko wspólne), użytkownik bez członkostwa (stan obronny).
- Start: brak sesji, wejście na `/` (przekierowanie na `/login`).
- Sukces: zalogowany widzi swoje konta bankowe (właściciel dwa, żona jedno), wylogowanie wraca na `/login`.

## Ekrany i stany (z zatwierdzonej mapy ekranów)

Źródło: `.ai/specs/design/2026-11-24-mapa-ekranow-e01.md` (zatwierdzona przez właściciela produktu 2026-11-24, P1-P17) oraz spec `.ai/specs/2026-11-17-auth-and-app-foundation.md` (decyzje Q23-Q28).

| Ekran / stan | Akcja w prototypie | Następny stan | Odniesienie |
|---|---|---|---|
| s01 `/login`, domyślny | wpisz e-mail i hasło, "Zaloguj się" | ładowanie, potem wynik wg panelu | S01-K1, S02-K1 |
| s01 walidacja (jedno lub kilka pól) | puste lub niepełne pola | błąd pod polem, przy kilku podsumowanie, fokus na pierwszym polu | Q23, P3 |
| s01 ładowanie | po wysłaniu | przycisk "Logowanie…", 0,7 s | spec UI/UX |
| s01 złe dane | wynik "Złe hasło" lub "Nieznany e-mail" | ten sam komunikat ogólny, nieudane próby rosną | S01-K2 |
| s01 blokada | wynik "Zbyt wiele prób" albo 5 nieudanych prób | komunikat z czasem 900 s (statyczny), trwa do Resetu lub wylogowania | Q23, P2 |
| s01 brak sieci, błąd serwera 500 | odpowiedni wynik | komunikat, wpisane dane zostają | Q23, P3 |
| s01 po wygaśnięciu sesji (30 dni nieaktywności, 90 dni od logowania) i po wylogowaniu | zmiana "Stan sesji" lub "Wyloguj" | zwykły ekran logowania, bez komunikatu | S01-K3, S01-K4, P4 |
| s01 zalogowany | wejście na `/login` z sesją | przekierowanie na `/` | Q24, P5 |
| s02 `/`, właściciel | poprawne logowanie jako właściciel | wspólne przed osobistymi, plakietki tekstem, `displayName` na pasku | S01-K1, Q25, Q26 |
| s02 `/`, żona | poprawne logowanie jako żona | tylko konta wspólne | S02-K1, S02-K2, Q27 |
| s02 ładowanie, pusta, błąd wczytania | panel "Lista kont" lub użytkownik bez członkostwa | szkielet (0,6 s lub zatrzymany), komunikat o braku kont, błąd z "Spróbuj ponownie" | Q23, P1, P15 |
| s02 długa nazwa, dwa konta wspólne | panel | zawijanie nazwy, trzy konta w kolejności | wymóg DS, P9, P10 |
| s02 wylogowanie | "Wyloguj" na pasku (przycisk wyglądający jak link) | `/login` | Q24, P6 |
| s02 dwie sesje naraz | panel: obok siebie właściciel i żona | niezależne listy i wylogowania | S02-K5, P17 |
| Link konta | klik w konto | atrapa "Ekran konta (poza tym prototypem)" pod `/?account=<id>`, z powrotem do listy | Q26, P8 |
| Żądanie konta po id | panel "Symuluj GET" | tylko wskaźnik tekstowy: 200 własne, 403 cudze (jako żona), 401 bez sesji | S01-K6, S02-K3, Q28, P14 |
| Nieznany adres | panel "Wejdź na nieznany adres" | strona z powrotem na `/` (zachowanie w produkcie nieustalone) | rekonstrukcja ścieżek |

Wykluczone z prototypu: S01-K5 (logi, bez ekranu), rejestracja, reset i zmiana hasła, ekran konta E02/E03, ekran "brak dostępu" (Q28, P14), ciemny motyw, marka. Szerokość: zmień okno przeglądarki (320 / 768 / 1440 px).

## Zachowane reguły i decyzje

Prototyp nie zmienia reguł ani decyzji z briefu. D01 (osobne logowania), D02 (historia żony zakładana mimo częściowego A02, status: ryzyko A02 pozostaje; materiał z rozmowy z żoną do zebrania przed wdrożeniem S02, P16). R03 (wynik per konto bankowe) dotyczy E02/E03 i nie jest tu pokazywany. Decyzje właściciela produktu Q23-Q28 i P1-P17 z 2026-11-24 zastosowane tak, jak zatwierdzone. Brief ma brak non-goals.

## Założenia i luki ([ASSUMPTION])

- [ASSUMPTION] A-P1: Tekst błędu serwera 500 w s01 ("Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę; wpisane dane zostały w formularzu.") jest mój; DS nie ma takiego komunikatu (LDS4, P3). Sprawdzenie: właściciel akceptuje lub poprawia tekst.
- [ASSUMPTION] A-P2: Blokada pojawia się po 5 nieudanych próbach w prototypie (próg z Edge Cases specu: `ip+email`, 5) i trwa do Resetu lub wylogowania; w produkcie blokada wygasa po 15 min. Czas pokazany statycznie jako "900 sekund (15 minut)" (LDS5).
- [ASSUMPTION] A-P3: Kolejność nazw wśród kont wspólnych (alfabetycznie po nazwie, `pl`) i druga nazwa wspólnego konta ("Konto wspólne: wakacje (przykład)") są ilustracją P9/P10.
- [ASSUMPTION] A-P4: Odpowiedź na "Nieznany adres" jest atrapą; spec nie ustala strony 404.
- [ASSUMPTION] A-P5: Po poprawnym logowaniu stan sesji wraca do "aktywna" (nowa sesja).
- [ASSUMPTION] A-P6: Fokus po błędzie logowania (komunikat z usługi) trafia na pole e-mail; spec mówi tylko "fokus na błędzie".
- Przycisk "Wyloguj" pokazuje wyłącznie przeniesienie na `/login`; nagłówek CSRF jest poza prototypem.

Zatwierdzenie symulacji nie dowodzi popytu ani nie spełnia Definition of Ready.

## Weryfikacja

Przegląd statyczny: wszystkie odwołania lokalne, brak `fetch`, storage, zewnętrznych adresów, skryptów i czcionek; formularz nie wysyła danych (`preventDefault`); dane w węzłach tekstowych; etykiety pól, statusy `role=alert/status`, fokus na nagłówku po zmianie widoku, widoczny fokus, układ jednokolumnowy poniżej 600 px. Zrobione.

Przeglądarka: NIE uruchomiono. Descriptor `.ai/browsers/agent-browser.md` wymaga `agent-browser`, którego nie ma w `PATH` ani w cache; jego instalacja (pobranie z GitHub) jest poza zakresem tej umiejętności. Zamiast tego wykonano skrypt kontrolny w jsdom (Node, bez przeglądarki; nie jest to przejście w przeglądarce): 29 sprawdzeń przepływu, wszystkie przeszły (przekierowania, walidacja, błędy z zachowaniem danych, blokada, logowanie właściciela i żony, kolejność i linki kont, stany listy, wygasanie sesji, wylogowanie, dwie sesje, Reset). Skrypt wykrył i pozwolił naprawić błąd w tej rewizji (opóźnione rysowanie listy po wylogowaniu). Nie sprawdzono: wygląd, fokus i nawigacja klawiaturą w prawdziwej przeglądarce, wąski viewport, zrzuty ekranu, cofanie/naprzód przeglądarki, czytniki ekranu.

Status: `Verification: not-run` (przegląd statyczny przeszedł, przejścia w przeglądarce brak).

## Pytania do właściciela produktu

1. Czy komunikat błędu serwera (A-P1) i brak komunikatu o wygaśnięciu sesji (P4) są akceptowalne po zobaczeniu w działaniu?
2. Czy nieznany adres ma mieć własną stronę (A-P4)?
3. Czy na liście kont przy blokadzie wystarczy czas statyczny (LDS5), skoro po 15 minutach trzeba odświeżyć stronę ręcznie?
