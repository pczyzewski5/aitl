# A `sr-only` element inside an `overflow-x-auto` region widens the whole page unless the region is positioned

Date: 2026-11-24

**Symptom:** At a 320 px viewport the document scrolled horizontally (`scrollWidth` 567) on every screen containing `EntryTable`, although the table sat in a scroll region with `overflow-x-auto` and no visible element stuck out. Storybook tests and axe did not notice, because they run in a wide viewport.

**Cause:** `sr-only` is `position: absolute`. An absolutely positioned element is clipped only by an overflow container that is its containing block, and the scroll region was `position: static`, so the hidden header and cell texts (positioned relative to the page) extended the document scroll width.

**Lesson:**
- Give every `overflow-x-auto` region that contains `sr-only` text `relative`.
- Measure `documentElement.scrollWidth` in an iframe of the target width (320, 768, 1440); a story or test in a wide viewport proves nothing about narrow overflow.
- A regression check that does not depend on the viewport: the hidden element's `offsetParent` is the scroll region (story "Wąski ekran (320 px)" of `EntryTable`).
