import { describe, expect, it } from 'vitest';
import { formatSeconds } from './format-seconds';

describe('formatSeconds', () => {
  it.each<{ seconds: number; expected: string }>([
    { seconds: 1, expected: '1 sekundę' },
    { seconds: 2, expected: '2 sekundy' },
    { seconds: 4, expected: '4 sekundy' },
    { seconds: 5, expected: '5 sekund' },
    { seconds: 11, expected: '11 sekund' },
    { seconds: 12, expected: '12 sekund' },
    { seconds: 14, expected: '14 sekund' },
    { seconds: 21, expected: '21 sekund' },
    { seconds: 22, expected: '22 sekundy' },
    { seconds: 24, expected: '24 sekundy' },
    { seconds: 25, expected: '25 sekund' },
    { seconds: 87, expected: '87 sekund' },
    { seconds: 101, expected: '101 sekund' },
    { seconds: 102, expected: '102 sekundy' },
    { seconds: 900, expected: '900 sekund' },
    { seconds: 1.5, expected: '1.5 sekundy' },
  ])('formats $seconds as "$expected"', ({ seconds, expected }) => {
    const actual = formatSeconds(seconds);

    expect(actual).toBe(expected);
  });
});
