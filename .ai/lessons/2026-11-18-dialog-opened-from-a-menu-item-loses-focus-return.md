# A dialog opened from a menu item does not return focus to the menu trigger

Date: 2026-11-18

**Symptom:** After closing a Dialog or ConfirmDialog that was opened from a Radix DropdownMenu item, focus ended on `body` instead of the menu button (play test failed on `toHaveFocus` for the trigger). A modal menu also failed axe (`aria-hidden-focus`) on every story with an open menu.

**Cause:** Radix Dialog returns focus only to its own `DialogTrigger`, otherwise to the element that was focused when it mounted. The menu closes in the same commit that opens the dialog, so the focused menu item is already removed and the dialog remembers `body`. A modal DropdownMenu sets `aria-hidden` on the rest of the page while its trigger stays focusable.

**Lesson:**
- Run the chosen item action after the menu has closed and focus is back on the trigger (`onCloseAutoFocus` of the menu content plus `queueMicrotask`), so the dialog records the trigger.
- Make Dialog restore focus to the element focused at open when there is no `DialogTrigger`.
- Use `modal={false}` for DropdownMenu when the a11y test gate is `error`; test the focus return in a real browser, jsdom does not reproduce it.
