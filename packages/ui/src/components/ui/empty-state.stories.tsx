import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { EmptyState } from './empty-state';

const LEVELS = ['h2', 'h3', 'h4'] as const;
const CONTROL_HEIGHT_PX = 36;
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
  title: 'Elementy bazowe/EmptyState',
  component: EmptyState,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  args: {
    title: 'Brak wpisów w tym miesiącu',
    description: 'Dodaj pierwszy wpływ albo wydatek, żeby zobaczyć, ile zostanie.',
    action: { label: 'Dodaj wpis', onClick: fn() },
  },
  argTypes: {
    titleLevel: { control: 'inline-radio', options: LEVELS },
    action: { control: 'object' },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const WithAction: Story = {
  name: 'Z akcją: pusty miesiąc na koncie (E02)',
  render: (args) => (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Konto wspólne (przykład)</CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState {...args} />
      </CardContent>
    </Card>
  ),
};

export const WithoutAction: Story = {
  name: 'Bez akcji: brak kont na liście (E01)',
  args: {
    title: 'Nie masz dostępu do żadnego konta bankowego',
    description: 'Gdy konto zostanie Ci przypisane, zobaczysz je tutaj.',
    action: undefined,
  },
};

export const TitleOnly: Story = {
  name: 'Tylko tytuł',
  args: { title: 'Brak wpisów w tym miesiącu', description: undefined, action: undefined },
};

export const HeadingLevels: Story = {
  name: 'Poziom nagłówka: h2, h3, h4',
  render: (args) => (
    <div className="flex flex-col gap-(--space-section)">
      {LEVELS.map((level) => (
        <EmptyState key={level} {...args} titleLevel={level} title={`Poziom ${level}: brak wpisów w tym miesiącu`} action={undefined} />
      ))}
    </div>
  ),
};

export const States: Story = {
  name: 'Stany: tylko przycisk akcji ma stany (podgląd najechania i fokusu)',
  render: (args) => (
    <div className="flex flex-col gap-(--space-section)">
      <EmptyState {...args} />
      <div className="flex flex-wrap gap-(--space-within-group)">
        <Button data-preview-state="hover">Dodaj wpis (najechanie)</Button>
        <Button data-preview-state="focus-visible">Dodaj wpis (fokus)</Button>
      </div>
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
    title: 'Brak wpisów na koncie wspólnym z Anną i Piotrem w tym miesiącu',
    description:
      'Nie ma jeszcze żadnego wpływu ani wydatku w tym miesiącu. Dodaj pierwszy wpis albo przejdź do poprzedniego miesiąca: https://example.com/bardzo/dlugi/adres/bez/spacji/w/komunikacie.',
    action: { label: 'Dodaj pierwszy wpis na tym koncie', onClick: fn() },
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
        <Example verdict="Dobrze" explanation="Mówi, dlaczego pusto, i podaje następny krok jednym przyciskiem z czasownikiem.">
          <EmptyState
            title="Brak wpisów w tym miesiącu"
            description="Dodaj pierwszy wpływ albo wydatek, żeby zobaczyć, ile zostanie."
            action={{ label: 'Dodaj wpis', onClick: fn() }}
          />
        </Example>
        <Example verdict="Źle" explanation="Nie mówi, dlaczego pusto ani co zrobić. Ikona i wykrzyknik niczego nie dodają.">
          <EmptyState title="Nic tu nie ma!" />
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Gdy użytkownik nie może nic dodać, stan pusty tłumaczy sytuację i nie ma przycisku.">
          <EmptyState
            title="Nie masz dostępu do żadnego konta bankowego"
            description="Gdy konto zostanie Ci przypisane, zobaczysz je tutaj."
          />
        </Example>
        <Example verdict="Źle" explanation="Przycisk bez działania, które da się wykonać: użytkownik klika i nic się nie dzieje.">
          <EmptyState
            title="Nie masz dostępu do żadnego konta bankowego"
            action={{ label: 'OK', onClick: fn() }}
          />
        </Example>
      </div>
    </div>
  ),
};

export const HasNoLiveRoleAndHasHeading: Story = {
  name: 'Test: nagłówek h3, brak roli status i alert, brak ikony',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const heading = canvas.getByRole('heading', { level: 3, name: 'Brak wpisów w tym miesiącu' });

    await expect(heading).toBeVisible();
    await expect(canvas.queryByRole('status')).toBeNull();
    await expect(canvas.queryByRole('alert')).toBeNull();
    await expect(canvasElement.querySelector('svg')).toBeNull();
    await expect(canvasElement.querySelector('img')).toBeNull();
  },
};

export const ActionIsAButtonCallableByMouseAndKeyboard: Story = {
  name: 'Test: akcja to przycisk, działa myszą i klawiaturą',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Dodaj wpis' });

    await userEvent.click(button);
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    await expect(args.action?.onClick).toHaveBeenCalledTimes(3);
  },
};

export const KeyboardReachesActionWithOutline: Story = {
  name: 'Test: Tab ustawia fokus na przycisku z obrysem 2 px, cel 36 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Dodaj wpis' });

    await userEvent.tab();

    await expect(button).toHaveFocus();
    await expect(getComputedStyle(button).outlineWidth).toBe('2px');
    await expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(CONTROL_HEIGHT_PX);
  },
};

export const WithoutActionHasNoButton: Story = {
  ...WithoutAction,
  name: 'Test: bez akcji nie ma przycisku',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { name: 'Nie masz dostępu do żadnego konta bankowego' })).toBeVisible();
    await expect(canvas.queryByRole('button')).toBeNull();
  },
};

export const UsesTokenColoursAndWeights: Story = {
  name: 'Test: tytuł 16 px / 600 w --foreground (dziedziczony), opis 14 px / 400 w --muted-foreground, wyrównanie do lewej',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = getComputedStyle(canvas.getByRole('heading'));
    const description = getComputedStyle(canvas.getByText('Dodaj pierwszy wpływ albo wydatek, żeby zobaczyć, ile zostanie.'));
    const container = getComputedStyle(canvasElement.querySelector('[data-slot="empty-state"]') as Element);

    await expect(title.fontSize).toBe('16px');
    await expect(title.fontWeight).toBe('600');
    await expect(description.fontSize).toBe('14px');
    await expect(description.fontWeight).toBe('400');
    await expect(description.color).toBe(resolveToken('--muted-foreground'));
    await expect(container.alignItems).toMatch(/start/);
    await expect(container.boxShadow).toBe('none');
  },
};

export const WrapsLongTextAtNarrowWidth: Story = {
  ...LongTextNarrowScreen,
  name: 'Test: długi tekst zawija się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector('[data-slot="empty-state"]') as HTMLElement;

    await expect(container.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  },
};
