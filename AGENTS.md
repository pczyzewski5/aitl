# AGENTS.md

AITL: aplikacja webowa do śledzenia oraz analizy wydatków. Opis dla ludzi w `README.md`.

## Założenia techniczne (obowiązują agentów)

- **Stack**: najnowszy Next.js, TypeScript, React, PostgreSQL + MikroORM, Awilix (DI), Tailwind, shadcn/ui. Nie wprowadzaj zamienników (inny ORM, kontener DI, framework CSS) bez zgody usera.
- **TypeScript**: wszędzie, bez `any` bez uzasadnienia.
- **Monorepo** (workspaces), kod w `packages/`:
  - `packages/app` (`@aitl/app`): główny kod aplikacji, Next.js, composition root kontenera DI.
  - `packages/core` (`@aitl/core`): części wielokrotnego użytku (logika domenowa, serwisy, typy, helpery). Bez zależności od Next.js i MikroORM.
  - `packages/db` (`@aitl/db`): konfiguracja MikroORM, encje, migracje, pula połączeń. Może zależeć najwyżej od `core`.
  - `packages/ui` (`@aitl/ui`): komponenty interfejsu wielokrotnego użytku. Nie zależy od `db`.
  - `app` może zależeć od pozostałych pakietów, żaden pakiet nie zależy od `app`. Nowe pakiety dodawaj w `packages/` pod nazwą `@aitl/<nazwa>`.
- **Baza danych**: PostgreSQL przez MikroORM. Zmiany schematu wyłącznie przez migracje, nigdy ręcznie ani przez synchronizację schematu.
- **Dependency Injection**: Awilix. Zależności wstrzykiwane przez konstruktor, rejestracja w kontenerze w `app`. Bez globalnych singletonów i `new` serwisów w logice biznesowej.
- **UI**: strony frontendowe stylujemy Tailwindem, strony backendowe (panel admina) budujemy na shadcn/ui. Komponenty współdzielone trafiają do `packages/ui`.

## Struktura `.ai/`

```
.ai/
├── specs/                  # specyfikacje (SDD)
│   ├── YYYY-MM-DD-slug.md  # aktywne
│   ├── implemented/        # zaimplementowane
│   └── archive/            # porzucone / nieaktualne
├── runs/                   # dzienniki zadań wykonywanych z AI
│   └── YYYY-MM-DD-slug.md
├── lessons.md              # indeks lekcji
└── lessons/                # szczegółowe lekcje
    └── YYYY-MM-DD-slug.md
```

## Specyfikacje (`.ai/specs/`)

- Specyfikacje służą do Spec-Driven Development: najpierw spec, potem implementacja.
- Nazwa pliku: `YYYY-MM-DD-slug.md` (data utworzenia, slug w kebab-case).
- Po zaimplementowaniu przenieś spec do `implemented/`, po porzuceniu lub zdezaktualizowaniu do `archive/`. Nie zmieniaj nazwy pliku przy przenoszeniu.
- Jeśli zadanie ma specyfikację, trzymaj się jej; rozbieżność zgłoś userowi zamiast cicho odchodzić od speca.

## Dzienniki zadań (`.ai/runs/`)

Jeden plik na zadanie, uzupełniany przyrostowo.

1. **Utworzenie**: `.ai/runs/YYYY-MM-DD-slug.md` tworzysz przy pierwszym commicie zadania. Data w nazwie to dzień rozpoczęcia zadania. Nie zmieniaj nazwy pliku i nie twórz nowego przy kolejnej sesji, nawet jeśli praca trwa kilka dni.
2. **Nagłówek**: na początku pliku stały nagłówek z celami zadania, linkiem do specyfikacji (jeśli istnieje) i linią `Status: in-progress` albo `Status: done`. Aktualizuj cele i status w tym nagłówku. `done` ustaw dopiero po ukończeniu zadania.
3. **Wpisy**: przy każdym commicie dopisz na końcu tego samego pliku wpis o długości 2–5 linii: data, co obejmuje ten commit, decyzje lub napotkane pułapki oraz co zostało do zrobienia. Nie zmieniaj wcześniejszych wpisów.
4. **Kiedy**: przygotuj wpis przed commitem i dołącz go do tego samego commita co opisywane zmiany. Nie odkładaj zapisu do końca sesji.
5. **Wznowienie**: przy wznowieniu zadania lub przejęciu go od innej osoby przeczytaj istniejący dziennik i kontynuuj w tym samym pliku.

Szablon:

```markdown
# <tytuł zadania>

Cele:
- ...

Spec: [.ai/specs/YYYY-MM-DD-slug.md](../specs/YYYY-MM-DD-slug.md) (lub: brak)
Status: in-progress

---

## YYYY-MM-DD
Zakres commita, decyzje/pułapki, co zostało do zrobienia.
```

## Lekcje (`.ai/lessons.md` i `.ai/lessons/`)

- Zapisuj tu ustalenia, wnioski i usprawnienia, np. po naprawieniu błędu albo gdy coś warto zachować w pamięci długoterminowej.
- Jedna lekcja = jeden plik `.ai/lessons/YYYY-MM-DD-slug.md` (co się stało, przyczyna, wniosek / jak postępować następnym razem).
- Każdą nową lekcję dopisz też jako linię w indeksie `.ai/lessons.md`.
- **Na początku zadania** przeczytaj `.ai/lessons.md` i sięgnij do lekcji istotnych dla zadania.

## Sposób pracy

- **Planowanie**: zadanie złożone (wiele plików, zmiana architektury, niejasny zakres) zaczynaj od planu (tryb planowania) albo specyfikacji w `.ai/specs/`. Poświęć na plan najwięcej uwagi, żeby implementacja przeszła w jednym podejściu. Gdy coś się sypie, zrób nowy plan zamiast brnąć dalej.
- **Weryfikacja**: przed uznaniem zmiany za gotową uruchom testy, lint i type-check, a w przypadku UI sprawdź działanie w przeglądarce. Nie zgłaszaj sukcesu bez dowodu (output komend). Przy bugu najpierw odtwórz go i dodaj test regresyjny, a dopiero potem naprawiaj.
- **Krytyczny przegląd**: przed commitem sprawdź własny diff pod kątem błędów i zbędnych zmian. Jeśli poprawka jest łatą, a po poznaniu przyczyny widać czystsze rozwiązanie, przepisz ją.
- **Wnioski po poprawkach**: po każdej korekcie od usera lub naprawionym błędzie zapisz lekcję (patrz "Lekcje"), a jeśli dotyczy ona reguł pracy, uzupełnij także ten plik, żeby błąd się nie powtórzył.
- **Subagenty**: research, przeglądy i niezależne zadania zlecaj subagentom, żeby nie zaśmiecać głównego kontekstu.
- **Powtarzalne czynności**: jeśli ta sama procedura wraca wielokrotnie, zaproponuj zamianę jej na skill lub komendę trzymaną w repo.

## Obowiązkowe zasady

- Przed rozpoczęciem pracy: przeczytaj `.ai/lessons.md`, odpowiedni spec (jeśli jest) oraz istniejący dziennik w `.ai/runs/` (jeśli zadanie jest wznawiane).
- Każdy commit zadania zawiera aktualizację dziennika w `.ai/runs/`.
- Po naprawieniu błędu lub odkryciu nieoczywistej pułapki dodaj lekcję.
- Nie modyfikuj wcześniejszych wpisów w dziennikach.
