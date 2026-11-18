import { describe, expect, it } from 'vitest';
import { formatEntryDate } from './format-entry-date';

describe('formatEntryDate', () => {
  it('reorders an ISO date into day.month.year without touching the clock', () => {
    expect(formatEntryDate('2026-11-05')).toBe('05.11.2026');
  });

  it('keeps leap days and month ends as written', () => {
    expect(formatEntryDate('2028-02-29')).toBe('29.02.2028');
    expect(formatEntryDate('2026-01-31')).toBe('31.01.2026');
  });
});
