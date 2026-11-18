import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import type { EntryActionResult } from './entry-failure';
import type { OneOffEntry, RecurringEntry } from './entry-row';
import { SeriesActions } from './series-actions';
import { DEFAULT_SERIES_ACTIONS_MESSAGES } from './series-actions.messages';

const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const NARROW_WIDTH_PX = 320;
const REQUEST_DELAY_MS = 150;
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 640 } };
const MENU_TRIGGER = /^Akcje wpisu/;
const DELETE_REASON = 'Seria ma miesiące w przeszłości. Użyj „Zakończ od miesiąca”.';
const SERVER_MONTH_ERROR = 'Ten miesiąc jest już po końcu serii. Wybierz wcześniejszy.';
const LONG_DESCRIPTION = 'Ubezpieczenie mieszkania https://example.com/bardzo/dlugi/adres/polisy/bez/spacji/w/opisie';

type Scenario = 'success' | 'pending' | 'conflict' | 'network' | 'limit' | 'validation' | 'field-error' | 'throws';
type Variant = 'one-off' | 'recurring' | 'recurring-past' | 'recurring-no-months' | 'recurring-long';

const ONE_OFF: OneOffEntry = {
  id: 'groceries',
  type: 'expense',
  description: 'Zakupy spożywcze (przykład)',
  amountMinor: 31250,
  occurredOn: '2026-11-07',
  recurrence: 'none',
  paid: true,
};

const SERIES: RecurringEntry = {
  id: 'rent',
  type: 'expense',
  description: 'Czynsz (przykład)',
  amountMinor: 185000,
  occurredOn: '2026-01-05',
  recurrence: 'monthly',
  dayOfMonth: 5,
  paid: false,
};

const END_MONTHS = ['2026-12', '2027-01', '2027-02'];
const AMOUNT_MONTHS = ['2026-11', '2026-12', '2027-01'];

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function respond<Field extends string>(scenario: Scenario, field: Field): Promise<EntryActionResult<Field>> {
  await wait(REQUEST_DELAY_MS);
  switch (scenario) {
    case 'pending':
      return new Promise<never>(() => undefined);
    case 'field-error':
      return { ok: false, kind: 'validation', fieldErrors: { [field]: SERVER_MONTH_ERROR } as Partial<Record<Field, string>> };
    case 'validation':
    case 'conflict':
    case 'network':
    case 'limit':
      return { ok: false, kind: scenario };
    case 'throws':
      throw new Error('offline');
    default:
      return { ok: true };
  }
}

interface ExampleProps {
  readonly variant?: Variant;
  readonly scenario?: Scenario;
  readonly onEdit?: () => void;
  readonly onDelete?: (entryId: string) => void;
  readonly onEnd?: (entryId: string, fromMonth: string) => void;
  readonly onChangeAmount?: (entryId: string, fromMonth: string, amountMinor: number) => void;
}

function Example({ variant = 'recurring', scenario = 'success', onEdit, onDelete, onEnd, onChangeAmount }: ExampleProps) {
  const handleDelete = (entryId: string) => {
    onDelete?.(entryId);

    return respond(scenario, 'month');
  };
  const common = { onEdit: () => onEdit?.(), onDelete: handleDelete };

  if (variant === 'one-off') {
    return (
      <div className="flex max-w-md items-center justify-between gap-(--space-within-group)">
        <span className="min-w-0 wrap-anywhere">{ONE_OFF.description}</span>
        <SeriesActions entry={ONE_OFF} {...common} />
      </div>
    );
  }

  const entry = variant === 'recurring-long' ? { ...SERIES, description: LONG_DESCRIPTION } : SERIES;
  const noMonths = variant === 'recurring-no-months';

  return (
    <div className="flex max-w-md items-center justify-between gap-(--space-within-group)">
      <span className="min-w-0 wrap-anywhere">{entry.description}</span>
      <SeriesActions
        entry={entry}
        {...common}
        series={{
          deletable: variant !== 'recurring-past' && variant !== 'recurring-long',
          endMonthOptions: noMonths ? [] : END_MONTHS,
          amountMonthOptions: noMonths ? [] : AMOUNT_MONTHS,
          onEnd: (entryId, fromMonth) => {
            onEnd?.(entryId, fromMonth);

            return respond(scenario, 'month');
          },
          onChangeAmount: (entryId, fromMonth, amountMinor) => {
            onChangeAmount?.(entryId, fromMonth, amountMinor);

            return respond(scenario, 'amount');
          },
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Elementy produktu/SeriesActions',
  component: Example,
  parameters: { layout: 'padded', docs: DOCS_IFRAME },
  args: { onEdit: fn(), onDelete: fn(), onEnd: fn(), onChangeAmount: fn() },
  argTypes: {
    variant: {
      control: 'select',
      options: ['one-off', 'recurring', 'recurring-past', 'recurring-no-months', 'recurring-long'],
    },
    scenario: {
      control: 'select',
      options: ['success', 'pending', 'conflict', 'network', 'limit', 'validation', 'field-error', 'throws'],
    },
    onEdit: { control: false },
    onDelete: { control: false },
    onEnd: { control: false },
    onChangeAmount: { control: false },
  },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

async function chooseMenuItem(canvasElement: HTMLElement, name: string | RegExp) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: MENU_TRIGGER }));
  await userEvent.click(await screen.findByRole('menuitem', { name }));

  return screen.findByRole('dialog');
}

async function openMenu(canvasElement: HTMLElement) {
  await userEvent.click(within(canvasElement).getByRole('button', { name: MENU_TRIGGER }));

  return screen.findByRole('menu');
}

async function chooseMonth(dialog: HTMLElement, label: string, value: string) {
  await userEvent.selectOptions(within(dialog).getByLabelText(label), value);
}

export const Playground: Story = {};

export const OneOffEntryMenu: Story = {
  name: 'Wpis jednorazowy: menu "Edytuj" i "Usuń"',
  args: { variant: 'one-off' },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

export const RecurringEntryMenu: Story = {
  name: 'Wpis cykliczny: menu z akcjami serii, "Usuń całkowicie" na końcu',
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

export const DeleteDisabledWithReason: Story = {
  name: 'Seria z miesiącami w przeszłości: "Usuń całkowicie" zablokowane z widocznym powodem',
  args: { variant: 'recurring-past' },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

export const NoMonthsToChoose: Story = {
  name: 'Brak miesięcy do wyboru: "Zakończ" i "Zmień kwotę" zablokowane z powodem',
  args: { variant: 'recurring-no-months' },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
  },
};

export const DeleteOneOffConfirmation: Story = {
  name: 'Potwierdzenie: usuń wpis jednorazowy (fokus na "Anuluj")',
  args: { variant: 'one-off' },
  play: async ({ canvasElement }) => {
    await chooseMenuItem(canvasElement, 'Usuń');
  },
};

export const DeleteSeriesConfirmation: Story = {
  name: 'Potwierdzenie: usuń całkowicie wpis cykliczny (fokus na "Anuluj")',
  play: async ({ canvasElement }) => {
    await chooseMenuItem(canvasElement, 'Usuń całkowicie…');
  },
};

export const EndSeriesDialog: Story = {
  name: 'Okno: zakończ od miesiąca (wybór miesiąca z listy)',
  play: async ({ canvasElement }) => {
    await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');
  },
};

export const ChangeAmountDialog: Story = {
  name: 'Okno: zmień kwotę od miesiąca (miesiąc i nowa kwota)',
  play: async ({ canvasElement }) => {
    await chooseMenuItem(canvasElement, 'Zmień kwotę od miesiąca…');
  },
};

export const DeleteConfirmationConflict: Story = {
  name: 'Potwierdzenie z błędem (409): komunikat w oknie, okno zostaje otwarte',
  args: { variant: 'one-off', scenario: 'conflict' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń wpis' }));
    await within(dialog).findByRole('alert');
  },
};

export const DeleteConfirmationNetworkError: Story = {
  name: 'Potwierdzenie z błędem sieci: komunikat w oknie',
  args: { scenario: 'throws' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń całkowicie…');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń całkowicie' }));
    await within(dialog).findByRole('alert');
  },
};

export const DeleteConfirmationLoading: Story = {
  name: 'Potwierdzenie: usuwanie w toku (przycisk zajęty)',
  args: { variant: 'one-off', scenario: 'pending' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń wpis' }));
  },
};

export const EndSeriesValidationErrors: Story = {
  name: 'Okno zakończenia: brak wybranego miesiąca (błąd przy polu, fokus na polu)',
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zakończ od miesiąca' }));
  },
};

export const ChangeAmountSeveralErrors: Story = {
  name: 'Okno zmiany kwoty: kilka błędów z podsumowaniem',
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zmień kwotę od miesiąca…');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zmień kwotę' }));
  },
};

export const ChangeAmountServerFieldError: Story = {
  name: 'Okno zmiany kwoty: błąd pola z serwera',
  args: { scenario: 'field-error' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zmień kwotę od miesiąca…');
    await chooseMonth(dialog, 'Pierwszy miesiąc z nową kwotą', '2026-12');
    await userEvent.type(within(dialog).getByLabelText('Nowa kwota'), '1900');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zmień kwotę' }));
  },
};

export const EndSeriesConflict: Story = {
  name: 'Okno zakończenia: konflikt (409) jako komunikat w oknie',
  args: { scenario: 'conflict' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');
    await chooseMonth(dialog, 'Pierwszy miesiąc bez tego wpisu', '2026-12');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zakończ od miesiąca' }));
    await within(dialog).findByRole('alert');
  },
};

export const ChangeAmountLoading: Story = {
  name: 'Okno zmiany kwoty: zapisywanie w toku',
  args: { scenario: 'pending' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zmień kwotę od miesiąca…');
    await chooseMonth(dialog, 'Pierwszy miesiąc z nową kwotą', '2026-12');
    await userEvent.type(within(dialog).getByLabelText('Nowa kwota'), '1900');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zmień kwotę' }));
  },
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px): długi opis w pytaniu potwierdzającym',
  globals: NARROW_VIEWPORT,
  args: { variant: 'recurring-long' },
  play: async ({ canvasElement }) => {
    await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');
  },
};

export const ConfirmationFocusStartsOnCancel: Story = {
  name: 'Test: każde potwierdzenie usunięcia ma domyślny fokus na "Anuluj", a nie na przycisku destrukcyjnym',
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń całkowicie…');

    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Anuluj' })).toHaveFocus());
    await expect(dialog).toHaveAccessibleName('Usunąć całkowicie wpis cykliczny „Czynsz (przykład)”?');
    await expect(within(dialog).getByText(/Tej operacji nie można cofnąć/)).toBeVisible();
  },
};

export const OneOffConfirmationFocusStartsOnCancel: Story = {
  name: 'Test: potwierdzenie usunięcia wpisu jednorazowego: fokus na "Anuluj", potem usunięcie woła onDelete z id',
  args: { variant: 'one-off' },
  play: async ({ canvasElement, args }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń');
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Anuluj' })).toHaveFocus());
    await expect(args.onDelete).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń wpis' }));

    await waitFor(() => expect(args.onDelete).toHaveBeenCalledWith('groceries'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const ServerErrorKeepsTheConfirmationOpen: Story = {
  name: 'Test: błąd serwera zostaje w oknie potwierdzenia (Alert), okno nie znika, a ponowna próba czyści błąd',
  args: { variant: 'one-off', scenario: 'conflict' },
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Usuń wpis' }));

    const alert = await within(dialog).findByRole('alert');
    await expect(alert).toHaveTextContent(DEFAULT_SERIES_ACTIONS_MESSAGES.conflict);
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Usuń wpis' })).not.toHaveAttribute('aria-busy'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Anuluj' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const DisabledItemExposesItsReason: Story = {
  name: 'Test: zablokowana pozycja ma widoczny powód, aria-disabled i nie otwiera okna',
  args: { variant: 'recurring-past' },
  play: async ({ canvasElement }) => {
    await openMenu(canvasElement);
    const item = await screen.findByRole('menuitem', { name: /Usuń całkowicie/ });

    await userEvent.click(item);

    await expect(item).toHaveAttribute('aria-disabled', 'true');
    await expect(within(item).getByText(DELETE_REASON)).toBeVisible();
    await expect(screen.queryByRole('dialog')).toBeNull();
    await expect(screen.getByRole('menu')).toBeInTheDocument();
  },
};

export const FocusReturnsToTheMenuTrigger: Story = {
  name: 'Test: po zamknięciu okna otwartego z menu fokus wraca na przycisk menu',
  play: async ({ canvasElement }) => {
    const trigger = within(canvasElement).getByRole('button', { name: MENU_TRIGGER });
    const dialog = await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Anuluj' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();

    await chooseMenuItem(canvasElement, 'Usuń całkowicie…');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(trigger).toHaveFocus();
  },
};

export const MonthsAreListedByPolishNames: Story = {
  name: 'Test: miesiące do wyboru mają polskie nazwy, a wartością jest klucz RRRR-MM',
  play: async ({ canvasElement, args }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');
    const select = within(dialog).getByLabelText('Pierwszy miesiąc bez tego wpisu') as HTMLSelectElement;

    await expect(Array.from(select.options).map((option) => [option.value, option.textContent])).toEqual([
      ['', 'Wybierz miesiąc'],
      ['2026-12', 'grudzień 2026'],
      ['2027-01', 'styczeń 2027'],
      ['2027-02', 'luty 2027'],
    ]);
    await userEvent.selectOptions(select, '2027-01');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Zakończ od miesiąca' }));

    await waitFor(() => expect(args.onEnd).toHaveBeenCalledWith('rent', '2027-01'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const ChangeAmountDeliversMinorUnits: Story = {
  name: 'Test: nowa kwota "12,50" trafia do onChangeAmount jako 1250 groszy razem z miesiącem',
  play: async ({ canvasElement, args }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zmień kwotę od miesiąca…');
    await chooseMonth(dialog, 'Pierwszy miesiąc z nową kwotą', '2026-12');
    await userEvent.type(within(dialog).getByLabelText('Nowa kwota'), '12,50');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zmień kwotę' }));

    await waitFor(() => expect(args.onChangeAmount).toHaveBeenCalledWith('rent', '2026-12', 1250));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  },
};

export const ChangeAmountValidatesBeforeCalling: Story = {
  name: 'Test: zmiana kwoty z błędami nie woła serwera, pokazuje podsumowanie i ustawia fokus na pierwszym polu',
  play: async ({ canvasElement, args }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zmień kwotę od miesiąca…');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Zmień kwotę' }));

    await expect(within(dialog).getByText(DEFAULT_SERIES_ACTIONS_MESSAGES.summaryTitle)).toBeVisible();
    await expect(within(dialog).getByLabelText('Pierwszy miesiąc z nową kwotą')).toHaveFocus();
    await expect(args.onChangeAmount).not.toHaveBeenCalled();
  },
};

export const DoubleConfirmIsBlocked: Story = {
  name: 'Test: podwójne kliknięcie potwierdzenia woła serwer raz, a okna nie da się zamknąć w trakcie',
  args: { variant: 'one-off', scenario: 'pending' },
  play: async ({ canvasElement, args }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Usuń');

    await userEvent.dblClick(within(dialog).getByRole('button', { name: 'Usuń wpis' }));
    await userEvent.keyboard('{Escape}');

    await expect(args.onDelete).toHaveBeenCalledTimes(1);
    await expect(within(dialog).getByRole('button', { name: 'Usuń wpis' })).toHaveAttribute('aria-busy', 'true');
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
  },
};

export const FitsNarrowScreen: Story = {
  ...NarrowScreen,
  name: 'Test: przy 320 px okno z długim opisem mieści się w ekranie',
  play: async ({ canvasElement }) => {
    const dialog = await chooseMenuItem(canvasElement, 'Zakończ od miesiąca…');

    const body = dialog.querySelector('[data-slot="dialog-body"]') as HTMLElement;
    await expect(dialog.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};
