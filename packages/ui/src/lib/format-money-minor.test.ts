import { describe, expect, it } from 'vitest';
import { formatMoneyMinor } from './format-money-minor';

const NBSP = ' ';
const MINUS = '−';

describe('formatMoneyMinor', () => {
  it.each([
    { amountMinor: 0, expected: `0,00${NBSP}zł` },
    { amountMinor: 1, expected: `0,01${NBSP}zł` },
    { amountMinor: 9, expected: `0,09${NBSP}zł` },
    { amountMinor: 10, expected: `0,10${NBSP}zł` },
    { amountMinor: 99, expected: `0,99${NBSP}zł` },
    { amountMinor: 100, expected: `1,00${NBSP}zł` },
    { amountMinor: 99999, expected: `999,99${NBSP}zł` },
    { amountMinor: 100000, expected: `1${NBSP}000,00${NBSP}zł` },
    { amountMinor: 123450, expected: `1${NBSP}234,50${NBSP}zł` },
    { amountMinor: 9999999999, expected: `99${NBSP}999${NBSP}999,99${NBSP}zł` },
  ])('formats $amountMinor grosze as $expected', ({ amountMinor, expected }) => {
    const actual = formatMoneyMinor(amountMinor);

    expect(actual).toBe(expected);
  });

  it('writes a negative amount with the true minus sign', () => {
    const actual = formatMoneyMinor(-123450);

    expect(actual).toBe(`${MINUS}1${NBSP}234,50${NBSP}zł`);
    expect(actual.startsWith('-')).toBe(false);
  });

  it('writes one negative grosz', () => {
    const actual = formatMoneyMinor(-1);

    expect(actual).toBe(`${MINUS}0,01${NBSP}zł`);
  });

  it('never writes a plus by default', () => {
    const actual = formatMoneyMinor(500);

    expect(actual).toBe(`5,00${NBSP}zł`);
  });

  it('writes an explicit plus for a positive amount when asked', () => {
    const actual = formatMoneyMinor(650000, { sign: 'always' });

    expect(actual).toBe(`+6${NBSP}500,00${NBSP}zł`);
  });

  it('writes the minus sign for a negative amount when asked for always', () => {
    const actual = formatMoneyMinor(-240000, { sign: 'always' });

    expect(actual).toBe(`${MINUS}2${NBSP}400,00${NBSP}zł`);
  });

  it('writes zero without a sign even when asked for always', () => {
    const actual = formatMoneyMinor(0, { sign: 'always' });

    expect(actual).toBe(`0,00${NBSP}zł`);
  });

  it('writes negative zero without a sign', () => {
    const actual = formatMoneyMinor(-0, { sign: 'always' });

    expect(actual).toBe(`0,00${NBSP}zł`);
  });

  it('does not round and keeps every grosz of a bigint beyond the safe integer range', () => {
    const actual = formatMoneyMinor(123456789012345678901n);

    expect(actual).toBe(`1${NBSP}234${NBSP}567${NBSP}890${NBSP}123${NBSP}456${NBSP}789,01${NBSP}zł`);
  });

  it('formats a negative bigint', () => {
    const actual = formatMoneyMinor(-5n);

    expect(actual).toBe(`${MINUS}0,05${NBSP}zł`);
  });

  it('formats the largest safe integer number exactly', () => {
    const actual = formatMoneyMinor(Number.MAX_SAFE_INTEGER);

    expect(actual).toBe(`90${NBSP}071${NBSP}992${NBSP}547${NBSP}409,91${NBSP}zł`);
  });

  it.each([{ value: 1.5 }, { value: Number.NaN }, { value: Number.POSITIVE_INFINITY }, { value: 2 ** 53 }])(
    'rejects $value because it is not a safe integer number of grosze',
    ({ value }) => {
      expect(() => formatMoneyMinor(value)).toThrow(RangeError);
    },
  );
});
