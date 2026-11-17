import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { APPROVED_PAIRS, evaluatePairs, TEXT_THRESHOLD, UI_THRESHOLD } from './contrast-pairs.ts';

const tokensCss = readFileSync(join(__dirname, '..', 'tokens.css'), 'utf8');

describe('evaluatePairs', () => {
  const evaluated = evaluatePairs(tokensCss);

  it('reproduces every ratio approved in the tokens document', () => {
    const actual = evaluated.map(({ foreground, background, ratio }) => ({ foreground, background, ratio }));
    const expected = APPROVED_PAIRS.map(({ foreground, background, approvedRatio }) => ({
      foreground,
      background,
      ratio: approvedRatio,
    }));

    expect(actual).toEqual(expected);
  });

  it('meets the thresholds for every pair except the documented exceptions', () => {
    const failing = evaluated.filter((pair) => !pair.meetsThreshold).map((pair) => pair.verdict);

    expect(failing).toEqual(['not-allowed', 'decorative']);
  });

  it('uses 4.5 for text and 3 for interface elements', () => {
    const thresholds = new Set(evaluated.map((pair) => `${pair.kind}:${pair.threshold}`));

    expect(thresholds).toEqual(new Set([`text:${TEXT_THRESHOLD}`, `ui:${UI_THRESHOLD}`]));
  });

  it('resolves the colors the pair refers to', () => {
    const first = evaluated[0];

    expect([first?.foregroundValue, first?.backgroundValue]).toEqual(['#1f2937', '#ffffff']);
  });

  it('flags a pair that falls below the threshold', () => {
    const css = ':root { --a: #777777; --b: #888888; }';

    const [actual] = evaluatePairs(css, [
      { foreground: '--a', background: '--b', kind: 'text', approvedRatio: 1.1, verdict: 'ok' },
    ]);

    expect(actual?.meetsThreshold).toBe(false);
  });
});
