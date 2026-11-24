# Focus moved after deleting a row is overwritten by Radix FocusScope unless it is deferred

Date: 2026-11-24

**Symptom:** After confirming a delete in a ConfirmDialog opened from a row menu, `heading.focus()` called from `onCompleted('delete')` left focus on `body` (play test failed on `toHaveFocus` for the list heading).

**Cause:** The row, its menu and the dialog unmount together. Radix `FocusScope` returns focus in a `setTimeout(0)` after unmount, and the remembered element is gone, so it focuses `body` after our synchronous `focus()`.

**Lesson:**
- Move focus after a destructive action in a timer scheduled *after* the unmount commit: set a request counter in state and focus in a `useEffect` with `window.setTimeout(..., 0)` (the effect runs after the commit that scheduled Radix's timer, so ours fires later); clear the timer in the effect cleanup.
- Target an element that always exists after the action (the list heading with `tabindex="-1"`), not a neighbouring row.
- Verify in a real browser; jsdom does not run FocusScope the same way.
