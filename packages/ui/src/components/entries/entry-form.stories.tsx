import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef, useState } from 'react';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../ui/button';
import { ToastProvider, useToast } from '../ui/toast';
import type { EntryActionResult } from './entry-failure';
import { EntryForm, type EntryFormField, type EntryFormMode, type EntrySubmission } from './entry-form';
import { DEFAULT_ENTRY_FORM_MESSAGES } from './entry-form.messages';
import type { EntryRowData } from './entry-row';

const NARROW_VIEWPORT = { viewport: { value: 'mobile1', isRotated: false } };
const NARROW_WIDTH_PX = 320;
const REQUEST_DELAY_MS = 150;
const DOCS_IFRAME = { story: { inline: false, iframeHeight: 760 } };
const OPENER_LABEL = 'Dodaj wpis';
const LONG_DESCRIPTION =
  'Ubezpieczenie mieszkania i odpowiedzialności cywilnej za cały rok https://example.com/bardzo/dlugi/adres/polisy/bez/spacji/w/opisie-wpisu';

type Scenario = 'success' | 'pending' | 'field-error' | 'validation' | 'conflict' | 'network' | 'limit' | 'throws';
type ModeName = 'create' | 'edit-one-off' | 'edit-series';

const ONE_OFF: EntryRowData = {
  id: 'groceries',
  type: 'expense',
  description: 'Zakupy spożywcze (przykład)',
  amountMinor: 31250,
  occurredOn: '2026-11-07',
  recurrence: 'none',
  paid: true,
};

const SERIES: EntryRowData = {
  id: 'rent',
  type: 'expense',
  description: 'Czynsz (przykład)',
  amountMinor: 185000,
  occurredOn: '2026-01-31',
  recurrence: 'monthly',
  dayOfMonth: 28,
  paid: false,
};

const MODES: Record<ModeName, EntryFormMode> = {
  create: { kind: 'create', defaultDate: '2026-11-18' },
  'edit-one-off': { kind: 'edit', entry: ONE_OFF },
  'edit-series': { kind: 'edit', entry: SERIES },
};

const SERVER_FIELD_ERROR = 'Kwota przekracza dopuszczalne maksimum. Wpisz mniej niż 100 000 000 zł.';

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function respond(scenario: Scenario): Promise<EntryActionResult<EntryFormField>> {
  await wait(REQUEST_DELAY_MS);
  switch (scenario) {
    case 'pending':
      return new Promise<never>(() => undefined);
    case 'field-error':
      return { ok: false, kind: 'validation', fieldErrors: { amount: SERVER_FIELD_ERROR } };
    case 'validation':
      return { ok: false, kind: 'validation' };
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
  readonly scenario?: Scenario;
  readonly mode?: ModeName;
  readonly defaultOpen?: boolean;
  readonly withToast?: boolean;
  readonly onSubmit?: (submission: EntrySubmission) => void;
  readonly onSaved?: () => void;
}

function ExampleContent({ scenario = 'success', mode = 'create', defaultOpen = false, withToast = false, onSubmit, onSaved }: ExampleProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { toast } = useToast();
  const openerRef = useRef<HTMLButtonElement>(null);

  const handleSaved = () => {
    onSaved?.();
    if (withToast) {
      toast({ message: DEFAULT_ENTRY_FORM_MESSAGES.saved });
    }
  };

  return (
    <>
      <Button ref={openerRef} variant="secondary" onClick={() => setOpen(true)}>
        {OPENER_LABEL}
      </Button>
      <EntryForm
        open={open}
        onOpenChange={setOpen}
        mode={MODES[mode]}
        onSubmit={(submission) => {
          onSubmit?.(submission);

          return respond(scenario);
        }}
        onSaved={handleSaved}
      />
    </>
  );
}

function Example(props: ExampleProps) {
  return (
    <ToastProvider closeLabel="Zamknij" viewportLabel="Powiadomienia ({hotkey})" announcementLabel="Powiadomienie">
      <ExampleContent {...props} />
    </ToastProvider>
  );
}

const meta = {
  title: 'Elementy produktu/EntryForm',
  component: Example,
  parameters: { layout: 'padded', docs: DOCS_IFRAME },
  args: { onSubmit: fn(), onSaved: fn() },
  argTypes: {
    scenario: {
      control: 'select',
      options: ['success', 'pending', 'field-error', 'validation', 'conflict', 'network', 'limit', 'throws'],
    },
    mode: { control: 'inline-radio', options: ['create', 'edit-one-off', 'edit-series'] },
    defaultOpen: { control: 'boolean' },
    withToast: { control: 'boolean' },
    onSubmit: { control: false },
    onSaved: { control: false },
  },
} satisfies Meta<typeof Example>;

export default meta;
type Story = StoryObj<typeof meta>;

async function dialogQueries() {
  const dialog = await screen.findByRole('dialog');

  return { dialog, ...within(dialog) };
}

async function fillValidEntry(description = 'Zakupy spożywcze (przykład)') {
  const form = await dialogQueries();
  await userEvent.type(form.getByLabelText('Opis'), description);
  await userEvent.type(form.getByLabelText('Kwota'), '12,50');
  await userEvent.clear(form.getByLabelText('Data'));
  await userEvent.type(form.getByLabelText('Data'), '2026-11-18');

  return form;
}

async function saveEntry() {
  const form = await dialogQueries();
  await userEvent.click(form.getByRole('button', { name: /^Zapis/ }));
}

export const Playground: Story = {};

export const CreateEntry: Story = {
  name: 'Dodawanie wpisu: czysty formularz',
  args: { defaultOpen: true },
};

export const CreateIncome: Story = {
  name: 'Wpływ: pole "Zapłacone" znika',
  args: { defaultOpen: true },
  play: async () => {
    const form = await dialogQueries();

    await userEvent.click(form.getByRole('radio', { name: 'Wpływ' }));
    await expect(form.queryByRole('checkbox', { name: 'Zapłacone' })).toBeNull();
  },
};

export const RecurringCreate: Story = {
  name: 'Wpis co miesiąc: podpowiedź o dacie początku i dniu miesiąca',
  args: { defaultOpen: true },
  play: async () => {
    const form = await dialogQueries();

    await userEvent.selectOptions(form.getByLabelText('Powtarzanie'), 'monthly');
    await expect(form.getByText(/data pierwszego wystąpienia/)).toBeVisible();
  },
};

export const OneError: Story = {
  name: 'Jeden błąd: komunikat przy polu, bez podsumowania',
  args: { defaultOpen: true },
  play: async () => {
    const form = await dialogQueries();
    await userEvent.type(form.getByLabelText('Kwota'), '12,50');

    await saveEntry();

    await expect(form.getByText('Wpisz opis wpisu, np. Czynsz.')).toBeVisible();
    await expect(form.queryByText('Popraw pola, żeby zapisać wpis')).toBeNull();
  },
};

export const SeveralErrors: Story = {
  name: 'Kilka błędów: podsumowanie z odnośnikami i fokus na pierwszym polu',
  args: { defaultOpen: true },
  play: async () => {
    const form = await dialogQueries();
    await userEvent.clear(form.getByLabelText('Data'));

    await saveEntry();

    await expect(form.getByText('Popraw pola, żeby zapisać wpis')).toBeVisible();
    await expect(form.getByLabelText('Opis')).toHaveFocus();
  },
};

export const Saving: Story = {
  name: 'Zapisywanie: przycisk zajęty, formularz blokuje podwójne wysłanie',
  args: { defaultOpen: true, scenario: 'pending' },
  play: async () => {
    await fillValidEntry();

    await saveEntry();

    const form = await dialogQueries();
    await expect(form.getByRole('button', { name: 'Zapisywanie…' })).toHaveAttribute('aria-busy', 'true');
  },
};

export const ServerFieldError: Story = {
  name: 'Błąd pola z serwera: pokazany przy polu, fokus na polu, dane zostają',
  args: { defaultOpen: true, scenario: 'field-error' },
  play: async () => {
    await fillValidEntry();

    await saveEntry();

    const form = await dialogQueries();
    await waitFor(() => expect(form.getByText(SERVER_FIELD_ERROR)).toBeVisible());
    await waitFor(() => expect(form.getByLabelText('Kwota')).toHaveFocus());
  },
};

export const ServerValidationWithoutField: Story = {
  name: 'Błąd walidacji bez wskazanego pola: komunikat ogólny',
  args: { defaultOpen: true, scenario: 'validation' },
  play: async () => {
    await fillValidEntry();

    await saveEntry();

    const form = await dialogQueries();
    await waitFor(() => expect(form.getByRole('alert')).toHaveTextContent(DEFAULT_ENTRY_FORM_MESSAGES.validation));
  },
};

export const Conflict: Story = {
  name: 'Konflikt (409): wpis zmienił się w międzyczasie',
  args: { defaultOpen: true, scenario: 'conflict', mode: 'edit-one-off' },
  play: async () => {
    await saveEntry();

    const form = await dialogQueries();
    await waitFor(() => expect(form.getByRole('alert')).toHaveTextContent(DEFAULT_ENTRY_FORM_MESSAGES.conflict));
  },
};

export const NetworkError: Story = {
  name: 'Brak sieci: komunikat ogólny, dane zostają w formularzu',
  args: { defaultOpen: true, scenario: 'throws' },
  play: async () => {
    await fillValidEntry();

    await saveEntry();

    const form = await dialogQueries();
    await waitFor(() => expect(form.getByRole('alert')).toHaveTextContent(DEFAULT_ENTRY_FORM_MESSAGES.network));
    await expect(form.getByLabelText('Opis')).toHaveValue('Zakupy spożywcze (przykład)');
  },
};

export const LimitError: Story = {
  name: 'Limit wpisów (422): komunikat ogólny',
  args: { defaultOpen: true, scenario: 'limit' },
  play: async () => {
    await fillValidEntry();

    await saveEntry();

    const form = await dialogQueries();
    await waitFor(() => expect(form.getByRole('alert')).toHaveTextContent(DEFAULT_ENTRY_FORM_MESSAGES.limit));
  },
};

export const EditOneOff: Story = {
  name: 'Edycja wpisu jednorazowego: opis, kwota i data; typ tylko do odczytu',
  args: { defaultOpen: true, mode: 'edit-one-off' },
};

export const EditRecurring: Story = {
  name: 'Edycja wpisu cyklicznego: tylko opis, kwota i dzień tylko do odczytu z podpowiedzią',
  args: { defaultOpen: true, mode: 'edit-series' },
};

export const NarrowScreen: Story = {
  name: 'Wąski ekran (320 px)',
  globals: NARROW_VIEWPORT,
  args: { defaultOpen: true },
};

export const LongDescriptionNarrowScreen: Story = {
  name: 'Długi opis bez spacji, wąski ekran (320 px)',
  globals: NARROW_VIEWPORT,
  args: { defaultOpen: true, scenario: 'validation' },
  play: async () => {
    await fillValidEntry(LONG_DESCRIPTION.slice(0, 200));

    await saveEntry();
  },
};

export const SavedWithToast: Story = {
  name: 'Po zapisie: formularz się zamyka, a Toast mówi "Wpis zapisany."',
  args: { withToast: true },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: OPENER_LABEL }));
    await fillValidEntry();

    await saveEntry();

    await waitFor(() => expect(screen.getByText(DEFAULT_ENTRY_FORM_MESSAGES.saved)).toBeInTheDocument());
  },
};

export const ValidationTiming: Story = {
  name: 'Test: błąd pojawia się po opuszczeniu dotkniętego pola i znika po poprawie',
  args: { defaultOpen: true },
  play: async () => {
    const form = await dialogQueries();
    const description = form.getByLabelText('Opis');

    await expect(form.queryByText('Wpisz opis wpisu, np. Czynsz.')).toBeNull();
    await userEvent.click(description);
    await userEvent.tab();
    await expect(form.getByText('Wpisz opis wpisu, np. Czynsz.')).toBeVisible();
    await expect(description).toHaveAttribute('aria-invalid', 'true');
    await userEvent.type(description, 'Czynsz');
    await expect(form.queryByText('Wpisz opis wpisu, np. Czynsz.')).toBeNull();
  },
};

export const SubmitFocusesTheFirstInvalidField: Story = {
  name: 'Test: wysłanie pustego formularza ustawia fokus na pierwszym błędnym polu i pokazuje podsumowanie',
  args: { defaultOpen: true },
  play: async ({ args }) => {
    await saveEntry();

    const form = await dialogQueries();
    await expect(form.getByLabelText('Opis')).toHaveFocus();
    await expect(form.getByRole('link', { name: 'Podaj kwotę, np. 12,50.' })).toBeVisible();
    await userEvent.click(form.getByRole('link', { name: 'Podaj kwotę, np. 12,50.' }));
    await expect(form.getByLabelText('Kwota')).toHaveFocus();
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

export const AmountIsParsedToMinorUnits: Story = {
  name: 'Test: "12,50" trafia do onSubmit jako 1250 groszy, opis jest przycięty, waluta nie jest polem',
  args: { defaultOpen: true },
  play: async ({ args }) => {
    const form = await fillValidEntry('  Zakupy spożywcze (przykład)  ');

    await saveEntry();

    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    await expect(args.onSubmit).toHaveBeenCalledWith({
      kind: 'create',
      draft: {
        type: 'expense',
        description: 'Zakupy spożywcze (przykład)',
        amountMinor: 1250,
        occurredOn: '2026-11-18',
        recurrence: 'none',
      },
      paid: false,
    });
    await expect(form.queryByLabelText(/waluta/i)).toBeNull();
    await expect(form.getByLabelText('Kwota')).toHaveAttribute('inputmode', 'decimal');
  },
};

export const PaidCheckboxOnlyForExpense: Story = {
  name: 'Test: pole "Zapłacone" tylko przy wydatku, a przy wpływie nigdy nie trafia do zapisu jako true',
  args: { defaultOpen: true },
  play: async ({ args }) => {
    const form = await fillValidEntry();
    await userEvent.click(form.getByRole('checkbox', { name: 'Zapłacone' }));
    await userEvent.click(form.getByRole('radio', { name: 'Wpływ' }));
    await expect(form.queryByRole('checkbox', { name: 'Zapłacone' })).toBeNull();

    await saveEntry();

    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledTimes(1));
    await expect(args.onSubmit).toHaveBeenCalledWith(expect.objectContaining({ paid: false }));
  },
};

export const DoubleSubmitIsBlocked: Story = {
  name: 'Test: podwójne kliknięcie "Zapisz" wysyła raz, a okna nie da się zamknąć w trakcie zapisu',
  args: { defaultOpen: true, scenario: 'pending' },
  play: async ({ args }) => {
    const form = await fillValidEntry();
    const submit = form.getByRole('button', { name: 'Zapisz' });

    await userEvent.dblClick(submit);
    await userEvent.keyboard('{Escape}');

    await expect(args.onSubmit).toHaveBeenCalledTimes(1);
    await expect(form.getByRole('button', { name: 'Zapisywanie…' })).toHaveAttribute('aria-busy', 'true');
    await expect(form.getByRole('button', { name: 'Anuluj' })).toBeDisabled();
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
  },
};

export const FocusReturnsToTheOpener: Story = {
  name: 'Test: po "Anuluj" i po Escape fokus wraca na przycisk, który otworzył formularz',
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: OPENER_LABEL });

    await userEvent.click(opener);
    await userEvent.click((await dialogQueries()).getByRole('button', { name: 'Anuluj' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();

    await userEvent.click(opener);
    await dialogQueries();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await expect(opener).toHaveFocus();
  },
};

export const SaveClosesTheFormAndTheToastDoesNotStealFocus: Story = {
  name: 'Test: po zapisie formularz się zamyka, Toast pojawia się z zatwierdzonym tekstem, a fokus zostaje na przycisku otwierającym',
  args: { withToast: true },
  play: async ({ canvasElement, args }) => {
    const opener = within(canvasElement).getByRole('button', { name: OPENER_LABEL });
    await userEvent.click(opener);
    await fillValidEntry();

    await saveEntry();

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(screen.getByText('Wpis zapisany.')).toBeInTheDocument());
    await expect(opener).toHaveFocus();
    await expect(args.onSaved).toHaveBeenCalledTimes(1);
  },
};

export const ErrorKeepsTheFormOpen: Story = {
  name: 'Test: błąd serwera zostawia formularz otwarty z wpisanymi danymi i bez wywołania onSaved',
  args: { defaultOpen: true, scenario: 'network' },
  play: async ({ args }) => {
    const form = await fillValidEntry();

    await saveEntry();

    await waitFor(() => expect(form.getByRole('alert')).toBeVisible());
    await expect(form.getByLabelText('Kwota')).toHaveValue('12,50');
    await expect(args.onSaved).not.toHaveBeenCalled();
    await expect(screen.getByRole('dialog')).toBeInTheDocument();
  },
};

export const RecurringEditIsReadOnlyExceptDescription: Story = {
  name: 'Test: edycja wpisu cyklicznego wysyła tylko opis, a kwota i dzień są tekstem',
  args: { defaultOpen: true, mode: 'edit-series' },
  play: async ({ args }) => {
    const form = await dialogQueries();

    await expect(form.queryByLabelText('Kwota')).toBeNull();
    await expect(form.queryByLabelText('Data')).toBeNull();
    await expect(form.getByText('Dzień miesiąca:')).toBeVisible();
    await expect(form.getByText(/Zmień kwotę od miesiąca/)).toBeVisible();
    await userEvent.clear(form.getByLabelText('Opis'));
    await userEvent.type(form.getByLabelText('Opis'), 'Czynsz za mieszkanie');
    await saveEntry();

    await waitFor(() => expect(args.onSubmit).toHaveBeenCalledWith({ kind: 'update-series-description', entryId: 'rent', description: 'Czynsz za mieszkanie' }));
  },
};

export const FitsNarrowScreen: Story = {
  ...NarrowScreen,
  name: 'Test: przy 320 px okno mieści się w ekranie, a długi opis się zawija',
  args: { defaultOpen: true, scenario: 'validation' },
  play: async () => {
    const form = await fillValidEntry(LONG_DESCRIPTION.slice(0, 200));
    await saveEntry();

    const body = form.dialog.querySelector('[data-slot="dialog-body"]') as HTMLElement;
    await waitFor(() => expect(form.getByRole('alert')).toBeVisible());
    await expect(form.dialog.getBoundingClientRect().width).toBeLessThanOrEqual(NARROW_WIDTH_PX);
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth);
  },
};
