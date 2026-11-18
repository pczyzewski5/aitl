import { MAX_DESCRIPTION_LENGTH, type AmountFailureMessages, type DateFailureMessages } from './entry-validation';
import type { EntryFailureMessages } from './entry-failure';

interface EntryFormMessages extends EntryFailureMessages, DateFailureMessages {
  createTitle: string;
  editTitle: string;
  editSeriesTitle: string;
  createDescription: string;
  editDescription: string;
  editSeriesDescription: string;
  typeLegend: string;
  incomeLabel: string;
  expenseLabel: string;
  descriptionLabel: string;
  descriptionHint: string;
  descriptionRequired: string;
  descriptionTooLong: string;
  amountLabel: string;
  amountSuffix: string;
  amountHint: string;
  amountFailures: AmountFailureMessages;
  dateLabel: string;
  dateHint: string;
  dateHintMonthly: string;
  recurrenceLabel: string;
  recurrenceOnce: string;
  recurrenceMonthly: string;
  paidLabel: string;
  dayOfMonthLabel: string;
  recurringReadOnlyHint: string;
  summaryTitle: string;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  saved: string;
}

const DEFAULT_AMOUNT_FAILURE_MESSAGES: AmountFailureMessages = {
  empty: 'Podaj kwotę, np. 12,50.',
  negative: 'Kwota nie może być ujemna. Wpisz wartość dodatnią, a to, czy to wpływ czy wydatek, wybierz w polu „Typ”.',
  'invalid-format': 'Kwota ma niepoprawny format. Wpisz same cyfry z przecinkiem lub kropką, np. 12,50.',
  'too-many-decimals': 'Kwota ma więcej niż dwa miejsca po przecinku. Zaokrąglij do groszy, np. 12,50.',
  'too-large': 'Kwota jest zbyt duża. Wpisz mniej niż 100 000 000 zł.',
  zero: 'Kwota musi być większa od zera. Wpisz co najmniej 0,01.',
};

const DEFAULT_ENTRY_FORM_MESSAGES: EntryFormMessages = {
  createTitle: 'Dodaj wpis',
  editTitle: 'Edytuj wpis',
  editSeriesTitle: 'Edytuj opis wpisu cyklicznego',
  createDescription: 'Wpływ albo wydatek na tym koncie. Kwoty są w złotych (PLN).',
  editDescription: 'Zmień opis, kwotę albo datę wpisu. Typ wpisu jest niezmienny.',
  editSeriesDescription: 'W wpisie cyklicznym zmienisz tu tylko opis. Zmiana obejmie wszystkie miesiące serii.',
  typeLegend: 'Typ',
  incomeLabel: 'Wpływ',
  expenseLabel: 'Wydatek',
  descriptionLabel: 'Opis',
  descriptionHint: `Do ${MAX_DESCRIPTION_LENGTH} znaków.`,
  descriptionRequired: 'Wpisz opis wpisu, np. Czynsz.',
  descriptionTooLong: `Opis ma więcej niż ${MAX_DESCRIPTION_LENGTH} znaków. Skróć go.`,
  amountLabel: 'Kwota',
  amountSuffix: 'PLN',
  amountHint: 'Wpisz kwotę z przecinkiem lub kropką, np. 12,50.',
  amountFailures: DEFAULT_AMOUNT_FAILURE_MESSAGES,
  dateLabel: 'Data',
  dateHint: 'Format RRRR-MM-DD, np. 2026-11-18.',
  dateHintMonthly:
    'Format RRRR-MM-DD, np. 2026-11-18. Dla wpisu co miesiąc to data pierwszego wystąpienia, a dzień miesiąca wynika z niej; w krótszych miesiącach wpis wypada ostatniego dnia.',
  dateFormat: 'Podaj datę wpisu w formacie RRRR-MM-DD, np. 2026-11-18.',
  dateNotReal: 'Taka data nie istnieje w kalendarzu. Sprawdź dzień i miesiąc, np. 2026-11-18.',
  dateOutOfRange: 'Data wpisu jest poza zakresem. Wybierz rok od 2000 do 2100.',
  recurrenceLabel: 'Powtarzanie',
  recurrenceOnce: 'Jednorazowy',
  recurrenceMonthly: 'Co miesiąc',
  paidLabel: 'Zapłacone',
  dayOfMonthLabel: 'Dzień miesiąca',
  recurringReadOnlyHint:
    'Kwotę wpisu cyklicznego zmienisz akcją „Zmień kwotę od miesiąca” w menu wpisu. Typ i początek serii są niezmienne.',
  summaryTitle: 'Popraw pola, żeby zapisać wpis',
  submitLabel: 'Zapisz',
  submittingLabel: 'Zapisywanie…',
  cancelLabel: 'Anuluj',
  saved: 'Wpis zapisany.',
  validation: 'Serwer odrzucił wpis. Sprawdź dane i spróbuj ponownie.',
  conflict: 'Wpis zmienił się w międzyczasie. Odśwież listę i spróbuj ponownie.',
  network:
    'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie; wpisane dane zostały w formularzu.',
  limit: 'Na tym koncie jest już zbyt wiele wpisów w miesiącu. Usuń nieaktualne wpisy i spróbuj ponownie.',
};

export { DEFAULT_AMOUNT_FAILURE_MESSAGES, DEFAULT_ENTRY_FORM_MESSAGES };
export type { EntryFormMessages };
