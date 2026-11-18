import { describe, expect, it } from 'vitest';
import { DEFAULT_AMOUNT_FAILURE_MESSAGES, DEFAULT_ENTRY_FORM_MESSAGES } from './entry-form.messages';
import { validateAmountText, validateDateText } from './entry-validation';

describe('validateAmountText', () => {
  it.each([
    { text: '12,50', expected: undefined },
    { text: '', expected: DEFAULT_AMOUNT_FAILURE_MESSAGES.empty },
    { text: '0', expected: DEFAULT_AMOUNT_FAILURE_MESSAGES.zero },
    { text: '-5', expected: DEFAULT_AMOUNT_FAILURE_MESSAGES.negative },
    { text: '1,234', expected: DEFAULT_AMOUNT_FAILURE_MESSAGES['too-many-decimals'] },
  ])('validates "$text"', ({ text, expected }) => {
    const actual = validateAmountText(text, DEFAULT_AMOUNT_FAILURE_MESSAGES);

    expect(actual).toBe(expected);
  });
});

describe('validateDateText', () => {
  it.each([
    { text: '2026-11-18', expected: undefined },
    { text: ' 2026-11-18 ', expected: undefined },
    { text: '2000-01-01', expected: undefined },
    { text: '2100-12-31', expected: undefined },
    { text: '18.11.2026', expected: DEFAULT_ENTRY_FORM_MESSAGES.dateFormat },
    { text: '', expected: DEFAULT_ENTRY_FORM_MESSAGES.dateFormat },
    { text: '2026-02-30', expected: DEFAULT_ENTRY_FORM_MESSAGES.dateNotReal },
    { text: '2026-13-01', expected: DEFAULT_ENTRY_FORM_MESSAGES.dateNotReal },
    { text: '1999-12-31', expected: DEFAULT_ENTRY_FORM_MESSAGES.dateOutOfRange },
    { text: '2101-01-01', expected: DEFAULT_ENTRY_FORM_MESSAGES.dateOutOfRange },
  ])('validates "$text"', ({ text, expected }) => {
    const actual = validateDateText(text, DEFAULT_ENTRY_FORM_MESSAGES);

    expect(actual).toBe(expected);
  });
});
