import type { Meta, StoryObj } from '@storybook/react-vite';
import type { MouseEvent, ReactNode } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Card, CardContent } from './card';
import { TextLink } from './text-link';

const FOCUS_OUTLINE_WIDTH_PX = '2px';
const FOCUS_OUTLINE_OFFSET_PX = '2px';
const NARROW_WIDTH_PX = 320;

function resolveToken(property: 'color' | 'backgroundColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

function preventNavigation(event: MouseEvent<HTMLAnchorElement>): void {
  event.preventDefault();
}

const meta = {
  title: 'Elementy bazowe/TextLink',
  component: TextLink,
  parameters: { layout: 'padded' },
  args: { children: 'Wyloguj', href: '#wyloguj', onClick: fn(preventNavigation) },
  argTypes: {
    asChild: { control: false },
    href: { control: 'text' },
  },
} satisfies Meta<typeof TextLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  name: 'Warianty: jeden wygląd, trzy miejsca użycia',
  render: () => (
    <div className="flex max-w-md flex-col gap-(--space-between-groups)">
      <p>
        <TextLink href="#wyloguj" onClick={preventNavigation}>
          Wyloguj
        </TextLink>
      </p>
      <p>
        Nie masz dostępu do tego konta?{' '}
        <TextLink href="#konta" onClick={preventNavigation}>
          Wróć do listy kont
        </TextLink>
        .
      </p>
      <p>
        Szczegóły liczenia znajdziesz w{' '}
        <TextLink href="https://example.com/dokumentacja">dokumentacji (strona zewnętrzna)</TextLink>.
      </p>
    </div>
  ),
};

export const OnCardSurface: Story = {
  name: 'Na karcie i na tle strony',
  render: () => (
    <div className="flex max-w-md flex-col gap-(--space-between-groups)">
      <Card>
        <CardContent>
          <p>
            Konto wspólne (przykład):{' '}
            <TextLink href="#wpisy" onClick={preventNavigation}>
              Zobacz wpisy tego konta
            </TextLink>
          </p>
        </CardContent>
      </Card>
      <p>
        Tło strony:{' '}
        <TextLink href="#wpisy" onClick={preventNavigation}>
          Zobacz wpisy tego konta
        </TextLink>
      </p>
    </div>
  ),
};

export const States: Story = {
  name: 'Stany: spoczynek, najechanie, fokus',
  render: () => (
    <div className="flex flex-wrap items-center gap-(--space-between-groups)">
      <TextLink href="#a" onClick={preventNavigation}>
        Spoczynek
      </TextLink>
      <TextLink href="#b" onClick={preventNavigation} data-preview-state="hover">
        Najechanie (podgląd)
      </TextLink>
      <TextLink href="#c" onClick={preventNavigation} data-preview-state="focus-visible">
        Fokus (podgląd)
      </TextLink>
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
  render: () => (
    <p className="break-words">
      Nie udało się otworzyć konta. Wróć do{' '}
      <TextLink href="#konta" onClick={preventNavigation}>
        listy kont bankowych wspólnych i osobnych, do których masz dostęp
      </TextLink>{' '}
      albo otwórz https://example.com/bardzo/dlugi/adres/bez/spacji/w/tresci.
    </p>
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
        <Example verdict="Dobrze" explanation="Link prowadzi gdzieś i mówi dokąd: nazwa celu, podkreślenie zawsze widoczne.">
          <TextLink href="#wpisy" onClick={preventNavigation}>
            Zobacz wpisy konta
          </TextLink>
        </Example>
        <Example verdict="Źle" explanation="Nazwa nic nie mówi poza kontekstem: czytnik ekranu czyta listę linków bez zdania obok.">
          <TextLink href="#wpisy" onClick={preventNavigation}>
            Kliknij tutaj
          </TextLink>
        </Example>
      </div>
      <div className="flex flex-wrap gap-4">
        <Example verdict="Dobrze" explanation="Akcja, która zmienia dane (zapis, usunięcie), to przycisk, nawet jeśli wygląda skromnie.">
          <TextLink asChild>
            <button type="button">Wyloguj</button>
          </TextLink>
        </Example>
        <Example verdict="Źle" explanation="Link bez podkreślenia: kolor jest wtedy jedynym nośnikiem znaczenia (WCAG 1.4.1).">
          <a href="#wpisy" className="text-primary no-underline" onClick={preventNavigation}>
            Zobacz wpisy konta
          </a>
        </Example>
      </div>
    </div>
  ),
};

export const IsAFocusableLinkWithName: Story = {
  name: 'Test: jest linkiem z nazwą i adresem',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const link = canvas.getByRole('link', { name: 'Wyloguj' });

    await expect(link).toHaveAttribute('href', '#wyloguj');
    await expect(link).not.toHaveAttribute('target');
  },
};

export const KeyboardFocusesAndActivates: Story = {
  name: 'Test: Tab ustawia fokus z obrysem 2 px, Enter aktywuje',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Wyloguj' });

    await userEvent.tab();
    await expect(link).toHaveFocus();
    const styles = getComputedStyle(link);
    await userEvent.keyboard('{Enter}');

    await expect(styles.outlineWidth).toBe(FOCUS_OUTLINE_WIDTH_PX);
    await expect(styles.outlineOffset).toBe(FOCUS_OUTLINE_OFFSET_PX);
    await expect(styles.outlineStyle).toBe('solid');
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

const HEADER_LINK_CLASS = 'text-primary-foreground hover:text-primary-foreground';
const STANDALONE_LINK_CLASS = 'inline-flex min-h-control items-center';
const MIN_STANDALONE_TARGET_PX = 24;

export const OnPrimaryBar: Story = {
  name: 'Na pasku nagłówka (tło --primary): kolor --primary-foreground z podkreśleniem',
  render: () => (
    <div className="flex items-center justify-between gap-(--space-within-group) bg-primary p-(--space-panel) text-primary-foreground">
      <p className="font-semibold">AITL</p>
      <TextLink href="#wyloguj" className={`${HEADER_LINK_CLASS} ${STANDALONE_LINK_CLASS}`} onClick={preventNavigation}>
        Wyloguj
      </TextLink>
    </div>
  ),
};

export const StandaloneLinkHasLargeTarget: Story = {
  name: 'Samodzielny link w osobnym wierszu ma cel co najmniej 24 px (tu 36 px)',
  render: () => (
    <div className="flex flex-col gap-(--space-within-group)">
      <TextLink href="#lista-kont" className={STANDALONE_LINK_CLASS} onClick={preventNavigation}>
        Wróć do listy kont
      </TextLink>
    </div>
  ),
};

export const IsUnderlinedAndUsesActionColour: Story = {
  name: 'Test: podkreślenie zawsze, kolor --primary, bez cienia',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByRole('link', { name: 'Wyloguj' }));

    await expect(styles.textDecorationLine).toBe('underline');
    await expect(styles.color).toBe(resolveToken('color', '--primary'));
    await expect(styles.boxShadow).toBe('none');
    await expect(styles.fontWeight).toBe('400');
  },
};

export const HoverPreviewKeepsUnderline: Story = {
  ...States,
  name: 'Test: najechanie zmienia kolor na --primary-hover i nie usuwa podkreślenia',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const styles = getComputedStyle(canvas.getByRole('link', { name: 'Najechanie (podgląd)' }));

    await expect(styles.color).toBe(resolveToken('color', '--primary-hover'));
    await expect(styles.textDecorationLine).toBe('underline');
  },
};

export const ExternalLinkStaysInSameTab: Story = {
  ...Variants,
  name: 'Test: link zewnętrzny otwiera się w tej samej karcie, bez ikony',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const link = canvas.getByRole('link', { name: 'dokumentacji (strona zewnętrzna)' });

    await expect(link).toHaveAttribute('href', 'https://example.com/dokumentacja');
    await expect(link).not.toHaveAttribute('target');
    await expect(link.querySelector('svg')).toBeNull();
  },
};

export const WrapsLongTextAtNarrowWidth: Story = {
  ...LongTextNarrowScreen,
  name: 'Test: długi link zawija się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const paragraph = canvas.getByRole('link').closest('p');

    await expect(paragraph?.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(paragraph?.scrollWidth).toBeLessThanOrEqual(paragraph?.clientWidth ?? 0);
  },
};

export const HeaderLinkUsesForegroundOnPrimary: Story = {
  ...OnPrimaryBar,
  name: 'Test: link na pasku --primary ma kolor --primary-foreground, podkreślenie i cel co najmniej 24 px',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const link = canvas.getByRole('link', { name: 'Wyloguj' });
    const styles = getComputedStyle(link);

    await expect(styles.color).toBe(resolveToken('color', '--primary-foreground'));
    await expect(styles.textDecorationLine).toBe('underline');
    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(MIN_STANDALONE_TARGET_PX);
  },
};

export const StandaloneTargetIsAtLeast24px: Story = {
  ...StandaloneLinkHasLargeTarget,
  name: 'Test: samodzielny link ma wysokość celu co najmniej 24 px i zachowuje podkreślenie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const link = canvas.getByRole('link', { name: 'Wróć do listy kont' });

    await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(MIN_STANDALONE_TARGET_PX);
    await expect(getComputedStyle(link).textDecorationLine).toBe('underline');
  },
};
