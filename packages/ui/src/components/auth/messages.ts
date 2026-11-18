interface LoginFormMessages {
  title: string;
  emailLabel: string;
  passwordLabel: string;
  submitLabel: string;
  submittingLabel: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  summaryTitle: string;
  invalidCredentials: string;
  tooManyAttempts: (secondsText: string) => string;
  tooManyAttemptsWithoutTime: string;
  network: string;
}

const DEFAULT_LOGIN_MESSAGES: LoginFormMessages = {
  title: 'Logowanie',
  emailLabel: 'Adres e-mail',
  passwordLabel: 'Hasło',
  submitLabel: 'Zaloguj się',
  submittingLabel: 'Logowanie…',
  emailRequired: 'Wpisz adres e-mail, np. jan@example.com.',
  emailInvalid: 'Adres e-mail wygląda na niepełny. Sprawdź, czy ma znak @ i domenę, np. jan@example.com.',
  passwordRequired: 'Wpisz hasło.',
  summaryTitle: 'Popraw dane logowania, żeby się zalogować',
  invalidCredentials: 'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.',
  tooManyAttempts: (secondsText) => `Zbyt wiele prób logowania. Spróbuj ponownie za ${secondsText}.`,
  tooManyAttemptsWithoutTime: 'Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.',
  network:
    'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie; wpisane dane zostały w formularzu.',
};

export { DEFAULT_LOGIN_MESSAGES };
export type { LoginFormMessages };
