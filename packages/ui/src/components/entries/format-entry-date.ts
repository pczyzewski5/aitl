const DATE_PARTS_SEPARATOR = '-';
const DISPLAY_SEPARATOR = '.';

function formatEntryDate(date: string): string {
  const [year, month, day] = date.split(DATE_PARTS_SEPARATOR);

  return [day, month, year].join(DISPLAY_SEPARATOR);
}

export { formatEntryDate };
