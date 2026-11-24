# Lessons

Indeks ustaleń, wniosków i usprawnień zapisywanych przez LLM-y (pamięć długoterminowa projektu). Szczegóły każdej lekcji są w `.ai/lessons/`.

Format wpisu w indeksie: `- [tytuł](lessons/YYYY-MM-DD-slug.md) – jednolinijkowe streszczenie`

## Indeks

- [Integration tests hang when the app is started through npx](lessons/2026-11-02-integration-tests-hang-with-npx.md) – spawn servers directly with Node, add timeout-minutes to CI jobs
- [The dependency audit gate must cover production dependencies only](lessons/2026-11-17-audit-only-production-dependencies.md) – a dev-tool advisory with no patch turned the required Lint check red; audit with --omit=dev
- [tsc include does not pick up files under .storybook](lessons/2026-11-17-tsconfig-include-skips-storybook-dir.md) – keep ambient `.d.ts` declarations in `src/`; verify with `tsc --listFilesOnly`
- [The shadcn CLI writes into a literal `@/` directory without a tsconfig alias](lessons/2026-11-17-shadcn-cli-writes-to-literal-alias-dir.md) – move the generated file, use relative imports, hand-write `cn`; zeroed Tailwind namespaces drop shadcn classes silently
- [The shadcn CLI imported a stray `cn` npm package](lessons/2026-11-17-shadcn-cli-imports-stray-cn-package.md) – a placeholder import pulled an unrelated package into `package.json`; check new dependencies after every `shadcn add`
- [Storybook play tests: Radix arrow keys need a held key, and waitFor must not mutate the DOM](lessons/2026-11-18-storybook-play-radix-arrow-keys-and-waitfor.md) – hold the key between keydown and keyup; a DOM-mutating `waitFor` callback freezes the run
- [`break-words` does not shrink a fit-content flex item, `wrap-anywhere` does](lessons/2026-11-18-break-words-does-not-shrink-fit-content-flex-items.md) – in `items-start` flex columns a long unbroken string widened the container; use `wrap-anywhere` and a 320 px story with a long URL
- [A dialog opened from a menu item does not return focus to the menu trigger](lessons/2026-11-18-dialog-opened-from-a-menu-item-loses-focus-return.md) – run the item action after the menu closed and focus returned; Dialog restores focus to the element focused at open; modal menus fail axe
- [Focus moved after deleting a row is overwritten by Radix FocusScope unless it is deferred](lessons/2026-11-24-focus-after-deleting-a-row-must-wait-for-radix-focusscope.md) – request focus in state and run it in an effect with `setTimeout(0)`; target the list heading
- [Story assertions on money text must use the formatter](lessons/2026-11-24-money-text-uses-narrow-no-break-space-compare-with-the-formatter.md) – typed spaces differ from the formatter's no-break characters; build expectations with `formatMoneyMinor`
- [Account cards (h3 titles) directly under the page h1 fail axe heading-order](lessons/2026-11-24-cards-under-h1-need-an-h2-for-axe-heading-order.md) – add a visually hidden h2 section heading; list shared story harnesses in `excludeStories`
- [check:tokens scans .mdx, so documentation cannot quote forbidden values](lessons/2026-11-24-check-tokens-scans-mdx-docs-cannot-quote-forbidden-values.md) – describe forbidden values in words in `packages/ui` docs; literal examples are fine in `docs/design-system.md`
- [A `sr-only` element inside an overflow region widens the page unless the region is positioned](lessons/2026-11-24-sr-only-in-a-scroll-region-needs-a-positioned-container.md) – add `relative` to scroll regions with hidden text; measure `scrollWidth` in a 320 px iframe, not in the wide test viewport
- [The review engine needs host CSS classes it does not ship, and a prototype vitest config needs its own `root`](lessons/2026-11-24-review-engine-expects-host-css-classes-and-a-vitest-root.md) – define `.btn`/`.segmented`/`.toast` from tokens in the prototype; set `root` in its vitest config; gate redirects at window capture
- [Verify 320 px in an iframe, the engine toolbar overflows at 320 px, and Delete uses a native dialog](lessons/2026-11-24-verify-320-px-in-an-iframe-and-expect-engine-toolbar-overflow.md) – Chrome windows stop at about 500 px; wrap `.proto-toolbar` from host CSS; clear `localStorage` instead of clicking Delete in automation
- [MikroORM migration:up prints no "nothing pending" message](lessons/2026-11-24-migration-up-prints-no-marker-when-nothing-is-pending.md) – detect applied migrations by the `Applied '` line; verify output markers with a real first and second run
