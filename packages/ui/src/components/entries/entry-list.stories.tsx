import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { AccountRemainderCard, type AccountType } from '../bank-accounts/account-remainder-card';
import { type MonthKey, addMonths } from '../months/month';
import { MonthSwitcher } from '../months/month-switcher';
import { Button } from '../ui/button';
import { ToastProvider, useToast } from '../ui/toast';
import type { EntryActionResult } from './entry-failure';
import { EntryForm, type EntryFormField, type EntryFormMode, type EntrySubmission } from './entry-form';
import { DEFAULT_ENTRY_FORM_MESSAGES } from './entry-form.messages';
import type { EntryRowData } from './entry-row';
import { EntryTable } from './entry-table';
import { SeriesActions } from './series-actions';

const SERVER_CURRENT_MONTH: MonthKey = '2026-11';
const NARROW_WIDTH_PX = 320;
const SAVE_DELAY_MS = 150;
const NO_BREAK_SPACE = ' ';
const SAVE_FAILED_MESSAGE = 'Nie udało się zapisać zmiany. Flaga „Zapłacone” została taka, jak była. Spróbuj ponownie.';
const ENTRY_SAVED_MESSAGE = DEFAULT_ENTRY_FORM_MESSAGES.saved;
const ENTRY_DELETED_MESSAGE = 'Wpis usunięty.';
const SERIES_ENDED_MESSAGE = 'Seria zakończona.';
const AMOUNT_CHANGED_MESSAGE = 'Kwota zmieniona.';
const MONTHS_OFFERED = 3;
const ADD_ENTRY_LABEL = 'Dodaj wpis';
const MENU_TRIGGER = /^Akcje wpisu/;
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const LEAP_FEBRUARY_LENGTH = 29;

type Scenario = 'ready' | 'loading' | 'error' | 'empty' | 'limit' | 'paidFails' | 'saveFails' | 'deleteFails';

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

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function monthLength(month: MonthKey): number {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  return monthNumber === 2 && isLeapYear ? LEAP_FEBRUARY_LENGTH : (MONTH_LENGTHS[monthNumber - 1] ?? 0);
}

function effectiveDay(occurredOn: string, month: MonthKey): number {
  return Math.min(Number(occurredOn.slice(8, 10)), monthLength(month));
}

function applySubmission(list: readonly EntryRowData[], submission: EntrySubmission, month: MonthKey, newId: string): EntryRowData[] {
  if (submission.kind === 'create') {
    const { draft } = submission;
    const paid = draft.type === 'expense' ? submission.paid : null;
    const created: EntryRowData =
      draft.recurrence === 'monthly'
        ? { ...draft, id: newId, recurrence: 'monthly', dayOfMonth: effectiveDay(draft.occurredOn, month), paid }
        : { ...draft, id: newId, recurrence: 'none', paid };

    return [...list, created];
  }

  return list.map((entry) => {
    if (entry.id !== submission.entryId) {
      return entry;
    }

    return submission.kind === 'update-series-description'
      ? { ...entry, description: submission.description }
      : { ...entry, ...submission.draft, recurrence: 'none' };
  });
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
  const [lists, setLists] = useState<Readonly<Record<string, readonly EntryRowData[]>>>({});
  const [formMode, setFormMode] = useState<EntryFormMode>();
  const [createdCount, setCreatedCount] = useState(0);
  const selected = selectedId === SHARED.id ? SHARED : PERSONAL;
  const listKey = `${month}|${selected.id}`;

  const listFor = (listMonth: MonthKey, accountId: string): readonly EntryRowData[] =>
    lists[`${listMonth}|${accountId}`] ?? entriesFor(listMonth, accountId);
  const updateList = (change: (list: readonly EntryRowData[]) => readonly EntryRowData[]) =>
    setLists((current) => ({ ...current, [listKey]: change(current[listKey] ?? entriesFor(month, selected.id)) }));

  const entries = listFor(month, selected.id).map((entry) =>
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

  const handleSubmit = async (submission: EntrySubmission): Promise<EntryActionResult<EntryFormField>> => {
    await wait(SAVE_DELAY_MS);
    if (scenario === 'saveFails') {
      return { ok: false, kind: 'network' };
    }
    const newId = `created-${createdCount}`;
    setCreatedCount((current) => current + 1);
    updateList((list) => applySubmission(list, submission, month, newId));

    return { ok: true };
  };

  const handleDelete = async (entryId: string): Promise<EntryActionResult> => {
    await wait(SAVE_DELAY_MS);
    if (scenario === 'deleteFails') {
      return { ok: false, kind: 'conflict' };
    }
    updateList((list) => list.filter((entry) => entry.id !== entryId));

    return { ok: true };
  };

  const monthsFrom = (offset: number) => Array.from({ length: MONTHS_OFFERED }, (_, index) => addMonths(month, offset + index));
  const completedMessages = { delete: ENTRY_DELETED_MESSAGE, end: SERIES_ENDED_MESSAGE, 'change-amount': AMOUNT_CHANGED_MESSAGE };

  const renderActions = (entry: EntryRowData) => {
    const common = {
      onEdit: () => setFormMode({ kind: 'edit', entry }),
      onDelete: handleDelete,
      onCompleted: (action: keyof typeof completedMessages) => toast({ message: completedMessages[action] }),
    };

    if (entry.recurrence === 'none') {
      return <SeriesActions entry={entry} {...common} />;
    }

    return (
      <SeriesActions
        entry={entry}
        {...common}
        series={{
          deletable: entry.occurredOn.slice(0, 7) > SERVER_CURRENT_MONTH,
          endMonthOptions: monthsFrom(1),
          amountMonthOptions: monthsFrom(0),
          onEnd: async () => {
            await wait(SAVE_DELAY_MS);

            return { ok: true };
          },
          onChangeAmount: async () => {
            await wait(SAVE_DELAY_MS);

            return { ok: true };
          },
        }}
      />
    );
  };

  const status = scenario === 'loading' || scenario === 'error' ? scenario : scenario === 'limit' ? 'limit-exceeded' : 'loaded';
  const shownEntries = status === 'loaded' && scenario !== 'empty' ? entries : [];
  const cardsLoading = scenario === 'loading';
  const openCreateForm = () => setFormMode({ kind: 'create', defaultDate: `${month}-01` });
  const isEmptyMonth = status === 'loaded' && shownEntries.length === 0;

  return (
    <div className="flex max-w-3xl flex-col gap-(--space-between-groups)">
      <div className="flex flex-wrap items-center justify-between gap-(--space-within-group)">
        <h2 className="text-lg font-semibold leading-base">Wpisy konta</h2>
        {!isEmptyMonth && (
          <Button variant="secondary" onClick={openCreateForm}>
            {ADD_ENTRY_LABEL}
          </Button>
        )}
      </div>
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
              {...totals(listFor(month, account.id))}
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
        actions={renderActions}
        onPaidChange={handlePaidChange}
        onRetry={onRetry}
        emptyAction={{ label: ADD_ENTRY_LABEL, onClick: openCreateForm }}
        headingLevel="h3"
      />
      <EntryForm
        open={formMode !== undefined}
        onOpenChange={(open) => !open && setFormMode(undefined)}
        mode={formMode ?? { kind: 'create' }}
        onSubmit={handleSubmit}
        onSaved={() => toast({ message: ENTRY_SAVED_MESSAGE })}
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
    scenario: { control: 'inline-radio', options: ['ready', 'loading', 'error', 'empty', 'limit', 'paidFails', 'saveFails', 'deleteFails'] },
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


export const SaveFails: Story = {
  name: 'Błąd zapisu wpisu: formularz zostaje otwarty z komunikatem',
  args: { scenario: 'saveFails' },
};

export const DeleteFails: Story = {
  name: 'Błąd usuwania: komunikat w oknie potwierdzenia, wpis zostaje na liście',
  args: { scenario: 'deleteFails' },
};

async function fillNewEntry(description: string) {
  const dialog = within(await screen.findByRole('dialog'));
  await userEvent.type(dialog.getByLabelText('Opis'), description);
  await userEvent.type(dialog.getByLabelText('Kwota'), '12,50');

  return dialog;
}

async function chooseRowAction(canvasElement: HTMLElement, rowText: string, item: string | RegExp) {
  const row = within(canvasElement).getByText(new RegExp(rowText)).closest('tr') as HTMLElement;
  await userEvent.click(within(row).getByRole('button', { name: MENU_TRIGGER }));
  await userEvent.click(await screen.findByRole('menuitem', { name: item }));
}

export const AddEntryFlow: Story = {
  name: 'Test: dodanie wpisu: formularz z przycisku, zapis, lista się odświeża, Toast "Wpis zapisany.", fokus na przycisku',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const opener = canvas.getByRole('button', { name: ADD_ENTRY_LABEL });
    const rowsBefore = canvas.getAllByRole('row').length;
    const remainderBefore = remainderText(canvasElement);

    await userEvent.click(opener);
    const dialog = await fillNewEntry('Bilety do kina (przykład)');
    await userEvent.click(dialog.getByRole('button', { name: 'Zapisz' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.getByText(ENTRY_SAVED_MESSAGE)).toBeInTheDocument());
    await expect(canvas.getAllByRole('row')).toHaveLength(rowsBefore + 1);
    await expect(canvas.getByText('Bilety do kina (przykład)')).toBeVisible();
    await expect(remainderText(canvasElement)).not.toBe(remainderBefore);
    await expect(opener).toHaveFocus();
  },
};

export const EditOneOffFlow: Story = {
  name: 'Test: edycja wpisu jednorazowego z menu wiersza: zmiana opisu widoczna na liście i Toast',
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Zakupy spożywcze', 'Edytuj');

    const dialog = within(await screen.findByRole('dialog', { name: 'Edytuj wpis' }));
    const description = dialog.getByLabelText('Opis');
    await userEvent.clear(description);
    await userEvent.type(description, 'Zakupy tygodniowe (przykład)');
    await userEvent.click(dialog.getByRole('button', { name: 'Zapisz' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(within(canvasElement).getByText('Zakupy tygodniowe (przykład)')).toBeVisible();
    await waitFor(() => expect(screen.getByText(ENTRY_SAVED_MESSAGE)).toBeInTheDocument());
  },
};

export const EditRecurringFlow: Story = {
  name: 'Test: wpis cykliczny z menu wiersza: edycja tylko opisu, kwota tylko do odczytu',
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Czynsz', 'Edytuj opis');

    const dialog = within(await screen.findByRole('dialog', { name: 'Edytuj opis wpisu cyklicznego' }));
    await expect(dialog.queryByLabelText('Kwota')).toBeNull();
    await expect(dialog.getByText(/Zmień kwotę od miesiąca/)).toBeVisible();
  },
};

export const RecurringMenuHasSeriesActions: Story = {
  name: 'Test: menu wpisu cyklicznego ma akcje serii, a "Usuń całkowicie" jest zablokowane z powodem (seria z przeszłością)',
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByText(/Czynsz/).closest('tr') as HTMLElement;

    await userEvent.click(within(row).getByRole('button', { name: MENU_TRIGGER }));

    const items = (await screen.findAllByRole('menuitem')).map((item) => item.textContent);
    await expect(items[0]).toBe('Edytuj opis');
    await expect(items[1]).toBe('Zakończ od miesiąca…');
    await expect(items[2]).toBe('Zmień kwotę od miesiąca…');
    await expect(screen.getByRole('menuitem', { name: /Usuń całkowicie/ })).toHaveAttribute('aria-disabled', 'true');
    await expect(screen.getByText('Seria ma miesiące w przeszłości. Użyj „Zakończ od miesiąca”.')).toBeVisible();
  },
};

export const DeleteOneOffFlow: Story = {
  name: 'Test: usunięcie wpisu przez potwierdzenie: wiersz znika, Toast bez "Cofnij"',
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Zakupy spożywcze', 'Usuń');

    const dialog = within(await screen.findByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Usuń wpis' }));

    await waitFor(() => expect(screen.queryByText('Zakupy spożywcze (przykład)')).toBeNull());
    await waitFor(() => expect(screen.getByText(ENTRY_DELETED_MESSAGE)).toBeInTheDocument());
    await expect(screen.queryByRole('button', { name: /Cofnij/ })).toBeNull();
  },
};

export const DeleteFailureKeepsTheRow: Story = {
  ...DeleteFails,
  name: 'Test: błąd usuwania zostaje w oknie potwierdzenia, a wiersz nie znika',
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Zakupy spożywcze', 'Usuń');

    const dialog = within(await screen.findByRole('dialog'));
    await userEvent.click(dialog.getByRole('button', { name: 'Usuń wpis' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('Wpis zmienił się w międzyczasie');
    await expect(within(canvasElement).getByText('Zakupy spożywcze (przykład)')).toBeInTheDocument();
  },
};

export const SaveFailureKeepsTheFormOpen: Story = {
  ...SaveFails,
  name: 'Test: błąd zapisu zostawia formularz otwarty z danymi, bez Toastu "Wpis zapisany."',
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: ADD_ENTRY_LABEL }));
    const dialog = await fillNewEntry('Bilety do kina (przykład)');

    await userEvent.click(dialog.getByRole('button', { name: 'Zapisz' }));

    await expect(await dialog.findByRole('alert')).toBeVisible();
    await expect(dialog.getByLabelText('Opis')).toHaveValue('Bilety do kina (przykład)');
    await expect(screen.queryByText(ENTRY_SAVED_MESSAGE)).toBeNull();
  },
};

export const EmptyMonthHasASingleAddAction: Story = {
  ...EmptyMonth,
  name: 'Test: pusty miesiąc ma jedną akcję "Dodaj wpis" (w stanie pustym), która otwiera formularz',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('button', { name: ADD_ENTRY_LABEL })).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: ADD_ENTRY_LABEL }));

    await expect(await screen.findByRole('dialog', { name: 'Dodaj wpis' })).toBeVisible();
    await expect(within(screen.getByRole('dialog')).getByLabelText('Data')).toHaveValue('2027-03-01');
  },
};
