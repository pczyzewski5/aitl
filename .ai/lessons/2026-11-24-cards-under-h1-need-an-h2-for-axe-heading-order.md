# Account cards (h3 titles) directly under the page h1 fail axe heading-order

Date: 2026-11-24

**Symptom:** The overview screen story with cards in the error state failed axe `heading-order` ("Heading levels should only increase by one"): `h1`, then the card title `h3`, then the error title `h4`.

**Cause:** `CardTitle` renders an `h3` by default and nothing between the page `h1` and the cards provided an `h2`.

**Lesson:**
- Put the cards in a `section` named by a visually hidden `h2` (`sr-only`), so the order is `h1`, `h2`, card `h3`, state `h4`.
- When composing a screen from components with fixed heading levels, check the whole outline, not just each component's own story.
- A story file that exports a shared harness for other stories must list it in `excludeStories`, otherwise Storybook treats the export as a story.
