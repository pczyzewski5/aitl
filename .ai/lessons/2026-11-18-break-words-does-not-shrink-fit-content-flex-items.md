# `break-words` does not shrink a fit-content flex item, `wrap-anywhere` does

Date: 2026-11-18

**Symptom:** A long URL without spaces made an `EmptyState`/`ErrorState` container 410 px wide inside a 320 px wrapper, although its text had `break-words` (`overflow-wrap: break-word`).

**Cause:** The container is `flex flex-col items-start`, so each child is sized as fit-content. `overflow-wrap: break-word` only breaks the word after the width is chosen; it does not lower the min-content width, so the item stayed as wide as the unbroken URL.

**Lesson:**
- In `items-start` / `items-center` flex columns use `wrap-anywhere` (`overflow-wrap: anywhere`) on text that can contain long unbroken strings; `break-words` is enough only when the item stretches (the default `items-stretch`, as in `Alert`).
- Cover it with a 320 px story whose text contains a long URL and assert `scrollWidth <= clientWidth`.
