type MoneySign = 'negative' | 'always';

interface FormatMoneyOptions {
  sign?: MoneySign;
}

const MINUS_SIGN = '−';
const PLUS_SIGN = '+';
const NO_BREAK_SPACE = ' ';
const DECIMAL_SEPARATOR = ',';
const PLN_SYMBOL = 'zł';
const MINOR_UNITS_PER_MAJOR = 100n;
const THOUSANDS_GROUP = /\B(?=(\d{3})+(?!\d))/g;

function toBigInt(amountMinor: number | bigint): bigint {
  if (typeof amountMinor === 'bigint') {
    return amountMinor;
  }
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError('Amount in minor units must be a safe integer or a bigint');
  }
  return BigInt(amountMinor);
}

function signPrefix(value: bigint, sign: MoneySign): string {
  if (value < 0n) {
    return MINUS_SIGN;
  }
  if (value > 0n && sign === 'always') {
    return PLUS_SIGN;
  }
  return '';
}

function formatMoneyMinor(amountMinor: number | bigint, { sign = 'negative' }: FormatMoneyOptions = {}): string {
  const value = toBigInt(amountMinor);
  const absolute = value < 0n ? -value : value;
  const major = (absolute / MINOR_UNITS_PER_MAJOR).toString().replace(THOUSANDS_GROUP, NO_BREAK_SPACE);
  const minor = (absolute % MINOR_UNITS_PER_MAJOR).toString().padStart(2, '0');

  return `${signPrefix(value, sign)}${major}${DECIMAL_SEPARATOR}${minor}${NO_BREAK_SPACE}${PLN_SYMBOL}`;
}

export { formatMoneyMinor };
export type { FormatMoneyOptions, MoneySign };
