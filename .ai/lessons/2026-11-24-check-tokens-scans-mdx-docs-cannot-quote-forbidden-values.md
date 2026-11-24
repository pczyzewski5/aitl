# check:tokens scans .mdx, so documentation cannot quote forbidden values

Date: 2026-11-24

**Symptom:** The new "what to avoid" and "usage" pages listed example forbidden values (a hex colour, a palette class, an arbitrary-value class) and `npm run check:tokens` failed with violations in the `.mdx` files.

**Cause:** The script scans `.ts`, `.tsx`, `.css` and `.mdx`, and inline code in documentation matches the same patterns as real code.

**Lesson:**
- Describe forbidden values in words (for example "palette name and shade") instead of quoting them in `packages/ui` documentation.
- The agent file `docs/design-system.md` lives outside the scanned roots, so literal examples are fine there.
- Run `npm run check:tokens` after writing any documentation page, not only after code changes.
