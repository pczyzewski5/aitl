const MINOR_UNITS_PER_MAJOR = 100;
const DECIMAL_SEPARATOR = ',';
const FRACTION_DIGITS = 2;

function formatAmountInput(amountMinor: number): string {
  const major = Math.floor(amountMinor / MINOR_UNITS_PER_MAJOR);
  const minor = String(amountMinor % MINOR_UNITS_PER_MAJOR).padStart(FRACTION_DIGITS, '0');

  return `${major}${DECIMAL_SEPARATOR}${minor}`;
}

export { formatAmountInput };
