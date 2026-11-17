import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { Badge } from './badge';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const CARD_RADIUS_PX = '8px';
const PANEL_PADDING_PX = '16px';
const CARD_GAP_PX = '12px';
const NARROW_WIDTH_PX = 320;

function resolveToken(property: 'color' | 'borderTopColor' | 'backgroundColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy bazowe/Card',
  component: Card,
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) =>
      parameters.ownSurface ? (
        <Story />
      ) : (
        <div className="max-w-sm">
          <Story />
        </div>
      ),
  ],
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Konto wspólne (przykład)</CardTitle>
        <Badge variant="shared">Wspólne</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Zostaje w tym miesiącu</p>
        <p className="text-xl font-bold">3 975,50 zł</p>
      </CardContent>
    </Card>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Anatomy: Story = {
  name: 'Anatomia: nagłówek z tytułem i plakietką, treść',
  render: () => (
    <div className="flex flex-col gap-(--space-between-groups)">
      <Card>
        <CardHeader>
          <CardTitle>Konto osobiste (przykład)</CardTitle>
          <Badge variant="personal">Osobiste</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Zostaje w tym miesiącu</p>
          <p className="text-xl font-bold">1 120,00 zł</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-lg">
            Wpisy w listopadzie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Czynsz (przykład): 2 400,00 zł</p>
          <p className="text-sm">Wypłata (przykład): 6 375,50 zł</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const States: Story = {
  name: 'Stany: karta nie ma stanów interaktywnych',
  render: () => (
    <Card>
      <CardContent>
        <p className="text-sm">
          Karta nie reaguje na najechanie ani fokus i nie jest klikalna. Karta konta z `aria-pressed` to osobny komponent produktu.
        </p>
      </CardContent>
    </Card>
  ),
};

export const LongContentNarrowScreen: Story = {
  name: 'Długa treść, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Konto do rozliczeń z pracodawcą, urzędem skarbowym i ubezpieczycielem (przykład)</CardTitle>
        <Badge variant="personal">Osobiste</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Zostaje w tym miesiącu</p>
        <p className="text-xl font-bold">123 456 789,50 zł</p>
      </CardContent>
    </Card>
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
        <Example verdict="Dobrze" explanation="Karta oddzielona od tła ramką 1 px: granica jest widoczna bez cienia (A2).">
          <Card>
            <CardContent>
              <p className="text-sm">Konto wspólne (przykład)</p>
            </CardContent>
          </Card>
        </Example>
        <Example verdict="Źle" explanation="Biała powierzchnia bez ramki na szarym tle: granica to tylko różnica jasności, poniżej progu 3:1 (A2).">
          <div className="flex flex-col rounded-card bg-card p-4 text-card-foreground">
            <p className="text-sm">Konto wspólne (przykład)</p>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Jedna karta opisuje jeden obiekt: nazwa w nagłówku, wynik w treści.">
          <Card>
            <CardHeader>
              <CardTitle>Konto osobiste (przykład)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">1 120,00 zł</p>
            </CardContent>
          </Card>
        </Example>
        <Example verdict="Źle" explanation="Karta w karcie: zagnieżdżona ramka i podwójny padding zwężają treść, zwłaszcza przy 320 px.">
          <Card>
            <Card>
              <CardContent>
                <p className="text-sm">Konto osobiste (przykład)</p>
              </CardContent>
            </Card>
          </Card>
        </Example>
      </div>
    </div>
  ),
};

export const TitleIsAHeading: Story = {
  name: 'Test: tytuł jest nagłówkiem, plakietka niesie typ tekstem',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const heading = canvas.getByRole('heading', { name: 'Konto wspólne (przykład)' });

    await expect(heading.tagName).toBe('H3');
    await expect(canvas.getByText('Wspólne')).toBeVisible();
    await expect(canvas.getByText('3 975,50 zł')).toBeVisible();
  },
};

export const SurfaceUsesTokens: Story = {
  name: 'Test: ramka --border, tło --card, promień 8 px, padding 16 px, odstęp 12 px, bez cienia',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvasElement.querySelector('[data-slot="card"]') as HTMLElement;

    const styles = getComputedStyle(card);

    await expect(styles.borderTopColor).toBe(resolveToken('borderTopColor', '--border'));
    await expect(styles.borderTopWidth).toBe('1px');
    await expect(styles.backgroundColor).toBe(resolveToken('backgroundColor', '--card'));
    await expect(styles.color).toBe(resolveToken('color', '--card-foreground'));
    await expect(styles.borderRadius).toBe(CARD_RADIUS_PX);
    await expect(styles.paddingTop).toBe(PANEL_PADDING_PX);
    await expect(styles.paddingLeft).toBe(PANEL_PADDING_PX);
    await expect(styles.rowGap).toBe(CARD_GAP_PX);
    await expect(styles.boxShadow).toBe('none');
    await expect(canvas.getByRole('heading', { name: /Konto wspólne/ })).toBeVisible();
  },
};

export const TitleTypography: Story = {
  name: 'Test: tytuł ma 16 px i wagę 600',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByRole('heading', { name: /Konto wspólne/ }));

    await expect(styles.fontSize).toBe('16px');
    await expect(styles.fontWeight).toBe('600');
  },
};

export const IsNotInteractive: Story = {
  name: 'Test: karta nie przyjmuje fokusu',
  play: async ({ canvasElement }) => {
    await userEvent.tab();

    await expect(canvasElement.querySelector('[data-slot="card"]')).not.toHaveFocus();
    await expect(document.body).toHaveFocus();
  },
};

export const WrapsLongContentAtNarrowWidth: Story = {
  ...LongContentNarrowScreen,
  name: 'Test: długa nazwa zawija się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot="card"]') as HTMLElement;

    await expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};
