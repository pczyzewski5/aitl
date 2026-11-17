# Lessons

Indeks ustaleń, wniosków i usprawnień zapisywanych przez LLM-y (pamięć długoterminowa projektu). Szczegóły każdej lekcji są w `.ai/lessons/`.

Format wpisu w indeksie: `- [tytuł](lessons/YYYY-MM-DD-slug.md) – jednolinijkowe streszczenie`

## Indeks

- [Integration tests hang when the app is started through npx](lessons/2026-11-02-integration-tests-hang-with-npx.md) – spawn servers directly with Node, add timeout-minutes to CI jobs
- [The dependency audit gate must cover production dependencies only](lessons/2026-11-17-audit-only-production-dependencies.md) – a dev-tool advisory with no patch turned the required Lint check red; audit with --omit=dev
- [tsc include does not pick up files under .storybook](lessons/2026-11-17-tsconfig-include-skips-storybook-dir.md) – keep ambient `.d.ts` declarations in `src/`; verify with `tsc --listFilesOnly`
- [The shadcn CLI writes into a literal `@/` directory without a tsconfig alias](lessons/2026-11-17-shadcn-cli-writes-to-literal-alias-dir.md) – move the generated file, use relative imports, hand-write `cn`; zeroed Tailwind namespaces drop shadcn classes silently
- [The shadcn CLI imported a stray `cn` npm package](lessons/2026-11-17-shadcn-cli-imports-stray-cn-package.md) – a placeholder import pulled an unrelated package into `package.json`; check new dependencies after every `shadcn add`
