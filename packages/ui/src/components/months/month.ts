type MonthKey = string;

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;
const MONTHS_PER_YEAR = 12;
const MIN_YEAR = 1;
const MAX_YEAR = 9999;
const YEAR_DIGITS = 4;
const MONTH_DIGITS = 2;

interface MonthParts {
  readonly year: number;
  readonly month: number;
}

function parseMonthKey(key: MonthKey): MonthParts | null {
  const match = MONTH_KEY_PATTERN.exec(key);
  if (match === null) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < MIN_YEAR || month < 1 || month > MONTHS_PER_YEAR) {
    return null;
  }
  return { year, month };
}

function isMonthKey(value: string): value is MonthKey {
  return parseMonthKey(value) !== null;
}

function requireMonthParts(key: MonthKey): MonthParts {
  const parts = parseMonthKey(key);
  if (parts === null) {
    throw new RangeError(`Invalid month key "${key}", expected YYYY-MM`);
  }
  return parts;
}

function buildMonthKey(year: number, month: number): MonthKey {
  return `${String(year).padStart(YEAR_DIGITS, '0')}-${String(month).padStart(MONTH_DIGITS, '0')}`;
}

function addMonths(key: MonthKey, delta: number): MonthKey {
  const { year, month } = requireMonthParts(key);
  const totalMonths = year * MONTHS_PER_YEAR + (month - 1) + delta;
  const nextYear = Math.floor(totalMonths / MONTHS_PER_YEAR);
  if (!Number.isInteger(delta) || nextYear < MIN_YEAR || nextYear > MAX_YEAR) {
    throw new RangeError(`Cannot move month "${key}" by ${delta}`);
  }
  return buildMonthKey(nextYear, (totalMonths % MONTHS_PER_YEAR) + 1);
}

function compareMonths(left: MonthKey, right: MonthKey): number {
  const leftParts = requireMonthParts(left);
  const rightParts = requireMonthParts(right);
  return leftParts.year * MONTHS_PER_YEAR + leftParts.month - (rightParts.year * MONTHS_PER_YEAR + rightParts.month);
}

function formatMonthLabel(key: MonthKey, monthNames: readonly string[]): string {
  const { year, month } = requireMonthParts(key);
  const name = monthNames[month - 1];
  if (name === undefined) {
    throw new RangeError(`Missing name for month ${month}`);
  }
  return `${name} ${year}`;
}

export { addMonths, compareMonths, formatMonthLabel, isMonthKey, parseMonthKey };
export type { MonthKey, MonthParts };
