type PolishSecondsForm = 'one' | 'few' | 'many' | 'other';

const SECONDS_FORMS: Record<PolishSecondsForm, string> = {
  one: 'sekundę',
  few: 'sekundy',
  many: 'sekund',
  other: 'sekundy',
};

const POLISH_PLURAL_RULES = new Intl.PluralRules('pl');

function formatSeconds(seconds: number): string {
  const form = POLISH_PLURAL_RULES.select(seconds) as PolishSecondsForm;

  return `${seconds} ${SECONDS_FORMS[form]}`;
}

export { formatSeconds };
