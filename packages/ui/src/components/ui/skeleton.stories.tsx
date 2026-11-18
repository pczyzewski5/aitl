import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, within } from 'storybook/test';
import { Card, CardContent, CardHeader } from './card';
import { Skeleton } from './skeleton';

const CONTROL_RADIUS_PX = '6px';
const NARROW_WIDTH_PX = 320;
const ENTRY_ROWS = 4;
const ACCOUNT_CARDS = 2;

function resolveToken(token: string): string {
  const probe = document.createElement('div');
  probe.style.backgroundColor = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).backgroundColor;
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
  args: { className: 'h-4 w-64' },
  argTypes: { className: { control: 'text' } },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

function TextLinesSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-within-group)">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function AccountCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-48" />
      </CardContent>
    </Card>
  );
}

function EntryRowSkeleton() {
  return (
    <div className="flex items-center gap-(--space-between-groups)">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

function EntryListSkeleton() {
  return (
    <div className="flex flex-col gap-(--space-between-fields)">
      {Array.from({ length: ENTRY_ROWS }, (_, index) => (
        <EntryRowSkeleton key={index} />
      ))}
    </div>
  );
}

export const TextLine: Story = {
  name: 'Linie tekstu',
  render: () => (
    <div className="max-w-md">
      <TextLinesSkeleton />
    </div>
  ),
};

export const Variants: Story = {
  name: 'Kompozycje: karta konta, lista wpisów, linie tekstu',
  render: () => (
    <div className="flex max-w-md flex-col gap-(--space-section)">
      <AccountCardSkeleton />
      <EntryListSkeleton />
      <TextLinesSkeleton />
    </div>
  ),
};

export const AccountRemainderLoading: Story = {
  name: 'Ekran: "Ile zostanie" w trakcie ładowania (E03)',
  render: () => (
    <section className="flex max-w-md flex-col gap-(--space-between-groups)">
      <h2 className="text-lg font-semibold">Ile zostanie w tym miesiącu</h2>
      <div data-testid="loading-container" aria-busy="true" className="flex flex-col gap-(--space-between-groups)">
        {Array.from({ length: ACCOUNT_CARDS }, (_, index) => (
          <AccountCardSkeleton key={index} />
        ))}
      </div>
    </section>
  ),
};

export const EntryListLoading: Story = {
  name: 'Ekran: lista wpisów konta w trakcie ładowania (E02)',
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <h2 className="text-lg font-semibold">Wpisy</h2>
      </CardHeader>
      <div data-testid="loading-container" aria-busy="true">
        <EntryListSkeleton />
      </div>
    </Card>
  ),
};

export const States: Story = {
  name: 'Stany: blok nie ma stanów interaktywnych',
  render: () => (
    <p className="max-w-md text-sm text-muted-foreground">
      Szkielet nie reaguje na najechanie ani fokus i nie jest ogłaszany czytnikowi ekranu. Stan ładowania to cały kontener z atrybutem
      aria-busy, a nie pojedynczy blok.
    </p>
  ),
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px)',
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div data-testid="loading-container" aria-busy="true" className="flex flex-col gap-(--space-between-groups)">
      <AccountCardSkeleton />
      <EntryListSkeleton />
    </div>
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
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Szkielet zachowuje układ wpisu (data, opis, kwota), więc po załadowaniu nic nie skacze.">
          <EntryListSkeleton />
        </Example>
        <Example verdict="Źle" explanation="Jeden wielki blok nie mówi, co się ładuje, a po załadowaniu cała treść przesuwa układ.">
          <Skeleton className="h-24 w-full" />
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Tło strony zostaje widoczne, a kontener wpisów ma aria-busy: czytnik nie ogłasza bloków.">
          <div aria-busy="true">
            <TextLinesSkeleton />
          </div>
        </Example>
        <Example verdict="Źle" explanation="Pulsowanie lub przesuwający się połysk to ruch dekoracyjny: ta aplikacja go nie ma (R01.6).">
          <div className="h-4 w-full animate-pulse rounded-control bg-muted" />
        </Example>
      </div>
    </div>
  ),
};

export const IsHiddenFromAssistiveTechnology: Story = {
  ...AccountRemainderLoading,
  name: 'Test: bloki są ukryte, kontener ma aria-busy, nagłówek zostaje widoczny',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const container = canvas.getByTestId('loading-container');
    const blocks = canvasElement.querySelectorAll('[data-slot="skeleton"]');

    await expect(container).toHaveAttribute('aria-busy', 'true');
    await expect(canvas.getByRole('heading', { name: 'Ile zostanie w tym miesiącu' })).toBeVisible();
    await expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      await expect(block).toHaveAttribute('aria-hidden', 'true');
    }
    await expect(canvas.queryAllByRole('status')).toHaveLength(0);
    await expect(canvas.queryAllByRole('alert')).toHaveLength(0);
  },
};

export const IsAStaticMutedBlockWithoutAnimation: Story = {
  name: 'Test: tło --muted, promień 6 px, bez animacji, bez przejścia i cienia',
  args: { className: 'h-4 w-64' },
  play: async ({ canvasElement }) => {
    const block = canvasElement.querySelector('[data-slot="skeleton"]');

    const styles = getComputedStyle(block as Element);

    await expect(styles.backgroundColor).toBe(resolveToken('--muted'));
    await expect(styles.borderRadius).toBe(CONTROL_RADIUS_PX);
    await expect(styles.animationName).toBe('none');
    await expect(styles.transitionDuration).toBe('0s');
    await expect(styles.boxShadow).toBe('none');
    await expect(styles.height).toBe('16px');
  },
};

export const EntryRowsKeepOneHeight: Story = {
  ...EntryListLoading,
  name: 'Test: wiersze wpisów mają wysokość linii tekstu (16 px) i są w jednym kontenerze aria-busy',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const container = canvas.getByTestId('loading-container');
    const blocks = container.querySelectorAll('[data-slot="skeleton"]');

    await expect(blocks).toHaveLength(ENTRY_ROWS * 3);
    for (const block of blocks) {
      await expect(getComputedStyle(block).height).toBe('16px');
    }
  },
};

export const FitsNarrowScreen: Story = {
  ...NarrowScreen,
  name: 'Test: przy 320 px nie ma poziomego przewijania',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const container = canvas.getByTestId('loading-container');

    await expect(container.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  },
};
