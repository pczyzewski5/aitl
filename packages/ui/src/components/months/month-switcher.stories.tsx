import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MonthSwitcher, type MonthSwitcherProps } from './month-switcher';

const CONTROL_SIZE_PX = 36;
const NARROW_WIDTH_PX = 320;
const SERVER_CURRENT_MONTH = '2026-11';

type ControlledProps = Omit<MonthSwitcherProps, 'month' | 'onMonthChange'> & {
  readonly initialMonth?: string;
  readonly onMonthChange?: (month: string) => void;
};

function ControlledMonthSwitcher({ initialMonth = SERVER_CURRENT_MONTH, onMonthChange, ...props }: ControlledProps) {
  const [month, setMonth] = useState(initialMonth);

  const handleChange = (next: string) => {
    setMonth(next);
    onMonthChange?.(next);
  };

  return <MonthSwitcher {...props} month={month} onMonthChange={handleChange} />;
}

function resolveToken(property: 'color' | 'backgroundColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

const meta = {
  title: 'Elementy produktu/MonthSwitcher',
  component: MonthSwitcher,
  parameters: { layout: 'padded' },
  args: { month: SERVER_CURRENT_MONTH, onMonthChange: fn() },
  argTypes: {
    month: { control: 'text' },
    min: { control: 'text' },
    max: { control: 'text' },
    messages: { control: 'object' },
  },
  render: ({ month, ...args }) => <ControlledMonthSwitcher {...args} initialMonth={month} />,
} satisfies Meta<typeof MonthSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const BoundsReached: Story = {
  name: 'Granice: pierwszy i ostatni dozwolony miesiąc',
  render: () => (
    <div className="flex flex-col gap-(--space-between-groups)">
      <ControlledMonthSwitcher initialMonth="2000-01" min="2000-01" max="2100-12" />
      <ControlledMonthSwitcher initialMonth="2100-12" min="2000-01" max="2100-12" />
      <ControlledMonthSwitcher initialMonth="2026-11" min="2026-11" max="2026-11" />
    </div>
  ),
};

export const YearBoundary: Story = {
  name: 'Przejście przez granicę roku',
  render: () => <ControlledMonthSwitcher initialMonth="2026-12" />,
};

export const ServerSuppliedCurrentMonth: Story = {
  name: 'Bieżący miesiąc podaje serwer (Europe/Warsaw), nie zegar przeglądarki',
  render: () => <ControlledMonthSwitcher initialMonth="2031-03" />,
};

export const States: Story = {
  name: 'Stany: domyślny, na granicy, najechanie i fokus jak w Button',
  render: () => (
    <div className="flex flex-col gap-(--space-between-groups)">
      <ControlledMonthSwitcher initialMonth="2026-11" />
      <ControlledMonthSwitcher initialMonth="2000-01" min="2000-01" />
      <ControlledMonthSwitcher initialMonth="2100-12" max="2100-12" />
    </div>
  ),
};

export const LongLabelNarrowScreen: Story = {
  name: 'Najdłuższa nazwa miesiąca, wąski ekran (320 px)',
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => <ControlledMonthSwitcher initialMonth="2026-10" />,
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
      <div>{children}</div>
      <figcaption className="text-sm text-muted-foreground">{explanation}</figcaption>
    </figure>
  );
}

export const GoodAndBad: Story = {
  name: 'Dobrze i źle',
  render: () => (
    <div className="flex flex-col gap-(--space-between-groups)">
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Strzałki mają nazwy, a nazwa miesiąca jest w regionie aria-live: czytnik ogłasza zmianę.">
          <ControlledMonthSwitcher />
        </Example>
        <Example verdict="Źle" explanation="Same strzałki bez nazw i bez regionu na etykiecie: czytnik nie powie ani co kliknięto, ani jaki miesiąc jest teraz.">
          <div className="flex items-center gap-(--space-between-groups)">
            <span aria-hidden="true">←</span>
            <span>listopad 2026</span>
            <span aria-hidden="true">→</span>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Na granicy zakresu strzałka zostaje na swoim miejscu, jest wyszarzona i ma powód czytany przez czytnik.">
          <ControlledMonthSwitcher initialMonth="2100-12" max="2100-12" />
        </Example>
        <Example verdict="Źle" explanation="Strzałka znika na granicy: układ skacze, a użytkownik nie wie, dlaczego nie ma dalej.">
          <div className="flex items-center gap-(--space-between-groups)">
            <span>grudzień 2100</span>
          </div>
        </Example>
      </div>
    </div>
  ),
};

export const ChangesLabelAndAnnounces: Story = {
  name: 'Test: strzałki zmieniają miesiąc, etykieta jest regionem aria-live',
  render: () => <ControlledMonthSwitcher initialMonth="2026-12" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector('[data-slot="month-switcher-label"]') as HTMLElement;

    await expect(label).toHaveAttribute('aria-live', 'polite');
    await expect(label).toHaveTextContent('grudzień 2026');

    await userEvent.click(canvas.getByRole('button', { name: 'Następny miesiąc' }));
    await waitFor(() => expect(label).toHaveTextContent('styczeń 2027'));

    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await waitFor(() => expect(label).toHaveTextContent('listopad 2026'));
  },
};

export const ArrowsAreNormalButtons: Story = {
  name: 'Test: strzałki to zwykłe przyciski, Tab, Enter i spacja',
  render: () => <ControlledMonthSwitcher initialMonth="2026-11" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector('[data-slot="month-switcher-label"]') as HTMLElement;

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Poprzedni miesiąc' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(label).toHaveTextContent('październik 2026'));

    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Następny miesiąc' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(label).toHaveTextContent('listopad 2026'));
    await expect(getComputedStyle(canvas.getByRole('button', { name: 'Następny miesiąc' })).outlineWidth).toBe('2px');
  },
};

export const BoundsDisableArrows: Story = {
  name: 'Test: granice blokują strzałki z powodem, fokus zostaje',
  render: () => <ControlledMonthSwitcher initialMonth="2026-12" min="2026-11" max="2026-12" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector('[data-slot="month-switcher-label"]') as HTMLElement;
    const next = canvas.getByRole('button', { name: 'Następny miesiąc' });
    const previous = canvas.getByRole('button', { name: 'Poprzedni miesiąc' });

    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).toHaveAccessibleDescription('Nie ma późniejszych miesięcy do wyświetlenia');
    await userEvent.click(next);
    await expect(label).toHaveTextContent('grudzień 2026');

    await userEvent.click(previous);
    await waitFor(() => expect(label).toHaveTextContent('listopad 2026'));
    await expect(previous).toHaveAttribute('aria-disabled', 'true');
    await expect(previous).toHaveFocus();
    await expect(previous).toHaveAccessibleDescription('Nie ma wcześniejszych miesięcy do wyświetlenia');
    await userEvent.click(previous);
    await expect(label).toHaveTextContent('listopad 2026');
    await expect(next).not.toHaveAttribute('aria-disabled');
  },
};

export const AccessibleNamesAndTargets: Story = {
  name: 'Test: nazwy dostępne, cele 36 px, strzałki ukryte przed czytnikiem',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const group = canvas.getByRole('group', { name: 'Wybór miesiąca' });
    const buttons = [canvas.getByRole('button', { name: 'Poprzedni miesiąc' }), canvas.getByRole('button', { name: 'Następny miesiąc' })];

    await expect(group).toBeVisible();
    for (const button of buttons) {
      const box = button.getBoundingClientRect();
      await expect(box.width).toBe(CONTROL_SIZE_PX);
      await expect(box.height).toBe(CONTROL_SIZE_PX);
      await expect(button.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    }
  },
};

export const UsesTokens: Story = {
  name: 'Test: strzałki drugoplanowe, etykieta 20 px i waga 600 z tokenów',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector('[data-slot="month-switcher-label"]') as HTMLElement;

    const previousStyles = getComputedStyle(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    const labelStyles = getComputedStyle(label);

    await expect(previousStyles.backgroundColor).toBe(resolveToken('backgroundColor', '--muted'));
    await expect(previousStyles.borderRadius).toBe('6px');
    await expect(labelStyles.fontSize).toBe('20px');
    await expect(labelStyles.fontWeight).toBe('600');
    await expect(labelStyles.color).toBe(resolveToken('color', '--foreground'));
  },
};

export const FitsNarrowScreen: Story = {
  ...LongLabelNarrowScreen,
  name: 'Test: przy 320 px mieści się bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const group = canvasElement.querySelector('[data-slot="month-switcher"]') as HTMLElement;

    await expect(group.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth);
  },
};

export const DoesNotReadTheClock: Story = {
  name: 'Test: pokazuje dokładnie miesiąc z propsa, niezależnie od zegara przeglądarki',
  render: () => <ControlledMonthSwitcher initialMonth="2031-03" />,
  play: async ({ canvasElement }) => {
    const label = canvasElement.querySelector('[data-slot="month-switcher-label"]') as HTMLElement;

    await expect(label).toHaveTextContent('marzec 2031');
  },
};
