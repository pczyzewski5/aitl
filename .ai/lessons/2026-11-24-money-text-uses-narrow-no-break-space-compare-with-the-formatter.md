# Story assertions on money text must use the formatter, not a typed no-break space

Date: 2026-11-24

**Symptom:** Browser play tests failed with two visually identical strings (`3 979,00 zł` vs `3 979,00 zł`, "expected to be").

**Cause:** `formatMoneyMinor` separates thousands and the currency with U+00A0 / U+202F characters; a copy-pasted or typed space in the expectation is a different code point.

**Lesson:**
- Build expected money strings with `formatMoneyMinor(amountMinor)` in stories and tests instead of typing the characters.
- Same rule for the minus sign (U+2212): take it from the formatter output.
