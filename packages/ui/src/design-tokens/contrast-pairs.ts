import { contrastRatio, parseHexColor } from './contrast.ts';
import { parseCustomProperties, resolveProperty } from './token-css.ts';

export type PairKind = 'text' | 'ui';
export type PairVerdict = 'ok' | 'not-allowed' | 'decorative';

export interface ApprovedPair {
  readonly foreground: string;
  readonly background: string;
  readonly kind: PairKind;
  readonly approvedRatio: number;
  readonly verdict: PairVerdict;
}

export interface EvaluatedPair extends ApprovedPair {
  readonly foregroundValue: string;
  readonly backgroundValue: string;
  readonly ratio: number;
  readonly threshold: number;
  readonly meetsThreshold: boolean;
}

export const TEXT_THRESHOLD = 4.5;
export const UI_THRESHOLD = 3;
const RATIO_PRECISION = 100;

const pair = (
  foreground: string,
  background: string,
  kind: PairKind,
  approvedRatio: number,
  verdict: PairVerdict = 'ok',
): ApprovedPair => ({ foreground, background, kind, approvedRatio, verdict });

export const APPROVED_PAIRS: readonly ApprovedPair[] = [
  pair('--foreground', '--card', 'text', 14.68),
  pair('--foreground', '--background', 'text', 13.34),
  pair('--foreground', '--muted', 'text', 11.86),
  pair('--foreground', '--badge-shared-bg', 'text', 12.03),
  pair('--muted-foreground', '--card', 'text', 7.56),
  pair('--muted-foreground', '--background', 'text', 6.87),
  pair('--muted-foreground', '--form-surface', 'text', 7.23),
  pair('--muted-foreground', '--muted', 'text', 6.1),
  pair('--primary-foreground', '--primary', 'text', 5.17),
  pair('--primary-foreground', '--primary-hover', 'text', 6.7),
  pair('--income', '--card', 'text', 5.02),
  pair('--income', '--form-surface', 'text', 4.8),
  pair('--income', '--background', 'text', 4.56),
  pair('--expense', '--card', 'text', 6.47),
  pair('--expense', '--form-surface', 'text', 6.19),
  pair('--expense', '--background', 'text', 5.88),
  pair('--badge-shared-fg', '--badge-shared-bg', 'text', 5.49),
  pair('--badge-personal-fg', '--badge-personal-bg', 'text', 5.98),
  pair('--primary', '--card', 'ui', 5.17),
  pair('--primary', '--background', 'ui', 4.7),
  pair('--primary', '--form-surface', 'ui', 4.95),
  pair('--input', '--card', 'ui', 3.18),
  pair('--input', '--form-surface', 'ui', 3.04),
  pair('--input', '--background', 'ui', 2.89, 'not-allowed'),
  pair('--border', '--card', 'ui', 1.47, 'decorative'),
];

export const PROPOSED_PAIRS: readonly ApprovedPair[] = [
  pair('--foreground', '--muted-hover', 'text', 9.96),
  pair('--muted-foreground', '--muted-hover', 'text', 5.13),
  pair('--destructive-foreground', '--destructive', 'text', 6.47),
  pair('--ring', '--muted-hover', 'ui', 3.51),
  pair('--ring', '--muted', 'ui', 4.17),
];

export function evaluatePairs(css: string, pairs: readonly ApprovedPair[] = APPROVED_PAIRS): EvaluatedPair[] {
  const properties = parseCustomProperties(css, ':root');
  return pairs.map((approved) => {
    const foregroundValue = resolveProperty(properties, approved.foreground);
    const backgroundValue = resolveProperty(properties, approved.background);
    const ratio = contrastRatio(parseHexColor(foregroundValue), parseHexColor(backgroundValue));
    const threshold = approved.kind === 'text' ? TEXT_THRESHOLD : UI_THRESHOLD;
    return {
      ...approved,
      foregroundValue,
      backgroundValue,
      ratio: Math.round(ratio * RATIO_PRECISION) / RATIO_PRECISION,
      threshold,
      meetsThreshold: ratio >= threshold,
    };
  });
}
