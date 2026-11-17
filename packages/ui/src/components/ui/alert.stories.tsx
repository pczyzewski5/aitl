import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { Alert, AlertDescription, AlertTitle } from './alert';

const VARIANTS = ['neutral', 'error'] as const;
const CARD_RADIUS_PX = '8px';
const PANEL_PADDING_PX = '16px';
const NARROW_WIDTH_PX = 320;
const BLOCKED_SECONDS = 120;

function resolveToken(property: 'color' | 'borderTopColor' | 'backgroundColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Alert',
  component: Alert,
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) =>
      parameters.ownSurface ? (
        <Story />
      ) : (
        <div className="max-w-md">
          <Story />
        </div>
      ),
  ],
  args: { variant: 'error' },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
  },
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Nie udało się zalogować</AlertTitle>
      <AlertDescription>Sprawdź e-mail i hasło i spróbuj ponownie.</AlertDescription>
    </Alert>
  ),
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: 'Warianty',
  render: () => (
    <div className="flex flex-col gap-(--space-between-groups)">
      <Alert variant="neutral">
        <AlertTitle>Wylogowano</AlertTitle>
        <AlertDescription>Zaloguj się ponownie, aby zobaczyć swoje konta.</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertTitle>Nie udało się zalogować</AlertTitle>
        <AlertDescription>Sprawdź e-mail i hasło i spróbuj ponownie.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const LoginFailed: Story = {
  name: 'Logowanie: ogólny błąd',
  args: { variant: 'error' },
};

export const LoginBlocked: Story = {
  name: 'Logowanie: blokada z czasem (429)',
  render: () => (
    <Alert variant="error">
      <AlertTitle>Zbyt wiele prób logowania</AlertTitle>
      <AlertDescription>Odczekaj {BLOCKED_SECONDS} sekund i spróbuj ponownie.</AlertDescription>
    </Alert>
  ),
};

export const WithoutTitle: Story = {
  name: 'Bez tytułu',
  render: () => (
    <Alert variant="error">
      <AlertDescription>Nie udało się zapisać wpisu. Sprawdź połączenie i spróbuj ponownie.</AlertDescription>
    </Alert>
  ),
};

export const States: Story = {
  name: 'Stany: komunikat nie ma stanów interaktywnych',
  render: () => (
    <Alert variant="neutral">
      <AlertDescription>
        Alert nie reaguje na najechanie ani fokus: nie jest elementem interaktywnym. Czytnik ekranu ogłasza go przy pojawieniu się.
      </AlertDescription>
    </Alert>
  ),
};

export const LongTextNarrowScreen: Story = {
  name: 'Długi tekst, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Alert variant="error">
      <AlertTitle>Nie udało się zapisać wpisu na koncie wspólnym z Anną i Piotrem</AlertTitle>
      <AlertDescription>
        Serwer nie odpowiedział w wyznaczonym czasie. Sprawdź połączenie z internetem, odczekaj chwilę i spróbuj ponownie. Wpisane dane
        zostały w formularzu, więc nie musisz ich wpisywać od nowa: https://example.com/bardzo/dlugi/adres/bez/spacji/w/komunikacie.
      </AlertDescription>
    </Alert>
  ),
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex flex-1 flex-col gap-2 rounded-card border border-border bg-background p-4">
      <p className="font-semibold">{verdict}</p>
      <div>{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  parameters: { ownSurface: true },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Mówi, co się stało i co zrobić. Rodzaj komunikatu niesie tekst i ramka, nie sam kolor.">
          <Alert variant="error">
            <AlertTitle>Zbyt wiele prób logowania</AlertTitle>
            <AlertDescription>Odczekaj 2 minuty i spróbuj ponownie.</AlertDescription>
          </Alert>
        </Example>
        <Example verdict="Źle" explanation="Nie mówi, co zrobić, i nie podaje przyczyny. Czerwony kolor nie zastąpi treści.">
          <Alert variant="error">
            <AlertDescription>Coś poszło nie tak.</AlertDescription>
          </Alert>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Błąd jednego pola stoi pod polem (Field), a Alert zostaje dla błędu całego formularza.">
          <Alert variant="error">
            <AlertDescription>Nie udało się zapisać wpisu. Spróbuj ponownie za chwilę.</AlertDescription>
          </Alert>
        </Example>
        <Example verdict="Źle" explanation="Błąd konkretnego pola w Alercie nad formularzem: użytkownik nie wie, które pole poprawić.">
          <Alert variant="error">
            <AlertDescription>Niepoprawna wartość.</AlertDescription>
          </Alert>
        </Example>
      </div>
    </div>
  ),
};

export const ErrorIsAnnouncedAsAlert: Story = {
  name: 'Test: błąd ma rolę alert i dostępną treść',
  args: { variant: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = canvas.getByRole('alert');

    await expect(alert).toHaveTextContent('Nie udało się zalogować');
    await expect(alert).toHaveTextContent('Sprawdź e-mail i hasło i spróbuj ponownie.');
    await expect(canvas.queryByRole('status')).toBeNull();
  },
};

export const NeutralIsAnnouncedAsStatus: Story = {
  name: 'Test: neutralny ma rolę status',
  args: { variant: 'neutral' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const status = canvas.getByRole('status');

    await expect(status).toHaveTextContent('Nie udało się zalogować');
    await expect(canvas.queryByRole('alert')).toBeNull();
  },
};

export const LoginBlockedShowsTimeInText: Story = {
  ...LoginBlocked,
  name: 'Test: blokada mówi, ile odczekać, tekstem',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = canvas.getByRole('alert');

    await expect(alert).toHaveTextContent('Zbyt wiele prób logowania');
    await expect(alert).toHaveTextContent(`Odczekaj ${BLOCKED_SECONDS} sekund`);
  },
};

export const ErrorUsesDestructiveBorderAndText: Story = {
  name: 'Test: błąd ma ramkę i tekst --destructive, tło --card, promień 8 px, padding 16 px, bez cienia',
  args: { variant: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByRole('alert'));

    await expect(styles.borderTopColor).toBe(resolveToken('borderTopColor', '--destructive'));
    await expect(styles.color).toBe(resolveToken('color', '--destructive'));
    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--card'));
    await expect(styles.borderTopWidth).toBe('1px');
    await expect(styles.borderRadius).toBe(CARD_RADIUS_PX);
    await expect(styles.paddingTop).toBe(PANEL_PADDING_PX);
    await expect(styles.paddingLeft).toBe(PANEL_PADDING_PX);
    await expect(styles.boxShadow).toBe('none');
  },
};

export const NeutralUsesBorderAndForeground: Story = {
  name: 'Test: neutralny ma ramkę --border i tekst --foreground',
  args: { variant: 'neutral' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByRole('status'));

    await expect(styles.borderTopColor).toBe(resolveToken('borderTopColor', '--border'));
    await expect(styles.color).toBe(resolveToken('color', '--foreground'));
  },
};

export const TitleIsSemiboldDescriptionIsNormal: Story = {
  name: 'Test: tytuł ma wagę 600, opis 400, tekst 14 px',
  args: { variant: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = getComputedStyle(canvas.getByText('Nie udało się zalogować'));
    const description = getComputedStyle(canvas.getByText('Sprawdź e-mail i hasło i spróbuj ponownie.'));

    await expect(title.fontWeight).toBe('600');
    await expect(description.fontWeight).toBe('400');
    await expect(title.fontSize).toBe('14px');
  },
};

export const WrapsLongTextAtNarrowWidth: Story = {
  ...LongTextNarrowScreen,
  name: 'Test: długi tekst zawija się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = canvas.getByRole('alert');

    await expect(alert.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
  },
};
