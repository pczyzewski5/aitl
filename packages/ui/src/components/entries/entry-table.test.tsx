import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { EntryRowData } from './entry-row';
import { EntryTable, type EntryTableProps } from './entry-table';

afterEach(cleanup);

const ENTRIES: readonly EntryRowData[] = [
  {
    id: 'e1',
    type: 'income',
    description: 'Wynagrodzenie (przykład)',
    amountMinor: 650000,
    occurredOn: '2026-11-10',
    recurrence: 'monthly',
    dayOfMonth: 10,
    paid: null,
  },
  {
    id: 'e2',
    type: 'expense',
    description: 'Czynsz (przykład)',
    amountMinor: 185000,
    occurredOn: '2026-11-05',
    recurrence: 'none',
    paid: true,
  },
];

function renderTable(props: Partial<EntryTableProps> = {}) {
  const onPaidChange = props.onPaidChange ?? vi.fn();
  const onRetry = props.onRetry ?? vi.fn();
  render(
    <EntryTable
      status="loaded"
      caption="Wpisy konta wspólnego, listopad 2026"
      entries={ENTRIES}
      {...props}
      onPaidChange={onPaidChange}
      onRetry={onRetry}
    />,
  );

  return { onPaidChange, onRetry };
}

describe('EntryTable', () => {
  it('renders a semantic table named by its caption with column headers', () => {
    renderTable();

    const table = screen.getByRole('table', { name: 'Wpisy konta wspólnego, listopad 2026' });
    const headers = within(table).getAllByRole('columnheader');

    expect(headers.map((header) => header.textContent)).toEqual(['Opis', 'Kwota', 'Data', 'Zapłacone']);
    expect(headers.every((header) => header.getAttribute('scope') === 'col')).toBe(true);
  });

  it('renders one row per entry in the received order plus the header row', () => {
    renderTable();

    const actual = screen.getAllByRole('row');

    expect(actual).toHaveLength(3);
    expect(within(actual[1] as HTMLElement).getByRole('rowheader').textContent).toContain('Wynagrodzenie');
    expect(within(actual[2] as HTMLElement).getByRole('rowheader').textContent).toContain('Czynsz');
  });

  it('hides the caption visually by default and can show it', () => {
    renderTable();
    const hidden = screen.getByText('Wpisy konta wspólnego, listopad 2026');
    cleanup();
    renderTable({ captionVisible: true });
    const visible = screen.getByText('Wpisy konta wspólnego, listopad 2026');

    expect(hidden.className).toContain('sr-only');
    expect(visible.className).not.toContain('sr-only');
  });

  it('wraps the table in a focusable region named by the caption and described by the scroll hint', () => {
    renderTable();

    const actual = screen.getByRole('region', { name: 'Wpisy konta wspólnego, listopad 2026' });
    const hint = screen.getByText('Przewiń tabelę w poziomie, żeby zobaczyć wszystkie kolumny.');

    expect(actual.getAttribute('tabindex')).toBe('0');
    expect(actual.className).toContain('overflow-x-auto');
    expect(actual.className).toContain('relative');
    expect(actual.getAttribute('aria-describedby')).toBe(hint.id);
    expect(hint.className).toContain('@xl:hidden');
  });

  it('adds an actions column with a hidden header and the slot content for every row', () => {
    renderTable({ actions: (entry) => <button type="button">Akcje: {entry.description}</button> });

    const headers = screen.getAllByRole('columnheader');

    expect(headers).toHaveLength(5);
    expect(headers[4]?.textContent).toBe('Akcje');
    expect(headers[4]?.querySelector('.sr-only')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Akcje:/ })).toHaveLength(2);
  });

  it('has no actions column without the slot', () => {
    renderTable();

    const actual = screen.getAllByRole('columnheader');

    expect(actual).toHaveLength(4);
  });

  it('forwards the paid toggle with the entry id', () => {
    const { onPaidChange } = renderTable();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' }));

    expect(onPaidChange).toHaveBeenCalledWith('e2', false);
  });

  it('marks only the saving entries as busy', () => {
    renderTable({
      entries: [{ ...ENTRIES[1], id: 'e3', description: 'Internet (przykład)' } as EntryRowData, ENTRIES[1] as EntryRowData],
      savingEntryIds: ['e3'],
    });

    const [busy, idle] = screen.getAllByRole('checkbox');

    expect(busy?.getAttribute('aria-busy')).toBe('true');
    expect(idle?.hasAttribute('aria-busy')).toBe(false);
  });

  it('passes message overrides to the rows', () => {
    renderTable({ messages: { paidLabel: (description) => `Paid: ${description}`, paidHeader: 'Paid' } });

    expect(screen.getByRole('checkbox', { name: 'Paid: Czynsz (przykład)' })).toBeTruthy();
    expect(screen.getByRole('columnheader', { name: 'Paid' })).toBeTruthy();
  });

  it('shows skeleton rows in a busy container and no table while loading', () => {
    renderTable({ status: 'loading', entries: undefined });

    const root = document.querySelector('[data-slot="entry-table"]') as HTMLElement;

    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(5);
    expect(screen.getByText('Wczytywanie wpisów')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('is not busy once loaded', () => {
    renderTable();

    const actual = document.querySelector('[data-slot="entry-table"]') as HTMLElement;

    expect(actual.hasAttribute('aria-busy')).toBe(false);
  });

  it('shows the empty state with the default copy and no table for an empty month', () => {
    renderTable({ entries: [] });

    expect(screen.getByRole('heading', { level: 3, name: 'W tym miesiącu nie ma jeszcze żadnych wpisów' })).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows the empty action, a custom copy and a custom heading level', () => {
    const onClick = vi.fn();
    renderTable({
      entries: undefined,
      emptyAction: { label: 'Dodaj wpis', onClick },
      messages: { emptyTitle: 'Pusto' },
      headingLevel: 'h2',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Dodaj wpis' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Pusto' })).toBeTruthy();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows an announced error with a retry and no table', () => {
    const { onRetry } = renderTable({ status: 'error', entries: undefined });

    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(screen.getByRole('alert').textContent).toContain('Nie udało się wczytać wpisów');
    expect(screen.queryByRole('table')).toBeNull();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('marks the retry button as busy while retrying', () => {
    renderTable({ status: 'error', retrying: true });

    const actual = screen.getByRole('button', { name: /Spróbuj ponownie/ });

    expect(actual.getAttribute('aria-busy')).toBe('true');
  });

  it('explains the result limit in an alert with the default limit and shows nothing silently truncated', () => {
    renderTable({ status: 'limit-exceeded', entries: [] });

    const actual = screen.getByRole('alert');

    expect(actual.textContent).toContain('Za dużo wpisów, żeby je pokazać');
    expect(actual.textContent).toContain('więcej niż 500 wpisów');
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('heading')).toBeNull();
  });

  it('takes a custom limit and still shows rows it was given above which the alert stays', () => {
    renderTable({ status: 'limit-exceeded', limit: 10 });

    expect(screen.getByRole('alert').textContent).toContain('więcej niż 10 wpisów');
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('merges a class name into the root', () => {
    renderTable({ className: 'extra' });

    const actual = document.querySelector('[data-slot="entry-table"]') as HTMLElement;

    expect(actual.className).toContain('extra');
  });
});
