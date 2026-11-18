# Storybook play tests: Radix arrow keys need a held key, and waitFor must not mutate the DOM

Date: 2026-11-18

**Symptom 1:** In a play test, `userEvent.keyboard('{ArrowDown}')` moved focus inside a Radix RadioGroup but did not select the option.

**Cause 1:** Radix selects an option on arrow keys only when the focus change happens while the key is still down (a document `keydown` sets a flag, `keyup` clears it), and it moves focus in a `setTimeout`. `user-event` sends `keyup` immediately, so the flag is already cleared.

**Symptom 2:** The whole Storybook test run hung forever (no timeout, no failure) on one story.

**Cause 2:** The story used `waitFor(() => expect(color).toBe(resolveToken(...)))`, and `resolveToken` appends and removes a probe element. `waitFor` re-runs its callback on every DOM mutation, so the callback retriggered itself in an endless loop that froze the page.

**Lesson:**
- Press arrows with `{ArrowDown>}`, a short wait (about 50 ms), then `{/ArrowDown}`.
- Resolve token values before `waitFor`; the callback must only read state (never create or remove elements).
- A test run that prints nothing after one story means a frozen page, not a slow test: look for DOM-mutating callbacks inside `waitFor`.
