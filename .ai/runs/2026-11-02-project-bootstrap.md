# Project bootstrap

Cele:
- Opisać projekt i stack w README
- Przygotować strukturę `.ai/` oraz AGENTS.md / CLAUDE.md
- Założyć szkielet monorepo w `packages/` (app, core, db, ui)

Spec: brak
Status: in-progress

---

## 2026-11-02
Dodano README ze stackiem i architekturą, strukturę `.ai/`, AGENTS.md i CLAUDE.md oraz szkielet monorepo (puste pakiety z package.json).
Decyzja: kierunki zależności między pakietami to propozycja, do potwierdzenia; menedżer pakietów jeszcze nie wybrany (workspaces zgodne z npm/yarn).
Do zrobienia: inicjalizacja Next.js w `packages/app`, konfiguracja MikroORM w `packages/db`, kontener Awilix, Tailwind i shadcn/ui.

## 2026-11-02 (specs)
Added the monorepo migration plan and the AITL-adapted engineering standards spec, plus the matching rules in AGENTS.md.
Decision: dependency direction stays db -> core (persistence through repository ports); the original spec's app -> core -> db was rejected.
Todo: workspace skeleton, Next.js app, lint, tests and CI.

## 2026-11-02 (workspace, app, CI)
Added the npm workspace skeleton, minimal Next.js app, ESLint with dependency-boundary rules, Vitest unit tests at 100% coverage, testcontainers integration tests and the GitHub CI workflow.
Pitfalls: typescript-eslint caps TypeScript at 6.0.x; Vitest needs the automatic JSX runtime because the app tsconfig uses preserve.
Todo: phase 3 (MikroORM and migrations), phase 4 (Awilix), phase 4b (http and ui/backend layers), phase 5 (Tailwind and shadcn/ui); CI not yet run on GitHub (no remote).

## 2026-11-02 (pre-commit hook)
Added a pre-commit hook running lint, typecheck and unit tests with coverage, installed through the prepare script.
Decision: dependency-free hook in .githooks instead of husky; origin switched to SSH.
Todo: branch protection with required CI checks, phase 3 (MikroORM).

## 2026-11-02 (CI hang fix)
First CI run hung in the integration job: tests passed, but the app started through npx left an orphaned server holding the Vitest worker.
Fix: spawn Next.js directly with the Node binary so SIGTERM reaches the server; added a 15 minute timeout to every CI job.
Todo: branch protection with required checks (needs gh auth, done), phase 3 (MikroORM).

## 2026-11-02 (first lesson)
Recorded the first lesson (hanging CI integration job) in the lessons index.
Pitfall: branch protection and rulesets are unavailable for private repos on the free GitHub plan (HTTP 403), so main is not protected server-side.
Todo: decide on GitHub Pro or public repo for branch protection, phase 3 (MikroORM).

## 2026-11-02 (phase 3: MikroORM)
Added MikroORM setup in the db package: pool config, shared entity properties, blank initial migration, migration scripts, docker compose PostgreSQL, .env.example and an integration test applying migrations.
Pitfalls: MikroORM refuses to start with zero entities (disabled the check until the first concept); the CLI needs configPaths and the tsx loader to read a TS config; parameter properties in the errors class broke the erasable-syntax check once tests imported package code.
Todo: phase 4 (Awilix composition root), phase 4b, first domain concept (expenses).

## 2026-11-02 (secret scanner)
GitGuardian flagged one secret on the phase 3 PR, most likely the database URL with a password; removed passwords from example URLs and test fixtures and switched local PostgreSQL to trust auth.
Pitfall: the finding details are visible only in the GitGuardian dashboard, so the exact line was inferred.
Todo: confirm the check turns green; phase 4.

## 2026-11-17 (agent pipeline)
Configured the agent PR pipeline: .ai/agentic.config.json (GitHub tracker, agent-browser, 6-command validation gate including npm audit), tracker and browser descriptors, SDLC.md, CODE_REVIEW.md, BACKWARD_COMPATIBILITY.md, npm audit step in the Lint CI job.
Decisions: pipeline execution plans go to .ai/pipeline-runs to avoid clashing with these journals; plain English commit and PR titles without prefixes; installed skills (.agents, .claude/skills, skills-lock.json) are not committed.
Todo: issue #2 (npm run setup installer), phase 4 (Awilix), phase 4b.
Pitfall: the pre-commit lint scanned the locally installed skills in .agents (third-party code, 250 errors); excluded .agents and .claude from ESLint.

## 2026-11-17 (discovery layer)
Added the product layer to the agent pipeline: discovery block in .ai/agentic.config.json (no domain expert, no designer), Product owner role, Definition of Ready and protected product decisions in SDLC.md, .ai/specs/research/. AGENTS.md has no task-routing table, so no routing row was added.
Todo: run /om-discover to write .ai/specs/product-brief.md; issue #2; phase 4 (Awilix); phase 4b.

## 2026-11-17 (product brief)
Added the first product brief (om-discover, own mode, quick pass) with the owner's interview note and decision D01: the first version covers recurring and one-off income and expenses, a paid flag, shared and personal accounts, separate logins for the owner and spouse, and the monthly remainder (income minus expenses).
Pitfall: the evidence is one account from the owner plus their second-hand report of a conversation with the spouse; the brief says so and lists a collection plan (spreadsheet copy, note from the spouse conversation).
Todo: om-backlog dry run and backlog; issue #2; phase 4 (Awilix); phase 4b.

## 2026-11-17 (backlog)
Filed the first backlog on GitHub (#6-#23: 4 epics, 7 stories, 7 tasks) from the product brief and mapped it in .ai/specs/backlog.md. Brief refreshed with R03 (remainder computed per account), D02 (spouse login story filed despite partially supported A02) and Q08.
Pitfall: needs-qa was not put on the risk-high stories; it is a PR label, so it is applied when their PRs are opened.
Todo: issue #2 (npm run setup); start with E01-S01 (#10) and its tasks (#17-#20); phase 4 (Awilix) is task #17.

## 2026-11-17 (spec: auth and app foundation)
Wrote the specification for E01-S01 (login) and the framework underneath it (.ai/specs/2026-11-17-auth-and-app-foundation.md, data model view in .ai/data-model/): server-side sessions in PostgreSQL, own thin auth layer, argon2id, BankAccount and membership model, two phases and one PR per step. Passed a cross-model review (Opus) and a grill-me session; decisions Q1-Q22 recorded in the spec.
Pitfall: Auth.js Credentials only supports JWT sessions and its MikroORM adapter targets MikroORM 5/6, so it conflicted with server-side sessions; the owner chose the own layer.
Todo: rename follow-ups for BankAccount in the backlog, brief and issues; update issues #10, #18, #20; add a production-readiness story; then implement phase 1 (steps 1.1-1.3).

## 2026-11-17 (specs: entries and monthly remainder)
Wrote the specifications for E02 (income and expenses entries, recurring series, paid flag; issues #12-#15, #21, #22) and E03 (monthly remainder per bank account; #16, #23). Passed a cross-model review (Opus); decisions E02-Q1..Q16 and E03-Q5..Q10 recorded in the specs, PLN-only amounts in minor units, one PR per step, rollout order E02 F1-F3, E03 1.1, E02 F4, E03 1.2.
Pitfall: a recurring entry without a series id could be counted twice after a revision; the review caught it and the model now has series_id, optimistic concurrency and a serialised series lock.
Todo: implement phase 1 of the auth spec first (E02 depends on it); owner provides the spreadsheet extract for the A01 golden test (#23).

## 2026-11-17 (bank account naming cleanup)
Clarified "konto" in the brief and backlog: glossary now separates the user account (login) from the bank account (shared or personal); issues #6-#16 and #20-#23 reworded accordingly, #20 widened to the five tables from the spec, #10, #11, #17, #18, #19 now link the spec and its steps.
Added the parked epic E05 (production readiness, issue #26) for the items the spec deferred (Q15-Q18).
Todo: implement phase 1 of the auth spec (steps 1.1-1.3).

## 2026-11-17 (audit gate)
CI on main turned red after a new high advisory for picomatch (dev tooling, no patched version) failed the full npm audit step in the Lint job; switched the gate, config and docs to `npm audit --omit=dev --audit-level=high` and recorded a lesson.
Todo: review dev-tool advisories manually when updating dependencies (Vitest, Vite).

## 2026-11-17 (design system, stage 0)
Added the approved design decisions (.ai/specs/design/2026-11-17-referencje.md and 2026-11-17-tokeny.md) and the stage 0 plan in packages/ui/POSTEP.md: inventory, decisions, open questions, component list, docs menu tree and the PR sequence A-D. Docs only, nothing installed.
Decisions: Storybook 10.6.7 with react-vite, Tailwind 4.3.5, Playwright 1.65.1, Vitest pinned at 5.0.5, docs in Polish, dark theme structure only.
Todo: owner answers the open questions and says "dalej"; then PR B (Storybook tooling).

## 2026-11-17 (design system, PR B: Storybook tooling)
Added Storybook 10.6.7 (react-vite, docs, a11y with test: 'error', vitest addon), Vitest browser packages 5.0.5 and Playwright 1.65.1 as ui devDependencies, a separate vitest.storybook.config.ts, one Polish MDX intro page, and a build-storybook step in the CI Build job; coverage excludes stories and .storybook, storybook-static is ignored by git and ESLint.
Pitfall: with only an MDX page there are no story tests, so test:storybook uses passWithNoTests; verified with a throwaway story that the browser run works and an a11y violation fails it. Prod audit gate unchanged (one pre-existing moderate next advisory, exit 0).
Todo: PR C (tokens, Tailwind, theme switch) after the owner says "dalej"; the dedicated storybook-tests CI job comes in PR D.

## 2026-11-17 (next security upgrade)
Upgraded next from 16.4.3 to 16.4.6 in packages/app to fix GHSA-mfr8-8qww-v76h and GHSA-vc7v-qv4w-wrv8 (use cache advisories, affected 16.2.0 - 16.4.4); no eslint-config-next in the repo.
Verified typecheck, lint, coverage (100%), build and integration tests; npm audit --omit=dev now reports 0 vulnerabilities.

## 2026-11-17 (design system, PR C: tokens, Tailwind, theme switch)
Added tokens.css (three layers, approved values unchanged), styles.css (Tailwind 4.3.5 via @tailwindcss/vite, @theme inline, default palette/radius/shadow/text reset) and a Storybook theme switch that sets data-theme on html; dark is an empty block (L3), the toolbar item says the values are not defined.
Pitfall: Tailwind theme names equal to token names (--text-*, --radius-surface) produce self-referencing var() cycles, so font sizes became --font-size-* and radii map to rounded-control/card/pill.
Todo: PR D (Foundations pages, check:tokens, CI jobs).

## 2026-11-17 (design system, PR D: Foundations, check:tokens, CI)
Added Polish Foundations pages (Kolory, Typografia, Odstepy, Promienie i powierzchnie, Ruch, Motyw) as CSF stories plus attached MDX, with token values and contrast ratios computed live from tokens.css by tested helpers (100% coverage); test:storybook now runs 16 real stories and no longer uses passWithNoTests.
Added check:tokens (raw colors, Tailwind default palette classes, arbitrary values; file:line, exit 1) over ui src, .storybook and app src with unit tests, plus CI jobs "Storybook tests" and "Check tokens" with timeout-minutes.
Pitfall: tsc include does not pick up files under .storybook, so the *.css?raw declaration lives in src/raw-imports.d.ts. Todo: owner decides on required checks; stage 2 (base components) after "dalej".

## 2026-11-17 (required checks)
Added "Storybook tests" and "Check tokens" to the required status checks of the protected main branch (verified by reading the protection back: six checks, strict, admins enforced) and updated AGENTS.md and SDLC.md to list all six.
Todo: stage 2 of the design system (base components) after the owner approves the list of differences from the default shadcn/ui.

## 2026-11-17 (design system, PR E: component infrastructure and Button)
Added hand-written components.json, the cn helper (clsx + tailwind-merge with the project radius/control names) and the shadcn Button adapted to tokens (variants default/secondary/ghost/destructive, sizes default/icon, loading prop, no shadows/ring/500 weight); dependencies class-variance-authority, clsx, tailwind-merge, radix-ui and react/react-dom peers. Added a Polish 13-section Button docs page, stories with preview states and play tests, and token proposals (--muted-hover, --destructive-foreground, --control-height, --line-height-base) plus global prefers-reduced-motion.
Pitfall: shadcn CLI wrote to a literal @/ directory (lesson added); user-event cannot trigger CSS :hover. Todo: owner accepts token proposals and decides the destructive hover color; PR F (Input, Label/Field), PR G (Card, Badge, Alert).

## 2026-11-17 (design system, PR F: Input, Label and Field)
Added Input (text, email, password, amount as text with decimal input mode), Label (Radix) and Field (label, slot, hint, error below the field, "(opcjonalne)" marker, id and aria wiring through cloneElement) with the --space-label-field token (4 px), Polish 13-section docs pages, stories for every state and 320 px, play tests and unit tests at 100% coverage; the PR E tokens are recorded as approved by the owner.
Pitfall: keyboard Tab focus selects the whole input value, so a Backspace play test needs End first. Components were hand-adapted from shadcn rather than fetched with the CLI to avoid the literal @/ directory and dead FieldError/Separator branches. Todo: PR G (Card, Badge, Alert).

## 2026-11-17 (design system, PR G: Card, Badge and Alert)
Added hand-written Card (Header/Title/Content), Badge (neutral/shared/personal) and Alert (neutral status, error alert; Title/Description) on the shadcn pattern, the --space-card-gap token (12 px), three Polish 13-section docs pages, stories (320 px, long text, login failure and 429 block) with play tests, and unit tests at 100% coverage; the PR F proposals and the PR G decisions are recorded as approved by the owner on 2026-11-17.
No new dependencies; unused shadcn parts (CardDescription, CardFooter, CardAction) are documented as gaps instead of shipped. Todo: batch 2 (Checkbox, Select, RadioGroup with lucide-react), owner inputs listed in POSTEP.md.

## 2026-11-17 (design system, PR H: Checkbox and lucide-react)
Added the Checkbox (Radix primitive, 20 px box via the new --checkbox-size token inside a 36 px label click target, Check and Minus icons from lucide-react 1.74.0 imported per icon), a Polish 13-section docs page, stories for every state (320 px, table row, Field, select-all group), play tests and unit tests at 100% coverage; removed the unused `cn` dependency. Owner decisions for lucide-react and the Checkbox are recorded in the tokens file and POSTEP.md.
Pitfalls: the shadcn `cn` placeholder had pulled a stray npm package (lesson added); outline-color is animated by transition-colors, so the focus test checks width/offset only. Todo: PR I (Select), PR J (RadioGroup).

## 2026-11-18 (design system, PR I: Select)
Added the native-select Select (styled on the field only, 36 px, tokens for background/border/radius, ChevronDown from lucide-react imported per icon as a decorative aria-hidden arrow in a 32 px right margin, optional empty "Wybierz…" option, options passed as data), a Polish 13-section docs page, stories for every state (month, entry type, long option at 320 px, invalid in Field), play tests and unit tests at 100% coverage; Field needed no change. Owner decisions of 2026-11-18 are recorded in the tokens file and POSTEP.md.
Pitfall: user-event cannot drive arrow keys or type-ahead on a closed native select, so Storybook tests cover Tab focus, selectOptions and change; the native popup cannot be styled (documented as a gap). Todo: PR J (RadioGroup).

## 2026-11-18 (design system, PR J: RadioGroup, batch 2 complete)
Added RadioGroup (Radix RadioGroup root rendered as a fieldset with a visible legend, options passed as data with optional per-option hint and disabled, group hint and error below, Checkbox-like 20 px circle with an 8 px white dot in a 36 px label target, layout from a container query: two options side by side from 384 px, more than two or narrow always vertical), a Polish 13-section docs page, stories for every state and 320 px, play tests (arrows, Tab, Space, sizes, token colours) and unit tests at 100% coverage; no new dependencies or tokens. Owner decisions of 2026-11-18 are recorded in the tokens file and POSTEP.md, which also lists the remaining base components and what each needs from the owner.
Pitfalls: user-event sends keyup before Radix's deferred focus, so arrow keys need a held key; a DOM-mutating waitFor callback froze the run (lesson added). Todo: owner review, then the remaining base components of stage 2, then stage 3.

## 2026-11-18 (design system, PR K: TextLink, Skeleton, EmptyState, ErrorState)
Added four small state/link components with Polish 13-section docs pages, stories (320 px, long text, frozen hover/focus previews) and play plus unit tests: TextLink (always underlined, action colour, asChild), a static Skeleton block (no animation; the loading container carries aria-busy, compositions are documented examples only), EmptyState (one Button action, no icon, no live role) and ErrorState (retry button, role alert only through `announce` when it appears after a failed load). No new dependencies or tokens; owner decisions of 2026-11-18 recorded in POSTEP.md and the tokens file (Textarea and Tabs are not built until a screen needs them).
Pitfall: `break-words` does not shrink the min-content width of an `items-start` flex child, so a long URL widened the container past 320 px; `wrap-anywhere` fixes it. Todo: PR L (Dialog + ConfirmDialog), then PR M (Menu) and PR N (Toast).

## 2026-11-18 (design system, PR L: Dialog and ConfirmDialog)
Added Dialog (Radix Dialog; overlay as a flex centering layer with a 16 px margin, content scrolls inside the window, optional X close button named by a prop, overlay click closes it unless turned off) and ConfirmDialog (controlled composition: initial focus on Cancel, no overlay dismissal, destructive Button with loading, focus restored to the opener), with Polish 13-section docs, stories for every state, play tests in the real browser (including a 320 px viewport) and unit tests at 100% coverage. New tokens: `--overlay` (gray 900 at 60%), `--raw-red-800` and `--destructive-hover` (applied to Button destructive hover); the owner decisions of 2026-11-18 and these proposals are recorded in the tokens file and POSTEP.md, TextLink and Skeleton docs got the approved PR K rules.
Pitfall: Radix defers outside-click dismissal to the `click` event, so unit tests must fire pointerdown and click. Todo: owner acceptance of the PR L proposals, then PR M (Menu) and PR N (Toast).

## 2026-11-18 (design system, PR M: Menu)
Added Menu (Radix DropdownMenu, a 36 px ghost icon trigger with the three-dots icon named by a prop, data-driven items with destructive styling, an automatic separator and disabled items that stay visible and focusable with the reason as text via `aria-disabled`), with Polish 13-section docs, stories for every state (frozen item hover/focus, 320 px, table row, E02-S03 series actions opening Dialog and ConfirmDialog), real-browser play tests and unit tests at 100% coverage; no new dependencies or tokens. The PR L proposals and the owner decisions of 2026-11-18 are recorded in the tokens file and POSTEP.md.
Pitfalls: a modal Radix menu leaves the trigger focusable inside an aria-hidden root and fails axe, so the menu is non-modal; a dialog opened from a menu item remembered `body` as its opener, so the item action now runs after the menu closed and Dialog restores focus to the element focused at open (lesson added). Todo: owner review of the PR M proposals, then PR N (Toast).

## 2026-11-18 (design system, PR N: Toast, stage 2 complete)
Added Toast (Radix Toast; `ToastProvider` with a one-at-a-time queue plus `useToast()` returning ids, text passed as props, a text close button, polite announcement by default with an assertive mechanism documented but unused, swipe disabled, countdown paused on hover and focus, no animation) with Polish 13-section docs, stories for every state, real-browser play tests (including 320 px and 1280 px position) and unit tests at 100% coverage. New tokens `--toast-duration`, `--toast-duration-with-action` (reserved) and `--toast-viewport-offset`; the Menu proposals and the Toast decisions of 2026-11-18 are recorded in the tokens file and POSTEP.md, which now holds the stage 3 plan.
Pitfall: Radix gives the toast no live role itself, it adds a hidden announcer for one second, so tests assert on that element; the Storybook `desktop` viewport is 1280 px, not 1024. Todo: owner review, then stage 3 starting with the form pattern.
