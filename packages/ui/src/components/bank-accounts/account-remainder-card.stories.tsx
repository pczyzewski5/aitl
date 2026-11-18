import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AccountRemainderCard, type AccountRemainderCardReadyProps } from './account-remainder-card';

const NARROW_WIDTH_PX = 320;
const MIN_TARGET_PX = 36;
const NO_BREAK_SPACE = ' ';
const MINUS_SIGN = '−';

const SHARED_ACCOUNT = {
  name: 'Konto wspólne',
  accountType: 'shared',
  remainderMinor: 397550,
  incomeMinor: 650000,
  expensesMinor: 252450,
} as const;

const PERSONAL_ACCOUNT = {
  name: 'Konto osobiste',
  accountType: 'personal',
  remainderMinor: 104100,
  incomeMinor: 120000,
  expensesMinor: 15900,
} as const;

const NEGATIVE_ACCOUNT = {
  name: 'Konto wspólne',
  accountType: 'shared',
  remainderMinor: -123450,
  incomeMinor: 100000,
  expensesMinor: 223450,
} as const;

const ZERO_ACCOUNT = {
  name: 'Konto osobiste',
  accountType: 'personal',
  remainderMinor: 0,
  incomeMinor: 0,
  expensesMinor: 0,
} as const;

type AccountData = Omit<AccountRemainderCardReadyProps, 'selected' | 'onSelect' | 'status'>;

function resolveToken(property: 'color' | 'borderTopColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

interface ToggleCardProps {
  readonly account: AccountData;
  readonly initiallySelected?: boolean;
  readonly onSelect?: () => void;
}

function ToggleCard({ account, initiallySelected = false, onSelect }: ToggleCardProps) {
  const [selected, setSelected] = useState(initiallySelected);

  return (
    <AccountRemainderCard
      {...account}
      selected={selected}
      onSelect={() => {
        setSelected((current) => !current);
        onSelect?.();
      }}
    />
  );
}

function PreviewState({ state, children }: { readonly state: 'hover' | 'focus-visible'; readonly children: ReactNode }) {
  return (
    <div
      ref={(element) => {
        element?.querySelector('button')?.setAttribute('data-preview-state', state);
      }}
    >
      {children}
    </div>
  );
}

const meta = {
  title: 'Elementy produktu/AccountRemainderCard',
  component: AccountRemainderCard,
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
  args: { ...SHARED_ACCOUNT, selected: false, onSelect: fn() },
  argTypes: {
    accountType: { control: 'inline-radio', options: ['shared', 'personal'] },
    selected: { control: 'boolean' },
    remainderMinor: { control: 'number' },
    incomeMinor: { control: 'number' },
    expensesMinor: { control: 'number' },
  },
  render: ({ selected, onSelect, name, accountType, remainderMinor, incomeMinor, expensesMinor }) => {
    return (
      <ToggleCard
        account={{ name, accountType, remainderMinor, incomeMinor, expensesMinor }}
        initiallySelected={selected}
        onSelect={onSelect}
      />
    );
  },
} satisfies Meta<AccountRemainderCardReadyProps>;

export default meta;
type Story = StoryObj<AccountRemainderCardReadyProps>;

export const Playground: Story = {};

export const Active: Story = {
  name: 'Wybrane konto: ramka 2 px w kolorze akcji i napis "Wybrane"',
  render: () => <ToggleCard account={SHARED_ACCOUNT} initiallySelected />,
};

export const Negative: Story = {
  name: 'Wynik ujemny: znak minus i kolor wydatku',
  render: () => <ToggleCard account={NEGATIVE_ACCOUNT} />,
};

export const Zero: Story = {
  name: 'Wynik zero: neutralny, bez znaku i koloru',
  render: () => <ToggleCard account={ZERO_ACCOUNT} />,
};

export const Loading: Story = {
  name: 'Ładowanie: szkielety w aria-busy',
  render: () => <AccountRemainderCard status="loading" name="Konto wspólne" accountType="shared" selected={false} onSelect={fn()} />,
};

export const LoadingSelected: Story = {
  name: 'Ładowanie wybranego konta po zmianie miesiąca',
  render: () => <AccountRemainderCard status="loading" name="Konto wspólne" accountType="shared" selected onSelect={fn()} />,
};

export const FailedToLoad: Story = {
  name: 'Błąd wczytania: ErrorState w karcie',
  render: () => <AccountRemainderCard status="error" name="Konto wspólne" accountType="shared" onRetry={fn()} />,
};

export const States: Story = {
  name: 'Macierz stanów',
  parameters: { ownSurface: true },
  render: () => (
    <div role="region" aria-label="Macierz stanów karty konta" tabIndex={0} className="overflow-x-auto">
      <div className="grid w-full max-w-3xl grid-cols-1 gap-(--space-between-groups) md:grid-cols-2">
        <section aria-label="Domyślny" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Domyślny</p>
          <ToggleCard account={SHARED_ACCOUNT} />
        </section>
        <section aria-label="Wybrany" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Wybrany (aria-pressed)</p>
          <ToggleCard account={SHARED_ACCOUNT} initiallySelected />
        </section>
        <section aria-label="Najechanie" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Najechanie (zamrożony podgląd)</p>
          <PreviewState state="hover">
            <ToggleCard account={SHARED_ACCOUNT} />
          </PreviewState>
        </section>
        <section aria-label="Fokus" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Fokus klawiatury (zamrożony podgląd)</p>
          <PreviewState state="focus-visible">
            <ToggleCard account={SHARED_ACCOUNT} />
          </PreviewState>
        </section>
        <section aria-label="Ładowanie" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Ładowanie</p>
          <AccountRemainderCard status="loading" name="Konto wspólne" accountType="shared" selected={false} onSelect={fn()} />
        </section>
        <section aria-label="Błąd" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Błąd wczytania</p>
          <AccountRemainderCard status="error" name="Konto wspólne" accountType="shared" onRetry={fn()} />
        </section>
        <section aria-label="Ujemny" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Wynik ujemny</p>
          <ToggleCard account={NEGATIVE_ACCOUNT} />
        </section>
        <section aria-label="Zero" className="flex flex-col gap-(--space-within-group)">
          <p className="text-sm font-semibold">Wynik zero</p>
          <ToggleCard account={ZERO_ACCOUNT} />
        </section>
      </div>
    </div>
  ),
};

export const TwoAccountsSideBySide: Story = {
  name: 'Dwa konta obok siebie: osobne wyniki, bez sumy łącznej',
  parameters: { ownSurface: true },
  render: () => (
    <div className="flex max-w-3xl flex-wrap gap-(--space-between-groups)">
      <ToggleCard account={SHARED_ACCOUNT} initiallySelected />
      <ToggleCard account={PERSONAL_ACCOUNT} />
    </div>
  ),
};

export const LongNameNarrowScreen: Story = {
  name: 'Długa nazwa konta, wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <ToggleCard
      initiallySelected
      account={{
        ...NEGATIVE_ACCOUNT,
        name: 'Konto do rozliczeń z pracodawcą, urzędem skarbowym i ubezpieczycielem (przykład)',
      }}
    />
  ),
};

export const LargestAmountNarrowScreen: Story = {
  name: 'Największa kwota (99 999 999,99 zł), wąski ekran (320 px)',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <ToggleCard
      account={{
        name: 'Konto wspólne',
        accountType: 'shared',
        remainderMinor: -9999999999,
        incomeMinor: 0,
        expensesMinor: 9999999999,
      }}
    />
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
    <div className="flex flex-col gap-(--space-between-groups)">
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Wynik ujemny ma znak minus i kolor: znak niesie znaczenie, kolor je wzmacnia (A3).">
          <ToggleCard account={NEGATIVE_ACCOUNT} />
        </Example>
        <Example verdict="Źle" explanation="Ujemny wynik tylko na czerwono, bez znaku: kolor jest jedynym nośnikiem znaczenia (A3).">
          <div className="rounded-card border-2 border-border bg-card p-(--space-panel)">
            <p className="text-xl font-bold text-expense">1 234,50 zł</p>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Dwa konta, dwa osobne wyniki (R03).">
          <div className="flex flex-col gap-(--space-between-groups)">
            <ToggleCard account={SHARED_ACCOUNT} />
            <ToggleCard account={PERSONAL_ACCOUNT} />
          </div>
        </Example>
        <Example verdict="Źle" explanation="Jedna łączna liczba obu kont: wprost zakazana przez R03 (A4).">
          <div className="rounded-card border-2 border-border bg-card p-(--space-panel)">
            <p className="text-sm">Razem na obu kontach</p>
            <p className="text-xl font-bold">5 016,50 zł</p>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Wybrane konto ma napis i stałą ramkę 2 px: układ nie skacze, a stan nie zależy od koloru.">
          <ToggleCard account={SHARED_ACCOUNT} initiallySelected />
        </Example>
        <Example verdict="Źle" explanation="Aktywne konto tylko niebieską ramką 1 px przechodzącą w 2 px: układ skacze, a stan niesie sam kolor (A3).">
          <div className="rounded-card border border-primary bg-card p-(--space-panel)">
            <p className="text-sm font-semibold">Konto wspólne</p>
            <p className="text-xl font-bold">3 975,50 zł</p>
          </div>
        </Example>
      </div>
    </div>
  ),
};

export const TogglesAriaPressed: Story = {
  name: 'Test: kliknięcie i klawiatura przełączają aria-pressed',
  render: () => <ToggleCard account={SHARED_ACCOUNT} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /Konto wspólne/ });

    await expect(card).toHaveAttribute('aria-pressed', 'false');
    await userEvent.tab();
    await expect(card).toHaveFocus();
    await expect(getComputedStyle(card).outlineWidth).toBe('2px');
    await userEvent.keyboard('{Enter}');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await userEvent.keyboard(' ');
    await expect(card).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(card);
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(card);
    await expect(card).toHaveAttribute('aria-pressed', 'false');
  },
};

export const ConstantBorderNoLayoutShift: Story = {
  name: 'Test: ramka stale 2 px, rozmiar karty nie zmienia się po wybraniu',
  render: () => <ToggleCard account={SHARED_ACCOUNT} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /Konto wspólne/ });

    const before = card.getBoundingClientRect();
    const inactiveBorder = getComputedStyle(card).borderTopColor;
    await userEvent.click(card);
    const after = card.getBoundingClientRect();
    const activeStyles = getComputedStyle(card);

    await expect(after.width).toBe(before.width);
    await expect(after.height).toBe(before.height);
    await expect(inactiveBorder).toBe(resolveToken('borderTopColor', '--border'));
    const primaryColor = resolveToken('borderTopColor', '--primary');
    await waitFor(() => expect(activeStyles.borderTopColor).toBe(primaryColor));
    await expect(activeStyles.borderTopWidth).toBe('2px');
    await expect(activeStyles.borderLeftWidth).toBe('2px');
    await expect(inactiveBorder).not.toBe(activeStyles.borderTopColor);
  },
};

export const TextMarkerCarriesState: Story = {
  name: 'Test: wybrane konto ma widoczny napis, niewybrane go nie pokazuje',
  render: () => <ToggleCard account={SHARED_ACCOUNT} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /Konto wspólne/ });
    const marker = canvasElement.querySelector('[data-slot="account-remainder-marker"]') as HTMLElement;

    await expect(marker).toHaveTextContent('Wybrane');
    await expect(getComputedStyle(marker).visibility).toBe('hidden');
    await userEvent.click(card);
    await expect(getComputedStyle(marker).visibility).toBe('visible');
    await expect(marker).toBeVisible();
    await expect(getComputedStyle(marker).color).toBe(resolveToken('color', '--primary'));
  },
};

export const AmountsUseSignsAndTokens: Story = {
  name: 'Test: kwoty z minusem U+2212, twardą spacją, plusem i kolorami z tokenów',
  render: () => <ToggleCard account={NEGATIVE_ACCOUNT} />,
  play: async ({ canvasElement }) => {
    const value = canvasElement.querySelector('[data-slot="account-remainder-value"]') as HTMLElement;
    const [income, expenses] = Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-amount"]')) as [
      HTMLElement,
      HTMLElement,
    ];

    await expect(value.textContent).toBe(`${MINUS_SIGN}1${NO_BREAK_SPACE}234,50${NO_BREAK_SPACE}zł`);
    await expect(income.textContent).toBe(`+1${NO_BREAK_SPACE}000,00${NO_BREAK_SPACE}zł`);
    await expect(expenses.textContent).toBe(`${MINUS_SIGN}2${NO_BREAK_SPACE}234,50${NO_BREAK_SPACE}zł`);
    await expect(getComputedStyle(value).color).toBe(resolveToken('color', '--expense'));
    await expect(getComputedStyle(income).color).toBe(resolveToken('color', '--income'));
    await expect(getComputedStyle(expenses).color).toBe(resolveToken('color', '--expense'));
    await expect(getComputedStyle(value).fontSize).toBe('28px');
    await expect(getComputedStyle(value).fontWeight).toBe('700');
    await expect(getComputedStyle(income).fontWeight).toBe('400');
  },
};

export const OnlyTheValueIsBold: Story = {
  name: 'Test: waga 700 tylko przy wyniku "ile zostanie"',
  render: () => <ToggleCard account={SHARED_ACCOUNT} initiallySelected />,
  play: async ({ canvasElement }) => {
    const boldElements = Array.from(canvasElement.querySelectorAll('button *')).filter(
      (element) => getComputedStyle(element).fontWeight === '700',
    );

    await expect(boldElements).toHaveLength(1);
    await expect(boldElements[0]).toHaveAttribute('data-slot', 'account-remainder-value');
  },
};

export const PositiveAndZeroColours: Story = {
  name: 'Test: dodatni wynik w kolorze wpływu, zero w neutralnym',
  render: () => (
    <div className="flex flex-col gap-(--space-between-groups)">
      <ToggleCard account={SHARED_ACCOUNT} />
      <ToggleCard account={ZERO_ACCOUNT} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [positive, zero] = Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-value"]')) as [
      HTMLElement,
      HTMLElement,
    ];

    await expect(getComputedStyle(positive).color).toBe(resolveToken('color', '--income'));
    await expect(zero.textContent).toBe(`0,00${NO_BREAK_SPACE}zł`);
    await expect(getComputedStyle(zero).color).toBe(resolveToken('color', '--card-foreground'));
  },
};

export const LoadingIsBusy: Story = {
  name: 'Test: ładowanie ma aria-busy, szkielety i tekst dla czytnika',
  render: () => <AccountRemainderCard status="loading" name="Konto wspólne" accountType="shared" selected onSelect={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button');

    await expect(card).toHaveAttribute('aria-busy', 'true');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await expect(card.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    await expect(canvas.getByText('Wczytywanie wyniku konta')).toBeInTheDocument();
    await expect(canvasElement.querySelector('[data-slot="account-remainder-value"]')).toBeNull();
  },
};

export const ErrorRetries: Story = {
  name: 'Test: błąd ogłasza komunikat i pozwala ponowić',
  render: () => <AccountRemainderCard status="error" name="Konto wspólne" accountType="shared" onRetry={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('Nie udało się wczytać wyniku konta');
    await expect(canvas.getByRole('heading', { name: 'Konto wspólne' })).toBeVisible();
    await expect(canvas.queryByRole('button', { pressed: false })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));
  },
};

export const TargetSizeAndName: Story = {
  name: 'Test: cel co najmniej 36 px, nazwa przycisku zawiera nazwę konta i kwoty',
  render: () => <ToggleCard account={SHARED_ACCOUNT} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = canvas.getByRole('button', { name: /Konto wspólne/ });

    await expect(card.getBoundingClientRect().height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    await expect(card).toHaveAccessibleName(/Konto wspólne.*Ile zostanie.*3.975,50.zł.*Wpływy.*Wydatki/);
  },
};

export const NoCombinedTotal: Story = {
  ...TwoAccountsSideBySide,
  name: 'Test: dwa konta nie mają żadnej sumy łącznej',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const values = canvasElement.querySelectorAll('[data-slot="account-remainder-value"]');

    await expect(canvas.getAllByRole('button')).toHaveLength(2);
    await expect(values).toHaveLength(2);
    await expect(canvas.queryByText(/razem|łącznie|suma|wszystkie konta/i)).toBeNull();
    await expect(canvasElement.textContent).not.toContain(`5${NO_BREAK_SPACE}016,50`);
  },
};

export const WrapsLongNameAtNarrowWidth: Story = {
  ...LongNameNarrowScreen,
  name: 'Test: długa nazwa zawija się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot="account-remainder-card"]') as HTMLElement;

    await expect(card.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
  },
};

export const LargestAmountFitsNarrowWidth: Story = {
  ...LargestAmountNarrowScreen,
  name: 'Test: największa kwota mieści się przy 320 px bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('[data-slot="account-remainder-card"]') as HTMLElement;

    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    await expect(card.textContent).toContain(`${MINUS_SIGN}99${NO_BREAK_SPACE}999${NO_BREAK_SPACE}999,99${NO_BREAK_SPACE}zł`);
  },
};
