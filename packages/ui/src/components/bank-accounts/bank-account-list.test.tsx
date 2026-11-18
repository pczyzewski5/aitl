import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BankAccountList } from './bank-account-list';
import type { BankAccountListItem, BankAccountListProps } from './bank-account-list';

afterEach(cleanup);

const SHARED: BankAccountListItem = { id: 'a1', name: 'Konto wspólne', type: 'shared', href: '/konta/a1' };
const PERSONAL: BankAccountListItem = { id: 'a2', name: 'Konto osobiste Pawła', type: 'personal', href: '/konta/a2' };

function renderList(props: Partial<BankAccountListProps> = {}) {
  const onRetry = props.onRetry ?? vi.fn();
  render(<BankAccountList status="loaded" accounts={[SHARED, PERSONAL]} {...props} onRetry={onRetry} />);

  return onRetry;
}

describe('BankAccountList', () => {
  it('renders accounts in the received order as a list with links and type badges', () => {
    renderList({ accounts: [PERSONAL, SHARED] });

    const items = within(screen.getByRole('list')).getAllByRole('listitem');

    expect(items).toHaveLength(2);
    expect(within(items[0] as HTMLElement).getByRole('link', { name: 'Konto osobiste Pawła' }).getAttribute('href')).toBe('/konta/a2');
    expect(within(items[0] as HTMLElement).getByText('Osobiste')).toBeTruthy();
    expect(within(items[1] as HTMLElement).getByRole('link', { name: 'Konto wspólne' }).getAttribute('href')).toBe('/konta/a1');
    expect(within(items[1] as HTMLElement).getByText('Wspólne')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Twoje konta bankowe' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Twoje konta bankowe' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('shows only the shared account for a shared-only member, without a hint of another one', () => {
    renderList({ accounts: [SHARED] });

    const actual = screen.getAllByRole('listitem');

    expect(actual).toHaveLength(1);
    expect(screen.queryByText('Osobiste')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders a busy container with skeletons and no list while loading', () => {
    renderList({ status: 'loading', accounts: undefined, className: 'extra' });

    const region = screen.getByRole('region', { name: 'Twoje konta bankowe' });

    expect(region.getAttribute('aria-busy')).toBe('true');
    expect(region.className).toContain('extra');
    expect(region.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders the empty state without an action by default', () => {
    renderList({ accounts: [] });

    expect(screen.getByRole('heading', { level: 3, name: 'Nie masz jeszcze żadnego konta bankowego' })).toBeTruthy();
    expect(screen.getByText('Gdy konto zostanie Ci przypisane, zobaczysz je tutaj.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('treats a missing accounts prop as empty and runs the optional empty action', () => {
    const onClick = vi.fn();
    renderList({ accounts: undefined, emptyAction: { label: 'Sprawdź ponownie', onClick } });

    fireEvent.click(screen.getByRole('button', { name: 'Sprawdź ponownie' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the error state with an announced retry that calls onRetry', () => {
    const onRetry = renderList({ status: 'error', accounts: undefined });

    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(screen.getByRole('alert').textContent).toContain('Nie udało się wczytać kont bankowych');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('marks the retry button busy while retrying', () => {
    renderList({ status: 'error', retrying: true });

    const actual = screen.getByRole('button', { name: 'Spróbuj ponownie' });

    expect(actual.getAttribute('aria-busy')).toBe('true');
  });

  it('uses heading level 1 with state headings one level lower', () => {
    renderList({ headingLevel: 'h1', status: 'error' });

    expect(screen.getByRole('heading', { level: 1, name: 'Twoje konta bankowe' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Nie udało się wczytać kont bankowych' })).toBeTruthy();
  });

  it('uses overridden messages', () => {
    renderList({ messages: { title: 'Accounts', sharedLabel: 'Shared' }, accounts: [SHARED] });

    expect(screen.getByRole('heading', { name: 'Accounts' })).toBeTruthy();
    expect(screen.getByText('Shared')).toBeTruthy();
  });
});
