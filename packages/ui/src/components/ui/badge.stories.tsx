import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Badge } from './badge';

const VARIANTS = ['shared', 'personal', 'neutral'] as const;
const VARIANT_LABELS: Record<(typeof VARIANTS)[number], string> = {
  shared: 'Wspólne',
  personal: 'Osobiste',
  neutral: 'Jednorazowy',
};
const BADGE_FONT_PX = '14px';
const BADGE_RADIUS_PX = '10px';

function resolveToken(property: 'color' | 'backgroundColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) =>
      parameters.ownSurface ? (
        <Story />
      ) : (
        <div className="max-w-sm rounded-card border border-border bg-card p-4">
          <Story />
        </div>
      ),
  ],
  args: { children: 'Wspólne', variant: 'shared' },
  argTypes: {
    variant: { control: 'inline-radio', options: VARIANTS },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: 'Warianty',
  render: () => (
    <div className="flex flex-wrap items-center gap-(--space-within-group)">
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {VARIANT_LABELS[variant]}
        </Badge>
      ))}
    </div>
  ),
};

export const States: Story = {
  name: 'Stany: plakietka nie ma stanów interaktywnych',
  render: () => (
    <p className="text-sm">
      Konto <Badge variant="shared">Wspólne</Badge> nie zmienia wyglądu po najechaniu ani po fokusie: plakietka nie jest elementem
      interaktywnym.
    </p>
  ),
};

export const LongTextNarrowScreen: Story = {
  name: 'Długi tekst, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80 border border-border bg-card p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    variant: 'personal',
    children: 'Osobiste konto do rozliczeń z pracodawcą i urzędem skarbowym (przykład)',
  },
};

interface ExampleProps {
  readonly verdict: 'Dobrze' | 'Źle';
  readonly explanation: string;
  readonly children: ReactNode;
}

function Example({ verdict, explanation, children }: ExampleProps) {
  return (
    <figure className="flex flex-1 flex-col gap-2 rounded-card border border-border bg-card p-4">
      <p className="font-semibold">{verdict}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
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
        <Example verdict="Dobrze" explanation="Typ konta nazwany słowem: znaczenie niesie tekst, kolor tylko je wzmacnia (A3).">
          <Badge variant="shared">Wspólne</Badge>
          <Badge variant="personal">Osobiste</Badge>
        </Example>
        <Example verdict="Źle" explanation="Dwa konta różnią się tylko kolorem plakietki: osoba niewidząca barw nie odróżni typu (A3).">
          <Badge variant="shared">Konto</Badge>
          <Badge variant="personal">Konto</Badge>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Jedno krótkie słowo opisujące typ lub status.">
          <Badge>Co miesiąc</Badge>
        </Example>
        <Example verdict="Źle" explanation="Całe zdanie w plakietce: długi opis należy do tekstu obok, nie do plakietki.">
          <Badge>Konto współdzielone z żoną, rozliczane co miesiąc 10. dnia</Badge>
        </Example>
      </div>
    </div>
  ),
};

export const RendersTextAndVariants: Story = {
  name: 'Test: tekst i wariant są w drzewie dostępności',
  render: Variants.render,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Wspólne')).toHaveAttribute('data-variant', 'shared');
    await expect(canvas.getByText('Osobiste')).toHaveAttribute('data-variant', 'personal');
    await expect(canvas.getByText('Jednorazowy')).toHaveAttribute('data-variant', 'neutral');
  },
};

export const SharedUsesTokenColors: Story = {
  name: 'Test: wspólne ma kolory z tokenów, 14 px, waga 400, promień 10 px, bez cienia',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText('Wspólne');

    const styles = getComputedStyle(badge);

    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--badge-shared-bg'));
    await expect(styles.color).toBe(resolveToken('color', '--badge-shared-fg'));
    await expect(styles.fontSize).toBe(BADGE_FONT_PX);
    await expect(styles.fontWeight).toBe('400');
    await expect(styles.borderRadius).toBe(BADGE_RADIUS_PX);
    await expect(styles.boxShadow).toBe('none');
  },
};

export const PersonalUsesTokenColors: Story = {
  name: 'Test: osobiste ma kolory z tokenów',
  args: { variant: 'personal', children: 'Osobiste' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByText('Osobiste'));

    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--badge-personal-bg'));
    await expect(styles.color).toBe(resolveToken('color', '--badge-personal-fg'));
  },
};

export const NeutralUsesBackgroundAndForeground: Story = {
  name: 'Test: neutralna ma tło --background i tekst --foreground',
  args: { variant: 'neutral', children: 'Jednorazowy' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByText('Jednorazowy'));

    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--background'));
    await expect(styles.color).toBe(resolveToken('color', '--foreground'));
  },
};

export const IsNotFocusable: Story = {
  name: 'Test: plakietka nie przyjmuje fokusu',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();

    await expect(canvas.getByText('Wspólne')).not.toHaveFocus();
    await expect(document.body).toHaveFocus();
  },
};

export const WrapsLongTextWithoutOverflow: Story = {
  ...LongTextNarrowScreen,
  name: 'Test: długi tekst zawija się i nie wychodzi poza kontener',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const badge = canvas.getByText(/Osobiste konto do rozliczeń/);

    const container = badge.parentElement as HTMLElement;

    await expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth);
    await expect(badge.getBoundingClientRect().right).toBeLessThanOrEqual(container.getBoundingClientRect().right);
  },
};
