# aitl

Aplikacja webowa do śledzenia oraz analizy wydatków.

## Getting started

Wymagania: Node >= 22.17 (CI używa 24) z npm oraz Docker z działającym demonem. Dla macOS i Linuksa.

### Ścieżka 1: `npm run setup`

```bash
npm run setup
```

Skrypt `scripts/setup.ts` wykonuje kolejno poniższe kroki i dla każdego wypisuje `[done]` albo `[skipped]`:

1. sprawdza prerekwizyty (wersja Node, npm, Docker i jego demon); przy braku kończy się od razu błędem,
2. instaluje zależności (`npm install`), pomija, gdy `node_modules` jest aktualne względem `package-lock.json`,
3. kopiuje `.env.example` do `.env`, pomija, gdy `.env` istnieje (nigdy go nie nadpisuje),
4. uruchamia PostgreSQL (`docker compose up -d postgres`), pomija start, gdy kontener już działa, i czeka na gotowość (`pg_isready`, limit 60 s),
5. stosuje migracje (`npm run migration:up -w @aitl/db`), przy aktualnej bazie nic nie zmienia.

Ponowne uruchomienie jest bezpieczne. Skrypt nie generuje sekretów i nigdy nie usuwa wolumenów Dockera. Jeśli PostgreSQL odrzuci dane logowania (stary wolumen), skrypt podpowie `docker compose down -v`, ale musisz to wykonać sam, wiedząc, że usuwa lokalne dane.

Po instalacji uzupełnij w `.env` sekrety (`SEED_PASSWORD` oraz pozostałe puste zmienne z `.env.example`), utwórz konto użytkownika (sekcja "Konta użytkowników") i uruchom aplikację: `npm run dev -w @aitl/app`.

### Ścieżka 2: ręcznie

To samo, krok po kroku:

```bash
npm install
cp .env.example .env
docker compose up -d postgres
docker compose exec -T postgres pg_isready -U aitl -d aitl
npm run migration:up -w @aitl/db
npm run seed:user -- --email <e-mail> --name <nazwa>
npm run dev -w @aitl/app
```

Przed `cp` sprawdź, czy `.env` już nie istnieje (nie nadpisuj go). Polecenie `pg_isready` powtarzaj, aż zwróci sukces. Pozostałe kroki są idempotentne. Przed `seed:user` ustaw `SEED_PASSWORD` w `.env`.

### Konta użytkowników

Aplikacja nie ma publicznej rejestracji, konta powstają komendą `npm run seed:user` (logika w `packages/app/src/seed/`, cienki wrapper w `scripts/seed-user.ts`):

```bash
npm run seed:user -- --email wlasciciel@example.com --name "Właściciel"
npm run seed:user -- --email druga.osoba@example.com --name "Druga osoba" --shared-only
```

- Pierwsza komenda tworzy użytkownika, konto wspólne ("Wspólne") i jego konto osobiste ("Osobiste"). Z `--shared-only` użytkownik jest członkiem tylko konta wspólnego, bez osobistego. Nazwy kont można zmienić opcjami `--shared-account-name` i `--personal-account-name`.
- Hasło pochodzi wyłącznie ze zmiennej `SEED_PASSWORD` (w `.env.example` puste, wartość wpisz w lokalnym `.env`), nigdy z argumentów ani z logów. Minimum to 8 znaków, przy `NODE_ENV=production` 12.
- Komenda jest idempotentna. Ponowne uruchomienie z innym hasłem niż zapisane niczego nie zmienia: wypisuje ostrzeżenie i kończy się kodem 1 (kod 2 oznacza błędne argumenty lub hasło).

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
