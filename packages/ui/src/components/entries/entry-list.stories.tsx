import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { AccountRemainderCard, type AccountType } from '../bank-accounts/account-remainder-card';
import { type MonthKey } from '../months/month';
import { MonthSwitcher } from '../months/month-switcher';
import { Menu } from '../ui/menu';
import { ToastProvider, useToast } from '../ui/toast';
import type { EntryRowData } from './entry-row';
import { EntryTable } from './entry-table';

const SERVER_CURRENT_MONTH: MonthKey = '2026-11';
const NARROW_WIDTH_PX = 320;
const SAVE_DELAY_MS = 150;
const NO_BREAK_SPACE = ' ';
const SAVE_FAILED_MESSAGE = 'Nie udało się zapisać zmiany. Flaga „Zapłacone” została taka, jak była. Spróbuj ponownie.';

type Scenario = 'ready' | 'loading' | 'error' | 'empty' | 'limit' | 'paidFails';

interface Account {
  readonly id: string;
  readonly name: string;
  readonly accountType: AccountType;
}

const SHARED: Account = { id: 'shared', name: 'Konto wspólne', accountType: 'shared' };
const PERSONAL: Account = { id: 'personal', name: 'Konto osobiste', accountType: 'personal' };

const SHARED_NOVEMBER: readonly EntryRowData[] = [
  {
    id: 'salary',
    type: 'income',
    description: 'Wynagrodzenie (przykład)',
    amountMinor: 650000,
    occurredOn: '2026-01-10',
    recurrence: 'monthly',
    dayOfMonth: 10,
    paid: null,
  },
  {
    id: 'rent',
    type: 'expense',
    description: 'Czynsz (przykład)',
    amountMinor: 185000,
    occurredOn: '2026-01-05',
    recurrence: 'monthly',
    dayOfMonth: 5,
    paid: true,
  },
  {
    id: 'groceries',
    type: 'expense',
    description: 'Zakupy spożywcze (przykład)',
    amountMinor: 31250,
    occurredOn: '2026-11-07',
    recurrence: 'none',
    paid: true,
  },
  {
    id: 'internet',
    type: 'expense',
    description: 'Internet (przykład)',
    amountMinor: 5900,
    occurredOn: '2026-02-12',
    recurrence: 'monthly',
    dayOfMonth: 12,
    paid: false,
  },
  {
    id: 'refund',
    type: 'income',
    description: 'Zwrot za bilety (przykład)',
    amountMinor: 12050,
    occurredOn: '2026-11-18',
    recurrence: 'none',
    paid: null,
  },
  {
    id: 'insurance',
    type: 'expense',
    description: 'Ubezpieczenie samochodu (przykład)',
    amountMinor: 42000,
    occurredOn: '2026-11-20',
    recurrence: 'none',
    paid: false,
  },
];

const SHARED_OCTOBER: readonly EntryRowData[] = SHARED_NOVEMBER.filter((entry) => entry.recurrence === 'monthly').map(
  (entry) => ({ ...entry, paid: entry.type === 'expense' ? true : null }),
);

const PERSONAL_NOVEMBER: readonly EntryRowData[] = [
  {
    id: 'freelance',
    type: 'income',
    description: 'Zlecenie dodatkowe (przykład)',
    amountMinor: 120000,
    occurredOn: '2026-11-03',
    recurrence: 'none',
    paid: null,
  },
  {
    id: 'gym',
    type: 'expense',
    description: 'Karnet na siłownię (przykład)',
    amountMinor: 15900,
    occurredOn: '2026-03-01',
    recurrence: 'monthly',
    dayOfMonth: 1,
    paid: false,
  },
];

const ENTRIES_BY_MONTH: Record<string, Record<string, readonly EntryRowData[]>> = {
  '2026-11': { shared: SHARED_NOVEMBER, personal: PERSONAL_NOVEMBER },
  '2026-10': { shared: SHARED_OCTOBER },
};

function entriesFor(month: string, accountId: string): readonly EntryRowData[] {
  return ENTRIES_BY_MONTH[month]?.[accountId] ?? [];
}

function totals(entries: readonly EntryRowData[]) {
  const incomeMinor = entries.filter((entry) => entry.type === 'income').reduce((sum, entry) => sum + entry.amountMinor, 0);
  const expensesMinor = entries.filter((entry) => entry.type === 'expense').reduce((sum, entry) => sum + entry.amountMinor, 0);

  return { incomeMinor, expensesMinor, remainderMinor: incomeMinor - expensesMinor };
}

function rowActions(entry: EntryRowData): ReactNode {
  return (
    <Menu
      triggerLabel={`Akcje wpisu ${entry.description}`}
      align="end"
      items={[{ id: 'delete', label: entry.recurrence === 'monthly' ? 'Zakończ od miesiąca' : 'Usuń wpis', onSelect: fn() }]}
    />
  );
}

interface EntryListProps {
  readonly scenario?: Scenario;
  readonly initialMonth?: MonthKey;
  readonly initialSelectedId?: string;
  readonly onRetry?: () => void;
}

function EntryListContent({
  scenario = 'ready',
  initialMonth = SERVER_CURRENT_MONTH,
  initialSelectedId = SHARED.id,
  onRetry = fn(),
}: EntryListProps) {
  const { toast } = useToast();
  const [month, setMonth] = useState(initialMonth);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [paidOverrides, setPaidOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [savingIds, setSavingIds] = useState<readonly string[]>([]);
  const selected = selectedId === SHARED.id ? SHARED : PERSONAL;

  const entries = entriesFor(month, selected.id).map((entry) =>
    entry.id in paidOverrides ? { ...entry, paid: paidOverrides[entry.id] ?? entry.paid } : entry,
  );

  const handlePaidChange = (entryId: string, paid: boolean) => {
    setSavingIds((current) => [...current, entryId]);
    window.setTimeout(() => {
      setSavingIds((current) => current.filter((id) => id !== entryId));
      if (scenario === 'paidFails') {
        toast({ message: SAVE_FAILED_MESSAGE, announce: 'assertive' });
        return;
      }
      setPaidOverrides((current) => ({ ...current, [entryId]: paid }));
    }, SAVE_DELAY_MS);
  };

  const status = scenario === 'loading' || scenario === 'error' ? scenario : scenario === 'limit' ? 'limit-exceeded' : 'loaded';
  const shownEntries = status === 'loaded' && scenario !== 'empty' ? entries : [];
  const cardsLoading = scenario === 'loading';

  return (
    <div className="flex max-w-3xl flex-col gap-(--space-between-groups)">
      <h2 className="text-lg font-semibold leading-base">Wpisy konta</h2>
      <MonthSwitcher month={month} onMonthChange={setMonth} min="2000-01" max="2100-12" />
      <div className="flex flex-wrap gap-(--space-between-groups)">
        {[SHARED, PERSONAL].map((account) =>
          cardsLoading ? (
            <AccountRemainderCard
              key={account.id}
              className="min-w-64 flex-1"
              status="loading"
              name={account.name}
              accountType={account.accountType}
              selected={account.id === selectedId}
              onSelect={() => setSelectedId(account.id)}
            />
          ) : (
            <AccountRemainderCard
              key={account.id}
              className="min-w-64 flex-1"
              name={account.name}
              accountType={account.accountType}
              {...totals(entriesFor(month, account.id))}
              selected={account.id === selectedId}
              onSelect={() => setSelectedId(account.id)}
            />
          ),
        )}
      </div>
      <EntryTable
        status={status}
        caption={`Wpisy: ${selected.name}, ${month}`}
        entries={shownEntries}
        savingEntryIds={savingIds}
        actions={rowActions}
        onPaidChange={handlePaidChange}
        onRetry={onRetry}
        emptyAction={{ label: 'Dodaj wpis', onClick: fn() }}
        headingLevel="h3"
      />
    </div>
  );
}

function EntryList(props: EntryListProps) {
  return (
    <ToastProvider closeLabel="Zamknij" viewportLabel="Powiadomienia ({hotkey})" announcementLabel="Powiadomienie">
      <EntryListContent {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Wzorce/Lista wpisów konta',
  component: EntryList,
  parameters: { layout: 'padded', docs: { story: { inline: false, iframeHeight: 640 } } },
  argTypes: {
    scenario: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'empty', 'limit', 'paidFails'] },
    initialMonth: { control: 'text' },
    initialSelectedId: { control: 'inline-radio', options: [SHARED.id, PERSONAL.id] },
    onRetry: { control: false },
  },
} satisfies Meta<typeof EntryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Ready: Story = {
  name: 'Konto wspólne, listopad 2026: wpływy, wydatki, cykliczne i jednorazowe',
};

export const PersonalAccount: Story = {
  name: 'Konto osobiste: osobna lista i osobny wynik',
  args: { initialSelectedId: PERSONAL.id },
};

export const EmptyMonth: Story = {
  name: 'Miesiąc bez wpisów: stan pusty z akcją "Dodaj wpis"',
  args: { initialMonth: '2027-03' },
};

export const Loading: Story = {
  name: 'Ładowanie listy i wyników',
  args: { scenario: 'loading' },
};

export const FailedToLoad: Story = {
  name: 'Błąd wczytania listy',
  args: { scenario: 'error' },
};

export const LimitExceeded: Story = {
  name: 'Za dużo wpisów (422): ostrzeżenie zamiast listy',
  args: { scenario: 'limit' },
};

export const PaidSaveFails: Story = {
  name: 'Błąd zapisu flagi: Toast, pole wraca do poprzedniego stanu',
  args: { scenario: 'paidFails' },
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px): tabela przewija się w kontenerze, strona nie',
  parameters: { docs: { story: { inline: false, iframeHeight: 900 } } },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};

function PaidCheckboxOf(canvasElement: HTMLElement, description: string): HTMLElement {
  return within(canvasElement).getByRole('checkbox', { name: `Zapłacone: ${description}` });
}

function remainderText(canvasElement: HTMLElement): string {
  return (canvasElement.querySelector('[data-slot="account-remainder-value"]') as HTMLElement).textContent ?? '';
}

export const PaidFlagNeverChangesTheSums: Story = {
  name: 'Test: zapis flagi "Zapłacone" jest widoczny jako zajęcie, a wyniki konta się nie zmieniają (R02)',
  play: async ({ canvasElement }) => {
    const remainderBefore = remainderText(canvasElement);
    const checkbox = PaidCheckboxOf(canvasElement, 'Internet (przykład)');

    await expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    await expect(checkbox).toHaveAttribute('aria-busy', 'true');
    await waitFor(() => expect(checkbox).toBeChecked());
    await expect(checkbox).not.toHaveAttribute('aria-busy');
    await userEvent.click(PaidCheckboxOf(canvasElement, 'Czynsz (przykład)'));
    await waitFor(() => expect(PaidCheckboxOf(canvasElement, 'Czynsz (przykład)')).not.toBeChecked());
    await expect(remainderText(canvasElement)).toBe(remainderBefore);
    await expect(remainderBefore).toBe(`3${NO_BREAK_SPACE}979,00${NO_BREAK_SPACE}zł`);
  },
};

export const PaidFailureShowsToastAndKeepsTheOldState: Story = {
  ...PaidSaveFails,
  name: 'Test: nieudany zapis flagi pokazuje Toast, pole zostaje bez zmian i przestaje być zajęte',
  play: async ({ canvasElement }) => {
    const checkbox = PaidCheckboxOf(canvasElement, 'Internet (przykład)');

    await userEvent.click(checkbox);
    await expect(checkbox).toHaveAttribute('aria-busy', 'true');
    await waitFor(() => expect(checkbox).not.toHaveAttribute('aria-busy'));
    await expect(checkbox).not.toBeChecked();
    await waitFor(() => expect(screen.getByText(SAVE_FAILED_MESSAGE)).toBeInTheDocument());
  },
};

export const SwitchingMonthReplacesTheRows: Story = {
  name: 'Test: zmiana miesiąca podmienia wiersze i stan pusty pokazuje się dla miesiąca bez wpisów',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('row')).toHaveLength(SHARED_NOVEMBER.length + 1);
    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await expect(canvas.getAllByRole('row')).toHaveLength(SHARED_OCTOBER.length + 1);
    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await expect(canvas.queryByRole('table')).toBeNull();
    await expect(canvas.getByRole('heading', { name: 'W tym miesiącu nie ma jeszcze żadnych wpisów' })).toBeVisible();
  },
};

export const SwitchingAccountReplacesTheRows: Story = {
  name: 'Test: wybór drugiego konta pokazuje jego wpisy i podpis tabeli',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Konto osobiste/ }));
    await expect(canvas.getByRole('table', { name: 'Wpisy: Konto osobiste, 2026-11' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('row')).toHaveLength(PERSONAL_NOVEMBER.length + 1);
    await expect(canvas.queryByText('Czynsz (przykład)')).toBeNull();
  },
};

export const LimitAndErrorAndLoadingStates: Story = {
  name: 'Test: scenariusze limit, błąd i ładowanie pokazują właściwe stany zamiast tabeli',
  render: () => (
    <ToastProvider closeLabel="Zamknij" viewportLabel="Powiadomienia ({hotkey})" announcementLabel="Powiadomienie">
      <div className="flex flex-col gap-(--space-section)">
        <EntryListContent scenario="limit" />
        <EntryListContent scenario="error" />
        <EntryListContent scenario="loading" />
      </div>
    </ToastProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Za dużo wpisów, żeby je pokazać')).toBeVisible();
    await expect(canvas.getByText('Nie udało się wczytać wpisów')).toBeVisible();
    await expect(canvas.getByText('Wczytywanie wpisów')).toBeInTheDocument();
    await expect(canvas.queryByRole('table')).toBeNull();
  },
};

export const FitsNarrowScreen: Story = {
  ...NarrowScreen,
  name: 'Test: przy 320 px strona się nie przewija, a kontener tabeli tak',
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.firstElementChild as HTMLElement;
    const region = within(canvasElement).getByRole('region', { name: 'Wpisy: Konto wspólne, 2026-11' });

    await expect(wrapper.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
  },
};

export const NoCombinedTotalAndOnlySelectedAccountRows: Story = {
  name: 'Test: nie ma sumy łącznej i lista konta pokazuje wyłącznie wpisy wybranego konta',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText(/razem|łącznie|suma/i)).toBeNull();
    await expect(canvas.queryByText('Karnet na siłownię (przykład)')).toBeNull();
  },
};

