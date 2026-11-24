# The review engine needs host CSS classes it does not ship, and a prototype vitest config needs its own `root`

Date: 2026-11-24

**Symptom:** After wiring the lesson-7 review engine into the prototype, its toolbar buttons would have been unstyled; running `vitest --config prototypes/.../vitest.config.ts` from the repo root found no test files.

**Cause:** `prototype.js` creates elements with classes `.btn`, `.btn-primary/-outline/-ghost/-sm`, `.segmented`, `.toast`, `.input`, `.row`, `.t-*` that only the original host design defined; `prototype.css` and `mostek.css` do not include them. Vitest resolves `include` against the process cwd, not the config file location.

**Lesson:**
- Define those classes in the prototype's own CSS from design tokens (`src/chrome.css`), and map engine shadows to `none` in `mostek.css` (the DS has no shadows).
- Set `root: fileURLToPath(new URL('.', import.meta.url))` in a prototype `vitest.config.ts`.
- The engine owns navigation history; gate redirects at `window` capture level (before the engine's document capture) so the history does not fill with gated screens.
