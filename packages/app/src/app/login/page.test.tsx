import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME_PATH } from '../../routes';
import { LoginScreen } from './login-screen';
import LoginPage from './page';

const mocks = vi.hoisted(() => ({
  loadCurrentUser: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock('../../http/current-user', () => ({ loadCurrentUser: mocks.loadCurrentUser }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));

const randomText = (): string => randomBytes(8).toString('hex');

describe('LoginPage', () => {
  beforeEach(() => {
    mocks.loadCurrentUser.mockReset();
    mocks.redirect.mockClear();
  });

  it('renders the login screen without a signed-in user', async () => {
    mocks.loadCurrentUser.mockResolvedValue(null);

    const actual = await LoginPage();

    expect(actual.type).toBe(LoginScreen);
  });

  it('redirects a signed-in user to the home page', async () => {
    mocks.loadCurrentUser.mockResolvedValue({ id: randomText(), email: `${randomText()}@example.test`, displayName: randomText() });

    const actual = LoginPage();

    await expect(actual).rejects.toThrow(`redirect:${HOME_PATH}`);
  });
});
