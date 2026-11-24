import type { Meta, StoryObj } from '@storybook/react-vite';
import { type MouseEvent, useEffect, useId, useRef, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { AccountRemainderCard, type AccountType } from '../../components/bank-accounts/account-remainder-card';
import type { EntryActionResult } from '../../components/entries/entry-failure';
import { EntryForm, type EntryFormField, type EntryFormMode, type EntrySubmission } from '../../components/entries/entry-form';
import { DEFAULT_ENTRY_FORM_MESSAGES } from '../../components/entries/entry-form.messages';
import type { EntryRowData } from '../../components/entries/entry-row';
import { EntryTable } from '../../components/entries/entry-table';
import { SeriesActions } from '../../components/entries/series-actions';
import { formatMoneyMinor } from '../../lib/format-money-minor';
import { AppShell } from '../../components/layout/app-shell';
import { type MonthKey, addMonths, isMonthKey } from '../../components/months/month';
import { MonthSwitcher } from '../../components/months/month-switcher';
import { Button } from '../../components/ui/button';
import { EmptyState } from '../../components/ui/empty-state';
import { ErrorState } from '../../components/ui/error-state';
import { ToastProvider, useToast } from '../../components/ui/toast';

const SERVER_CURRENT_MONTH: MonthKey = '2026-11';
const MIN_MONTH: MonthKey = '2000-01';
const MAX_MONTH: MonthKey = '2100-12';
const NARROW_WIDTH_PX = 320;
const MOBILE_VIEWPORT = { value: 'mobile1', isRotated: false };
const TABLET_VIEWPORT = { value: 'tablet', isRotated: false };
const OPERATION_DELAY_MS = 150;
const MONTHS_OFFERED = 3;
const ACCOUNT_PARAM = 'account';
const MONTH_PARAM = 'month';
const ADD_ENTRY_LABEL = 'Dodaj wpis';
const MENU_TRIGGER = /^Akcje wpisu/;
const PAGE_TITLE = 'Ile zostanie w miesiącu';
const NO_ACCOUNTS_TITLE = 'Nie masz dostępu do żadnego konta bankowego';
const NO_ACCOUNTS_DESCRIPTION = 'Poproś właściciela konta o dostęp, a potem odśwież stronę.';
const ACCOUNTS_ERROR_TITLE = 'Nie udało się wczytać kont bankowych';
const ACCOUNTS_ERROR_DESCRIPTION = 'Sprawdź połączenie z internetem i spróbuj ponownie.';
const RETRY_LABEL = 'Spróbuj ponownie';
const CARDS_HEADING = 'Wyniki kont w wybranym miesiącu';
const ENTRIES_HEADING_PREFIX = 'Wpisy: ';
const ADDRESS_LABEL = 'Adres strony (symulacja)';
const PAID_SAVE_FAILED_MESSAGE = 'Nie udało się zapisać zmiany. Flaga „Zapłacone” została taka, jak była. Spróbuj ponownie.';
const ENTRY_SAVED_MESSAGE = DEFAULT_ENTRY_FORM_MESSAGES.saved;
const ENTRY_DELETED_MESSAGE = 'Wpis usunięty.';
const SERIES_ENDED_MESSAGE = 'Seria zakończona.';
const AMOUNT_CHANGED_MESSAGE = 'Kwota zmieniona.';
const END_MONTH_LABEL = 'Pierwszy miesiąc bez tego wpisu';
const END_MONTH = '2026-12';
const END_CONFIRM_LABEL = 'Zakończ od miesiąca';
const AMOUNT_FIELD_ERROR = 'Kwota przekracza dopuszczalny zakres.';

type OverviewScenario = 'ready' | 'loading' | 'error' | 'accounts-error' | 'one-account' | 'no-accounts';
type ListScenario =
  | 'ready'
  | 'loading'
  | 'error'
  | 'limit'
  | 'paid-fails'
  | 'save-fails'
  | 'validation-fails'
  | 'save-limit'
  | 'delete-conflict'
  | 'series-conflict';

interface Account {
  readonly id: string;
  readonly name: string;
  readonly accountType: AccountType;
}

const SHARED: Account = { id: 'shared', name: 'Konto wspólne', accountType: 'shared' };
const PERSONAL: Account = { id: 'personal', name: 'Konto osobiste', accountType: 'personal' };

const ACCOUNTS_BY_OVERVIEW: Record<OverviewScenario, readonly Account[]> = {
  ready: [SHARED, PERSONAL],
  loading: [SHARED, PERSONAL],
  error: [SHARED, PERSONAL],
  'accounts-error': [],
  'one-account': [SHARED],
  'no-accounts': [],
};

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

const SHARED_OCTOBER: readonly EntryRowData[] = SHARED_NOVEMBER.filter((entry) => entry.recurrence === 'monthly').map((entry) => ({
  ...entry,
  paid: entry.type === 'expense' ? true : null,
}));

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

const SHARED_SEPTEMBER: readonly EntryRowData[] = [
  { ...(SHARED_NOVEMBER[0] as EntryRowData) },
  {
    id: 'renovation',
    type: 'expense',
    description: 'Remont łazienki (przykład)',
    amountMinor: 710000,
    occurredOn: '2026-09-14',
    recurrence: 'none',
    paid: true,
  },
];

const ENTRIES_BY_MONTH: Record<string, Record<string, readonly EntryRowData[]>> = {
  '2026-11': { shared: SHARED_NOVEMBER, personal: PERSONAL_NOVEMBER },
  '2026-10': { shared: SHARED_OCTOBER },
  '2026-09': { shared: SHARED_SEPTEMBER },
};

interface UrlState {
  readonly accountId: string | undefined;
  readonly month: MonthKey;
}

function readUrlState(search: string, accounts: readonly Account[]): UrlState {
  const params = new URLSearchParams(search);
  const requestedMonth = params.get(MONTH_PARAM) ?? '';
  const requestedAccount = params.get(ACCOUNT_PARAM);
  const isMonthInRange = isMonthKey(requestedMonth) && requestedMonth >= MIN_MONTH && requestedMonth <= MAX_MONTH;
  const account = accounts.find((candidate) => candidate.id === requestedAccount) ?? accounts[0];

  return { accountId: account?.id, month: isMonthInRange ? requestedMonth : SERVER_CURRENT_MONTH };
}

function buildSearch({ accountId, month }: UrlState): string {
  const params = new URLSearchParams();
  if (accountId !== undefined) {
    params.set(ACCOUNT_PARAM, accountId);
  }
  params.set(MONTH_PARAM, month);

  return `?${params.toString()}`;
}

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

function applySubmission(list: readonly EntryRowData[], submission: EntrySubmission, newId: string): EntryRowData[] {
  if (submission.kind === 'create') {
    const { draft } = submission;
    const paid = draft.type === 'expense' ? submission.paid : null;
    const created: EntryRowData =
      draft.recurrence === 'monthly'
        ? { ...draft, id: newId, recurrence: 'monthly', dayOfMonth: Number(draft.occurredOn.slice(8, 10)), paid }
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

interface MonthPageProps {
  readonly overview?: OverviewScenario;
  readonly list?: ListScenario;
  readonly initialSearch?: string;
  readonly onRetry?: () => void;
}

function MonthPageContent({ overview = 'ready', list = 'ready', initialSearch = '', onRetry = fn() }: MonthPageProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState(initialSearch);
  const [paidOverrides, setPaidOverrides] = useState<Readonly<Record<string, boolean>>>({});
  const [savingIds, setSavingIds] = useState<readonly string[]>([]);
  const [lists, setLists] = useState<Readonly<Record<string, readonly EntryRowData[]>>>({});
  const [formMode, setFormMode] = useState<EntryFormMode>();
  const [createdCount, setCreatedCount] = useState(0);
  const [headingFocusRequests, setHeadingFocusRequests] = useState(0);
  const cardsHeadingId = useId();
  const entriesHeadingId = useId();
  const entriesHeadingRef = useRef<HTMLHeadingElement>(null);
  const accounts = ACCOUNTS_BY_OVERVIEW[overview];
  const { accountId, month } = readUrlState(search, accounts);
  const selected = accounts.find((account) => account.id === accountId);
  useEffect(() => {
    if (headingFocusRequests === 0) {
      return undefined;
    }
    const timer = window.setTimeout(() => entriesHeadingRef.current?.focus(), 0);

    return () => window.clearTimeout(timer);
  }, [headingFocusRequests]);
  const navigate = (next: UrlState) => setSearch(buildSearch(next));

  const listFor = (listMonth: MonthKey, id: string): readonly EntryRowData[] => lists[`${listMonth}|${id}`] ?? entriesFor(listMonth, id);
  const updateList = (id: string, change: (current: readonly EntryRowData[]) => readonly EntryRowData[]) => {
    const key = `${month}|${id}`;
    setLists((current) => ({ ...current, [key]: change(current[key] ?? entriesFor(month, id)) }));
  };

  const entries = selected
    ? listFor(month, selected.id).map((entry) => (entry.id in paidOverrides ? { ...entry, paid: paidOverrides[entry.id] ?? entry.paid } : entry))
    : [];

  const handlePaidChange = (entryId: string, paid: boolean) => {
    setSavingIds((current) => [...current, entryId]);
    window.setTimeout(() => {
      setSavingIds((current) => current.filter((id) => id !== entryId));
      if (list === 'paid-fails') {
        toast({ message: PAID_SAVE_FAILED_MESSAGE, announce: 'assertive' });
        return;
      }
      setPaidOverrides((current) => ({ ...current, [entryId]: paid }));
    }, OPERATION_DELAY_MS);
  };

  const handleSubmit = async (submission: EntrySubmission): Promise<EntryActionResult<EntryFormField>> => {
    await wait(OPERATION_DELAY_MS);
    if (list === 'save-fails') {
      return { ok: false, kind: 'network' };
    }
    if (list === 'save-limit') {
      return { ok: false, kind: 'limit' };
    }
    if (list === 'validation-fails') {
      return { ok: false, kind: 'validation', fieldErrors: { amount: AMOUNT_FIELD_ERROR } };
    }
    if (selected) {
      const newId = `created-${createdCount}`;
      setCreatedCount((current) => current + 1);
      updateList(selected.id, (current) => applySubmission(current, submission, newId));
    }

    return { ok: true };
  };

  const handleDelete = async (entryId: string): Promise<EntryActionResult> => {
    await wait(OPERATION_DELAY_MS);
    if (list === 'delete-conflict') {
      return { ok: false, kind: 'conflict' };
    }
    if (selected) {
      updateList(selected.id, (current) => current.filter((entry) => entry.id !== entryId));
    }

    return { ok: true };
  };

  const runSeriesOperation = async (): Promise<EntryActionResult> => {
    await wait(OPERATION_DELAY_MS);

    return list === 'series-conflict' ? { ok: false, kind: 'conflict' } : { ok: true };
  };

  const monthsFrom = (offset: number) => Array.from({ length: MONTHS_OFFERED }, (_, index) => addMonths(month, offset + index));

  const handleCompleted = (action: 'delete' | 'end' | 'change-amount') => {
    if (action === 'delete') {
      toast({ message: ENTRY_DELETED_MESSAGE });
      setHeadingFocusRequests((current) => current + 1);
      return;
    }
    toast({ message: action === 'end' ? SERIES_ENDED_MESSAGE : AMOUNT_CHANGED_MESSAGE });
  };

  const renderActions = (entry: EntryRowData) => {
    const common = { onEdit: () => setFormMode({ kind: 'edit', entry }), onDelete: handleDelete, onCompleted: handleCompleted };

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
          onEnd: runSeriesOperation,
          onChangeAmount: runSeriesOperation,
        }}
      />
    );
  };

  const tableStatus = list === 'loading' || list === 'error' ? list : list === 'limit' ? 'limit-exceeded' : 'loaded';
  const shownEntries = tableStatus === 'loaded' ? entries : [];
  const openCreateForm = () => setFormMode({ kind: 'create', defaultDate: `${month}-01` });
  const isEmptyMonth = tableStatus === 'loaded' && shownEntries.length === 0;

  const renderOverview = () => {
    if (overview === 'accounts-error') {
      return (
        <ErrorState
          announce
          titleLevel="h2"
          title={ACCOUNTS_ERROR_TITLE}
          description={ACCOUNTS_ERROR_DESCRIPTION}
          retryLabel={RETRY_LABEL}
          onRetry={onRetry}
        />
      );
    }
    if (accounts.length === 0) {
      return <EmptyState titleLevel="h2" title={NO_ACCOUNTS_TITLE} description={NO_ACCOUNTS_DESCRIPTION} />;
    }

    return (
      <section aria-labelledby={cardsHeadingId} className="flex flex-wrap gap-(--space-between-groups)">
        <h2 id={cardsHeadingId} className="sr-only">
          {CARDS_HEADING}
        </h2>
        {accounts.map((account) => {
          const common = { name: account.name, accountType: account.accountType, className: 'min-w-64 flex-1' };
          const select = { selected: account.id === selected?.id, onSelect: () => navigate({ accountId: account.id, month }) };
          if (overview === 'loading') {
            return <AccountRemainderCard key={account.id} {...common} {...select} status="loading" />;
          }
          if (overview === 'error') {
            return <AccountRemainderCard key={account.id} {...common} status="error" onRetry={onRetry} />;
          }

          return <AccountRemainderCard key={account.id} {...common} {...select} {...totals(listFor(month, account.id))} />;
        })}
      </section>
    );
  };

  return (
    <AppShell logoutHref="#wyloguj" onClickCapture={preventNavigationOnLink}>
      <div className="flex flex-col gap-(--space-between-groups)">
        <h1 className="text-2xl font-semibold leading-base">{PAGE_TITLE}</h1>
        <MonthSwitcher month={month} onMonthChange={(next) => navigate({ accountId: selected?.id, month: next })} min={MIN_MONTH} max={MAX_MONTH} />
        {renderOverview()}
        {selected ? (
          <section aria-labelledby={entriesHeadingId} className="flex flex-col gap-(--space-between-groups)">
            <div className="flex flex-wrap items-center justify-between gap-(--space-within-group)">
              <h2 id={entriesHeadingId} ref={entriesHeadingRef} tabIndex={-1} className="text-lg font-semibold leading-base">
                {ENTRIES_HEADING_PREFIX}
                {selected.name}
              </h2>
              {!isEmptyMonth && (
                <Button variant="secondary" onClick={openCreateForm}>
                  {ADD_ENTRY_LABEL}
                </Button>
              )}
            </div>
            <EntryTable
              status={tableStatus}
              caption={`${ENTRIES_HEADING_PREFIX}${selected.name}, ${month}`}
              entries={shownEntries}
              savingEntryIds={savingIds}
              actions={renderActions}
              onPaidChange={handlePaidChange}
              onRetry={onRetry}
              emptyAction={{ label: ADD_ENTRY_LABEL, onClick: openCreateForm }}
              headingLevel="h3"
            />
          </section>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {ADDRESS_LABEL}: <code data-slot="demo-address">{`/${buildSearch({ accountId: selected?.id, month })}`}</code>
        </p>
      </div>
      <EntryForm
        open={formMode !== undefined}
        onOpenChange={(open) => !open && setFormMode(undefined)}
        mode={formMode ?? { kind: 'create' }}
        onSubmit={handleSubmit}
        onSaved={() => toast({ message: ENTRY_SAVED_MESSAGE })}
      />
    </AppShell>
  );
}

function preventNavigationOnLink(event: MouseEvent<HTMLElement>): void {
  if ((event.target as HTMLElement).closest('a')) {
    event.preventDefault();
  }
}

function MonthPage(props: MonthPageProps) {
  return (
    <ToastProvider closeLabel="Zamknij" viewportLabel="Powiadomienia ({hotkey})" announcementLabel="Powiadomienie">
      <MonthPageContent {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Ekrany/E02 Wpisy/Konto z wpisami (/?account=…&month=…)',
  component: MonthPage,
  parameters: { layout: 'fullscreen', docs: { story: { inline: false, iframeHeight: 720 } } },
  args: { onRetry: fn() },
  excludeStories: ['MonthPage', 'SERVER_CURRENT_MONTH', 'SHARED_NOVEMBER'],
  argTypes: {
    overview: {
      control: 'inline-radio',
      options: ['ready', 'loading', 'error', 'accounts-error', 'one-account', 'no-accounts'],
      description: 'Stan kart wyniku i listy kont',
    },
    list: {
      control: 'inline-radio',
      options: [
        'ready',
        'loading',
        'error',
        'limit',
        'paid-fails',
        'save-fails',
        'validation-fails',
        'save-limit',
        'delete-conflict',
        'series-conflict',
      ],
      description: 'Stan listy wpisów i wynik operacji zapisu',
    },
    initialSearch: { control: 'text', description: 'Parametry adresu, np. ?account=personal&month=2026-10' },
    onRetry: { control: false },
  },
} satisfies Meta<typeof MonthPage>;

export default meta;
export { MonthPage, SERVER_CURRENT_MONTH, SHARED_NOVEMBER };
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Ready: Story = {
  name: 'Stan: konto wspólne, listopad 2026 (adres bez parametrów, domyślne konto i miesiąc)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 1, name: PAGE_TITLE })).toBeVisible();
    await expect(canvas.getByRole('heading', { level: 2, name: 'Wpisy: Konto wspólne' })).toBeVisible();
    await expect(canvas.getByRole('table', { name: 'Wpisy: Konto wspólne, 2026-11' })).toBeVisible();
    await expect(canvas.getAllByRole('row')).toHaveLength(SHARED_NOVEMBER.length + 1);
    await expect(canvasElement.querySelector('[data-slot="demo-address"]')).toHaveTextContent('/?account=shared&month=2026-11');
  },
};

export const FromUrl: Story = {
  name: 'Stan: adres z parametrami (konto osobiste, poprzedni miesiąc bez wpisów)',
  args: { initialSearch: '?account=personal&month=2026-10' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 2, name: 'Wpisy: Konto osobiste' })).toBeVisible();
    await expect(canvas.getByRole('heading', { name: 'W tym miesiącu nie ma jeszcze żadnych wpisów' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: /Konto osobiste/ })).toHaveAttribute('aria-pressed', 'true');
  },
};

export const InvalidUrl: Story = {
  name: 'Stan: błędny adres (nieznane konto, miesiąc spoza zakresu) wraca do domyślnych',
  args: { initialSearch: '?account=cudze-konto&month=1999-12' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { level: 2, name: 'Wpisy: Konto wspólne' })).toBeVisible();
    await expect(canvasElement.querySelector('[data-slot="demo-address"]')).toHaveTextContent('/?account=shared&month=2026-11');
  },
};

export const Loading: Story = {
  name: 'Stan: ładowanie listy wpisów (karty wyniku niezależnie gotowe)',
  args: { list: 'loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Wczytywanie wpisów')).toBeInTheDocument();
    await expect(canvas.queryByRole('table')).toBeNull();
    await expect(canvas.getAllByRole('button', { name: /^Konto/ })).toHaveLength(2);
  },
};

export const LoadingAll: Story = {
  name: 'Stan: ładowanie kart wyniku i listy naraz',
  args: { overview: 'loading', list: 'loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByText('Wczytywanie wyniku konta')).toHaveLength(2);
    await expect(canvas.getByText('Wczytywanie wpisów')).toBeInTheDocument();
  },
};

export const EmptyMonth: Story = {
  name: 'Stan: miesiąc bez wpisów z jedną akcją "Dodaj wpis"',
  args: { initialSearch: '?account=shared&month=2027-03' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('button', { name: ADD_ENTRY_LABEL })).toHaveLength(1);
    await userEvent.click(canvas.getByRole('button', { name: ADD_ENTRY_LABEL }));

    await expect(await screen.findByRole('dialog', { name: ADD_ENTRY_LABEL })).toBeVisible();
    await expect(within(screen.getByRole('dialog')).getByLabelText('Data')).toHaveValue('2027-03-01');
  },
};

export const FailedToLoad: Story = {
  name: 'Stan: błąd wczytania listy z ponowieniem',
  args: { list: 'error' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(within(canvas.getByRole('alert')).getByRole('button', { name: RETRY_LABEL }));

    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const LimitExceeded: Story = {
  name: 'Stan: za dużo wpisów (422): ostrzeżenie zamiast listy, bez "Dodaj wpis" w stanie pustym',
  args: { list: 'limit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Za dużo wpisów, żeby je pokazać')).toBeVisible();
    await expect(canvas.queryByRole('table')).toBeNull();
  },
};

export const PaidSaveFails: Story = {
  name: 'Stan: błąd zapisu flagi "Zapłacone": Toast, pole wraca do poprzedniego stanu',
  args: { list: 'paid-fails' },
  play: async ({ canvasElement }) => {
    const checkbox = within(canvasElement).getByRole('checkbox', { name: 'Zapłacone: Internet (przykład)' });

    await userEvent.click(checkbox);
    await expect(checkbox).toHaveAttribute('aria-busy', 'true');
    await waitFor(() => expect(checkbox).not.toHaveAttribute('aria-busy'));

    await expect(checkbox).not.toBeChecked();
    await waitFor(() => expect(screen.getByText(PAID_SAVE_FAILED_MESSAGE)).toBeInTheDocument());
  },
};

export const SaveFails: Story = {
  name: 'Stan: błąd sieci przy zapisie wpisu: formularz zostaje otwarty z danymi',
  args: { list: 'save-fails' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: ADD_ENTRY_LABEL }));
    const dialog = await fillNewEntry('Bilety do kina (przykład)');

    await userEvent.click(dialog.getByRole('button', { name: 'Zapisz' }));

    await expect(await dialog.findByRole('alert')).toBeVisible();
    await expect(dialog.getByLabelText('Opis')).toHaveValue('Bilety do kina (przykład)');
    await expect(screen.queryByText(ENTRY_SAVED_MESSAGE)).toBeNull();
  },
};

export const SaveValidationFails: Story = {
  name: 'Stan: serwer odrzuca kwotę (walidacja): błąd przy polu, fokus na polu',
  args: { list: 'validation-fails' },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: ADD_ENTRY_LABEL }));
    const dialog = await fillNewEntry('Bilety do kina (przykład)');

    await userEvent.click(dialog.getByRole('button', { name: 'Zapisz' }));

    await expect(await dialog.findByText(AMOUNT_FIELD_ERROR)).toBeVisible();
    await expect(dialog.getByLabelText('Kwota')).toHaveFocus();
  },
};

export const SaveLimit: Story = {
  name: 'Stan: limit wpisów przy zapisie (422): komunikat w oknie, wpis nie powstaje',
  args: { list: 'save-limit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const rowsBefore = canvas.getAllByRole('row').length;
    await userEvent.click(canvas.getByRole('button', { name: ADD_ENTRY_LABEL }));
    const dialog = await fillNewEntry('Bilety do kina (przykład)');

    await userEvent.click(dialog.getByRole('button', { name: 'Zapisz' }));

    await expect(await dialog.findByRole('alert')).toBeVisible();
    await expect(canvas.getAllByRole('row', { hidden: true })).toHaveLength(rowsBefore);
  },
};

export const DeleteConflict: Story = {
  name: 'Stan: konflikt przy usuwaniu (409): komunikat w oknie potwierdzenia, wiersz zostaje',
  args: { list: 'delete-conflict' },
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Zakupy spożywcze', 'Usuń');
    const dialog = within(await screen.findByRole('dialog'));

    await userEvent.click(dialog.getByRole('button', { name: 'Usuń wpis' }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('Wpis zmienił się w międzyczasie');
    await expect(within(canvasElement).getByText('Zakupy spożywcze (przykład)')).toBeInTheDocument();
  },
};

export const SeriesConflict: Story = {
  name: 'Stan: konflikt przy zakończeniu serii (409): komunikat w oknie, seria zostaje',
  args: { list: 'series-conflict' },
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Czynsz', /^Zakończ od miesiąca/);
    const dialog = within(await screen.findByRole('dialog'));

    await userEvent.selectOptions(dialog.getByLabelText(END_MONTH_LABEL), END_MONTH);
    await userEvent.click(dialog.getByRole('button', { name: END_CONFIRM_LABEL }));

    await expect(await dialog.findByRole('alert')).toHaveTextContent('Wpis zmienił się w międzyczasie');
  },
};

export const OneAccount: Story = {
  name: 'Stan: dostęp tylko do konta wspólnego (jedna karta)',
  args: { overview: 'one-account' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('button', { name: /^Konto/ })).toHaveLength(1);
    await expect(canvas.queryByText('Konto osobiste')).toBeNull();
  },
};

export const Tablet: Story = {
  name: 'Szerokość: 768 px',
  globals: { viewport: TABLET_VIEWPORT },
};

export const NarrowScreen: Story = {
  name: 'Szerokość: 320 px (tabela przewija się w kontenerze, strona nie)',
  globals: { viewport: MOBILE_VIEWPORT },
  parameters: { docs: { story: { inline: false, iframeHeight: 900 } } },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const frame = canvasElement.firstElementChild as HTMLElement;
    const region = within(canvasElement).getByRole('region', { name: 'Wpisy: Konto wspólne, 2026-11' });

    await expect(frame.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(frame.scrollWidth).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
  },
};

function remainderText(canvasElement: HTMLElement): string {
  return (canvasElement.querySelector('[data-slot="account-remainder-value"]') as HTMLElement).textContent ?? '';
}

function addressOf(canvasElement: HTMLElement): string {
  return canvasElement.querySelector('[data-slot="demo-address"]')?.textContent ?? '';
}

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

export const UrlTracksAccountAndMonth: Story = {
  name: 'Test: wybór konta i miesiąca zapisuje się w adresie, a zmiana miesiąca zachowuje konto',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Konto osobiste/ }));
    await expect(addressOf(canvasElement)).toBe('/?account=personal&month=2026-11');
    await expect(canvas.getByRole('table', { name: 'Wpisy: Konto osobiste, 2026-11' })).toBeInTheDocument();
    await expect(canvas.queryByText('Czynsz (przykład)')).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Poprzedni miesiąc' }));
    await expect(addressOf(canvasElement)).toBe('/?account=personal&month=2026-10');
    await expect(canvas.getByRole('heading', { level: 2, name: 'Wpisy: Konto osobiste' })).toBeVisible();
  },
};

export const NoCombinedTotal: Story = {
  name: 'Test: nie ma sumy łącznej, a lista pokazuje wyłącznie wpisy wybranego konta',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText(/razem|łącznie|suma/i)).toBeNull();
    await expect(canvas.queryByText('Karnet na siłownię (przykład)')).toBeNull();
    await expect(remainderText(canvasElement)).toBe(formatMoneyMinor(397900));
  },
};

export const AddEntryFlow: Story = {
  name: 'Test: dodanie wpisu: zapis, odświeżona lista i wynik, Toast "Wpis zapisany.", fokus wraca na przycisk',
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
    await expect(remainderText(canvasElement)).not.toBe(remainderBefore);
    await expect(opener).toHaveFocus();
  },
};

export const DeleteMovesFocusToTheListHeading: Story = {
  name: 'Test: po usunięciu wpisu fokus trafia na nagłówek listy, a Toast nie ma akcji "Cofnij"',
  play: async ({ canvasElement }) => {
    await chooseRowAction(canvasElement, 'Zakupy spożywcze', 'Usuń');
    const dialog = within(await screen.findByRole('dialog'));

    await userEvent.click(dialog.getByRole('button', { name: 'Usuń wpis' }));

    await waitFor(() => expect(screen.queryByText('Zakupy spożywcze (przykład)')).toBeNull());
    await waitFor(() => expect(screen.getByText(ENTRY_DELETED_MESSAGE)).toBeInTheDocument());
    await waitFor(() => expect(within(canvasElement).getByRole('heading', { level: 2, name: 'Wpisy: Konto wspólne' })).toHaveFocus());
    await expect(screen.queryByRole('button', { name: /Cofnij/ })).toBeNull();
  },
};

export const SeriesEndKeepsTheRowAndFocusReturnsToTheMenu: Story = {
  name: 'Test: zakończenie serii zostawia wiersz, pokazuje Toast, a fokus wraca na menu wiersza',
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByText(/Czynsz/).closest('tr') as HTMLElement;
    const trigger = within(row).getByRole('button', { name: MENU_TRIGGER });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('menuitem', { name: /^Zakończ od miesiąca/ }));
    const dialog = within(await screen.findByRole('dialog'));

    await userEvent.selectOptions(dialog.getByLabelText(END_MONTH_LABEL), END_MONTH);
    await userEvent.click(dialog.getByRole('button', { name: END_CONFIRM_LABEL }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.getByText(SERIES_ENDED_MESSAGE)).toBeInTheDocument());
    await expect(within(canvasElement).getByText(/Czynsz/)).toBeVisible();
    await expect(trigger).toHaveFocus();
  },
};

export const PaidFlagNeverChangesTheSums: Story = {
  name: 'Test: zapis flagi "Zapłacone" nie zmienia wyniku konta (R02)',
  play: async ({ canvasElement }) => {
    const remainderBefore = remainderText(canvasElement);
    const checkbox = within(canvasElement).getByRole('checkbox', { name: 'Zapłacone: Internet (przykład)' });

    await userEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());

    await expect(remainderText(canvasElement)).toBe(remainderBefore);
  },
};

export const OnePageFrame: Story = {
  name: 'Test: jedna rama strony: jeden pasek, jeden obszar główny, jeden h1 i jeden link (Wyloguj)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('banner')).toHaveLength(1);
    await expect(canvas.getAllByRole('main')).toHaveLength(1);
    await expect(canvas.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await expect(canvas.getAllByRole('link')).toHaveLength(1);
  },
};

export const FocusOrder: Story = {
  name: 'Test: kolejność fokusu (Wyloguj, miesiąc, karty, Dodaj wpis, tabela)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Wyloguj' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Poprzedni miesiąc' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Następny miesiąc' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: /Konto wspólne/ })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: /Konto osobiste/ })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: ADD_ENTRY_LABEL })).toHaveFocus();
  },
};
