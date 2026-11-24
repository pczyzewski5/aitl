# Verify 320 px in an iframe, the engine toolbar overflows at 320 px, and Delete uses a native dialog

Date: 2026-11-24

**Symptom:** `resize_window` to 320 px left `innerWidth` at 500; in a 320 px iframe the page scrolled horizontally (`scrollWidth` 491). Clicking "Delete" on a review comment froze the automated Chrome tab (every CDP call timed out).

**Cause:** Chrome does not shrink a window below about 500 px. The engine toolbar `.proto-toolbar` (Clickable, Comment, ...) is a non-wrapping flex row, so six buttons exceed 320 px. The engine's "Delete" asks through a native `confirm()` dialog, which blocks the page for CDP-driven tools.

**Lesson:**
- Check 320 px with a same-origin `<iframe style="width:320px">` pointing at the prototype (state is per iframe) and compare `documentElement.scrollWidth` with `clientWidth`; say in the report that an iframe was used.
- Override engine layout from the host CSS, never in `engine/`: `.proto-toolbar { flex-wrap: wrap; min-width: 0; }` in `src/chrome.css`.
- Do not click "Delete" on a comment in automated runs; delete test comments by clearing `localStorage` (key `om-prototype-comments:v2:<prototypeId>`). Capture exports by patching `URL.createObjectURL` and `HTMLAnchorElement.prototype.click` so no file is written to disk.
