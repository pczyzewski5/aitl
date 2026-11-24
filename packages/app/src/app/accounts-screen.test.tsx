import { randomBytes } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BANK_ACCOUNTS_API_PATH, LOGIN_PATH, LOGOUT_API_PATH } from '../routes';
import { LOGOUT_FAILED_MESSAGE } from '../messages';
import { AccountsScreen } from './accounts-screen';

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  apiCall: vi.fn(),
  requestHeadingFocus: vi.fn(),
}));

vi.mock('next/navigation', () => {
  const router = { replace: mocks.replace };

  return { useRouter: () => router };
});
vi.mock('@aitl/ui', async (importOriginal) => ({ ...(await importOriginal<object>()), apiCall: mocks.apiCall }));
vi.mock('../focus/heading-focus', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  requestHeadingFocus: mocks.requestHeadingFocus,
}));

const randomText = (): string => randomBytes(8).toString('hex');
const okAccounts = (bankAccounts: unknown[]) => ({ ok: true, status: 200, data: { bankAccounts } });
const apiError = (status: number) => ({ ok: false, kind: 'api-error', status, error: { code: 'x', message: 'x' } });

describe('AccountsScreen', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.apiCall.mockReset();
    mocks.requestHeadingFocus.mockReset();
  });

  afterEach(cleanup);

  it('shows the name of the user in the bar and the loading state first', () => {
    const displayName = randomText();
    mocks.apiCall.mockReturnValue(new Promise(() => undefined));

    render(<AccountsScreen displayName={displayName} />);

    expect(screen.getByText(displayName)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Twoje konta bankowe' })).toBeTruthy();
    expect(document.querySelector('[data-slot="bank-account-list-skeleton"]')).not.toBeNull();
  });

  it('lists the accounts in the given order as links to the account', async () => {
    const shared = { id: randomText(), type: 'shared', name: randomText() };
    const personal = { id: randomText(), type: 'personal', name: randomText() };
    mocks.apiCall.mockResolvedValue(okAccounts([shared, personal]));

    render(<AccountsScreen displayName={randomText()} />);

    const links = await screen.findAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([`/?account=${shared.id}`, `/?account=${personal.id}`]);
    expect(links.map((link) => link.textContent)).toEqual([shared.name, personal.name]);
    expect(mocks.apiCall).toHaveBeenCalledWith(BANK_ACCOUNTS_API_PATH);
  });

  it('shows the empty state pointing to the administrator', async () => {
    mocks.apiCall.mockResolvedValue(okAccounts([]));

    render(<AccountsScreen displayName={randomText()} />);

    expect(await screen.findByText('Skontaktuj się z administratorem aplikacji.')).toBeTruthy();
  });

  it('shows the shared load error and loads again on retry', async () => {
    const account = { id: randomText(), type: 'shared', name: randomText() };
    mocks.apiCall.mockResolvedValueOnce(apiError(500)).mockResolvedValueOnce(okAccounts([account]));
    render(<AccountsScreen displayName={randomText()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Spróbuj ponownie' }));

    expect(await screen.findByText(account.name)).toBeTruthy();
    expect(mocks.apiCall).toHaveBeenCalledTimes(2);
  });

  it('shows the load error when the network fails', async () => {
    mocks.apiCall.mockResolvedValue({ ok: false, kind: 'network' });

    render(<AccountsScreen displayName={randomText()} />);

    expect(await screen.findByText('Nie udało się wczytać kont bankowych')).toBeTruthy();
  });

  it('goes to the login page when the session expired', async () => {
    mocks.apiCall.mockResolvedValue(apiError(401));

    render(<AccountsScreen displayName={randomText()} />);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(LOGIN_PATH));
  });

  it('logs out through the API, requests focus on the next heading and goes to the login page', async () => {
    mocks.apiCall.mockImplementation(async (path: string) =>
      path === LOGOUT_API_PATH ? { ok: true, status: 200, data: null } : okAccounts([]),
    );
    render(<AccountsScreen displayName={randomText()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj' }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(LOGIN_PATH));
    expect(mocks.apiCall).toHaveBeenCalledWith(LOGOUT_API_PATH, { method: 'POST' });
    expect(mocks.requestHeadingFocus).toHaveBeenCalledTimes(1);
  });

  it('stays on the page and says so when logging out fails, then clears the message on the next try', async () => {
    mocks.apiCall.mockImplementation(async (path: string) =>
      path === LOGOUT_API_PATH ? { ok: false, kind: 'network' } : okAccounts([]),
    );
    render(<AccountsScreen displayName={randomText()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj' }));

    expect((await screen.findByRole('alert')).textContent).toContain(LOGOUT_FAILED_MESSAGE);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.requestHeadingFocus).not.toHaveBeenCalled();

    mocks.apiCall.mockImplementation(async (path: string) =>
      path === LOGOUT_API_PATH ? { ok: true, status: 200, data: null } : okAccounts([]),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj' }));

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(LOGIN_PATH));
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
