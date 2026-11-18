const AMOUNT_PATTERN = /^(\d+)(?:[.,](\d+))?$/;
const MINOR_UNITS_PER_MAJOR = 100;
const MAX_FRACTION_DIGITS = 2;
const MAX_WHOLE_DIGITS = 8;

type AmountFailureReason = 'empty' | 'negative' | 'invalid-format' | 'too-many-decimals' | 'too-large' | 'zero';

type AmountParseResult = { ok: true; minor: number } | { ok: false; reason: AmountFailureReason };

function parseAmountToMinor(input: string): AmountParseResult {
  const trimmed = input.trim();

  if (trimmed === '') {
    return { ok: false, reason: 'empty' };
  }

  if (trimmed.startsWith('-')) {
    return { ok: false, reason: 'negative' };
  }

  const match = AMOUNT_PATTERN.exec(trimmed);

  if (!match) {
    return { ok: false, reason: 'invalid-format' };
  }

  const [, whole = '', fraction = ''] = match;

  if (fraction.length > MAX_FRACTION_DIGITS) {
    return { ok: false, reason: 'too-many-decimals' };
  }

  if (whole.length > MAX_WHOLE_DIGITS) {
    return { ok: false, reason: 'too-large' };
  }

  const minor = Number(whole) * MINOR_UNITS_PER_MAJOR + Number(fraction.padEnd(MAX_FRACTION_DIGITS, '0'));

  if (minor === 0) {
    return { ok: false, reason: 'zero' };
  }

  return { ok: true, minor };
}

export { parseAmountToMinor };
export type { AmountFailureReason, AmountParseResult };
