# Bezpieczeństwo narzędzi AI (lekcja 9)

Cele:
- PR A: reguły `deny` dla odczytu sekretów, hook PreToolUse (Bash) z testem, `CODEOWNERS`, `docs/security-notes.md`
- PR B: konfiguracja sandboxa w `.claude/settings.json` (domeny sieciowe, odczyt plików, wyjątki), do ręcznej weryfikacji przez właściciela

Spec: brak
Status: done

---

## 2026-11-24 (PR A)
Dodane: `.claude/settings.json` (deny + hook), `.claude/hooks/pre-tool-use.sh` z README i testem `scripts/pre-tool-use-hook.test.ts`, `.github/CODEOWNERS`, `docs/security-notes.md`.
Decyzje: `deny` wymienia konkretne warianty `.env*` zamiast `.env.*`, żeby nie blokować `.env.example`; hook przy braku `jq` blokuje (fail closed); `rm -rf .next` jest teraz zablokowane (w repo nic go nie używa).
Do zrobienia: właściciel włącza "Require review from Code Owners" w ochronie `main`; sekcje ręczne w `docs/security-notes.md`.

## 2026-11-24 (PR B, sandbox)
Dodane: blok `sandbox` w `.claude/settings.json` (denyRead, allowedDomains github/api.github/npm, deniedDomains metadanych, `allowLocalBinding`, `excludedCommands: ["docker"]`) i sekcja o sandboxie w `docs/security-notes.md`.
Pułapka: zachowania sandboxa nie da się zweryfikować z subagenta; PR ma etykietę `needs-qa` i listę kontrolną. Gałąź B jest oparta o gałąź A (PR A musi wejść pierwszy).
Do zrobienia: ręczny test właściciela (curl/git clone/npm/cat ~/.ssh oraz `npm run test:integration`).

## 2026-11-24 (zamknięcie zadania)
PR #84 i #85 zmergowane do `main`. Status `done`.
Do zrobienia przez właściciela: skan `~/.claude/projects/` z rotacją, menedżer sekretów, testy z laboratorium, test ręczny sandboxa, "Require review from Code Owners".

## 2026-11-25 (kontrole ręczne)
Dodane: `scripts/keychain-env.sh` z testem (`keychain:init`, `dev:secure`), wpisy w README i wypełniona sekcja 7 w `docs/security-notes.md` (skan sesji, rotacja, menedżer sekretów, test prompt injection, decyzja o Code Owners).
Decyzje: skan bez realnych sekretów, rotacji brak; Code Owners świadomie nie włączone (solo, autor nie zatwierdzi własnego PR-a, `enforce_admins`); test prompt injection sprawdził tylko odporność modelu.
Do zrobienia przez właściciela: `npm run keychain:init`, usunięcie linii `SESSION_SECRET` z lokalnego pliku środowiskowego, testy z laboratorium kursu, checkboxy na stronie kursu.
