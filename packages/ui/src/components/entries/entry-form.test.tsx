import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { EntryForm, type EntryFormProps, type EntrySubmission } from './entry-form';
import type { EntryActionResult } from './entry-failure';
import type { EntryRowData } from './entry-row';

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(cleanup);

const NO_BREAK_SPACE = ' ';

const ONE_OFF: EntryRowData = {
  id: 'e1',
  type: 'expense',
  description: 'Czynsz (przykład)',
  amountMinor: 185000,
  occurredOn: '2026-11-05',
  recurrence: 'none',
  paid: true,
};

const SERIES: EntryRowData = {
  id: 'e2',
  type: 'income',
  description: 'Wynagrodzenie (przykład)',
  amountMinor: 650000,
  occurredOn: '2026-01-31',
  recurrence: 'monthly',
  dayOfMonth: 28,
  paid: null,
};

type Submit = (submission: EntrySubmission) => Promise<EntryActionResult<'type' | 'description' | 'amount' | 'date' | 'recurrence'>>;

function renderForm(props: Partial<EntryFormProps> = {}) {
  const onSubmit = vi.fn<Submit>(async () => ({ ok: true }));
  const onOpenChange = vi.fn();
  const onSaved = vi.fn();
  render(
    <EntryForm
      open
      onOpenChange={onOpenChange}
      mode={{ kind: 'create' }}
      onSubmit={onSubmit}
      onSaved={onSaved}
      {...props}
    />,
  );

  return { onSubmit, onOpenChange, onSaved };
}

function fillValid() {
  fireEvent.change(screen.getByLabelText('Opis'), { target: { value: '  Zakupy  ' } });
  fireEvent.change(screen.getByLabelText('Kwota'), { target: { value: '12,50' } });
  fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-11-18' } });
}

function save() {
  fireEvent.click(screen.getByRole('button', { name: /^Zapis/ }));
}

describe('EntryForm', () => {
  it('renders nothing while closed', () => {
    renderForm({ open: false });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows the create form with labelled fields, the PLN suffix and the paid checkbox for an expense', () => {
    renderForm({ mode: { kind: 'create', defaultDate: '2026-11-18' } });

    const dialog = screen.getByRole('dialog', { name: 'Dodaj wpis' });

    expect(within(dialog).getByRole('radio', { name: 'Wydatek' }).getAttribute('aria-checked')).toBe('true');
    expect(within(dialog).getByLabelText('Opis')).toBeTruthy();
    expect(within(dialog).getByLabelText('Kwota').getAttribute('inputmode')).toBe('decimal');
    expect(dialog.querySelector('[data-slot="amount-suffix"]')?.textContent).toBe('PLN');
    expect((within(dialog).getByLabelText('Data') as HTMLInputElement).value).toBe('2026-11-18');
    expect((within(dialog).getByLabelText('Powtarzanie') as HTMLSelectElement).value).toBe('none');
    expect(within(dialog).getByRole('checkbox', { name: 'Zapłacone' })).toBeTruthy();
    expect(dialog.querySelector('form')?.hasAttribute('novalidate')).toBe(true);
  });

  it('hides the paid checkbox for an income and delivers paid false even after it was ticked for an expense', async () => {
    const { onSubmit } = renderForm();
    fillValid();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Zapłacone' }));

    fireEvent.click(screen.getByRole('radio', { name: 'Wpływ' }));
    const actual = screen.queryByRole('checkbox', { name: 'Zapłacone' });
    save();

    expect(actual).toBeNull();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ kind: 'create', draft: { type: 'income' }, paid: false });
  });

  it('shows the monthly hint for a recurring entry', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Powtarzanie'), { target: { value: 'monthly' } });

    expect(screen.getByText(/data pierwszego wystąpienia/)).toBeTruthy();
  });

  it('shows a field error only after the touched field is left', () => {
    renderForm();
    const description = screen.getByLabelText('Opis');

    fireEvent.blur(description);

    expect(screen.getByText('Wpisz opis wpisu, np. Czynsz.')).toBeTruthy();
    expect(description.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Kwota').hasAttribute('aria-invalid')).toBe(false);
  });

  it('focuses the first invalid field and shows the summary for several errors', () => {
    const { onSubmit } = renderForm();

    save();

    expect(document.activeElement).toBe(screen.getByLabelText('Opis'));
    expect(screen.getByText('Popraw pola, żeby zapisać wpis')).toBeTruthy();
    expect(screen.getByText('Podaj kwotę, np. 12,50.', { selector: 'a' })).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows no summary for a single error', () => {
    renderForm();
    fillValid();
    fireEvent.change(screen.getByLabelText('Opis'), { target: { value: '   ' } });

    save();

    expect(screen.queryByText('Popraw pola, żeby zapisać wpis')).toBeNull();
    expect(screen.getByText('Wpisz opis wpisu, np. Czynsz.')).toBeTruthy();
  });

  it('rejects a too long description', () => {
    renderForm();
    fillValid();
    fireEvent.change(screen.getByLabelText('Opis'), { target: { value: 'a'.repeat(201) } });

    save();

    expect(screen.getByText('Opis ma więcej niż 200 znaków. Skróć go.')).toBeTruthy();
  });

  it('rejects a date outside the calendar range', () => {
    renderForm();
    fillValid();
    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '1999-12-31' } });

    save();

    expect(screen.getByText('Data wpisu jest poza zakresem. Wybierz rok od 2000 do 2100.')).toBeTruthy();
  });

  it('delivers the parsed amount in minor units and closes after a successful save', async () => {
    const { onSubmit, onOpenChange, onSaved } = renderForm();
    fillValid();

    save();

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'create',
      draft: {
        type: 'expense',
        description: 'Zakupy',
        amountMinor: 1250,
        occurredOn: '2026-11-18',
        recurrence: 'none',
      },
      paid: false,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks a double submit and ignores closing while the request is pending', async () => {
    let finish: (result: EntryActionResult) => void = () => undefined;
    const onSubmit = vi.fn<Submit>(() => new Promise((resolve) => (finish = resolve)));
    const { onOpenChange } = renderForm({ onSubmit });
    fillValid();

    save();
    save();
    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Zapisywanie…' }).getAttribute('aria-busy')).toBe('true'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    await act(async () => finish({ ok: true }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes with the cancel button when nothing is saving', () => {
    const { onOpenChange, onSaved } = renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('maps a server field error to its field, focuses it and keeps the entered data', async () => {
    const onSubmit = vi.fn<Submit>(async () => ({ ok: false, kind: 'validation', fieldErrors: { amount: 'Kwota przekracza limit.' } }));
    const { onOpenChange } = renderForm({ onSubmit });
    fillValid();

    save();

    expect(await screen.findByText('Kwota przekracza limit.')).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Kwota')));
    expect((screen.getByLabelText('Opis') as HTMLInputElement).value).toBe('  Zakupy  ');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('shows a generic message for a validation failure without usable field errors', async () => {
    const onSubmit = vi.fn<Submit>(async () => ({ ok: false, kind: 'validation' }));
    renderForm({ onSubmit });
    fillValid();

    save();

    expect(await screen.findByText('Serwer odrzucił wpis. Sprawdź dane i spróbuj ponownie.')).toBeTruthy();
  });

  it.each([
    { kind: 'conflict' as const, expected: 'Wpis zmienił się w międzyczasie. Odśwież listę i spróbuj ponownie.' },
    {
      kind: 'network' as const,
      expected:
        'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie; wpisane dane zostały w formularzu.',
    },
    {
      kind: 'limit' as const,
      expected: 'Na tym koncie jest już zbyt wiele wpisów w miesiącu. Usuń nieaktualne wpisy i spróbuj ponownie.',
    },
  ])('shows the $kind message as an alert and keeps the form open', async ({ kind, expected }) => {
    const onSubmit = vi.fn<Submit>(async () => ({ ok: false, kind }));
    const { onOpenChange } = renderForm({ onSubmit });
    fillValid();

    save();

    const actual = await screen.findByRole('alert');
    expect(actual.textContent).toBe(expected);
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('treats a rejected submit as a network failure', async () => {
    const onSubmit = vi.fn<Submit>(() => Promise.reject(new Error('offline')));
    renderForm({ onSubmit });
    fillValid();

    save();

    expect((await screen.findByRole('alert')).textContent).toContain('Nie udało się połączyć z serwerem.');
  });

  it('edits a one-off entry: prefilled editable fields, read-only type and no paid checkbox', async () => {
    const { onSubmit } = renderForm({ mode: { kind: 'edit', entry: ONE_OFF } });

    const dialog = screen.getByRole('dialog', { name: 'Edytuj wpis' });
    const summary = dialog.querySelector('[data-slot="entry-form-summary"]') as HTMLElement;
    fireEvent.change(screen.getByLabelText('Kwota'), { target: { value: '1900' } });
    save();

    expect(summary.textContent).toBe('Typ:WydatekPowtarzanie:Jednorazowy');
    expect((screen.getByLabelText('Opis') as HTMLInputElement).value).toBe('Czynsz (przykład)');
    expect((screen.getByLabelText('Data') as HTMLInputElement).value).toBe('2026-11-05');
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByLabelText('Powtarzanie')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'update-one-off',
      entryId: 'e1',
      draft: {
        type: 'expense',
        description: 'Czynsz (przykład)',
        amountMinor: 190000,
        occurredOn: '2026-11-05',
        recurrence: 'none',
      },
    });
  });

  it('edits only the description of a recurring entry and shows the amount and the day read-only with a hint', async () => {
    const { onSubmit } = renderForm({ mode: { kind: 'edit', entry: SERIES } });

    const dialog = screen.getByRole('dialog', { name: 'Edytuj opis wpisu cyklicznego' });
    const summary = dialog.querySelector('[data-slot="entry-form-summary"]') as HTMLElement;
    fireEvent.change(screen.getByLabelText('Opis'), { target: { value: 'Pensja' } });
    save();

    expect(summary.textContent).toBe(
      `Typ:WpływPowtarzanie:Co miesiącDzień miesiąca:28Kwota:6${NO_BREAK_SPACE}500,00${NO_BREAK_SPACE}zł`,
    );
    expect(screen.getByText(/Zmień kwotę od miesiąca/)).toBeTruthy();
    expect(screen.queryByLabelText('Kwota')).toBeNull();
    expect(screen.queryByLabelText('Data')).toBeNull();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'update-series-description', entryId: 'e2', description: 'Pensja' });
  });

  it('turns a field error for a field that is not editable into the generic message', async () => {
    const onSubmit = vi.fn<Submit>(async () => ({ ok: false, kind: 'validation', fieldErrors: { amount: 'Nie wolno.' } }));
    renderForm({ mode: { kind: 'edit', entry: SERIES }, onSubmit });

    save();

    expect(await screen.findByText('Serwer odrzucił wpis. Sprawdź dane i spróbuj ponownie.')).toBeTruthy();
    expect(screen.queryByText('Nie wolno.')).toBeNull();
  });

  it('uses overridden messages', () => {
    renderForm({ messages: { createTitle: 'Nowy wpis', submitLabel: 'Dodaj' } });

    expect(screen.getByRole('dialog', { name: 'Nowy wpis' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dodaj' })).toBeTruthy();
  });

  it('does not call onSaved when it is not provided', async () => {
    const { onOpenChange } = renderForm({ onSaved: undefined });
    fillValid();

    save();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
