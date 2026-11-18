import { type AmountFailureReason, parseAmountToMinor } from '../../backend/forms/parse-amount';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MIN_DATE = '2000-01-01';
const MAX_DATE = '2100-12-31';
const MAX_DESCRIPTION_LENGTH = 200;

interface DateFailureMessages {
  dateFormat: string;
  dateNotReal: string;
  dateOutOfRange: string;
}

type AmountFailureMessages = Record<AmountFailureReason, string>;

function validateAmountText(text: string, failures: AmountFailureMessages): string | undefined {
  const parsed = parseAmountToMinor(text);

  return parsed.ok ? undefined : failures[parsed.reason];
}

function validateDateText(text: string, messages: DateFailureMessages): string | undefined {
  const value = text.trim();
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return messages.dateFormat;
  }

  const [year = 0, month = 0, day = 0] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal) {
    return messages.dateNotReal;
  }

  return value < MIN_DATE || value > MAX_DATE ? messages.dateOutOfRange : undefined;
}

export { MAX_DESCRIPTION_LENGTH, validateAmountText, validateDateText };
export type { AmountFailureMessages, DateFailureMessages };
