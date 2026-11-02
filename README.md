# aitl

Aplikacja webowa do śledzenia oraz analizy wydatków.

## Stack technologiczny

- **TypeScript** – język po stronie serwera i przeglądarki
- **Next.js** (najnowsza wersja) – backend i frontend w jednym projekcie
- **React** – warstwa UI
- **Tailwind** – stylowanie stron frontendowych
- **shadcn/ui** – komponenty stron backendowych (panel admina, tryb jasny i ciemny)
- **PostgreSQL** – baza danych
- **MikroORM** – ORM obsługujący migracje i pulę połączeń
- **Awilix** – kontener Dependency Injection

## Architektura

Monorepo oparte na workspaces. Całość kodu leży w katalogu `packages/`:

| Pakiet | Nazwa | Odpowiedzialność |
| --- | --- | --- |
| `packages/app` | `@aitl/app` | Główny kod aplikacji (Next.js): strony, routing, API, composition root kontenera DI |
| `packages/core` | `@aitl/core` | Części wielokrotnego użytku: logika domenowa, serwisy, typy, współdzielone helpery |
| `packages/db` | `@aitl/db` | Narzędzia do zarządzania danymi: konfiguracja MikroORM, encje, migracje, pula połączeń |
| `packages/ui` | `@aitl/ui` | Komponenty interfejsu wielokrotnego użytku |

### Zależności między pakietami

```
app ──► ui
 │      │
 ├────► core
 └────► db ──► core
```

- `app` może zależeć od pozostałych pakietów, żaden pakiet nie zależy od `app`.
- `core` nie zależy od innych pakietów ani od frameworka (Next.js, MikroORM).
- `db` zależy najwyżej od `core`; `ui` nie zależy od `db`.

### Zasady

- **Dependency Injection**: usługi rejestrowane w kontenerze Awilix, zależności wstrzykiwane przez konstruktor. Kontener składany jest w `app`.
- **Baza danych**: PostgreSQL przez MikroORM; zmiany schematu wyłącznie przez migracje.
- **Frontend**: strony publiczne stylowane Tailwindem.
- **Backend (panel admina)**: strony zbudowane na komponentach shadcn/ui.
