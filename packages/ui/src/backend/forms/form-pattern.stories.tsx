import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useLayoutEffect, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { RadioGroup } from '../../components/ui/radio-group';
import { Select } from '../../components/ui/select';
import { ToastProvider, useToast } from '../../components/ui/toast';
import { ErrorSummary } from './error-summary';
import { parseAmountToMinor } from './parse-amount';
import type { AmountFailureReason } from './parse-amount';
import { useFormValidation } from './use-form-validation';
import type { FieldErrors, SubmitResult } from './use-form-validation';

const REQUEST_DELAY_MS = 150;
const DEFAULT_LOCKOUT_SECONDS = 87;
const MAX_DESCRIPTION_LENGTH = 200;
const MINOR_UNITS_PER_MAJOR = 100;
const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 560 } };
const DURATION_TOKEN = '--toast-duration';
const PERSISTENT_DURATION = '3600000ms';
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const EMAIL_REQUIRED = 'Wpisz adres e-mail, np. jan@example.com.';
const EMAIL_INVALID = 'Adres e-mail wygląda na niepełny. Sprawdź, czy ma znak @ i domenę, np. jan@example.com.';
const PASSWORD_REQUIRED = 'Wpisz hasło.';
const LOGIN_SUMMARY_TITLE = 'Popraw dane logowania, żeby się zalogować';
const LOGIN_GENERIC_ERROR = 'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.';
const NETWORK_ERROR = 'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie; wpisane dane zostały w formularzu.';
const SIGNED_IN_MESSAGE = 'Zalogowano. Za chwilę zobaczysz listę kont.';

const SECONDS_FORMS: Record<Intl.LDMLPluralRule, string> = {
  zero: 'sekund',
  one: 'sekundę',
  two: 'sekundy',
  few: 'sekundy',
  many: 'sekund',
  other: 'sekundy',
};

function formatSeconds(seconds: number): string {
  return `${seconds} ${SECONDS_FORMS[new Intl.PluralRules('pl').select(seconds)]}`;
}

function lockoutMessage(seconds: number): string {
  return `Zbyt wiele prób logowania. Spróbuj ponownie za ${formatSeconds(seconds)}.`;
}

const AMOUNT_MESSAGES: Record<AmountFailureReason, string> = {
  empty: 'Podaj kwotę, np. 12,50.',
  negative: 'Kwota nie może być ujemna. Wpisz wartość dodatnią, a to, czy to wpływ czy wydatek, wybierz w polu "Typ wpisu".',
  'invalid-format': 'Kwota ma niepoprawny format. Wpisz same cyfry z przecinkiem lub kropką, np. 12,50.',
  'too-many-decimals': 'Kwota ma więcej niż dwa miejsca po przecinku. Zaokrąglij do groszy, np. 12,50.',
  'too-large': 'Kwota jest zbyt duża. Wpisz mniej niż 100 000 000 zł.',
  zero: 'Kwota musi być większa od zera. Wpisz co najmniej 0,01.',
};
const DATE_FORMAT_MESSAGE = 'Podaj datę wpisu w formacie RRRR-MM-DD, np. 2026-11-18.';
const DATE_NOT_REAL_MESSAGE = 'Taka data nie istnieje w kalendarzu. Sprawdź dzień i miesiąc, np. 2026-11-18.';
const DESCRIPTION_REQUIRED = 'Wpisz opis wpisu, np. Czynsz.';
const DESCRIPTION_TOO_LONG = `Opis ma więcej niż ${MAX_DESCRIPTION_LENGTH} znaków. Skróć go.`;
const ENTRY_SUMMARY_TITLE = 'Popraw pola, żeby zapisać wpis';
const ENTRY_LIMIT_ERROR = 'Na tym koncie jest już zbyt wiele wpisów w miesiącu. Usuń nieaktualne wpisy i spróbuj ponownie.';
const ENTRY_DATE_RANGE_ERROR = 'Data wpisu jest poza zakresem. Wybierz rok od 2000 do 2100.';

const ENTRY_TYPES = [
  { value: 'income', label: 'Wpływ' },
  { value: 'expense', label: 'Wydatek' },
];
const RECURRENCES = [
  { value: 'none', label: 'Jednorazowy' },
  { value: 'monthly', label: 'Co miesiąc' },
];

type LoginScenario = 'success' | 'wrong-credentials' | 'lockout' | 'network' | 'pending';
type EntryScenario = 'success' | 'limit-exceeded' | 'date-out-of-range' | 'network' | 'pending';

type LoginValues = { email: string; password: string };
type EntryValues = {
  type: string;
  amount: string;
  date: string;
  recurrence: string;
  description: string;
  paid: boolean;
};

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  const email = values.email.trim();
  let emailError: string | undefined;
  if (email === '') {
    emailError = EMAIL_REQUIRED;
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    emailError = EMAIL_INVALID;
  }
  return { email: emailError, password: values.password === '' ? PASSWORD_REQUIRED : undefined };
}

function validateDate(value: string): string | undefined {
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) {
    return DATE_FORMAT_MESSAGE;
  }
  const [year = 0, month = 0, day = 0] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isReal ? undefined : DATE_NOT_REAL_MESSAGE;
}

function validateEntry(values: EntryValues): FieldErrors<EntryValues> {
  const amount = parseAmountToMinor(values.amount);
  const description = values.description.trim();
  let descriptionError: string | undefined;
  if (description === '') {
    descriptionError = DESCRIPTION_REQUIRED;
  } else if (description.length > MAX_DESCRIPTION_LENGTH) {
    descriptionError = DESCRIPTION_TOO_LONG;
  }
  return {
    amount: amount.ok ? undefined : AMOUNT_MESSAGES[amount.reason],
    date: validateDate(values.date),
    description: descriptionError,
  };
}

function formatAmountMinor(minor: number): string {
  const cents = String(minor % MINOR_UNITS_PER_MAJOR).padStart(2, '0');
  return `${Math.floor(minor / MINOR_UNITS_PER_MAJOR)},${cents} zł`;
}

interface LoginFormExampleProps {
  scenario?: LoginScenario;
  lockoutSeconds?: number;
  onRequest?: (values: object) => void;
}

function LoginFormExample({ scenario = 'wrong-credentials', lockoutSeconds = DEFAULT_LOCKOUT_SECONDS, onRequest }: LoginFormExampleProps) {
  const [signedIn, setSignedIn] = useState(false);
  const form = useFormValidation<LoginValues>({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (values): Promise<SubmitResult<LoginValues>> => {
      onRequest?.(values);
      await wait(REQUEST_DELAY_MS);
      switch (scenario) {
        case 'success':
          setSignedIn(true);
          return { ok: true };
        case 'lockout':
          return { ok: false, formError: lockoutMessage(lockoutSeconds) };
        case 'network':
          return { ok: false, formError: NETWORK_ERROR };
        case 'pending':
          return new Promise<never>(() => undefined);
        default:
          return { ok: false, formError: LOGIN_GENERIC_ERROR };
      }
    },
  });

  return (
    <form {...form.formProps} aria-label="Logowanie (przykład)" className="flex max-w-md flex-col gap-(--space-between-fields) rounded-card border border-border bg-card p-4">
      {form.formError && (
        <Alert variant="error">
          <AlertDescription>{form.formError}</AlertDescription>
        </Alert>
      )}
      {signedIn && (
        <Alert>
          <AlertDescription>{SIGNED_IN_MESSAGE}</AlertDescription>
        </Alert>
      )}
      <ErrorSummary title={LOGIN_SUMMARY_TITLE} errors={form.summary} onSelect={form.focusField} />
      <Field label="Adres e-mail" {...form.getFieldProps('email')}>
        <Input type="email" autoComplete="email" {...form.getInputProps('email')} />
      </Field>
      <Field label="Hasło" {...form.getFieldProps('password')}>
        <Input type="password" autoComplete="current-password" {...form.getInputProps('password')} />
      </Field>
      <div>
        <Button type="submit" loading={form.submitting}>
          {form.submitting ? 'Logowanie…' : 'Zaloguj'}
        </Button>
      </div>
    </form>
  );
}

interface EntryFormExampleProps {
  scenario?: EntryScenario;
  onRequest?: (values: object) => void;
}

function EntryFormExample({ scenario = 'success', onRequest }: EntryFormExampleProps) {
  const { toast } = useToast();
  const form = useFormValidation<EntryValues>({
    initialValues: { type: 'expense', amount: '', date: '', recurrence: 'none', description: '', paid: false },
    validate: validateEntry,
    onSubmit: async (values, { reset }): Promise<SubmitResult<EntryValues>> => {
      const amount = parseAmountToMinor(values.amount);
      onRequest?.({ ...values, amountMinor: amount.ok ? amount.minor : undefined });
      await wait(REQUEST_DELAY_MS);
      switch (scenario) {
        case 'limit-exceeded':
          return { ok: false, formError: ENTRY_LIMIT_ERROR };
        case 'date-out-of-range':
          return { ok: false, fieldErrors: { date: ENTRY_DATE_RANGE_ERROR } };
        case 'network':
          return { ok: false, formError: NETWORK_ERROR };
        case 'pending':
          return new Promise<never>(() => undefined);
        default:
          toast({ message: `Zapisano wpis ${values.description.trim()}: ${formatAmountMinor(amount.ok ? amount.minor : 0)}.` });
          reset();
          return { ok: true };
      }
    },
  });

  return (
    <form {...form.formProps} aria-label="Dodaj wpis (przykład)" className="flex max-w-md flex-col gap-(--space-between-fields) rounded-card border border-border bg-card p-4">
      {form.formError && (
        <Alert variant="error">
          <AlertDescription>{form.formError}</AlertDescription>
        </Alert>
      )}
      <ErrorSummary title={ENTRY_SUMMARY_TITLE} errors={form.summary} onSelect={form.focusField} />
      <RadioGroup
        legend="Typ wpisu"
        name="type"
        options={ENTRY_TYPES}
        value={form.values.type}
        onValueChange={(value) => form.setValue('type', value)}
        onBlur={() => form.touch('type')}
        {...form.getFieldProps('type')}
      />
      <Field label="Kwota (zł)" hint="Wpisz kwotę z przecinkiem lub kropką, np. 12,50." {...form.getFieldProps('amount')}>
        <Input type="amount" placeholder="np. 12,50" autoComplete="off" {...form.getInputProps('amount')} />
      </Field>
      <Field label="Data" hint="Format RRRR-MM-DD, np. 2026-11-18." {...form.getFieldProps('date')}>
        <Input type="text" inputMode="numeric" placeholder="np. 2026-11-18" autoComplete="off" {...form.getInputProps('date')} />
      </Field>
      <Field label="Cykliczność" {...form.getFieldProps('recurrence')}>
        <Select options={RECURRENCES} {...form.getInputProps('recurrence')} />
      </Field>
      <Field label="Opis" {...form.getFieldProps('description')}>
        <Input type="text" autoComplete="off" {...form.getInputProps('description')} />
      </Field>
      {form.values.type === 'expense' && (
        <Checkbox
          label="Zapłacone"
          checked={form.values.paid}
          onCheckedChange={(checked) => form.setValue('paid', checked === true)}
        />
      )}
      <div>
        <Button type="submit" loading={form.submitting}>
          {form.submitting ? 'Zapisywanie…' : 'Zapisz wpis'}
        </Button>
      </div>
    </form>
  );
}

type LongLabelValues = { amount: string; description: string; note: boolean };

const LONG_AMOUNT_LABEL = 'Kwota wpisu w złotych polskich, bez separatora tysięcy, z przecinkiem albo kropką przed groszami (przykład)';
const LONG_DESCRIPTION_LABEL = 'Opis wpisu, który wyjaśnia, za co zapłacono albo skąd pochodzi wpływ, najlepiej w jednym zdaniu (przykład)';
const LONG_CHECKBOX_LABEL = 'Wydatek jest już zapłacony i nie trzeba o nim przypominać w kolejnych miesiącach (przykład)';
const LONG_SUMMARY_TITLE = 'Popraw dwa pola formularza, żeby zapisać wpis, który ma bardzo długi tytuł podsumowania (przykład)';
const LONG_URL = 'https://przyklad.example.com/bardzo/dlugi/adres/bez/spacji/ktory/nie-ma-gdzie-sie-zawinac/0123456789';

function validateLongLabels(values: LongLabelValues): FieldErrors<LongLabelValues> {
  return {
    amount: values.amount === '' ? `Podaj kwotę wpisu, np. 12,50. Zobacz też przykład pod adresem ${LONG_URL}.` : undefined,
    description: values.description === '' ? 'Wpisz opis wpisu, który wyjaśnia, za co zapłacono, najlepiej w jednym zdaniu.' : undefined,
  };
}

function LongLabelsExample() {
  const form = useFormValidation<LongLabelValues>({
    initialValues: { amount: '', description: '', note: false },
    validate: validateLongLabels,
    onSubmit: () => Promise.resolve({ ok: true }),
  });

  return (
    <form {...form.formProps} aria-label="Formularz z długimi etykietami (przykład)" className="flex w-80 flex-col gap-(--space-between-fields) border border-border bg-card p-4">
      <ErrorSummary title={LONG_SUMMARY_TITLE} errors={form.summary} onSelect={form.focusField} />
      <Field label={LONG_AMOUNT_LABEL} hint="Podpowiedź też bywa długa i zawija się do następnego wiersza." {...form.getFieldProps('amount')}>
        <Input type="amount" {...form.getInputProps('amount')} />
      </Field>
      <Field label={LONG_DESCRIPTION_LABEL} {...form.getFieldProps('description')}>
        <Input type="text" {...form.getInputProps('description')} />
      </Field>
      <Checkbox label={LONG_CHECKBOX_LABEL} checked={form.values.note} onCheckedChange={(checked) => form.setValue('note', checked === true)} />
      <div>
        <Button type="submit">Zapisz wpis</Button>
      </div>
    </form>
  );
}

interface PersistentToastsProps {
  children: ReactNode;
}

function PersistentToasts({ children }: PersistentToastsProps) {
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.style.setProperty(DURATION_TOKEN, PERSISTENT_DURATION);
    setReady(true);
    return () => {
      document.documentElement.style.removeProperty(DURATION_TOKEN);
    };
  }, []);

  return ready ? children : null;
}

function WithToasts({ children }: PersistentToastsProps) {
  return (
    <PersistentToasts>
      <ToastProvider closeLabel="Zamknij" viewportLabel="Powiadomienia ({hotkey})" announcementLabel="Powiadomienie">
        {children}
      </ToastProvider>
    </PersistentToasts>
  );
}

const meta = {
  title: 'Wzorce/Formularz',
  component: LoginFormExample,
  parameters: { layout: 'padded' },
  args: { onRequest: fn() },
  argTypes: {
    scenario: {
      control: 'inline-radio',
      options: ['wrong-credentials', 'lockout', 'network', 'success', 'pending'],
      description: 'Symulowana odpowiedź serwera po poprawnym wypełnieniu formularza',
    },
    lockoutSeconds: { control: 'number' },
  },
} satisfies Meta<typeof LoginFormExample>;

export default meta;
type Story = StoryObj<typeof meta>;

async function fillLogin(canvasElement: HTMLElement, email = 'jan@example.com', password = 'tajne-haslo') {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByLabelText('Adres e-mail'), email);
  await userEvent.type(canvas.getByLabelText('Hasło'), password);
}

function submitButton(canvasElement: HTMLElement, name: string) {
  return within(canvasElement).getByRole('button', { name });
}

export const Playground: Story = { name: 'Logowanie: pole do zabawy (wybierz odpowiedź serwera)' };

export const Pristine: Story = {
  name: 'Logowanie: czysty formularz (bez błędów przed dotknięciem pól)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByLabelText('Adres e-mail')).not.toHaveAttribute('aria-invalid');
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveAttribute('aria-required', 'true');
  },
};

export const TouchedInvalid: Story = {
  name: 'Logowanie: pole po opuszczeniu (błąd pod polem, tylko to pole)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText('Adres e-mail');
    const password = canvas.getByLabelText('Hasło');

    await userEvent.tab();
    await expect(email).toHaveFocus();
    await expect(canvas.queryByRole('alert')).toBeNull();

    await userEvent.tab();
    await expect(password).toHaveFocus();

    await expect(canvas.getByText(EMAIL_REQUIRED)).toBeVisible();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(password).not.toHaveAttribute('aria-invalid');
    await expect(canvas.queryByText(PASSWORD_REQUIRED)).toBeNull();
  },
};

export const SubmitOneError: Story = {
  name: 'Logowanie: wysłanie z jednym błędem (komunikat pod polem i fokus, bez podsumowania)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Adres e-mail'), 'jan@example.com');
    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();
    await expect(canvas.getByText(PASSWORD_REQUIRED)).toBeVisible();
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
    await expect(canvas.queryByText(LOGIN_SUMMARY_TITLE)).toBeNull();
    await expect(args.onRequest).not.toHaveBeenCalled();
  },
};

export const SubmitSeveralErrors: Story = {
  name: 'Logowanie: wysłanie z kilkoma błędami (podsumowanie z linkami, fokus na pierwszym polu)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
    await expect(canvas.getByText(LOGIN_SUMMARY_TITLE)).toBeVisible();
    await expect(canvas.getAllByRole('link').map((link) => link.textContent)).toEqual([EMAIL_REQUIRED, PASSWORD_REQUIRED]);
  },
};

export const Loading: Story = {
  name: 'Logowanie: wysyłanie (przycisk w stanie ładowania, dane zostają)',
  args: { scenario: 'pending' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    const button = await canvas.findByRole('button', { name: 'Logowanie…' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveValue('jan@example.com');
    await expect(canvas.getByLabelText('Hasło')).toHaveValue('tajne-haslo');
  },
};

export const WrongCredentials: Story = {
  name: 'Logowanie: błąd serwera, komunikat ogólny (ten sam dla złego e-maila i hasła)',
  args: { scenario: 'wrong-credentials' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement, 'nieznany@example.com', 'zle-haslo');

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    const first = await canvas.findByRole('alert');
    await expect(first).toHaveTextContent(LOGIN_GENERIC_ERROR);
    await expect(canvas.getByLabelText('Adres e-mail')).not.toHaveAttribute('aria-invalid');
    await expect(canvas.getByLabelText('Hasło')).toHaveValue('zle-haslo');

    await userEvent.clear(canvas.getByLabelText('Adres e-mail'));
    await userEvent.type(canvas.getByLabelText('Adres e-mail'), 'jan@example.com');
    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await waitFor(() => expect(args.onRequest).toHaveBeenCalledTimes(2));
    const second = await canvas.findByRole('alert');
    await expect(second).toHaveTextContent(LOGIN_GENERIC_ERROR);
  },
};

export const Lockout: Story = {
  name: 'Logowanie: blokada po zbyt wielu próbach (429, z liczbą sekund)',
  args: { scenario: 'lockout', lockoutSeconds: DEFAULT_LOCKOUT_SECONDS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(await canvas.findByRole('alert')).toHaveTextContent('Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund.');
  },
};

export const LockoutOneSecond: Story = {
  name: 'Logowanie: blokada, liczba pojedyncza (1 sekundę)',
  args: { scenario: 'lockout', lockoutSeconds: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(await canvas.findByRole('alert')).toHaveTextContent('Spróbuj ponownie za 1 sekundę.');
  },
};

export const NetworkError: Story = {
  name: 'Logowanie: brak sieci (komunikat u góry formularza, dane zostają)',
  args: { scenario: 'network' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(NETWORK_ERROR);
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveValue('jan@example.com');
    await expect(submitButton(canvasElement, 'Zaloguj')).not.toHaveAttribute('aria-busy');
  },
};

export const Success: Story = {
  name: 'Logowanie: sukces (dopiero po potwierdzeniu z serwera)',
  args: { scenario: 'success' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(canvas.queryByText(SIGNED_IN_MESSAGE)).toBeNull();
    await expect(await canvas.findByRole('status')).toHaveTextContent(SIGNED_IN_MESSAGE);
  },
};

export const EntryPristine: Story = {
  name: 'Wpis: czysty formularz',
  render: () => (
    <WithToasts>
      <EntryFormExample />
    </WithToasts>
  ),
};

export const EntryOneError: Story = {
  name: 'Wpis: jeden błąd (kwota z trzema miejscami po przecinku)',
  args: { onRequest: fn() },
  render: (args) => (
    <WithToasts>
      <EntryFormExample onRequest={args.onRequest} />
    </WithToasts>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Kwota (zł)'), '12,505');
    await userEvent.type(canvas.getByLabelText('Data'), '2026-11-18');
    await userEvent.type(canvas.getByLabelText('Opis'), 'Czynsz (przykład)');
    await userEvent.click(submitButton(canvasElement, 'Zapisz wpis'));

    await expect(canvas.getByLabelText('Kwota (zł)')).toHaveFocus();
    await expect(canvas.getByText(AMOUNT_MESSAGES['too-many-decimals'])).toBeVisible();
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
    await expect(args.onRequest).not.toHaveBeenCalled();
  },
};

export const EntrySeveralErrors: Story = {
  name: 'Wpis: kilka błędów (podsumowanie z trzema linkami)',
  render: () => (
    <WithToasts>
      <EntryFormExample />
    </WithToasts>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Kwota (zł)'), '-5');
    await userEvent.click(submitButton(canvasElement, 'Zapisz wpis'));

    await expect(canvas.getByLabelText('Kwota (zł)')).toHaveFocus();
    await expect(canvas.getByText(ENTRY_SUMMARY_TITLE)).toBeVisible();
    await expect(canvas.getAllByRole('link').map((link) => link.textContent)).toEqual([
      AMOUNT_MESSAGES.negative,
      DATE_FORMAT_MESSAGE,
      DESCRIPTION_REQUIRED,
    ]);

    await userEvent.click(canvas.getByRole('link', { name: DESCRIPTION_REQUIRED }));

    await expect(canvas.getByLabelText('Opis')).toHaveFocus();
  },
};

export const EntrySaved: Story = {
  name: 'Wpis: zapisany (Toast po potwierdzeniu z serwera, formularz wyczyszczony)',
  parameters: { docs: DOCS_IFRAME },
  args: { onRequest: fn() },
  render: (args) => (
    <WithToasts>
      <EntryFormExample onRequest={args.onRequest} />
    </WithToasts>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Kwota (zł)'), '1850,5');
    await userEvent.type(canvas.getByLabelText('Data'), '2026-11-18');
    await userEvent.type(canvas.getByLabelText('Opis'), 'Czynsz (przykład)');
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Zapłacone' }));
    await userEvent.click(submitButton(canvasElement, 'Zapisz wpis'));

    await waitFor(() => expect(args.onRequest).toHaveBeenCalledTimes(1));
    await expect(args.onRequest).toHaveBeenCalledWith(
      expect.objectContaining({ amountMinor: 185050, date: '2026-11-18', paid: true, type: 'expense', recurrence: 'none' }),
    );
    await expect(await screen.findByText('Zapisano wpis Czynsz (przykład): 1850,50 zł.')).toBeVisible();
    await expect(canvas.getByLabelText('Kwota (zł)')).toHaveValue('');
    await expect(canvas.getByLabelText('Opis')).toHaveValue('');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(submitButton(canvasElement, 'Zapisz wpis')).toHaveFocus();
  },
};

export const EntryServerFieldError: Story = {
  name: 'Wpis: błąd pola z serwera (komunikat pod polem i fokus)',
  render: () => (
    <WithToasts>
      <EntryFormExample scenario="date-out-of-range" />
    </WithToasts>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Kwota (zł)'), '12,50');
    await userEvent.type(canvas.getByLabelText('Data'), '1999-01-01');
    await userEvent.type(canvas.getByLabelText('Opis'), 'Stary wpis (przykład)');
    await userEvent.click(submitButton(canvasElement, 'Zapisz wpis'));

    await expect(await canvas.findByText(ENTRY_DATE_RANGE_ERROR)).toBeVisible();
    await expect(canvas.getByLabelText('Data')).toHaveFocus();
    await expect(canvas.getByLabelText('Data')).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByLabelText('Kwota (zł)')).toHaveValue('12,50');

    await userEvent.type(canvas.getByLabelText('Data'), '0');

    await waitFor(() => expect(canvas.queryByText(ENTRY_DATE_RANGE_ERROR)).toBeNull());
  },
};

export const EntryServerError: Story = {
  name: 'Wpis: błąd serwera niezwiązany z polem (komunikat u góry, np. limit wpisów)',
  render: () => (
    <WithToasts>
      <EntryFormExample scenario="limit-exceeded" />
    </WithToasts>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Kwota (zł)'), '12,50');
    await userEvent.type(canvas.getByLabelText('Data'), '2026-11-18');
    await userEvent.type(canvas.getByLabelText('Opis'), 'Czynsz (przykład)');
    await userEvent.click(submitButton(canvasElement, 'Zapisz wpis'));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(ENTRY_LIMIT_ERROR);
    await expect(canvas.getByLabelText('Opis')).toHaveValue('Czynsz (przykład)');
  },
};

export const LongLabelsNarrowScreen: Story = {
  name: 'Długie etykiety i komunikaty, wąski ekran (320 px)',
  globals: { viewport: NARROW_VIEWPORT.viewport },
  render: () => <LongLabelsExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zapisz wpis'));

    await expect(canvas.getByText(LONG_SUMMARY_TITLE)).toBeVisible();
    await expect(window.innerWidth).toBe(320);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

export const NoNativeValidation: Story = {
  name: 'Test: formularz ma noValidate, komunikaty są własne, nie przeglądarki',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const form = canvas.getByRole('form', { name: 'Logowanie (przykład)' }) as HTMLFormElement;
    const email = canvas.getByLabelText('Adres e-mail') as HTMLInputElement;

    await expect(form.noValidate).toBe(true);
    await expect(canvas.getByLabelText('Hasło')).not.toHaveAttribute('required');

    await userEvent.type(email, 'abc');
    await userEvent.type(canvas.getByLabelText('Hasło'), 'tajne-haslo');
    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    await expect(email.validity.valid).toBe(false);
    await expect(canvas.getByText(EMAIL_INVALID)).toBeVisible();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(args.onRequest).not.toHaveBeenCalled();
  },
};

export const ErrorLinkedToField: Story = {
  name: 'Test: błąd jest powiązany z polem (aria-invalid, aria-describedby, role alert)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText('Adres e-mail');

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));

    const message = canvas.getAllByRole('alert').find((alert) => alert.textContent === EMAIL_REQUIRED);
    await expect(message).toBeDefined();
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email.getAttribute('aria-describedby')).toContain(message?.id);
    await expect(email).toHaveAccessibleDescription(EMAIL_REQUIRED);
  },
};

export const ErrorDisappearsWhenFixed: Story = {
  name: 'Test: dotknięte pole sprawdzane na bieżąco, błąd znika po poprawie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText('Adres e-mail');

    await userEvent.type(email, 'jan');
    await userEvent.tab();
    await expect(canvas.getByText(EMAIL_INVALID)).toBeVisible();

    await userEvent.type(email, '@example.com');

    await expect(canvas.queryByText(EMAIL_INVALID)).toBeNull();
    await expect(email).not.toHaveAttribute('aria-invalid');
  },
};

export const DoubleSubmitBlocked: Story = {
  name: 'Test: podwójne wysłanie jest zablokowane (przycisk i Enter w polu)',
  args: { scenario: 'pending' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));
    const button = await canvas.findByRole('button', { name: 'Logowanie…' });
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.type(canvas.getByLabelText('Hasło'), '{Enter}');

    await expect(args.onRequest).toHaveBeenCalledTimes(1);
    await expect(button).toHaveAttribute('aria-busy', 'true');
  },
};

export const SummaryLinksMoveFocus: Story = {
  name: 'Test: link w podsumowaniu przenosi fokus do pola, a podsumowanie znika przy jednym błędzie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(submitButton(canvasElement, 'Zaloguj'));
    await userEvent.click(canvas.getByRole('link', { name: PASSWORD_REQUIRED }));

    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();

    await userEvent.type(canvas.getByLabelText('Adres e-mail'), 'jan@example.com');

    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
    await expect(canvas.getByText(PASSWORD_REQUIRED)).toBeVisible();
  },
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-2 rounded-card border border-border bg-card p-4">
      <p className="font-semibold">{verdict}</p>
      <div className="flex flex-col gap-2">{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Widoczna etykieta nad polem; przykład formatu w placeholderze.">
          <Field label="Kwota (zł)">
            <Input type="amount" placeholder="np. 12,50" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Placeholder zamiast etykiety: po wpisaniu pierwszego znaku nie wiadomo, co to za pole.">
          <Input type="amount" placeholder="Kwota" aria-label="Kwota" />
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Komunikat mówi, co się stało i co zrobić.">
          <Field label="Kwota (zł)" error={AMOUNT_MESSAGES['too-many-decimals']}>
            <Input type="amount" defaultValue="12,505" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Komunikat nie mówi, co jest nie tak ani jak to naprawić.">
          <Field label="Kwota (zł)" error="Nieprawidłowa wartość.">
            <Input type="amount" defaultValue="12,505" />
          </Field>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Jeden błąd: komunikat pod polem i fokus na polu. Bez podsumowania.">
          <Field label="Opis" error={DESCRIPTION_REQUIRED}>
            <Input type="text" />
          </Field>
        </Example>
        <Example verdict="Źle" explanation="Podsumowanie z jednym błędem dubluje komunikat pod polem i zajmuje miejsce.">
          <ErrorSummary
            title={ENTRY_SUMMARY_TITLE}
            errors={[{ name: 'description', fieldId: 'dobrze-i-zle-opis', message: DESCRIPTION_REQUIRED }]}
            onSelect={fn()}
          />
          <Field label="Opis" id="dobrze-i-zle-opis" error={DESCRIPTION_REQUIRED}>
            <Input type="text" />
          </Field>
        </Example>
      </div>
    </div>
  ),
};
