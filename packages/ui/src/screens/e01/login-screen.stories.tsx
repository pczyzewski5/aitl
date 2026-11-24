import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../../components/layout/app-shell';
import { LoginForm } from '../../components/auth/login-form';
import type { LoginValues } from '../../components/auth/login-form';
import type { LoginResult } from '../../components/auth/login-failure';

const REQUEST_DELAY_MS = 120;
const DEFAULT_LOCKOUT_SECONDS = 87;
const NARROW_WIDTH_PX = 320;
const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false };
const TABLET_VIEWPORT = { value: 'tablet', isRotated: false };
const PRODUCT_NAME = 'AITL';

type Scenario = 'invalid-credentials' | 'too-many-attempts' | 'network' | 'server-error' | 'pending';

interface LoginScreenProps {
  scenario?: Scenario;
  retryAfterSeconds?: number;
  onRequest?: (values: LoginValues) => void;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function LoginScreen({ scenario = 'invalid-credentials', retryAfterSeconds = DEFAULT_LOCKOUT_SECONDS, onRequest }: LoginScreenProps) {
  const respond = async (values: LoginValues): Promise<LoginResult> => {
    onRequest?.(values);
    await wait(REQUEST_DELAY_MS);
    switch (scenario) {
      case 'too-many-attempts':
        return { ok: false, kind: 'too-many-attempts', retryAfterSeconds };
      case 'network':
        return { ok: false, kind: 'network' };
      case 'server-error':
        return { ok: false, kind: 'server-error' };
      case 'pending':
        return new Promise<never>(() => undefined);
      default:
        return { ok: false, kind: 'invalid-credentials' };
    }
  };

  return (
    <AppShell>
      <LoginForm onSubmit={respond} />
    </AppShell>
  );
}

const meta = {
  title: 'Ekrany/E01 Dostęp i logowanie/Logowanie (/login)',
  component: LoginScreen,
  parameters: { layout: 'fullscreen' },
  args: { onRequest: fn() },
  argTypes: {
    scenario: {
      control: 'inline-radio',
      options: ['invalid-credentials', 'too-many-attempts', 'network', 'server-error', 'pending'],
      description: 'Symulowana odpowiedź serwera po poprawnie wypełnionym formularzu',
    },
    retryAfterSeconds: { control: 'number' },
  },
} satisfies Meta<typeof LoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

async function fillLogin(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.type(canvas.getByLabelText('Adres e-mail'), 'jan@example.com');
  await userEvent.type(canvas.getByLabelText('Hasło'), 'tajne-haslo');
}

export const Default: Story = {
  name: 'Stan: pusty formularz',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('banner')).toHaveTextContent(PRODUCT_NAME);
    await expect(canvas.getByRole('main')).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 1, name: 'Logowanie' })).toBeVisible();
    await expect(canvas.queryByRole('contentinfo')).toBeNull();
    await expect(canvas.queryByRole('img')).toBeNull();
    await expect(canvas.queryByRole('link')).toBeNull();
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

export const FieldError: Story = {
  name: 'Stan: błąd pola po jego opuszczeniu',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await userEvent.tab();

    await expect(canvas.getByText('Wpisz adres e-mail, np. jan@example.com.')).toBeVisible();
    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();
  },
};

export const SeveralErrors: Story = {
  name: 'Stan: kilka błędów z podsumowaniem',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));

    await expect(canvas.getByText('Popraw dane logowania, żeby się zalogować')).toBeVisible();
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
  },
};

export const Loading: Story = {
  name: 'Stan: wysyłanie',
  args: { scenario: 'pending' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));

    await expect(await canvas.findByRole('button', { name: 'Logowanie…' })).toHaveAttribute('aria-busy', 'true');
  },
};

export const InvalidCredentials: Story = {
  name: 'Stan: błędny e-mail lub hasło (komunikat ogólny)',
  args: { scenario: 'invalid-credentials' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent(
      'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.',
    );
  },
};

export const Lockout: Story = {
  name: 'Stan: blokada po zbyt wielu próbach',
  args: { scenario: 'too-many-attempts' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent('Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund.');
  },
};

export const NetworkError: Story = {
  name: 'Stan: brak sieci',
  args: { scenario: 'network' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));

    await expect(await canvas.findByRole('alert')).toHaveTextContent('Nie udało się połączyć z serwerem');
  },
};

export const Tablet: Story = {
  name: 'Szerokość: 768 px',
  globals: { viewport: TABLET_VIEWPORT },
};

export const NarrowScreen: Story = {
  name: 'Szerokość: 320 px (z błędem, długi komunikat blokady)',
  globals: { viewport: MOBILE_VIEWPORT },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: { scenario: 'too-many-attempts', retryAfterSeconds: 900 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fillLogin(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Zaloguj się' }));

    await waitFor(() => expect(canvas.getByRole('alert')).toHaveTextContent('za 900 sekund'));
    const frame = canvasElement.firstElementChild as HTMLElement;
    await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
  },
};

export const FocusOrder: Story = {
  name: 'Test: kolejność fokusu (e-mail, hasło, przycisk), brak linków w nagłówku',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByLabelText('Adres e-mail')).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByLabelText('Hasło')).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Zaloguj się' })).toHaveFocus();
  },
};
