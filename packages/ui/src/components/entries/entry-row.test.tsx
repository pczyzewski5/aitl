import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EntryRow, type EntryRowData, type EntryRowProps } from './entry-row';

afterEach(cleanup);

const NO_BREAK_SPACE = '\u00A0';
const MINUS_SIGN = '\u2212';

const EXPENSE: EntryRowData = {
  id: 'e1',
  type: 'expense',
  description: 'Czynsz (przykład)',
  amountMinor: 185000,
  occurredOn: '2026-11-05',
  recurrence: 'none',
  paid: false,
};

const INCOME: EntryRowData = {
  id: 'e2',
  type: 'income',
  description: 'Wynagrodzenie (przykład)',
  amountMinor: 650000,
  occurredOn: '2026-11-10',
  recurrence: 'monthly',
  dayOfMonth: 10,
  paid: null,
};

function renderRow(props: Partial<EntryRowProps> & { entry?: EntryRowData } = {}) {
  const onPaidChange = props.onPaidChange ?? vi.fn();
  render(
    <table>
      <tbody>
        <EntryRow entry={EXPENSE} {...props} onPaidChange={onPaidChange} />
      </tbody>
    </table>,
  );

  return onPaidChange;
}

function amountCell(): HTMLElement {
  return document.querySelector('[data-slot="entry-amount"]') as HTMLElement;
}

describe('EntryRow', () => {
  it('uses the description as the row header', () => {
    renderRow();

    const actual = screen.getByRole('rowheader', { name: /Czynsz \(przykład\)/ });

    expect(actual.getAttribute('scope')).toBe('row');
  });

  it('writes an expense with the minus sign, the expense tone and a text for the type', () => {
    renderRow();

    const actual = amountCell();

    expect(actual.textContent).toBe(`Wydatek: ${MINUS_SIGN}1${NO_BREAK_SPACE}850,00${NO_BREAK_SPACE}zł`);
    expect(actual.className).toContain('text-expense');
    expect(within(actual).getByText('Wydatek:', { exact: false }).className).toContain('sr-only');
  });

  it('writes an income with the plus sign, the income tone and a text for the type', () => {
    renderRow({ entry: INCOME });

    const actual = amountCell();

    expect(actual.textContent).toBe(`Wpływ: +6${NO_BREAK_SPACE}500,00${NO_BREAK_SPACE}zł`);
    expect(actual.className).toContain('text-income');
    expect(within(actual).getByText('Wpływ:', { exact: false }).className).toContain('sr-only');
  });

  it('ignores the sign of the amount it receives and shows the sign of the type', () => {
    renderRow({ entry: { ...EXPENSE, amountMinor: -500 } });

    const actual = amountCell();

    expect(actual.textContent).toBe(`Wydatek: ${MINUS_SIGN}5,00${NO_BREAK_SPACE}zł`);
  });

  it('shows a one-off date as a time element', () => {
    renderRow();

    const actual = screen.getByText('05.11.2026');

    expect(actual.tagName).toBe('TIME');
    expect(actual.getAttribute('datetime')).toBe('2026-11-05');
  });

  it('shows the day of month as plain text for a recurring entry', () => {
    renderRow({ entry: INCOME });

    const actual = screen.getByText('Dzień miesiąca: 10');

    expect(actual.tagName).toBe('SPAN');
    expect(screen.queryByText('10.11.2026')).toBeNull();
  });

  it('marks only a recurring entry with the neutral text badge', () => {
    renderRow({ entry: INCOME });

    const actual = screen.getByText('Co miesiąc');

    expect(actual.getAttribute('data-variant')).toBe('neutral');
  });

  it('does not mark a one-off entry as recurring', () => {
    renderRow();

    const actual = screen.queryByText('Co miesiąc');

    expect(actual).toBeNull();
  });

  it('names the paid checkbox after the description and reflects the flag', () => {
    renderRow({ entry: { ...EXPENSE, paid: true } });

    const actual = screen.getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' });

    expect(actual.getAttribute('aria-checked')).toBe('true');
  });

  it('leaves an unpaid expense unchecked and treats a missing flag as unpaid', () => {
    renderRow({ entry: { ...EXPENSE, paid: null } });

    const actual = screen.getByRole('checkbox');

    expect(actual.getAttribute('aria-checked')).toBe('false');
  });

  it('reports the entry id and the new flag when the checkbox is toggled', () => {
    const onPaidChange = renderRow();

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onPaidChange).toHaveBeenCalledTimes(1);
    expect(onPaidChange).toHaveBeenCalledWith('e1', true);
  });

  it('reports false when a paid expense is unchecked', () => {
    const onPaidChange = renderRow({ entry: { ...EXPENSE, paid: true } });

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onPaidChange).toHaveBeenCalledWith('e1', false);
  });

  it('has no checkbox for an income and says in text that the column does not apply', () => {
    renderRow({ entry: INCOME });

    const actual = screen.queryByRole('checkbox');

    expect(actual).toBeNull();
    expect(screen.getByText('Nie dotyczy wpływów').className).toContain('sr-only');
  });

  it('keeps the checkbox focusable, busy and inert while the flag is being saved', () => {
    const onPaidChange = renderRow({ saving: true });

    const actual = screen.getByRole('checkbox');
    fireEvent.click(actual);

    expect(actual.getAttribute('aria-busy')).toBe('true');
    expect(actual.getAttribute('aria-disabled')).toBe('true');
    expect(actual.hasAttribute('disabled')).toBe(false);
    expect(onPaidChange).not.toHaveBeenCalled();
  });

  it('is not busy when nothing is being saved', () => {
    renderRow();

    const actual = screen.getByRole('checkbox');

    expect(actual.hasAttribute('aria-busy')).toBe(false);
    expect(actual.hasAttribute('aria-disabled')).toBe(false);
  });

  it('renders the actions slot only when the table has an actions column', () => {
    renderRow({ showActions: true, actions: <button type="button">Akcje wpisu</button> });

    const actual = screen.getByRole('button', { name: 'Akcje wpisu' });

    expect(actual.closest('td')?.getAttribute('data-slot')).toBe('entry-actions');
  });

  it('renders no actions cell without an actions column', () => {
    renderRow({ actions: <button type="button">Akcje wpisu</button> });

    const actual = screen.queryByRole('button', { name: 'Akcje wpisu' });

    expect(actual).toBeNull();
  });

  it('exposes the type and recurrence as data attributes and takes message overrides', () => {
    renderRow({
      entry: INCOME,
      messages: { recurringBadge: 'Monthly', recurringDay: (day) => `Day ${day}`, incomeLabel: 'Income' },
    });

    const actual = screen.getByRole('row');

    expect(actual.getAttribute('data-type')).toBe('income');
    expect(actual.getAttribute('data-recurrence')).toBe('monthly');
    expect(screen.getByText('Monthly')).toBeTruthy();
    expect(screen.getByText('Day 10')).toBeTruthy();
    expect(screen.getByText('Income:', { exact: false })).toBeTruthy();
  });
});
