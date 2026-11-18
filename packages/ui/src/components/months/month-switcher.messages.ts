interface MonthSwitcherMessages {
  groupLabel: string;
  previousLabel: string;
  nextLabel: string;
  previousDisabledReason: string;
  nextDisabledReason: string;
  monthNames: readonly string[];
}

const MONTH_SWITCHER_MESSAGES: MonthSwitcherMessages = {
  groupLabel: 'Wybór miesiąca',
  previousLabel: 'Poprzedni miesiąc',
  nextLabel: 'Następny miesiąc',
  previousDisabledReason: 'Nie ma wcześniejszych miesięcy do wyświetlenia',
  nextDisabledReason: 'Nie ma późniejszych miesięcy do wyświetlenia',
  monthNames: [
    'styczeń',
    'luty',
    'marzec',
    'kwiecień',
    'maj',
    'czerwiec',
    'lipiec',
    'sierpień',
    'wrzesień',
    'październik',
    'listopad',
    'grudzień',
  ],
};

export { MONTH_SWITCHER_MESSAGES };
export type { MonthSwitcherMessages };
