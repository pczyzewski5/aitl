import { describe, expect, it } from 'vitest';
import { systemClock } from './clock.port';

describe('systemClock', () => {
  it('returns the current time', () => {
    const before = Date.now();

    const actual = systemClock();

    expect(actual.getTime()).toBeGreaterThanOrEqual(before);
    expect(actual.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
