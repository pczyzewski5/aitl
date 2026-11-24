# Test design systemu agentem: ekran "Prognoza na kolejne miesiące"

Status: przygotowany, nie wykonany. Test wykonuje się w NOWEJ sesji (po `/clear`), żeby agent nie znał odpowiedzi z rozmowy, w której powstawał system.

## Dlaczego ten ekran

Wszystkie historie E01-E03 mają już ekrany w Storybooku (patrz "Czego brakuje", pokrycie backlogu), a E04 i E05 są zaparkowane i bez historii. Ekran prognozy pochodzi z jedynej linii E04 w briefie (`.ai/specs/product-brief.md`: "Later: prognoza i planowanie wykraczające poza bieżący miesiąc"). Został wybrany, bo wymusza decyzje, na które system nie ma jeszcze odpowiedzi, czyli właśnie to, co test ma wykryć:

- wiele miesięcy naraz (dziś system zna jeden miesiąc i `MonthSwitcher`),
- zestawienie liczb per konto w czasie bez ogólnej tabeli danych (jest tylko `EntryTable`) i bez wykresu (brak komponentu, brak wzorca),
- zasada R01.8 / A4: wynik zawsze osobno per konto, bez łącznej liczby,
- rozróżnienie wartości policzonych z wpisów cyklicznych od niepewnych (brak wpisów jednorazowych w przyszłości),
- stany: ładowanie, błąd, brak kont, miesiąc bez wpisów, wynik ujemny, długie nazwy, 320 px.

Uwaga: E04 nie ma specyfikacji ani historii, więc część decyzji produktowych (ile miesięcy, skąd dane) z założenia nie ma odpowiedzi w repo. Agent ma je zapisać jako ZGADUJĘ i LUKA, nie dopowiadać z wyobraźni. Jeśli właściciel woli ekran w pełni objęty specyfikacją, alternatywa: strona odmowy dostępu (403) dla cudzego konta z `.ai/specs/2026-11-17-entries-income-expenses.md` (sekcja o dostępie).

## Zadanie dla agenta (do wklejenia w kolejnej sesji)

Przeczytaj `AGENTS.md`, `docs/design-system.md` i `packages/ui/POSTEP.md`. Zbuduj w `packages/ui/src/screens/e04/` ekran "Prognoza na kolejne miesiące": dla każdego konta bankowego użytkownika pokazuje, ile zostanie w kolejnych miesiącach na podstawie wpisów cyklicznych, osobno per konto, w jednej kolumnie do 960 px, z `AppShell`. Używaj wyłącznie komponentów, tokenów i wzorców z systemu projektowego.

Zasady:
- bez nowych kolorów, odstępów, promieni, wariantów i komponentów wielokrotnego użytku;
- brak komponentu lub zasady: zapisz jako lukę i użyj najbliższego istniejącego;
- bez dodawania testów, eksportów i konfiguracji; tylko ekran i jego story;
- język interfejsu: polski, kwoty w formacie "3 975,50 zł", dane przykładowe oznaczone "(przykład)";
- nie poprawiaj systemu projektowego, tylko opisz braki.

Krok 1, przed kodem: wypisz wszystkie decyzje (układ, komponenty, stany, odstępy, kolory, teksty, zachowanie przy błędzie, telefon) z etykietą:
- REGUŁA: wynika z zapisanej zasady (podaj plik i miejsce),
- PRZYKŁAD: skopiowane z istniejącego story lub ekranu (podaj które),
- ZGADUJĘ: nie znalazłeś odpowiedzi (napisz, co zakładasz).

Krok 2: zbuduj ekran i story ze stanami, sprawdź wartości na sztywno (`npm run check:tokens`).

Wynik: (1) lista luk pogrupowana (brakujący komponent, stan, zasada, niejasna lub sprzeczna dokumentacja) z tym, co agent zgadł, gdzie i co dopisać; (2) liczby REGUŁA / PRZYKŁAD / ZGADUJĘ; (3) wynik `check:tokens`.

## Kryteria oceny (dla właściciela)

| Kryterium | Dobry wynik |
|---|---|
| Brak nowych wartości | `check:tokens` bez uwag, brak nowych tokenów i komponentów |
| Każda decyzja z etykietą | żadna decyzja bez REGUŁA / PRZYKŁAD / ZGADUJĘ; reguły ze wskazanym plikiem |
| Stosunek | im więcej REGUŁA i PRZYKŁAD, tym lepiej; punkt odniesienia z DevMentora: 19 reguł, 14 przykładów, 27 zgadnięć (to wynik przed poprawkami, nie cel) |
| Brak zmyślonych danych | dane oznaczone "(przykład)", brak łącznej sumy kont (A4) |
| Stany | ładowanie, błąd, brak kont, miesiąc bez wpisów, wynik ujemny, długie teksty, 320 px |
| Szczerość | luki (np. brak wykresu, brak tabeli danych, liczba miesięcy) opisane, nie ukryte |

Po teście: każde ZGADUJĘ zamienić w zadanie (zasada w `docs/design-system.md`, nowy stan, komponent albo wpis w "Czego brakuje"), potem powtórzyć test w kolejnej nowej sesji.
