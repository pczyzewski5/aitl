interface EntryTableMessages {
  descriptionHeader: string;
  amountHeader: string;
  dateHeader: string;
  paidHeader: string;
  actionsHeader: string;
  incomeLabel: string;
  expenseLabel: string;
  recurringBadge: string;
  recurringDay: (day: number) => string;
  paidLabel: (description: string) => string;
  paidNotApplicable: string;
  scrollHint: string;
  loadingLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
  limitExceededTitle: string;
  limitExceededDescription: (limit: number) => string;
}

const ENTRY_LIST_LIMIT = 500;

const DEFAULT_ENTRY_TABLE_MESSAGES: EntryTableMessages = {
  descriptionHeader: 'Opis',
  amountHeader: 'Kwota',
  dateHeader: 'Data',
  paidHeader: 'Zapłacone',
  actionsHeader: 'Akcje',
  incomeLabel: 'Wpływ',
  expenseLabel: 'Wydatek',
  recurringBadge: 'Co miesiąc',
  recurringDay: (day) => `Dzień miesiąca: ${day}`,
  paidLabel: (description) => `Zapłacone: ${description}`,
  paidNotApplicable: 'Nie dotyczy wpływów',
  scrollHint: 'Przewiń tabelę w poziomie, żeby zobaczyć wszystkie kolumny.',
  loadingLabel: 'Wczytywanie wpisów',
  emptyTitle: 'W tym miesiącu nie ma jeszcze żadnych wpisów',
  emptyDescription: 'Dodaj pierwszy wpływ albo wydatek, żeby zobaczyć go na liście.',
  errorTitle: 'Nie udało się wczytać wpisów',
  errorDescription: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
  retryLabel: 'Spróbuj ponownie',
  limitExceededTitle: 'Za dużo wpisów, żeby je pokazać',
  limitExceededDescription: (limit) =>
    `W tym miesiącu jest więcej niż ${limit} wpisów, a lista pokazuje najwyżej ${limit}. Nie wyświetlamy żadnych, żeby niczego nie ukryć. Wybierz inny miesiąc.`,
};

export { DEFAULT_ENTRY_TABLE_MESSAGES, ENTRY_LIST_LIMIT };
export type { EntryTableMessages };
