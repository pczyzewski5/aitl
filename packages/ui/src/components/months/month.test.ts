import { describe, expect, it } from 'vitest';
import { addMonths, compareMonths, formatMonthLabel, isMonthKey, parseMonthKey } from './month';

const NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];

describe('parseMonthKey', () => {
  it('splits a valid key into year and month', () => {
    const actual = parseMonthKey('2026-10');

    expect(actual).toEqual({ year: 2026, month: 10 });
  });

  it.each([
    { key: '2026-13' },
    { key: '2026-00' },
    { key: '0000-05' },
    { key: '2026-1' },
    { key: '26-10' },
    { key: '2026-10-01' },
    { key: '' },
    { key: 'październik' },
  ])('returns null for "$key"', ({ key }) => {
    expect(parseMonthKey(key)).toBeNull();
  });
});

describe('isMonthKey', () => {
  it('accepts a valid key and rejects an invalid one', () => {
    expect(isMonthKey('2026-02')).toBe(true);
    expect(isMonthKey('2026-14')).toBe(false);
  });
});

describe('addMonths', () => {
  it.each([
    { key: '2026-10', delta: 1, expected: '2026-11' },
    { key: '2026-10', delta: -1, expected: '2026-09' },
    { key: '2026-12', delta: 1, expected: '2027-01' },
    { key: '2026-01', delta: -1, expected: '2025-12' },
    { key: '2026-10', delta: 0, expected: '2026-10' },
    { key: '2026-10', delta: 14, expected: '2027-12' },
    { key: '2026-10', delta: -22, expected: '2024-12' },
    { key: '0001-02', delta: -1, expected: '0001-01' },
    { key: '9999-11', delta: 1, expected: '9999-12' },
  ])('moves $key by $delta to $expected', ({ key, delta, expected }) => {
    const actual = addMonths(key, delta);

    expect(actual).toBe(expected);
  });

  it.each([
    { key: '0001-01', delta: -1 },
    { key: '9999-12', delta: 1 },
    { key: '2026-10', delta: 0.5 },
    { key: 'nonsense', delta: 1 },
  ])('throws for $key moved by $delta', ({ key, delta }) => {
    expect(() => addMonths(key, delta)).toThrow(RangeError);
  });
});

describe('compareMonths', () => {
  it('returns a negative number, zero and a positive number', () => {
    expect(compareMonths('2026-09', '2026-10')).toBeLessThan(0);
    expect(compareMonths('2026-10', '2026-10')).toBe(0);
    expect(compareMonths('2027-01', '2026-12')).toBeGreaterThan(0);
  });

  it('throws for an invalid key on either side', () => {
    expect(() => compareMonths('x', '2026-10')).toThrow(RangeError);
    expect(() => compareMonths('2026-10', 'x')).toThrow(RangeError);
  });
});

describe('formatMonthLabel', () => {
  it('joins the month name and the year', () => {
    const actual = formatMonthLabel('2026-10', NAMES);

    expect(actual).toBe('j 2026');
  });

  it('uses the first and the last name for January and December', () => {
    expect(formatMonthLabel('2026-01', NAMES)).toBe('a 2026');
    expect(formatMonthLabel('2026-12', NAMES)).toBe('l 2026');
  });

  it('throws for a missing name or an invalid key', () => {
    expect(() => formatMonthLabel('2026-10', ['a'])).toThrow(RangeError);
    expect(() => formatMonthLabel('nonsense', NAMES)).toThrow(RangeError);
  });
});
