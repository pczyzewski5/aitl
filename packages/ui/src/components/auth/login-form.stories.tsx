import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import type { LoginResult } from './login-failure';
import { LoginForm } from './login-form';
import type { LoginValues } from './login-form';

const REQUEST_DELAY_MS = 120;
const DEFAULT_LOCKOUT_SECONDS = 87;
const NARROW_WIDTH_PX = 320;
const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 520 } };

const EMAIL_REQUIRED = 'Wpisz adres e-mail, np. jan@example.com.';
const PASSWORD_REQUIRED = 'Wpisz hasło.';
const SUMMARY_TITLE = 'Popraw dane logowania, żeby się zalogować';
const INVALID_CREDENTIALS = 'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.';
const NETWORK_ERROR =
  'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie; wpisane dane zostały w formularzu.';
const SERVER_ERROR = 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę; wpisane dane zostały w formularzu.';

type Scenario = 'invalid-credentials' | 'too-many-attempts' | 'network' | 'server-error' | 'rejects' | 'success' | 'pending';

interface ScenarioFormProps {
  scenario?: Scenario;
  retryAfterSeconds?: number;
  onRequest?: (values: LoginValues) => void;
  headingLevel?: 'h1' | 'h2';
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function ScenarioForm({ scenario = 'invalid-credentials', retryAfterSeconds = DEFAULT_LOCKOUT_SECONDS, onRequest, headingLevel }: ScenarioFormProps) {
  const respond = async (values: LoginValues): Promise<LoginResult> => {
    onRequest?.(values);
    await wait(REQUEST_DELAY_MS);
    switch (scenario) {
      case 'success':
        return { ok: true };
      case 'too-many-attempts':
        return { ok: false, kind: 'too-many-attempts', retryAfterSeconds };
      case 'network':
        return { ok: false, kind: 'network' };
      case 'server-error':
        return { ok: false, kind: 'server-error' };
      case 'rejects':
        throw new Error('offline');
      case 'pending':
        return new Promise<never>(() => undefined);
      default:
        return { ok: false, kind: 'invalid-credentials' };
    }
  };

  return <LoginForm onSubmit={respond} headingLevel={headingLevel} />;
}

const meta = {
  title: 'Elementy produktu/E01/LoginForm',
  component: ScenarioForm,
  parameters: { layout: 'padded' },
  args: { onRequest: fn() },
  argTypes: {
    scenario: {
      control: 'inline-radio',
      options: ['invalid-credentials', 'too-many-attempts', 'network', 'server-error', 'rejects', 'success', 'pending'],
      description: 'Symulowana odpowiedź `onSubmit` po poprawnie wypełnionym formularzu',
    },
    retryAfterSeconds: { control: 'number', description: 'Sekundy z odpowiedzi 429 (`Retry-After`)' },
    headingLevel: { control: 'inline-radio', options: ['h1', 'h2'] },
  },
} satisfies Meta<typeof ScenarioForm>;

export default meta;
type Story = StoryObj<typeof meta>;

async function fillLogin(canvasElement: HTMLElement, email = 'jan@example.com', password = 'tajne-haslo') {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByLabelText('Adres e-mail'), email);
  await userEvent.type(canvas.getByLabelText('Hasło'), password);
}

function submitButton(canvasElement: HTMLElement, name = 'Zaloguj się') {
  return within(canvasElement).getByRole('button', { name });
}

export const Playground: Story = { name: 'Pole do zabawy (wybierz odpowiedź serwera)', parameters: { docs: DOCS_IFRAME } };

export const Pristine: Story = {
  name: 'Czysty formularz (bez błędów przed dotknięciem pól)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText('Adres e-mail');
    const password = canvas.getByLabelText('Hasło');

    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Logowanie' })).toBeVisible();
    await expect(canvas.getByRole('form', { name: 'Logowanie' })).toHaveAttribute('novalidate');
    await expect(email).toHaveAttribute('type', 'email');
    await expect(email).toHaveAttribute('autocomplete', 'username');
    await expect(email).toHaveAttribute('aria-required', 'true');
    await expect(email).not.toHaveAttribute('aria-invalid');
    await expect(password).toHaveAttribute('type', 'password');
    await expect(password).toHaveAttribute('autocomplete', 'current-password');
    await expect(password).toHaveAttribute('aria-required', 'true');
  },
};

export const FieldError: Story = {
  name: 'Błąd pola po jego opuszczeniu (tylko to pole)',
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

export const OneErrorOnSubmit: Story = {
  name: 'Wysłanie z jednym błędem (komunikat pod polem i fokus, bez podsumowania)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Adres e-mail'), 'jan@example.com');
    await userEvent.click(submitButton(canvasElement));

    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();
    await expect(canvas.getByText(PASSWORD_REQUIRED)).toBeVisible();
    await expect(canvas.queryByText(SUMMARY_TITLE)).toBeNull();
    await expect(canvas.queryAllByRole('link')).toHaveLength(0);
    await expect(args.onRequest).not.toHaveBeenCalled();
  },
};

export const SeveralErrorsWithSummary: Story = {
  name: 'Kilka błędów (podsumowanie z linkami, fokus na pierwszym polu)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
    await expect(canvas.getByText(SUMMARY_TITLE)).toBeVisible();
    await expect(canvas.getAllByRole('link').map((link) => link.textContent)).toEqual([EMAIL_REQUIRED, PASSWORD_REQUIRED]);

    await userEvent.click(canvas.getByRole('link', { name: PASSWORD_REQUIRED }));
    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();
  },
};

export const Loading: Story = {
  name: 'Wysyłanie (przycisk w stanie ładowania, dane zostają)',
  args: { scenario: 'pending' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    const button = await canvas.findByRole('button', { name: 'Logowanie…' });
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveValue('jan@example.com');
    await expect(canvas.getByLabelText('Hasło')).toHaveValue('tajne-haslo');
  },
};

export const InvalidCredentials: Story = {
  name: 'Błędne dane: komunikat ogólny (ten sam dla nieznanego e-maila i złego hasła)',
  args: { scenario: 'invalid-credentials' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement, 'nieznany@example.com', 'zle-haslo');

    await userEvent.click(submitButton(canvasElement));
    const unknownEmail = await canvas.findByRole('alert');
    const unknownEmailText = unknownEmail.textContent;

    await userEvent.clear(canvas.getByLabelText('Adres e-mail'));
    await userEvent.type(canvas.getByLabelText('Adres e-mail'), 'jan@example.com');
    await userEvent.click(submitButton(canvasElement));

    await waitFor(() => expect(args.onRequest).toHaveBeenCalledTimes(2));
    const wrongPassword = await canvas.findByRole('alert');
    await expect(unknownEmailText).toBe(INVALID_CREDENTIALS);
    await expect(wrongPassword).toHaveTextContent(INVALID_CREDENTIALS);
    await expect(canvas.getByLabelText('Adres e-mail')).not.toHaveAttribute('aria-invalid');
    await expect(canvas.getByLabelText('Hasło')).not.toHaveAttribute('aria-invalid');
    await expect(canvas.getByLabelText('Hasło')).toHaveValue('zle-haslo');
  },
};

export const Lockout: Story = {
  name: 'Blokada po zbyt wielu próbach (429, z liczbą sekund, bez odliczania na żywo)',
  args: { scenario: 'too-many-attempts', retryAfterSeconds: DEFAULT_LOCKOUT_SECONDS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveTextContent('Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund.');
    await wait(REQUEST_DELAY_MS * 3);
    await expect(alert).toHaveTextContent('za 87 sekund.');
  },
};

export const LockoutOneSecond: Story = {
  name: 'Blokada, liczba pojedyncza (1 sekundę)',
  args: { scenario: 'too-many-attempts', retryAfterSeconds: 1 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await expect(await canvas.findByRole('alert')).toHaveTextContent('Spróbuj ponownie za 1 sekundę.');
  },
};

export const LockoutFewSeconds: Story = {
  name: 'Blokada, liczba mnoga "sekundy" (22 sekundy)',
  args: { scenario: 'too-many-attempts', retryAfterSeconds: 22 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await expect(await canvas.findByRole('alert')).toHaveTextContent('Spróbuj ponownie za 22 sekundy.');
  },
};

export const NetworkError: Story = {
  name: 'Brak sieci (komunikat u góry formularza, dane zostają)',
  args: { scenario: 'network' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(NETWORK_ERROR);
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveValue('jan@example.com');
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
    await expect(submitButton(canvasElement)).not.toHaveAttribute('aria-busy');
  },
};

export const ServerError: Story = {
  name: 'Błąd serwera 500 (komunikat bez szczegółów, dane zostają, fokus na e-mailu)',
  args: { scenario: 'server-error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveTextContent(SERVER_ERROR);
    await expect(alert.textContent).not.toMatch(/500|wyjątek|stack|SQL/i);
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveValue('jan@example.com');
    await expect(canvas.getByLabelText('Hasło')).toHaveValue('tajne-haslo');
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
  },
};

export const FocusReturnsToEmailAfterFailure: Story = {
  name: 'Test: po błędzie logowania (złe dane, blokada, sieć, 500) fokus wraca na pole e-mail',
  args: { scenario: 'invalid-credentials' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);
    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();

    await userEvent.click(submitButton(canvasElement));

    await canvas.findByRole('alert');
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
  },
};

export const RequestRejects: Story = {
  name: 'Żądanie rzuca wyjątek (ten sam komunikat o braku sieci)',
  args: { scenario: 'rejects' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(NETWORK_ERROR);
  },
};

export const Success: Story = {
  name: 'Sukces (formularz nie pokazuje własnego komunikatu, przekierowanie robi aplikacja)',
  args: { scenario: 'success' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await waitFor(() => expect(args.onRequest).toHaveBeenCalledTimes(1));
    await canvas.findByRole('button', { name: 'Zaloguj się' });
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(args.onRequest).toHaveBeenCalledWith({ email: 'jan@example.com', password: 'tajne-haslo' });
  },
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px)',
  globals: { viewport: NARROW_VIEWPORT.viewport },
  args: { scenario: 'invalid-credentials' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const LongErrorNarrowScreen: Story = {
  name: 'Długi nieprzerwany tekst w błędzie, 320 px',
  globals: { viewport: NARROW_VIEWPORT.viewport },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <LoginForm
      onSubmit={async () => ({ ok: false, kind: 'invalid-credentials' })}
      messages={{
        invalidCredentials:
          'Nie udało się zalogować. Sprawdź adres e-mail i hasło albo otwórz https://example.com/bardzo/dlugi/adres/pomocy/bez/spacji/w/komunikacie i spróbuj ponownie.',
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await canvas.findByRole('alert');
    const card = canvasElement.querySelector('[data-slot="login-form"]') as HTMLElement;
    await expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};

export const DoubleSubmitBlocked: Story = {
  name: 'Test: podwójne wysłanie jest zablokowane (przycisk i Enter w polu)',
  args: { scenario: 'pending' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));
    const button = await canvas.findByRole('button', { name: 'Logowanie…' });
    await userEvent.click(button);
    await userEvent.click(button);
    await userEvent.type(canvas.getByLabelText('Hasło'), '{Enter}');

    await expect(args.onRequest).toHaveBeenCalledTimes(1);
    await expect(button).toHaveAttribute('aria-busy', 'true');
  },
};

export const ErrorDisappearsWhenFixed: Story = {
  name: 'Test: dotknięte pole sprawdzane na bieżąco, błąd znika po poprawie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const email = canvas.getByLabelText('Adres e-mail');

    await userEvent.type(email, 'jan');
    await userEvent.tab();
    await expect(canvas.getByText(/wygląda na niepełny/)).toBeVisible();

    await userEvent.type(email, '@example.com');

    await expect(canvas.queryByText(/wygląda na niepełny/)).toBeNull();
    await expect(email).not.toHaveAttribute('aria-invalid');
  },
};

export const ErrorIsLinkedToTheField: Story = {
  name: 'Test: błąd jest powiązany z polem (aria-describedby)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    await expect(canvas.getByLabelText('Adres e-mail')).toHaveAccessibleDescription(EMAIL_REQUIRED);
    await expect(canvas.getByLabelText('Hasło')).toHaveAccessibleDescription(PASSWORD_REQUIRED);
  },
};

export const ServerErrorIsFirstInTheForm: Story = {
  name: 'Test: błąd serwera jest pierwszym elementem formularza i ogłaszany jako alert',
  args: { scenario: 'too-many-attempts' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(submitButton(canvasElement));

    const alert = await canvas.findByRole('alert');
    await expect(canvas.getByRole('form', { name: 'Logowanie' }).firstElementChild).toBe(alert);
  },
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex min-w-0 flex-1 flex-col gap-2 rounded-card border border-border bg-background p-4">
      <p className="font-semibold">{verdict}</p>
      <div>{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { docs: DOCS_IFRAME },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Ten sam komunikat dla nieznanego e-maila i złego hasła: nie zdradza, które konto istnieje.">
          <p className="text-sm text-destructive">{INVALID_CREDENTIALS}</p>
        </Example>
        <Example verdict="Źle" explanation="Zdradza, że taki e-mail jest (lub nie jest) zarejestrowany, i podpowiada atakującemu.">
          <p className="text-sm text-destructive">Nie ma takiego użytkownika.</p>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Blokada z liczbą sekund w poprawnej odmianie, statyczna: czytnik ekranu nie jest zalewany odliczaniem.">
          <p className="text-sm text-destructive">Zbyt wiele prób logowania. Spróbuj ponownie za 22 sekundy.</p>
        </Example>
        <Example verdict="Źle" explanation="Brak czasu i nieczytelna odmiana: użytkownik nie wie, kiedy spróbować, a tekst brzmi jak błąd systemu.">
          <p className="text-sm text-destructive">Błąd 429. Spróbuj za 22 sekund(y).</p>
        </Example>
      </div>
    </div>
  ),
};
