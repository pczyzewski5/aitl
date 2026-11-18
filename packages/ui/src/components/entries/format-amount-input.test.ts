import { describe, expect, it } from 'vitest';
import { formatAmountInput } from './format-amount-input';

describe('formatAmountInput', () => {
  it.each([
    { amountMinor: 1250, expected: '12,50' },
    { amountMinor: 185000, expected: '1850,00' },
    { amountMinor: 5, expected: '0,05' },
    { amountMinor: 123456, expected: '1234,56' },
  ])('formats $amountMinor as $expected without a thousands separator', ({ amountMinor, expected }) => {
    const actual = formatAmountInput(amountMinor);

    expect(actual).toBe(expected);
  });
});
