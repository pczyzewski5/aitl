interface AccountRemainderCardMessages {
  remainderLabel: string;
  incomeLabel: string;
  expensesLabel: string;
  selectedMarker: string;
  loadingLabel: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
  sharedAccountLabel: string;
  personalAccountLabel: string;
}

const ACCOUNT_REMAINDER_CARD_MESSAGES: AccountRemainderCardMessages = {
  remainderLabel: 'Ile zostanie',
  incomeLabel: 'Wpływy',
  expensesLabel: 'Wydatki',
  selectedMarker: 'Wybrane',
  loadingLabel: 'Wczytywanie wyniku konta',
  errorTitle: 'Nie udało się wczytać wyniku konta',
  errorDescription: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
  retryLabel: 'Spróbuj ponownie',
  sharedAccountLabel: 'Wspólne',
  personalAccountLabel: 'Osobiste',
};

export { ACCOUNT_REMAINDER_CARD_MESSAGES };
export type { AccountRemainderCardMessages };
