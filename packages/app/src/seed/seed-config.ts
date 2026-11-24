export const SEED_PASSWORD_ENV = 'SEED_PASSWORD';
export const PRODUCTION_ENVIRONMENT = 'production';
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_PRODUCTION_PASSWORD_LENGTH = 12;
export const DEFAULT_SHARED_ACCOUNT_NAME = 'Wspólne';
export const DEFAULT_PERSONAL_ACCOUNT_NAME = 'Osobiste';

export const SEED_OPTION = {
  Email: 'email',
  Name: 'name',
  SharedOnly: 'shared-only',
  SharedAccountName: 'shared-account-name',
  PersonalAccountName: 'personal-account-name',
} as const;

export const SEED_EXIT_CODE = {
  Success: 0,
  PasswordMismatch: 1,
  InvalidInput: 2,
} as const;

export const SEED_MESSAGE = {
  usage: `Użycie: npm run seed:user -- --${SEED_OPTION.Email} <e-mail> --${SEED_OPTION.Name} <nazwa> [--${SEED_OPTION.SharedOnly}] [--${SEED_OPTION.SharedAccountName} <nazwa>] [--${SEED_OPTION.PersonalAccountName} <nazwa>]`,
  missingOption: (option: string): string => `Brak wymaganej opcji --${option}.`,
  invalidEmail: 'Niepoprawny adres e-mail.',
  missingPassword: `Ustaw hasło w zmiennej środowiskowej ${SEED_PASSWORD_ENV} (np. w lokalnym .env).`,
  passwordTooShort: (minLength: number): string => `Hasło jest za krótkie, minimum to ${minLength} znaków.`,
  created: (email: string): string => `Utworzono konto użytkownika ${email}.`,
  unchanged: (email: string): string => `Użytkownik ${email} już istnieje, dane i hasło bez zmian.`,
  passwordMismatch: (email: string): string =>
    `Ostrzeżenie: użytkownik ${email} już istnieje z innym hasłem niż w ${SEED_PASSWORD_ENV}. Hasło nie zostało zmienione.`,
} as const;
