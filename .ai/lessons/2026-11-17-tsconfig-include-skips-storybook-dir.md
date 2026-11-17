# tsc include does not pick up files under .storybook

Date: 2026-11-17

**Symptom:** `tsc` reported `Cannot find module '../../src/tokens.css?raw'` even though a `declare module '*?raw'` file existed in `packages/ui/.storybook/`.

**Cause:** `"include": [".storybook"]` matches no files (`tsc --listFilesOnly` shows `main.ts` and `preview.ts` are absent); only files reached through imports from `src` or stories are checked.

**Lesson:**
- Put ambient declarations (`*.css?raw` and similar) under `src/` (a `.d.ts` there is excluded from coverage), not in `.storybook/`.
- Check `tsc --listFilesOnly` when a new directory is meant to be type-checked.
