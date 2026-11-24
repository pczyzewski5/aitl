import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { EntryActionResult } from './entry-failure';
import type { OneOffEntry, RecurringEntry } from './entry-row';
import { SeriesActions, type SeriesActionsProps, type SeriesControls } from './series-actions';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

const ONE_OFF: OneOffEntry = {
  id: 'e1',
  type: 'expense',
  description: 'Zakupy (przykład)',
  amountMinor: 31250,
  occurredOn: '2026-11-07',
  recurrence: 'none',
  paid: true,
};

const SERIES_ENTRY: RecurringEntry = {
  id: 'e2',
  type: 'expense',
  description: 'Czynsz (przykład)',
  amountMinor: 185000,
  occurredOn: '2026-01-05',
  recurrence: 'monthly',
  dayOfMonth: 5,
  paid: false,
};

type Result = EntryActionResult;
type SeriesResult = EntryActionResult<'month' | 'amount'>;

function buildSeries(overrides: Partial<SeriesControls> = {}): SeriesControls {
  return {
    deletable: true,
    endMonthOptions: ['2026-12', '2027-01'],
    amountMonthOptions: ['2026-11', '2026-12'],
    onEnd: vi.fn(async (): Promise<SeriesResult> => ({ ok: true })),
    onChangeAmount: vi.fn(async (): Promise<SeriesResult> => ({ ok: true })),
    ...overrides,
  };
}

function renderOneOff(overrides: Partial<Extract<SeriesActionsProps, { entry: OneOffEntry }>> = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn(async (): Promise<Result> => ({ ok: true }));
  render(<SeriesActions entry={ONE_OFF} onEdit={onEdit} onDelete={onDelete} {...overrides} />);

  return { onEdit, onDelete };
}

function renderSeries(series: SeriesControls = buildSeries(), overrides: Partial<Extract<SeriesActionsProps, { entry: RecurringEntry }>> = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn(async (): Promise<Result> => ({ ok: true }));
  render(<SeriesActions entry={SERIES_ENTRY} series={series} onEdit={onEdit} onDelete={onDelete} {...overrides} />);

  return { onEdit, onDelete, series };
}

function openMenu(): HTMLElement {
  const trigger = screen.getByRole('button', { name: /^Akcje wpisu/ });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'Enter' });

  return trigger;
}

async function chooseItem(name: string | RegExp) {
  openMenu();
  fireEvent.click(await screen.findByRole('menuitem', { name }));
}

describe('SeriesActions for a one-off entry', () => {
  it('names the menu trigger after the entry and offers only edit and delete', async () => {
    renderOneOff();

    openMenu();

    expect(screen.getByRole('button', { name: 'Akcje wpisu Zakupy (przykład)' })).toBeTruthy();
    const actual = (await screen.findAllByRole('menuitem')).map((item) => item.textContent);
    expect(actual).toEqual(['Edytuj', 'Usuń']);
  });

  it('calls onEdit with the entry', async () => {
    const { onEdit } = renderOneOff();

    await chooseItem('Edytuj');

    await waitFor(() => expect(onEdit).toHaveBeenCalledWith(ONE_OFF));
  });

  it('asks for confirmation with the focus on cancel and what cannot be undone', async () => {
    const { onDelete } = renderOneOff();

    await chooseItem('Usuń');

    const dialog = await screen.findByRole('dialog', { name: 'Usunąć wpis „Zakupy (przykład)”?' });
    expect(within(dialog).getByText(/Tej operacji nie można cofnąć/)).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(within(dialog).getByRole('button', { name: 'Anuluj' })));
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('deletes after the confirmation and closes the dialog', async () => {
    const { onDelete } = renderOneOff();
    await chooseItem('Usuń');

    fireEvent.click(await screen.findByRole('button', { name: 'Usuń wpis' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('e1'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('returns the focus to the menu trigger after cancelling the confirmation', async () => {
    renderOneOff();
    await chooseItem('Usuń');

    fireEvent.click(await screen.findByRole('button', { name: 'Anuluj' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Akcje wpisu/ }));
  });

  it.each([
    { kind: 'conflict' as const, expected: 'Wpis zmienił się w międzyczasie. Odśwież listę i spróbuj ponownie.' },
    {
      kind: 'network' as const,
      expected: 'Nie udało się połączyć z serwerem. Nic nie zostało zmienione. Sprawdź połączenie z internetem i spróbuj ponownie.',
    },
  ])('keeps the confirmation open and shows the $kind error inside it', async ({ kind, expected }) => {
    const onDelete = vi.fn(async (): Promise<Result> => ({ ok: false, kind }));
    renderOneOff({ onDelete });
    await chooseItem('Usuń');

    fireEvent.click(await screen.findByRole('button', { name: 'Usuń wpis' }));

    const dialog = await screen.findByRole('dialog');
    expect((await within(dialog).findByRole('alert')).textContent).toBe(expected);
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Usuń wpis' }).getAttribute('aria-busy')).toBeNull());
  });

  it('treats a rejected delete as a network failure and clears the error after cancelling', async () => {
    const onDelete = vi.fn(() => Promise.reject(new Error('offline')));
    renderOneOff({ onDelete });
    await chooseItem('Usuń');
    fireEvent.click(await screen.findByRole('button', { name: 'Usuń wpis' }));
    await screen.findByRole('alert');

    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await chooseItem('Usuń');

    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('blocks a double confirm and ignores Escape while the request is pending', async () => {
    let finish: (result: Result) => void = () => undefined;
    const onDelete = vi.fn(() => new Promise<Result>((resolve) => (finish = resolve)));
    renderOneOff({ onDelete });
    await chooseItem('Usuń');
    const confirm = await screen.findByRole('button', { name: 'Usuń wpis' });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog')).toBeTruthy();
    await act(async () => finish({ ok: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('SeriesActions for a recurring entry', () => {
  it('offers the edit of the description and the three series actions, destructive one last', async () => {
    renderSeries();

    openMenu();

    const actual = (await screen.findAllByRole('menuitem')).map((item) => item.textContent);
    expect(actual).toEqual(['Edytuj opis', 'Zakończ od miesiąca…', 'Zmień kwotę od miesiąca…', 'Usuń całkowicie…']);
  });

  it('calls onEdit with the recurring entry', async () => {
    const { onEdit } = renderSeries();

    await chooseItem('Edytuj opis');

    await waitFor(() => expect(onEdit).toHaveBeenCalledWith(SERIES_ENTRY));
  });

  it('disables the full delete with a visible reason when the series has past months and ignores the selection', async () => {
    renderSeries(buildSeries({ deletable: false }));

    openMenu();
    const item = await screen.findByRole('menuitem', { name: /Usuń całkowicie/ });
    fireEvent.click(item);

    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(within(item).getByText('Seria ma miesiące w przeszłości. Użyj „Zakończ od miesiąca”.')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('confirms the full delete with series wording and deletes the entry id', async () => {
    const { onDelete } = renderSeries();
    await chooseItem('Usuń całkowicie…');

    const dialog = await screen.findByRole('dialog', { name: 'Usunąć całkowicie wpis cykliczny „Czynsz (przykład)”?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Usuń całkowicie' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('e2'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('disables the month actions with a reason when there are no months to choose from', async () => {
    renderSeries(buildSeries({ endMonthOptions: [], amountMonthOptions: [] }));

    openMenu();

    const end = await screen.findByRole('menuitem', { name: /Zakończ od miesiąca/ });
    const change = screen.getByRole('menuitem', { name: /Zmień kwotę od miesiąca/ });
    expect(end.getAttribute('aria-disabled')).toBe('true');
    expect(change.getAttribute('aria-disabled')).toBe('true');
    expect(within(end).getByText('Nie ma miesiąca, od którego można to zrobić.')).toBeTruthy();
  });

  it('ends the series from the chosen month, listing months by their Polish names', async () => {
    const series = buildSeries();
    renderSeries(series);
    await chooseItem('Zakończ od miesiąca…');

    const dialog = await screen.findByRole('dialog', { name: 'Zakończyć wpis cykliczny „Czynsz (przykład)” od wybranego miesiąca?' });
    const select = within(dialog).getByLabelText('Pierwszy miesiąc bez tego wpisu') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '2027-01' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zakończ od miesiąca' }));

    expect(Array.from(select.options).map((option) => option.textContent)).toEqual([
      'Wybierz miesiąc',
      'grudzień 2026',
      'styczeń 2027',
    ]);
    await waitFor(() => expect(series.onEnd).toHaveBeenCalledWith('e2', '2027-01'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('requires a month and focuses the select on submit', async () => {
    const series = buildSeries();
    renderSeries(series);
    await chooseItem('Zakończ od miesiąca…');

    fireEvent.click(await screen.findByRole('button', { name: 'Zakończ od miesiąca' }));

    expect(screen.getByText('Wybierz miesiąc, od którego wpis ma się skończyć.')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Pierwszy miesiąc bez tego wpisu'));
    expect(series.onEnd).not.toHaveBeenCalled();
  });

  it('shows a server field error of the month and keeps the dialog open', async () => {
    const onEnd = vi.fn(async (): Promise<SeriesResult> => ({ ok: false, kind: 'validation', fieldErrors: { month: 'Ten miesiąc jest już po końcu serii.' } }));
    renderSeries(buildSeries({ onEnd }));
    await chooseItem('Zakończ od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc bez tego wpisu'), { target: { value: '2026-12' } });

    fireEvent.click(screen.getByRole('button', { name: 'Zakończ od miesiąca' }));

    expect(await screen.findByText('Ten miesiąc jest już po końcu serii.')).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('shows the conflict message as an alert in the end dialog', async () => {
    const onEnd = vi.fn(async (): Promise<SeriesResult> => ({ ok: false, kind: 'conflict' }));
    renderSeries(buildSeries({ onEnd }));
    await chooseItem('Zakończ od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc bez tego wpisu'), { target: { value: '2026-12' } });

    fireEvent.click(screen.getByRole('button', { name: 'Zakończ od miesiąca' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Wpis zmienił się w międzyczasie. Odśwież listę i spróbuj ponownie.');
  });

  it('treats a rejected end as a network failure', async () => {
    const onEnd = vi.fn(() => Promise.reject(new Error('offline')));
    renderSeries(buildSeries({ onEnd }));
    await chooseItem('Zakończ od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc bez tego wpisu'), { target: { value: '2026-12' } });

    fireEvent.click(screen.getByRole('button', { name: 'Zakończ od miesiąca' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Nie udało się połączyć z serwerem.');
  });

  it('closes the end dialog with cancel', async () => {
    renderSeries();
    await chooseItem('Zakończ od miesiąca…');

    fireEvent.click(await screen.findByRole('button', { name: 'Anuluj' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('changes the amount from the chosen month and delivers it in minor units', async () => {
    const series = buildSeries();
    renderSeries(series);
    await chooseItem('Zmień kwotę od miesiąca…');

    const dialog = await screen.findByRole('dialog', { name: 'Zmienić kwotę wpisu „Czynsz (przykład)” od wybranego miesiąca?' });
    const hint = within(dialog).getByText(/^Obecna kwota: 1\s850,00\szł\. Wpisz kwotę/);
    const suffix = dialog.querySelector('[data-slot="amount-suffix"]');
    fireEvent.change(within(dialog).getByLabelText('Pierwszy miesiąc z nową kwotą'), { target: { value: '2026-12' } });
    fireEvent.change(within(dialog).getByLabelText('Nowa kwota'), { target: { value: '1900,50' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Zmień kwotę' }));

    expect(hint).toBeTruthy();
    expect(suffix?.textContent).toBe('PLN');
    await waitFor(() => expect(series.onChangeAmount).toHaveBeenCalledWith('e2', '2026-12', 190050));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('validates the month and the amount and shows the summary for several errors', async () => {
    const series = buildSeries();
    renderSeries(series);
    await chooseItem('Zmień kwotę od miesiąca…');

    fireEvent.click(await screen.findByRole('button', { name: 'Zmień kwotę' }));

    expect(screen.getByText('Popraw pola, żeby zapisać zmianę')).toBeTruthy();
    expect(screen.getByText('Wybierz miesiąc, od którego obowiązuje nowa kwota.', { selector: 'a' })).toBeTruthy();
    expect(screen.getByText('Podaj kwotę, np. 12,50.', { selector: 'a' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Pierwszy miesiąc z nową kwotą'));
    expect(series.onChangeAmount).not.toHaveBeenCalled();
  });

  it('maps a server field error of the amount to the amount field', async () => {
    const onChangeAmount = vi.fn(async (): Promise<SeriesResult> => ({ ok: false, kind: 'validation', fieldErrors: { amount: 'Kwota przekracza limit.' } }));
    renderSeries(buildSeries({ onChangeAmount }));
    await chooseItem('Zmień kwotę od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc z nową kwotą'), { target: { value: '2026-12' } });
    fireEvent.change(screen.getByLabelText('Nowa kwota'), { target: { value: '12,50' } });

    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    expect(await screen.findByText('Kwota przekracza limit.')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Nowa kwota')));
  });

  it('shows a generic message when the server rejects the change without field errors', async () => {
    const onChangeAmount = vi.fn(async (): Promise<SeriesResult> => ({ ok: false, kind: 'validation' }));
    renderSeries(buildSeries({ onChangeAmount }));
    await chooseItem('Zmień kwotę od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc z nową kwotą'), { target: { value: '2026-12' } });
    fireEvent.change(screen.getByLabelText('Nowa kwota'), { target: { value: '12,50' } });

    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Serwer odrzucił zmianę. Sprawdź dane i spróbuj ponownie.');
  });

  it('blocks a double submit and disables cancel while the change is pending', async () => {
    let finish: (result: SeriesResult) => void = () => undefined;
    const onChangeAmount = vi.fn(() => new Promise<SeriesResult>((resolve) => (finish = resolve)));
    renderSeries(buildSeries({ onChangeAmount }));
    await chooseItem('Zmień kwotę od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc z nową kwotą'), { target: { value: '2026-12' } });
    fireEvent.change(screen.getByLabelText('Nowa kwota'), { target: { value: '12,50' } });
    const submit = screen.getByRole('button', { name: 'Zmień kwotę' });

    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(submit.getAttribute('aria-busy')).toBe('true'));
    expect(onChangeAmount).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: 'Anuluj' }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => finish({ ok: true }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('reports each completed action once', async () => {
    const onCompleted = vi.fn();
    const { onDelete } = renderSeries(buildSeries(), { onCompleted });
    await chooseItem('Zakończ od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc bez tego wpisu'), { target: { value: '2026-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zakończ od miesiąca' }));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith('end'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await chooseItem('Zmień kwotę od miesiąca…');
    fireEvent.change(await screen.findByLabelText('Pierwszy miesiąc z nową kwotą'), { target: { value: '2026-12' } });
    fireEvent.change(screen.getByLabelText('Nowa kwota'), { target: { value: '12,50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Zmień kwotę' }));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith('change-amount'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await chooseItem('Usuń całkowicie…');
    fireEvent.click(await screen.findByRole('button', { name: 'Usuń całkowicie' }));
    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith('delete'));

    expect(onCompleted).toHaveBeenCalledTimes(3);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('uses overridden messages', async () => {
    renderSeries(buildSeries(), { messages: { endItem: 'Zakończ…', triggerLabel: (description) => `Menu ${description}` } });

    const trigger = screen.getByRole('button', { name: 'Menu Czynsz (przykład)' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(trigger).toBeTruthy();
    expect(await screen.findByRole('menuitem', { name: 'Zakończ…' })).toBeTruthy();
  });
});
