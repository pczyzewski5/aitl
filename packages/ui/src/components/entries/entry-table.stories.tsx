import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ReactNode, useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Menu } from '../ui/menu';
import type { EntryRowData } from './entry-row';
import { EntryTable, type EntryTableProps } from './entry-table';

const NARROW_WIDTH_PX = 320;
const MIN_TARGET_PX = 36;
const NO_BREAK_SPACE = '\u00A0';
const MINUS_SIGN = '\u2212';
const CAPTION = 'Wpisy konta wspólnego, listopad 2026 (przykład)';
const MANY_ROWS_COUNT = 120;
const LONG_DESCRIPTION_MIN_HEIGHT_PX = 40;

const SALARY: EntryRowData = {
  id: 'salary',
  type: 'income',
  description: 'Wynagrodzenie (przykład)',
  amountMinor: 650000,
  occurredOn: '2026-01-10',
  recurrence: 'monthly',
  dayOfMonth: 10,
  paid: null,
};

const REFUND: EntryRowData = {
  id: 'refund',
  type: 'income',
  description: 'Zwrot za bilety (przykład)',
  amountMinor: 12050,
  occurredOn: '2026-11-18',
  recurrence: 'none',
  paid: null,
};

const RENT: EntryRowData = {
  id: 'rent',
  type: 'expense',
  description: 'Czynsz (przykład)',
  amountMinor: 185000,
  occurredOn: '2026-01-05',
  recurrence: 'monthly',
  dayOfMonth: 5,
  paid: true,
};

const INTERNET: EntryRowData = {
  id: 'internet',
  type: 'expense',
  description: 'Internet (przykład)',
  amountMinor: 5900,
  occurredOn: '2026-02-12',
  recurrence: 'monthly',
  dayOfMonth: 12,
  paid: false,
};

const GROCERIES: EntryRowData = {
  id: 'groceries',
  type: 'expense',
  description: 'Zakupy spożywcze (przykład)',
  amountMinor: 31250,
  occurredOn: '2026-11-07',
  recurrence: 'none',
  paid: true,
};

const INSURANCE: EntryRowData = {
  id: 'insurance',
  type: 'expense',
  description: 'Ubezpieczenie samochodu (przykład)',
  amountMinor: 42000,
  occurredOn: '2026-11-20',
  recurrence: 'none',
  paid: false,
};

const ENTRIES: readonly EntryRowData[] = [SALARY, RENT, GROCERIES, INTERNET, REFUND, INSURANCE];

const LONG_DESCRIPTION =
  'Opłata za przedłużoną gwarancję pralki i suszarki kupionych w sklepie https://example.com/bardzo/dlugi/adres/bez/spacji/w/opisie (przykład)';

function manyEntries(count: number): readonly EntryRowData[] {
  return Array.from({ length: count }, (_, index): EntryRowData => {
    const day = String((index % 28) + 1).padStart(2, '0');
    return index % 4 === 0
      ? {
          id: `many-${index}`,
          type: 'income',
          description: `Wpływ numer ${index + 1} (przykład)`,
          amountMinor: 10000 + index * 100,
          occurredOn: `2026-11-${day}`,
          recurrence: 'none',
          paid: null,
        }
      : {
          id: `many-${index}`,
          type: 'expense',
          description: `Wydatek numer ${index + 1} (przykład)`,
          amountMinor: 1000 + index * 50,
          occurredOn: `2026-11-${day}`,
          recurrence: 'none',
          paid: index % 3 === 0,
        };
  });
}

function resolveToken(property: 'color' | 'backgroundColor', token: string): string {
  const probe = document.createElement('div');
  probe.style[property] = `var(${token})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe)[property];
  probe.remove();
  return resolved;
}

function seriesActions(entry: EntryRowData): ReactNode {
  const items =
    entry.recurrence === 'monthly'
      ? [
          { id: 'change', label: 'Zmień kwotę od miesiąca', onSelect: fn() },
          { id: 'end', label: 'Zakończ od miesiąca', onSelect: fn() },
          {
            id: 'delete',
            label: 'Usuń całkowicie',
            destructive: true,
            disabled: true as const,
            disabledReason: 'Seria ma miesiące w przeszłości, więc można ją tylko zakończyć od wybranego miesiąca.',
          },
        ]
      : [{ id: 'delete', label: 'Usuń wpis', destructive: true, onSelect: fn() }];

  return <Menu triggerLabel={`Akcje wpisu ${entry.description}`} items={items} align="end" />;
}

interface ControlledTableProps extends Omit<EntryTableProps, 'onPaidChange' | 'caption' | 'onRetry'> {
  readonly caption?: string;
  readonly onPaidChange?: (entryId: string, paid: boolean) => void;
  readonly onRetry?: () => void;
}

function ControlledTable({
  entries = ENTRIES,
  caption = CAPTION,
  onPaidChange,
  onRetry = fn(),
  ...props
}: ControlledTableProps) {
  const [rows, setRows] = useState(entries);

  const handlePaidChange = (entryId: string, paid: boolean) => {
    setRows((current) => current.map((entry) => (entry.id === entryId ? { ...entry, paid } : entry)));
    onPaidChange?.(entryId, paid);
  };

  return <EntryTable {...props} caption={caption} entries={rows} onPaidChange={handlePaidChange} onRetry={onRetry} />;
}

const meta = {
  title: 'Elementy produktu/EntryTable',
  component: ControlledTable,
  parameters: { layout: 'padded' },
  decorators: [
    (Story, { parameters }) =>
      parameters.ownSurface ? (
        <Story />
      ) : (
        <div className="max-w-3xl">
          <Story />
        </div>
      ),
  ],
  args: { status: 'loaded', entries: ENTRIES, captionVisible: true, onPaidChange: fn() },
  argTypes: {
    status: { control: 'inline-radio', options: ['loading', 'error', 'loaded', 'limit-exceeded'] },
    captionVisible: { control: 'boolean' },
    retrying: { control: 'boolean' },
    entries: { control: false },
    actions: { control: false },
    messages: { control: false },
  },
} satisfies Meta<typeof ControlledTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const narrow = (Story: () => ReactNode) => (
  <div className="w-80">
    <Story />
  </div>
);

export const Playground: Story = {};

export const Loaded: Story = {
  name: 'Wczytane: wpływy, wydatki, wpisy cykliczne i jednorazowe',
};

export const PaidAndUnpaid: Story = {
  name: 'Wydatek zapłacony i niezapłacony: tylko pole wyboru',
  args: { entries: [RENT, INTERNET] },
};

export const Income: Story = {
  name: 'Wpływy: plus, kolor wpływu i pusta komórka "Zapłacone"',
  args: { entries: [SALARY, REFUND] },
};

export const Recurring: Story = {
  name: 'Oznaczenie cykliczności: napis "Co miesiąc" i dzień miesiąca',
  args: { entries: [SALARY, RENT, INTERNET] },
};

export const WithActions: Story = {
  name: 'Kolumna akcji: Menu z pozycją zablokowaną z powodem',
  parameters: { docs: { story: { inline: false, iframeHeight: 520 } } },
  args: { actions: seriesActions, entries: [RENT, GROCERIES, SALARY] },
};

export const Saving: Story = {
  name: 'Zapisywanie flagi: pole zajęte (aria-busy)',
  args: { savingEntryIds: ['internet'], entries: [RENT, INTERNET] },
};

export const Loading: Story = {
  name: 'Ładowanie: szkielety w aria-busy',
  args: { status: 'loading', entries: [] },
};

export const Empty: Story = {
  name: 'Pusty miesiąc: stan pusty z opcjonalną akcją',
  args: { entries: [], emptyAction: { label: 'Dodaj wpis', onClick: fn() } },
};

export const EmptyWithoutAction: Story = {
  name: 'Pusty miesiąc bez akcji',
  args: { entries: [] },
};

export const FailedToLoad: Story = {
  name: 'Błąd wczytania: komunikat i ponowienie',
  args: { status: 'error', entries: [], onRetry: fn() },
};

export const LimitExceeded: Story = {
  name: 'Przekroczony limit 500 wpisów (422 result_limit_exceeded)',
  args: { status: 'limit-exceeded', entries: [] },
};

export const ManyRows: Story = {
  name: 'Dużo wierszy (120): bez ucinania i bez paginacji',
  args: { entries: manyEntries(MANY_ROWS_COUNT) },
};

export const LongDescriptionNarrowScreen: Story = {
  name: 'Długi opis, wąski ekran (320 px): zawijanie, tabela przewija się w kontenerze',
  parameters: { ownSurface: true },
  decorators: [narrow],
  args: {
    entries: [{ ...INTERNET, id: 'long', description: LONG_DESCRIPTION }, SALARY, RENT],
  },
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px): przewijany kontener z podpowiedzią, strona nie przewija się',
  parameters: { ownSurface: true },
  decorators: [narrow],
};

export const NarrowStates: Story = {
  name: 'Wąski ekran (320 px): stany bez tabeli',
  parameters: { ownSurface: true },
  decorators: [narrow],
  render: () => (
    <div className="flex flex-col gap-(--space-section)">
      <EntryTable status="loading" caption={CAPTION} onPaidChange={fn()} onRetry={fn()} />
      <EntryTable status="loaded" entries={[]} caption={CAPTION} onPaidChange={fn()} onRetry={fn()} />
      <EntryTable status="error" caption={CAPTION} onPaidChange={fn()} onRetry={fn()} />
      <EntryTable status="limit-exceeded" caption={CAPTION} onPaidChange={fn()} onRetry={fn()} />
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
    <figure className="flex min-w-0 flex-1 flex-col gap-2 rounded-card border border-border bg-background p-4">
      <p className="font-semibold">{verdict}</p>
      <div className="min-w-0">{children}</div>
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
        <Example verdict="Dobrze" explanation="Typ wpisu niesie znak kwoty i tekst dla czytnika, kolor tylko je wzmacnia (A3).">
          <ControlledTable status="loaded" caption="Dobrze: znak i tekst (przykład)" entries={[SALARY, GROCERIES]} />
        </Example>
        <Example verdict="Źle" explanation="Wydatek i wpływ odróżnione samym kolorem kwoty, bez znaku (A3).">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-income">6 500,00 zł</p>
            <p className="text-sm text-expense">312,50 zł</p>
          </div>
        </Example>
      </div>
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Zapłacony wydatek ma tylko zaznaczone pole z nazwą z opisu: flaga informuje, nie zmienia wiersza ani sum (R02).">
          <ControlledTable status="loaded" caption="Dobrze: flaga bez zmiany wiersza (przykład)" entries={[RENT, INTERNET]} />
        </Example>
        <Example verdict="Źle" explanation="Zapłacony wiersz wyszarzony i przekreślony: wygląda jak usunięty i sugeruje, że znika z sumy (R02).">
          <p className="text-sm text-muted-foreground line-through">Czynsz (przykład) −1 850,00 zł</p>
        </Example>
      </div>
      <div className="flex flex-wrap gap-(--space-between-groups)">
        <Example verdict="Dobrze" explanation="Wąski ekran: tabela przewija się w kontenerze z widoczną podpowiedzią, strona stoi w miejscu.">
          <div className="w-72 max-w-full">
            <ControlledTable status="loaded" caption="Dobrze: wąski ekran (przykład)" entries={[RENT, SALARY]} />
          </div>
        </Example>
        <Example verdict="Źle" explanation="Tabela szersza niż ekran bez własnego kontenera: przewija się cała strona.">
          <div className="w-72 max-w-full overflow-hidden">
            <p className="w-xl text-sm">Opis | Kwota | Data | Zapłacone | Akcje</p>
          </div>
        </Example>
      </div>
    </div>
  ),
};

function rowOf(canvasElement: HTMLElement, description: string): HTMLElement {
  const row = within(canvasElement).getByText(new RegExp(description)).closest('tr');

  if (row === null) {
    throw new Error(`No row for ${description}`);
  }

  return row;
}

export const TableSemantics: Story = {
  name: 'Test: tabela z opisem, nagłówkami kolumn i wierszy oraz liczbą wierszy',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const table = canvas.getByRole('table', { name: CAPTION });
    const headers = within(table).getAllByRole('columnheader');
    const rowHeaders = within(table).getAllByRole('rowheader');

    await expect(table.querySelector('caption')).toHaveTextContent(CAPTION);
    await expect(headers.map((header) => header.textContent)).toEqual(['Opis', 'Kwota', 'Data', 'Zapłacone']);
    await expect(headers.every((header) => header.getAttribute('scope') === 'col')).toBe(true);
    await expect(rowHeaders).toHaveLength(ENTRIES.length);
    await expect(rowHeaders.every((header) => header.getAttribute('scope') === 'row')).toBe(true);
    await expect(within(table).getAllByRole('row')).toHaveLength(ENTRIES.length + 1);
  },
};

export const PaidCheckboxIsNamedAfterTheDescription: Story = {
  name: 'Test: pole "Zapłacone" ma nazwę z opisu wpisu i przełącza flagę',
  args: { entries: [RENT, INTERNET], onPaidChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const unpaid = canvas.getByRole('checkbox', { name: 'Zapłacone: Internet (przykład)' });
    const paid = canvas.getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' });

    await expect(unpaid).not.toBeChecked();
    await expect(paid).toBeChecked();
    await userEvent.click(unpaid);
    await expect(unpaid).toBeChecked();
    await expect(args.onPaidChange).toHaveBeenLastCalledWith('internet', true);
    unpaid.focus();
    await userEvent.keyboard(' ');
    await expect(unpaid).not.toBeChecked();
    await expect(args.onPaidChange).toHaveBeenLastCalledWith('internet', false);
    await expect(args.onPaidChange).toHaveBeenCalledTimes(2);
  },
};

export const PaidRowLooksLikeAnyOtherRow: Story = {
  name: 'Test: zapłacony wiersz nie jest wyszarzony, przekreślony ani inaczej pokolorowany',
  args: { entries: [RENT, INTERNET] },
  play: async ({ canvasElement }) => {
    const paidRow = rowOf(canvasElement, 'Czynsz');
    const unpaidRow = rowOf(canvasElement, 'Internet');
    const paidDescription = paidRow.querySelector('[data-slot="entry-description"]') as HTMLElement;
    const unpaidDescription = unpaidRow.querySelector('[data-slot="entry-description"]') as HTMLElement;

    await expect(getComputedStyle(paidRow).backgroundColor).toBe(getComputedStyle(unpaidRow).backgroundColor);
    await expect(getComputedStyle(paidRow).opacity).toBe(getComputedStyle(unpaidRow).opacity);
    await expect(getComputedStyle(paidDescription).textDecorationLine).toBe('none');
    await expect(getComputedStyle(paidDescription).color).toBe(getComputedStyle(unpaidDescription).color);
  },
};

export const TogglingThePaidFlagChangesNoAmounts: Story = {
  name: 'Test: zmiana flagi nie zmienia żadnej kwoty w tabeli (R02)',
  args: { entries: [RENT, INTERNET, SALARY] },
  play: async ({ canvasElement }) => {
    const amounts = () =>
      Array.from(canvasElement.querySelectorAll('[data-slot="entry-amount"]')).map((amount) => amount.textContent);
    const before = amounts();

    await userEvent.click(within(canvasElement).getByRole('checkbox', { name: 'Zapłacone: Internet (przykład)' }));
    await userEvent.click(within(canvasElement).getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' }));

    await expect(amounts()).toEqual(before);
  },
};

export const IncomeHasNoPaidControl: Story = {
  name: 'Test: wpływ nie ma kontrolki "Zapłacone", komórka ma tekst dla czytnika',
  args: { entries: [SALARY, REFUND] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('[data-slot="entry-paid"]')).toHaveLength(2);
    await expect(canvas.getAllByText('Nie dotyczy wpływów')).toHaveLength(2);
  },
};

export const SignsAndColoursComeFromTokens: Story = {
  name: 'Test: plus i minus U+2212 w kwotach, kolory z tokenów, tekst typu dla czytnika',
  args: { entries: [SALARY, GROCERIES] },
  play: async ({ canvasElement }) => {
    const income = rowOf(canvasElement, 'Wynagrodzenie').querySelector('[data-slot="entry-amount"]') as HTMLElement;
    const expense = rowOf(canvasElement, 'Zakupy').querySelector('[data-slot="entry-amount"]') as HTMLElement;
    const incomeColour = resolveToken('color', '--income');
    const expenseColour = resolveToken('color', '--expense');

    await expect(income.textContent).toBe(`Wpływ: +6${NO_BREAK_SPACE}500,00${NO_BREAK_SPACE}zł`);
    await expect(expense.textContent).toBe(`Wydatek: ${MINUS_SIGN}312,50${NO_BREAK_SPACE}zł`);
    await expect(getComputedStyle(income).color).toBe(incomeColour);
    await expect(getComputedStyle(expense).color).toBe(expenseColour);
    await expect(getComputedStyle(income.closest('td') as HTMLElement).textAlign).toBe('right');
    await expect(getComputedStyle(income.closest('td') as HTMLElement).fontVariantNumeric).toContain('tabular-nums');
  },
};

export const RecurringBadgeIsText: Story = {
  name: 'Test: plakietka "Co miesiąc" tylko przy wpisie cyklicznym, dzień miesiąca jako tekst',
  args: { entries: [SALARY, GROCERIES] },
  play: async ({ canvasElement }) => {
    const recurringRow = rowOf(canvasElement, 'Wynagrodzenie');
    const oneOffRow = rowOf(canvasElement, 'Zakupy');

    await expect(within(recurringRow).getByText('Co miesiąc')).toBeVisible();
    await expect(within(recurringRow).getByText('Dzień miesiąca: 10')).toBeVisible();
    await expect(within(oneOffRow).queryByText('Co miesiąc')).toBeNull();
    await expect(within(oneOffRow).getByText('07.11.2026')).toBeVisible();
  },
};

export const EffectiveDayInAShortMonth: Story = {
  name: 'Test: wpis cykliczny z dniem 31 w lutym pokazuje dzień efektywny z API (28)',
  args: {
    caption: 'Wpisy konta wspólnego, luty 2027 (przykład)',
    entries: [{ ...INTERNET, id: 'late', description: 'Opłata na koniec miesiąca (przykład)', occurredOn: '2026-01-31', dayOfMonth: 28 }],
  },
  play: async ({ canvasElement }) => {
    const row = rowOf(canvasElement, 'Opłata na koniec miesiąca');

    await expect(within(row).getByText('Dzień miesiąca: 28')).toBeVisible();
    await expect(within(row).queryByText('Dzień miesiąca: 31')).toBeNull();
  },
};

export const ScrollContainerIsFocusableAtNarrowWidth: Story = {
  ...NarrowScreen,
  name: 'Test: przy 320 px kontener tabeli przewija się, ma fokus, nazwę i widoczną podpowiedź, strona nie',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wrapper = canvasElement.firstElementChild as HTMLElement;
    const region = canvas.getByRole('region', { name: CAPTION });
    const hint = canvas.getByText('Przewiń tabelę w poziomie, żeby zobaczyć wszystkie kolumny.');

    await expect(wrapper.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect(getComputedStyle(region).overflowX).toBe('auto');
    await expect(region).toHaveAttribute('tabindex', '0');
    await expect(region).toHaveAccessibleDescription(hint.textContent ?? '');
    await expect(hint).toBeVisible();
    await userEvent.tab();
    await expect(region).toHaveFocus();
    await expect(getComputedStyle(region).outlineWidth).toBe('2px');
  },
};

export const HintIsHiddenWhenTheTableFits: Story = {
  name: 'Test: na szerokim ekranie tabela mieści się, podpowiedź o przewijaniu jest ukryta',
  parameters: { ownSurface: true },
  decorators: [
    (Story) => (
      <div className="w-200">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: CAPTION });
    const hint = canvasElement.querySelector('[data-slot="entry-table-hint"]') as HTMLElement;

    await expect(region.scrollWidth).toBeLessThanOrEqual(region.clientWidth);
    await expect(getComputedStyle(hint).display).toBe('none');
  },
};

export const LongDescriptionWrapsInsideTheContainer: Story = {
  ...LongDescriptionNarrowScreen,
  name: 'Test: długi opis zawija się w komórce i nie poszerza strony przy 320 px',
  play: async ({ canvasElement }) => {
    const wrapper = canvasElement.firstElementChild as HTMLElement;
    const description = canvasElement.querySelector('[data-slot="entry-description"]') as HTMLElement;

    await expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
    await expect(description.getBoundingClientRect().height).toBeGreaterThan(LONG_DESCRIPTION_MIN_HEIGHT_PX);
    await expect(description.textContent).toBe(LONG_DESCRIPTION);
  },
};

export const CheckboxTargetIsAtLeast36Pixels: Story = {
  name: 'Test: cel pola "Zapłacone" ma co najmniej 36 px',
  args: { entries: [INTERNET] },
  play: async ({ canvasElement }) => {
    const target = canvasElement.querySelector('[data-slot="checkbox-target"]') as HTMLElement;
    const rect = target.getBoundingClientRect();

    await expect(rect.width).toBeGreaterThanOrEqual(MIN_TARGET_PX);
    await expect(rect.height).toBeGreaterThanOrEqual(MIN_TARGET_PX);
  },
};

export const SavingCheckboxIsBusyAndInert: Story = {
  ...Saving,
  name: 'Test: zapisywane pole ma aria-busy i aria-disabled, zachowuje fokus i nie wywołuje zmiany',
  args: { savingEntryIds: ['internet'], entries: [RENT, INTERNET], onPaidChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const busy = canvas.getByRole('checkbox', { name: 'Zapłacone: Internet (przykład)' });
    const idle = canvas.getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' });

    busy.focus();
    await userEvent.click(busy);
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy).toHaveAttribute('aria-disabled', 'true');
    await expect(busy).toHaveFocus();
    await expect(busy).not.toBeChecked();
    await expect(idle).not.toHaveAttribute('aria-busy');
    await expect(args.onPaidChange).not.toHaveBeenCalled();
  },
};

export const ActionsSlotRendersAMenuPerRow: Story = {
  ...WithActions,
  name: 'Test: kolumna akcji ma ukryty nagłówek i po jednym Menu na wiersz',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('columnheader')).toHaveLength(5);
    await expect(canvas.getByRole('columnheader', { name: 'Akcje' })).toBeInTheDocument();
    await expect(canvas.getAllByRole('button', { name: /^Akcje wpisu / })).toHaveLength(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Akcje wpisu Czynsz (przykład)' }));
  },
};

export const LoadingIsBusyWithSkeletons: Story = {
  ...Loading,
  name: 'Test: ładowanie ma aria-busy, szkielety, tekst dla czytnika i nie ma tabeli',
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="entry-table"]') as HTMLElement;

    await expect(root).toHaveAttribute('aria-busy', 'true');
    await expect(root.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThanOrEqual(3);
    await expect(within(canvasElement).getByText('Wczytywanie wpisów')).toBeInTheDocument();
    await expect(within(canvasElement).queryByRole('table')).toBeNull();
  },
};

export const EmptyMonthShowsEmptyState: Story = {
  ...Empty,
  name: 'Test: pusty miesiąc pokazuje stan pusty z akcją, bez tabeli',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('heading', { name: 'W tym miesiącu nie ma jeszcze żadnych wpisów' })).toBeVisible();
    await expect(canvas.queryByRole('table')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Dodaj wpis' }));
    await expect(args.emptyAction?.onClick).toHaveBeenCalledTimes(1);
  },
};

export const ErrorOffersRetry: Story = {
  ...FailedToLoad,
  name: 'Test: błąd ogłasza komunikat i pozwala ponowić',
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent('Nie udało się wczytać wpisów');
    await userEvent.click(canvas.getByRole('button', { name: 'Spróbuj ponownie' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};

export const LimitAlertExplainsAndHidesNothingSilently: Story = {
  ...LimitExceeded,
  name: 'Test: przekroczony limit pokazuje ostrzeżenie z limitem 500 i żadnych wierszy',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');

    await expect(alert).toHaveTextContent('Za dużo wpisów, żeby je pokazać');
    await expect(alert).toHaveTextContent('więcej niż 500 wpisów');
    await expect(canvas.queryByRole('table')).toBeNull();
  },
};

export const ManyRowsAreAllRendered: Story = {
  ...ManyRows,
  name: 'Test: 120 wierszy jest renderowanych w całości',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('row')).toHaveLength(MANY_ROWS_COUNT + 1);
    await expect(canvas.getByText('Wydatek numer 120 (przykład)')).toBeInTheDocument();
  },
};
