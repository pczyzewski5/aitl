import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGIN_PATH } from '../routes';
import { AccountsScreen } from './accounts-screen';
import HomePage from './page';

const mocks = vi.hoisted(() => ({
  loadCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock('../http/current-user', () => ({ loadCurrentUser: mocks.loadCurrentUser }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

const randomText = (): string => randomBytes(8).toString('hex');

describe('HomePage', () => {
  beforeEach(() => {
    mocks.loadCurrentUser.mockReset();
    mocks.redirect.mockClear();
  });

  it('renders the accounts screen with the name of the signed-in user', async () => {
    const displayName = randomText();
    mocks.loadCurrentUser.mockResolvedValue({ id: randomText(), email: `${randomText()}@example.test`, displayName });

    const actual = await HomePage();

    expect(actual.type).toBe(AccountsScreen);
    expect(actual.props).toEqual({ displayName });
  });

  it('redirects to the login page without a signed-in user', async () => {
    mocks.loadCurrentUser.mockResolvedValue(null);

    const actual = HomePage();

    await expect(actual).rejects.toThrow(`redirect:${LOGIN_PATH}`);
  });
});
