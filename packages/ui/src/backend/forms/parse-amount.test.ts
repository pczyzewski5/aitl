import { describe, expect, it } from 'vitest';
import type { AmountParseResult } from './parse-amount';
import { parseAmountToMinor } from './parse-amount';

describe('parseAmountToMinor', () => {
  it.each([
    { input: '12,50', minor: 1250 },
    { input: '12.50', minor: 1250 },
    { input: '12,5', minor: 1250 },
    { input: '12', minor: 1200 },
    { input: '0,01', minor: 1 },
    { input: '0.99', minor: 99 },
    { input: '  3975,50  ', minor: 397550 },
    { input: ' 12,50 ', minor: 1250 },
    { input: '007,05', minor: 705 },
    { input: '99999999,99', minor: 9999999999 },
  ])('parses "$input" to $minor minor units', ({ input, minor }) => {
    const expected: AmountParseResult = { ok: true, minor };

    const actual = parseAmountToMinor(input);

    expect(actual).toEqual(expected);
  });

  it.each([
    { input: '', reason: 'empty' },
    { input: '   ', reason: 'empty' },
    { input: '-12,50', reason: 'negative' },
    { input: '-0', reason: 'negative' },
    { input: '12,505', reason: 'too-many-decimals' },
    { input: '12.001', reason: 'too-many-decimals' },
    { input: '100000000', reason: 'too-large' },
    { input: '100000000,00', reason: 'too-large' },
    { input: '0', reason: 'zero' },
    { input: '0,00', reason: 'zero' },
    { input: 'abc', reason: 'invalid-format' },
    { input: '12 zł', reason: 'invalid-format' },
    { input: '1 234,50', reason: 'invalid-format' },
    { input: '1,234.50', reason: 'invalid-format' },
    { input: '12,', reason: 'invalid-format' },
    { input: ',50', reason: 'invalid-format' },
    { input: '1e2', reason: 'invalid-format' },
    { input: '+12', reason: 'invalid-format' },
  ])('rejects "$input" as $reason', ({ input, reason }) => {
    const expected: AmountParseResult = { ok: false, reason } as AmountParseResult;

    const actual = parseAmountToMinor(input);

    expect(actual).toEqual(expected);
  });
});
