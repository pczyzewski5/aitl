# Notatki o bezpieczeństwie narzędzi AI

Raport z lekcji 9 ("Bezpieczeństwo narzędzi AI") dla repozytorium AITL. Stan na 2026-11-24. W dokumencie nie ma żadnych sekretów, a wartości sekretów nigdy nie są drukowane.

## 1. Włączone uprawnienia

Plik `.claude/settings.json` (wersjonowany, zmiany wymagają review właściciela przez `CODEOWNERS`):

| Warstwa | Co robi |
| --- | --- |
| `permissions.deny` | Zakaz `Read` dla `./.env`, `./.env.local`, `./.env.*.local`, `./.env.development`, `./.env.production`, `./.env.test`, `./**/.env`, `./**/.env.local`, `./**/*.pem`, `~/.ssh/**`, `~/.aws/**`. |
| `hooks.PreToolUse` (Bash) | `.claude/hooks/pre-tool-use.sh` blokuje `curl\|sh`, rekurencyjne `rm`, `~/.ssh`, `~/.aws` i dostęp do `.env`. Opis i ograniczenia: `.claude/hooks/README.md`. |
| `permissions.allow` | Brak: wszystko poza `deny` wymaga zgody w trakcie sesji (lub reguł z ustawień użytkownika). |

Kompromis `.env.*` a `.env.example`: lekcja proponuje `Read(./.env.*)`, ale ta reguła blokowałaby też `.env.example`, czyli szablon, który agenci mają prawo czytać (`npm run setup`, dokumentacja zmiennych). Dlatego reguły wymieniają konkretne warianty zamiast wildcardu. Składnia `deny` nie ma wyjątków (negacji), więc nietypowy wariant, np. `.env.staging`, nie jest pokryty przez `deny`. Łapie go hook dla komend Bash, a `.gitignore` (`.env*` poza `.env.example`) trzyma takie pliki poza repozytorium. Nowy wariant `.env.<nazwa>` trzeba dopisać do `deny`.

## 2. Zainstalowane skille

W repozytorium nie ma śledzonych plików skilli: `git ls-files .claude .agents` zwraca tylko pliki z tego PR-a. Lokalnie (nieśledzone, poza gitem) leży 72 skille `om-*` z `open-mercato/skills` (źródło i hash w lokalnym, nieśledzonym `skills-lock.json`). `.claude/skills/<nazwa>` to symlinki do `.agents/skills/<nazwa>`, więc lista jest jedna.

Nazwy: om-app-spec-writing, om-apply-upgrade-notes, om-approve-merge-pr, om-auto-audit-dependencies, om-auto-continue-pr, om-auto-continue-pr-loop, om-auto-create-pr, om-auto-create-pr-loop, om-auto-fix-issue, om-auto-fix-pr, om-auto-implement-spec, om-auto-issue-triage, om-auto-manage-issues, om-auto-merge-buddy, om-auto-qa-pr, om-auto-qa-scenarios, om-auto-review-pr, om-auto-sec-report, om-auto-sec-report-pr, om-auto-update-changelog, om-auto-write-spec, om-backlog, om-brainstorm, om-check-and-commit, om-close-fixed-issues, om-code-review, om-create-agents-md, om-create-skill, om-discover, om-eject-and-customize, om-evolve-harness, om-figma-design-with-ds, om-fix, om-fix-issue, om-fix-issue-multi, om-fix-issue-multi-optimized, om-fix-issue-optimized, om-followup-issue-from-pr, om-framework-context, om-gap-analysis, om-harness, om-help, om-implement-feature, om-implement-feature-multi, om-implement-feature-multi-optimized, om-implement-feature-optimized, om-integration-tests, om-judge-agent-session, om-merge-buddy, om-mockup-prototype, om-open-pr, om-pipeline-retro, om-pr-autopilot, om-pre-implement-spec, om-prepare-issue, om-prepare-test-env, om-qa-buddy, om-review-prs, om-root-cause, om-setup-agent-harness, om-setup-agent-pipeline, om-setup-discovery-pipeline, om-share-this-session, om-smart-test, om-spec-writing, om-synthetic-users, om-troubleshooter, om-ux-design, om-ux-review-pr, om-ux-setup, om-ux-shape, om-verify-in-repo.

### Skan skilli

Polecenie:

```bash
grep -RInE '!`|curl |wget |base64 |~/\.ssh|~/\.aws|\.env' .claude/skills .agents/skills
```

Wynik: trafienia w 146 plikach (symlinki podwajają liczbę), wszystkie przeczytane pod kątem kontekstu. Żadne nie jest złośliwe. Grupy:

| Wzorzec | Gdzie (plik:linia, przykłady) | Ocena |
| --- | --- | --- |
| `.env` w zasadach "Secrets hygiene" | `*/references/rules.md:7-11`, `*/SKILL.md` (np. `om-fix/SKILL.md:107`, `om-auto-qa-pr/SKILL.md:180,280`) | Niegroźne: to zakazy ("never paste ... `.env` content"). |
| `.env` w liście zakazanych | `om-auto-create-pr/references/external-skill-urls.md:15`, `om-evolve-harness/references/case-template.md:20` | Niegroźne: lista rzeczy, których nie wolno robić / czytać. |
| `curl`, `wget` | `om-setup-agent-pipeline/references/browsers/agent-browser.md:74-75`, `.../trackers/forgejo.md:148,157,494-498` | Niegroźne: przepisy konfiguracyjne (pobranie binarki z retry, wywołania API trackera, token przez stdin). Uruchamiane tylko na prośbę właściciela, ale to wzorce, które hook zatrzymałby tylko w formie `\| sh`. |
| `base64` | `om-setup-agent-pipeline/references/trackers/github.md:302,309`, `.../gitlab.md:607,615` | Niegroźne: kodowanie zrzutów ekranu do uploadu dowodów QA. |
| `.env` / `process.env` w skrypcie | `om-harness/scripts/harness.mjs:300,331,669,737,965,980,1105` | `process.env`: filtrowanie zmiennych środowiska dziecka (allowlista), niegroźne. |
| Odczyt magazynu kluczy | `om-harness/scripts/harness.mjs:737-742` | Do uwagi: skrypt czyta `~/.local/share/opencode/auth.json` (klucz API innego narzędzia), gdy brak zmiennej środowiskowej. Rozsądne dla swojej funkcji (zewnętrzny recenzent), ale to jedyny skill, który sięga po plik z poświadczeniami poza repozytorium. Nie uruchamiaj `om-harness` bez potrzeby. |
| `!` + backtick | `om-harness/references/reporting.md:34`, `om-harness/scripts/harness.mjs:1105`, `om-prepare-test-env/references/entrypoint-contract.md:146` | Niegroźne: znak `!` jako legenda raportu i `$!` w tabeli powłoki. Brak składni wstrzykiwania komend w SKILL.md (`` !`cmd` ``). |
| `~/.ssh`, `~/.aws` | brak trafień | |

Skille pochodzą z jednego zewnętrznego źródła (`open-mercato/skills`), nie są zmieniane lokalnie. Zmiany w `.agents/` i `.claude/` przechodzą przez `CODEOWNERS`.

## 3. Serwery MCP

Brak `.mcp.json` w repozytorium. Serwery MCP skonfigurowane globalnie u właściciela: do uzupełnienia przez właściciela (poza repozytorium).

## 4. Pliki konfiguracyjne agentów (odpowiednik `agent-audit`)

```bash
find . \( -name .mcp.json -o -name CLAUDE.md -o -name AGENTS.md -o -name .cursorrules \) -not -path './node_modules/*' -not -path './.claude/worktrees/*'
find .claude .agents .codex .github/workflows -maxdepth 1 2>/dev/null
```

Wynik: `CLAUDE.md`, `AGENTS.md`, `.claude/settings.json`, `.claude/hooks/` (ten PR), `.claude/skills/` (lokalnie), `.agents/skills/` (lokalnie), `.github/workflows/ci.yml`, `.github/CODEOWNERS` (ten PR). Brak `.mcp.json`, `.cursorrules`, `.codex/`.

Alias do własnego użytku (nie jest skryptem w repo):

```bash
alias agent-audit="find . \\( -name .mcp.json -o -name CLAUDE.md -o -name AGENTS.md -o -name .cursorrules \\) -not -path './node_modules/*' -not -path './.claude/worktrees/*'; ls -a .claude .agents .codex .github/workflows 2>/dev/null"
```

## 5. Śmiertelna trójka (lethal trifecta)

Ryzyko powstaje, gdy agent ma jednocześnie: dostęp do prywatnych danych, kontakt z niezaufaną treścią i możliwość komunikacji na zewnątrz. W typowym przebiegu agenta w AITL odcinamy pierwszą nogę: sekrety są wyłącznie w lokalnym `.env` właściciela, a agenci go nie czytają (reguły `deny` blokują narzędzie Read, hook blokuje `.env` i `~/.ssh`/`~/.aws` w Bash). Skutki ogranicza praca wyłącznie przez PR (chroniony `main`, wymagane checki, brak pushu na `main`), więc udany prompt injection daje widoczny w review diff. Warstwy sieciowej nie ma: sandbox został wyłączony (sekcja 6).

## 6. Sandbox (przetestowany i wyłączony)

Sandbox Claude Code (PR #85) został przetestowany i usunięty z `.claude/settings.json`. Powód: pracujemy solo, na własnym repo, bez obcych PR-ów i skilli, a koszt przewyższał zysk. Blokada odczytu `~/.ssh` i `~/.config/gh` zatrzymywała `git` i `gh` (`known_hosts`, konfiguracja `gh`), a obejście przez `excludedCommands` nie zadziałało w sesji agenta. Testcontainers i skrypty czytające lokalną konfigurację także wymagały wyjątków.

Zostają warstwy: reguły `permissions.deny` na pliki z sekretami, klucze `~/.ssh` i `~/.aws`, hook PreToolUse, chroniony `main` z wymaganymi checkami oraz CODEOWNERS. Sandbox warto włączyć ponownie przy pracy z niezaufanym kodem (obce repo, cudze PR-y, nowe skille lub serwery MCP), bo wtedy realnie ogranicza dwie nogi śmiertelnej trójki.

## 7. Do uzupełnienia przez właściciela

- Skan historii sesji w `~/.claude/projects` pod kątem sekretów: do uzupełnienia przez właściciela.
- Rotacja ewentualnie ujawnionych kluczy: do uzupełnienia przez właściciela.
- Menedżer sekretów zamiast plain `.env`: do uzupełnienia przez właściciela.
- Test prompt injection (złośliwy plik/issue z instrukcją wyciągnięcia `.env`): do uzupełnienia przez właściciela.
- Włączenie "Require review from Code Owners" w ochronie gałęzi `main`: do uzupełnienia przez właściciela (ten PR tylko dodaje `CODEOWNERS`).
