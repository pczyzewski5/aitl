import { MONTH_SWITCHER_MESSAGES } from '../months/month-switcher.messages';
import { DEFAULT_AMOUNT_FAILURE_MESSAGES } from './entry-form.messages';
import type { EntryFailureMessages } from './entry-failure';
import type { AmountFailureMessages } from './entry-validation';

interface SeriesActionsMessages extends EntryFailureMessages {
  triggerLabel: (description: string) => string;
  editItem: string;
  editDescriptionItem: string;
  deleteItem: string;
  endItem: string;
  changeAmountItem: string;
  deleteSeriesItem: string;
  deleteSeriesDisabledReason: string;
  noMonthsReason: string;
  cancelLabel: string;
  deleteTitle: (description: string) => string;
  deleteDescription: string;
  deleteConfirm: string;
  deleteSeriesTitle: (description: string) => string;
  deleteSeriesDescription: string;
  deleteSeriesConfirm: string;
  endTitle: (description: string) => string;
  endDescription: string;
  endMonthLabel: string;
  endMonthRequired: string;
  endConfirm: string;
  changeAmountTitle: (description: string) => string;
  changeAmountDescription: string;
  changeAmountMonthLabel: string;
  changeAmountMonthRequired: string;
  changeAmountConfirm: string;
  amountLabel: string;
  amountSuffix: string;
  currentAmountHint: (formattedAmount: string) => string;
  amountFailures: AmountFailureMessages;
  monthPlaceholder: string;
  monthNames: readonly string[];
  summaryTitle: string;
}

const DEFAULT_SERIES_ACTIONS_MESSAGES: SeriesActionsMessages = {
  triggerLabel: (description) => `Akcje wpisu ${description}`,
  editItem: 'Edytuj',
  editDescriptionItem: 'Edytuj opis',
  deleteItem: 'Usuń',
  endItem: 'Zakończ od miesiąca…',
  changeAmountItem: 'Zmień kwotę od miesiąca…',
  deleteSeriesItem: 'Usuń całkowicie…',
  deleteSeriesDisabledReason: 'Seria ma miesiące w przeszłości. Użyj „Zakończ od miesiąca”.',
  noMonthsReason: 'Nie ma miesiąca, od którego można to zrobić.',
  cancelLabel: 'Anuluj',
  deleteTitle: (description) => `Usunąć wpis „${description}”?`,
  deleteDescription: 'Wpis zniknie z listy i z wyniku konta w tym miesiącu. Tej operacji nie można cofnąć.',
  deleteConfirm: 'Usuń wpis',
  deleteSeriesTitle: (description) => `Usunąć całkowicie wpis cykliczny „${description}”?`,
  deleteSeriesDescription:
    'Wpis zniknie ze wszystkich miesięcy, razem z oznaczeniami „Zapłacone”. Tej operacji nie można cofnąć.',
  deleteSeriesConfirm: 'Usuń całkowicie',
  endTitle: (description) => `Zakończyć wpis cykliczny „${description}” od wybranego miesiąca?`,
  endDescription:
    'Wybrany miesiąc i kolejne przestaną zawierać ten wpis, razem z oznaczeniami „Zapłacone”. Wcześniejsze miesiące zostają bez zmian. Tej operacji nie można cofnąć.',
  endMonthLabel: 'Pierwszy miesiąc bez tego wpisu',
  endMonthRequired: 'Wybierz miesiąc, od którego wpis ma się skończyć.',
  endConfirm: 'Zakończ od miesiąca',
  changeAmountTitle: (description) => `Zmienić kwotę wpisu „${description}” od wybranego miesiąca?`,
  changeAmountDescription:
    'Nowa kwota obowiązuje od wybranego miesiąca włącznie. Wcześniejsze miesiące zachowują dotychczasową kwotę, więc ich wyniki się nie zmienią.',
  changeAmountMonthLabel: 'Pierwszy miesiąc z nową kwotą',
  changeAmountMonthRequired: 'Wybierz miesiąc, od którego obowiązuje nowa kwota.',
  changeAmountConfirm: 'Zmień kwotę',
  amountLabel: 'Nowa kwota',
  amountSuffix: 'PLN',
  currentAmountHint: (formattedAmount) => `Obecna kwota: ${formattedAmount}. Wpisz kwotę z przecinkiem lub kropką, np. 12,50.`,
  amountFailures: DEFAULT_AMOUNT_FAILURE_MESSAGES,
  monthPlaceholder: 'Wybierz miesiąc',
  monthNames: MONTH_SWITCHER_MESSAGES.monthNames,
  summaryTitle: 'Popraw pola, żeby zapisać zmianę',
  validation: 'Serwer odrzucił zmianę. Sprawdź dane i spróbuj ponownie.',
  conflict: 'Wpis zmienił się w międzyczasie. Odśwież listę i spróbuj ponownie.',
  network: 'Nie udało się połączyć z serwerem. Nic nie zostało zmienione. Sprawdź połączenie z internetem i spróbuj ponownie.',
  limit: 'Na tym koncie jest już zbyt wiele wpisów w miesiącu. Usuń nieaktualne wpisy i spróbuj ponownie.',
};

export { DEFAULT_SERIES_ACTIONS_MESSAGES };
export type { SeriesActionsMessages };
