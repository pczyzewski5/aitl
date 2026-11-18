import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AccountRemainderCard, type AccountType } from '../bank-accounts/account-remainder-card';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { EmptyState } from '../ui/empty-state';
import { MonthSwitcher } from './month-switcher';

const SERVER_CURRENT_MONTH = '2026-11';
const NARROW_WIDTH_PX = 320;
const NO_BREAK_SPACE = ' ';
const MINUS_SIGN = '−';

type Scenario = 'ready' | 'loading' | 'error' | 'empty' | 'oneAccount';

interface Account {
  readonly id: string;
  readonly name: string;
  readonly accountType: AccountType;
}

interface MonthTotals {
  readonly incomeMinor: number;
  readonly expensesMinor: number;
}

const SHARED: Account = { id: 'shared', name: 'Konto wspólne', accountType: 'shared' };
const PERSONAL: Account = { id: 'personal', name: 'Konto osobiste', accountType: 'personal' };
const NO_ENTRIES: MonthTotals = { incomeMinor: 0, expensesMinor: 0 };

const TOTALS_BY_MONTH: Record<string, Record<string, MonthTotals>> = {
  '2026-09': {
    shared: { incomeMinor: 650000, expensesMinor: 710000 },
    personal: { incomeMinor: 120000, expensesMinor: 15900 },
  },
  '2026-10': {
    shared: { incomeMinor: 650000, expensesMinor: 241900 },
    personal: { incomeMinor: 0, expensesMinor: 15900 },
  },
  '2026-11': {
    shared: { incomeMinor: 650000, expensesMinor: 252450 },
    personal: { incomeMinor: 120000, expensesMinor: 15900 },
  },
  '2026-12': {
    shared: { incomeMinor: 650000, expensesMinor: 217900 },
    personal: { incomeMinor: 0, expensesMinor: 15900 },
  },
};

const ACCOUNTS_BY_SCENARIO: Record<Scenario, readonly Account[]> = {
  ready: [SHARED, PERSONAL],
  loading: [SHARED, PERSONAL],
  error: [SHARED, PERSONAL],
  empty: [],
  oneAccount: [SHARED],
};

function totalsFor(month: string, accountId: string): MonthTotals {
  return TOTALS_BY_MONTH[month]?.[accountId] ?? NO_ENTRIES;
}

interface MonthOverviewProps {
  readonly scenario?: Scenario;
  readonly initialMonth?: string;
  readonly initialSelectedId?: string;
  readonly accounts?: readonly Account[];
  readonly onRetry?: () => void;
}

function MonthOverview({
  scenario = 'ready',
  initialMonth = SERVER_CURRENT_MONTH,
  initialSelectedId = SHARED.id,
  accounts,
  onRetry = fn(),
}: MonthOverviewProps) {
  const [month, setMonth] = useState(initialMonth);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const visibleAccounts = accounts ?? ACCOUNTS_BY_SCENARIO[scenario];
  const selected = visibleAccounts.find((account) => account.id === selectedId);

  return (
    <div className="flex max-w-3xl flex-col gap-(--space-between-groups)">
      <h2 className="text-lg font-semibold leading-base">Ile zostanie w miesiącu</h2>
      <MonthSwitcher month={month} onMonthChange={setMonth} min="2000-01" max="2100-12" />
      {visibleAccounts.length === 0 ? (
        <EmptyState
          titleLevel="h3"
          title="Nie masz dostępu do żadnego konta bankowego"
          description="Poproś właściciela konta o dostęp, a potem odśwież stronę."
        />
      ) : (
        <div className="flex flex-wrap gap-(--space-between-groups)">
          {visibleAccounts.map((account) => {
            const common = { name: account.name, accountType: account.accountType, className: 'min-w-64 flex-1' };
            if (scenario === 'loading') {
              return (
                <AccountRemainderCard
                  key={account.id}
                  {...common}
                  status="loading"
                  selected={account.id === selectedId}
                  onSelect={() => setSelectedId(account.id)}
                />
              );
            }
            if (scenario === 'error') {
              return <AccountRemainderCard key={account.id} {...common} status="error" onRetry={onRetry} />;
            }
            const { incomeMinor, expensesMinor } = totalsFor(month, account.id);
            return (
              <AccountRemainderCard
                key={account.id}
                {...common}
                remainderMinor={incomeMinor - expensesMinor}
                incomeMinor={incomeMinor}
                expensesMinor={expensesMinor}
                selected={account.id === selectedId}
                onSelect={() => setSelectedId(account.id)}
              />
            );
          })}
        </div>
      )}
      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle as="h3">Wpisy: {selected.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Tu pojawi się lista wpisów wybranego konta dla miesiąca z przełącznika.</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function amountText(minor: number, prefix = ''): string {
  const grosze = String(Math.abs(minor) % 100).padStart(2, '0');
  const zloty = String(Math.trunc(Math.abs(minor) / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, NO_BREAK_SPACE);
  return `${prefix}${zloty},${grosze}${NO_BREAK_SPACE}zł`;
}

const meta = {
  title: 'Wzorce/Przegląd miesiąca per konto',
  component: MonthOverview,
  parameters: { layout: 'padded' },
  argTypes: {
    scenario: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'empty', 'oneAccount'] },
    initialMonth: { control: 'text' },
    initialSelectedId: { control: 'inline-radio', options: [SHARED.id, PERSONAL.id] },
    accounts: { control: false },
    onRetry: { control: false },
  },
} satisfies Meta<typeof MonthOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const TwoAccounts: Story = {
  name: 'Dwa konta: wspólne wybrane, osobne wyniki',
};

export const OneAccount: Story = {
  name: 'Jedno konto: tylko wspólne (żona widzi wyłącznie konto wspólne)',
  args: { scenario: 'oneAccount' },
};

export const NegativeRemainder: Story = {
  name: 'Wynik ujemny na koncie wspólnym (wrzesień 2026)',
  args: { initialMonth: '2026-09' },
};

export const MonthWithoutEntries: Story = {
  name: 'Miesiąc bez wpisów: zera, nie pusty stan',
  args: { initialMonth: '2027-03' },
};

export const Loading: Story = {
  name: 'Ładowanie wyników',
  args: { scenario: 'loading' },
};

export const FailedToLoad: Story = {
  name: 'Błąd wczytania wyników',
  args: { scenario: 'error' },
};

export const NoAccounts: Story = {
  name: 'Brak kont: stan pusty zamiast kart',
  args: { scenario: 'empty' },
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px): karty jedna pod drugą',
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

export const LongAccountNames: Story = {
  name: 'Długie nazwy kont, wąski ekran (320 px)',
  args: {
    accounts: [
      { ...SHARED, name: 'Konto wspólne do rozliczeń domowych z Anną i Piotrem na cały rok (przykład)' },
      { ...PERSONAL, name: 'Konto osobiste do wydatków na hobby, podróże i prezenty (przykład)' },
    ],
  },
  decorators: NarrowScreen.decorators,
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
    <div className="flex flex-col gap-(--space-between-groups)">
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Miesiąc u góry, pod nim osobna karta na każde konto (R01.4, R03).">
          <MonthOverview />
        </Example>
        <Example verdict="Źle" explanation="Jedna łączna liczba obu kont ukrywa, które konto jest na minusie (R03, A4).">
          <div className="rounded-card border-2 border-border bg-card p-(--space-panel)">
            <p className="text-sm">Razem ile zostanie</p>
            <p className="text-xl font-bold">5 016,50 zł</p>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Miesiąc bez wpisów pokazuje zera, żeby było widać, że wynik policzono (E03).">
          <MonthOverview initialMonth="2027-03" />
        </Example>
        <Example verdict="Źle" explanation="Pusty stan zamiast zer: użytkownik nie wie, czy wynik wynosi zero, czy się nie wczytał.">
          <EmptyState title="Brak danych" description="Nic tu nie ma." />
        </Example>
      </div>
    </div>
  ),
};

export const SelectingMarksOneAccountActive: Story = {
  name: 'Test: wybranie konta oznacza je jako aktywne, drugie przestaje być aktywne',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const shared = canvas.getByRole('button', { name: /Konto wspólne/ });
    const personal = canvas.getByRole('button', { name: /Konto osobiste/ });

    await expect(shared).toHaveAttribute('aria-pressed', 'true');
    await expect(personal).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(personal);
    await expect(personal).toHaveAttribute('aria-pressed', 'true');
    await expect(shared).toHaveAttribute('aria-pressed', 'false');
    await expect(canvas.getByRole('heading', { name: 'Wpisy: Konto osobiste' })).toBeVisible();
  },
};

export const MonthChangeUpdatesData: Story = {
  name: 'Test: zmiana miesiąca zmienia etykietę i kwoty obu kart',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvasElement.querySelector('[data-slot="month-switcher-label"]') as HTMLElement;
    const values = () =>
      Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-value"]')).map((element) => element.textContent);

    await expect(label).toHaveTextContent('listopad 2026');
    await expect(values()).toEqual([amountText(397550), amountText(104100)]);

    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await waitFor(() => expect(label).toHaveTextContent('październik 2026'));
    await expect(values()).toEqual([amountText(408100), amountText(-15900, MINUS_SIGN)]);

    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await waitFor(() => expect(label).toHaveTextContent('wrzesień 2026'));
    await expect(values()).toEqual([amountText(-60000, MINUS_SIGN), amountText(104100)]);
  },
};

export const SelectionSurvivesMonthChange: Story = {
  name: 'Test: wybrane konto zostaje wybrane po zmianie miesiąca',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Konto osobiste/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Następny miesiąc' }));

    await expect(canvas.getByRole('button', { name: /Konto osobiste/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: /Konto wspólne/ })).toHaveAttribute('aria-pressed', 'false');
  },
};

export const NeverShowsACombinedTotal: Story = {
  name: 'Test: nigdzie nie ma sumy łącznej, są dwie osobne liczby',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvasElement.querySelectorAll('[data-slot="account-remainder-value"]')).toHaveLength(2);
    await expect(canvas.queryByText(/razem|łącznie|suma|wszystkie konta/i)).toBeNull();
    await expect(canvasElement.textContent).not.toContain(amountText(397550 + 104100));
  },
};

export const OneAccountHasOneCard: Story = {
  ...OneAccount,
  name: 'Test: jedno konto to jedna karta i żadna suma',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('button', { pressed: true })).toHaveLength(1);
    await expect(canvas.queryByRole('button', { name: /Konto osobiste/ })).toBeNull();
  },
};

export const ZeroMonthShowsZeros: Story = {
  ...MonthWithoutEntries,
  name: 'Test: miesiąc bez wpisów pokazuje zera zamiast stanu pustego',
  play: async ({ canvasElement }) => {
    const values = Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-value"]'));

    await expect(values.map((element) => element.textContent)).toEqual([amountText(0), amountText(0)]);
    await expect(canvasElement.querySelector('[data-slot="empty-state"]')).toBeNull();
  },
};

export const LoadingIsBusyOnBothCards: Story = {
  ...Loading,
  name: 'Test: ładowanie oznacza obie karty jako zajęte',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('button', { pressed: true })).toHaveLength(1);
    await expect(canvasElement.querySelectorAll('[aria-busy="true"]')).toHaveLength(2);
    await expect(canvasElement.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(6);
  },
};

export const ErrorOffersRetryPerCard: Story = {
  ...FailedToLoad,
  name: 'Test: błąd daje ponowienie w każdej karcie',
  args: { scenario: 'error', onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const retryButtons = canvas.getAllByRole('button', { name: 'Spróbuj ponownie' });

    await expect(retryButtons).toHaveLength(2);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Spróbuj ponownie' }).at(0) as HTMLElement);
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const EmptyStateWhenNoAccounts: Story = {
  ...NoAccounts,
  name: 'Test: brak kont pokazuje stan pusty i brak kart',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { name: 'Nie masz dostępu do żadnego konta bankowego' })).toBeVisible();
    await expect(canvasElement.querySelectorAll('[data-slot="account-remainder-card"]')).toHaveLength(0);
  },
};

export const FitsNarrowScreen: Story = {
  ...LongAccountNames,
  name: 'Test: przy 320 px karty są jedna pod drugą bez poziomego przewijania',
  play: async ({ canvasElement }) => {
    const [first, second] = Array.from(canvasElement.querySelectorAll('[data-slot="account-remainder-card"]')) as [
      HTMLElement,
      HTMLElement,
    ];
    const root = canvasElement.firstElementChild as HTMLElement;

    await expect(root.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(first.scrollWidth).toBeLessThanOrEqual(first.clientWidth);
    await expect(second.getBoundingClientRect().top).toBeGreaterThanOrEqual(first.getBoundingClientRect().bottom);
  },
};
