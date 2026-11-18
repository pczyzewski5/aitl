import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { ErrorState } from './error-state';
import { Field } from './field';
import { Input } from './input';

const LEVELS = ['h2', 'h3', 'h4'] as const;
const NARROW_WIDTH_PX = 320;

function resolveToken(token: string): string {
  const probe = document.createElement('div');
  probe.style.color = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/ErrorState',
  component: ErrorState,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Nie udało się wczytać wpisów',
    description: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
    retryLabel: 'Spróbuj ponownie',
    onRetry: fn(),
  },
  argTypes: {
    titleLevel: { control: 'inline-radio', options: LEVELS },
    announce: { control: 'boolean' },
    retrying: { control: 'boolean' },
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const FailedEntryList: Story = {
  name: 'Nieudane wczytanie listy wpisów w karcie (E02)',
  render: (args) => (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Wpisy</CardTitle>
      </CardHeader>
      <CardContent>
        <ErrorState {...args} />
      </CardContent>
    </Card>
  ),
};

export const FailedAccountList: Story = {
  name: 'Nieudane wczytanie kont (E01, E03)',
  args: {
    title: 'Nie udało się wczytać kont',
    description: 'Odśwież dane przyciskiem poniżej. Jeśli błąd wróci, spróbuj za kilka minut.',
  },
};

export const TitleOnly: Story = {
  name: 'Bez opisu',
  args: { description: undefined },
};

export const Retrying: Story = {
  name: 'Stan: ponawianie (przycisk zajęty)',
  args: { retrying: true, retryLabel: 'Ponawianie…' },
};

export const HeadingLevels: Story = {
  name: 'Poziom nagłówka: h2, h3, h4',
  render: (args) => (
    <div className="flex flex-col gap-(--space-section)">
      {LEVELS.map((level) => (
        <ErrorState key={level} {...args} titleLevel={level} title={`Poziom ${level}: nie udało się wczytać wpisów`} />
      ))}
    </div>
  ),
};

export const States: Story = {
  name: 'Stany: domyślny, ponawianie, najechanie i fokus przycisku (podgląd)',
  render: (args) => (
    <div className="flex flex-col gap-(--space-section)">
      <ErrorState {...args} />
      <ErrorState {...args} retrying retryLabel="Ponawianie…" />
      <div className="flex flex-wrap gap-(--space-within-group)">
        <Button data-preview-state="hover">Spróbuj ponownie (najechanie)</Button>
        <Button data-preview-state="focus-visible">Spróbuj ponownie (fokus)</Button>
      </div>
    </div>
  ),
};

function LoadEntriesAfterFailure() {
  const [failed, setFailed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Wpisy</CardTitle>
        {failed ? null : <Button onClick={() => setFailed(true)}>Wczytaj wpisy</Button>}
      </CardHeader>
      <CardContent>
        {failed ? (
          <ErrorState
            announce
            title="Nie udało się wczytać wpisów"
            description="Sprawdź połączenie z internetem i spróbuj ponownie."
            retryLabel="Spróbuj ponownie"
            onRetry={() => setFailed(false)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Wpisy nie zostały jeszcze wczytane.</p>
        )}
      </CardContent>
    </Card>
  );
}

export const AnnouncedAfterFailedLoad: Story = {
  name: 'Z rolą alert: pojawia się po nieudanym wczytaniu',
  render: () => <LoadEntriesAfterFailure />,
};

export const PresentFromFirstRender: Story = {
  name: 'Bez roli: obecny od pierwszego renderu (np. po błędzie serwera)',
  render: (args) => <ErrorState {...args} />,
};

export const AlertVersusErrorState: Story = {
  name: 'Alert czy ErrorState: błąd przy formularzu kontra widok, którego nie da się pokazać',
  render: () => (
    <div className="flex flex-col gap-(--space-section)">
      <Card>
        <CardHeader>
          <CardTitle as="h2">Dodaj wpis</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="error">
            <AlertTitle>Nie udało się zapisać wpisu</AlertTitle>
            <AlertDescription>Sprawdź połączenie i spróbuj ponownie. Wpisane dane zostały w formularzu.</AlertDescription>
          </Alert>
          <Field label="Opis">
            <Input defaultValue="Czynsz (przykład)" />
          </Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle as="h2">Wpisy</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            title="Nie udało się wczytać wpisów"
            description="Sprawdź połączenie z internetem i spróbuj ponownie."
            retryLabel="Spróbuj ponownie"
            onRetry={fn()}
          />
        </CardContent>
      </Card>
    </div>
  ),
};

export const LongTextNarrowScreen: Story = {
  name: 'Długi tekst, wąski ekran (320 px)',
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Nie udało się wczytać wpisów konta wspólnego z Anną i Piotrem',
    description:
      'Serwer nie odpowiedział w wyznaczonym czasie. Sprawdź połączenie z internetem i spróbuj ponownie: https://example.com/bardzo/dlugi/adres/bez/spacji/w/komunikacie.',
    retryLabel: 'Spróbuj ponownie wczytać wpisy tego konta',
  },
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
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Mówi, co się stało i co zrobić, i daje przycisk ponowienia.">
          <ErrorState
            title="Nie udało się wczytać wpisów"
            description="Sprawdź połączenie z internetem i spróbuj ponownie."
            retryLabel="Spróbuj ponownie"
            onRetry={fn()}
          />
        </Example>
        <Example verdict="Źle" explanation="Nie mówi, co się stało ani co zrobić. Przycisk z ogólnym napisem nie opisuje akcji.">
          <ErrorState title="Coś poszło nie tak" retryLabel="OK" onRetry={fn()} />
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="ErrorState zastępuje listę, której nie da się pokazać: w miejscu listy jest jedno, jasne miejsce na ponowienie.">
          <ErrorState
            title="Nie udało się wczytać kont"
            description="Odśwież dane przyciskiem poniżej."
            retryLabel="Spróbuj ponownie"
            onRetry={fn()}
          />
        </Example>
        <Example verdict="Źle" explanation="Błąd formularza jako ErrorState: użytkownik traci formularz zamiast zobaczyć komunikat obok pól (to zadanie Alertu).">
          <ErrorState title="Nie udało się zapisać wpisu" retryLabel="Zapisz" onRetry={fn()} />
        </Example>
      </div>
    </div>
  ),
};

export const HasNoLiveRoleByDefault: Story = {
  name: 'Test: nagłówek h3 i przycisk, domyślnie bez roli alert, bez ikony',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 3, name: 'Nie udało się wczytać wpisów' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Spróbuj ponownie' })).toBeVisible();
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvasElement.querySelector('svg')).toBeNull();
  },
};

export const AnnouncedWhenItAppearsAfterFailedLoad: Story = {
  ...AnnouncedAfterFailedLoad,
  name: 'Test: rola alert dopiero po nieudanym wczytaniu, ponowienie wraca do widoku',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Wczytaj wpisy' }));
    const alert = await canvas.findByRole('alert');
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));

    await expect(alert).toHaveTextContent('Nie udało się wczytać wpisów');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvas.getByRole('button', { name: 'Wczytaj wpisy' })).toBeVisible();
  },
};

export const AnnounceProducesAlertRole: Story = {
  name: 'Test: announce nadaje rolę alert',
  args: { announce: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('Spróbuj ponownie');
  },
};

export const RetryIsCallableByMouseAndKeyboard: Story = {
  name: 'Test: "Spróbuj ponownie" działa myszą i klawiaturą (Enter, spacja)',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Spróbuj ponownie' });

    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    await expect(args.onRetry).toHaveBeenCalledTimes(3);
  },
};

export const KeyboardReachesRetryWithOutline: Story = {
  name: 'Test: Tab ustawia fokus na przycisku ponowienia z obrysem 2 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Spróbuj ponownie' });

    await userEvent.tab();

    await expect(button).toHaveFocus();
    await expect(getComputedStyle(button).outlineWidth).toBe('2px');
  },
};

export const RetryingIgnoresClicks: Story = {
  ...Retrying,
  name: 'Test: w trakcie ponawiania przycisk ma aria-busy i nie wywołuje akcji',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Ponawianie…' });

    await userEvent.click(button);

    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(args.onRetry).not.toHaveBeenCalled();
  },
};

export const UsesTokenColoursAndWeights: Story = {
  name: 'Test: tytuł 16 px / 600, opis 14 px / 400 w --muted-foreground, bez ramki i cienia (to nie Alert)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = getComputedStyle(canvas.getByRole('heading'));
    const description = getComputedStyle(canvas.getByText('Sprawdź połączenie z internetem i spróbuj ponownie.'));
    const container = getComputedStyle(canvasElement.querySelector('[data-slot="error-state"]') as Element);

    await expect(title.fontSize).toBe('16px');
    await expect(title.fontWeight).toBe('600');
    await expect(description.fontSize).toBe('14px');
    await expect(description.fontWeight).toBe('400');
    await expect(description.color).toBe(resolveToken('--muted-foreground'));
    await expect(container.borderTopWidth).toBe('0px');
    await expect(container.boxShadow).toBe('none');
    await expect(container.alignItems).toMatch(/start/);
  },
};

export const WrapsLongTextAtNarrowWidth: Story = {
  ...LongTextNarrowScreen,
  name: 'Test: długi tekst zawija się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('[data-slot="error-state"]') as HTMLElement;

    await expect(container.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  },
};
