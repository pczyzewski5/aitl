interface BankAccountListMessages {
  title: string;
  sharedLabel: string;
  personalLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  errorTitle: string;
  errorDescription: string;
  retryLabel: string;
}

const DEFAULT_BANK_ACCOUNT_LIST_MESSAGES: BankAccountListMessages = {
  title: 'Twoje konta bankowe',
  sharedLabel: 'Wspólne',
  personalLabel: 'Osobiste',
  emptyTitle: 'Nie masz jeszcze żadnego konta bankowego',
  emptyDescription: 'Skontaktuj się z administratorem aplikacji.',
  errorTitle: 'Nie udało się wczytać kont bankowych',
  errorDescription: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
  retryLabel: 'Spróbuj ponownie',
};

export { DEFAULT_BANK_ACCOUNT_LIST_MESSAGES };
export type { BankAccountListMessages };
