import { randomBytes } from 'node:crypto';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOME_PATH, LOGIN_API_PATH } from '../../routes';
import { LoginScreen } from './login-screen';

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
vi.mock('../../focus/heading-focus', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  requestHeadingFocus: mocks.requestHeadingFocus,
}));

const randomText = (): string => randomBytes(8).toString('hex');

function submitCredentials(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Adres e-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Zaloguj się' }));
}

describe('LoginScreen', () => {
  beforeEach(() => {
    mocks.replace.mockReset();
    mocks.apiCall.mockReset();
    mocks.requestHeadingFocus.mockReset();
  });

  afterEach(cleanup);

  it('renders the login form inside the application shell', () => {
    render(<LoginScreen />);

    expect(screen.getByRole('heading', { level: 1, name: 'Logowanie' })).toBeTruthy();
    expect(screen.getByText('AITL')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Wyloguj' })).toBeNull();
  });

  it('posts the credentials, requests focus on the next heading and goes to the home page', async () => {
    const email = `${randomText()}@example.test`;
    const password = randomText();
    mocks.apiCall.mockResolvedValue({ ok: true, status: 200, data: { user: {} } });
    render(<LoginScreen />);

    submitCredentials(email, password);

    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith(HOME_PATH));
    expect(mocks.apiCall).toHaveBeenCalledWith(LOGIN_API_PATH, { method: 'POST', body: { email, password } });
    expect(mocks.requestHeadingFocus).toHaveBeenCalledTimes(1);
  });

  it('keeps the form and shows the message when the credentials are rejected', async () => {
    const email = `${randomText()}@example.test`;
    mocks.apiCall.mockResolvedValue({
      ok: false,
      kind: 'api-error',
      status: 401,
      error: { code: 'invalid_credentials', message: 'x' },
    });
    render(<LoginScreen />);

    submitCredentials(email, randomText());

    expect((await screen.findByRole('alert')).textContent).toContain('Nie udało się zalogować');
    expect((screen.getByLabelText('Adres e-mail') as HTMLInputElement).value).toBe(email);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(mocks.requestHeadingFocus).not.toHaveBeenCalled();
  });

  it('shows the lock time when the attempts are throttled', async () => {
    mocks.apiCall.mockResolvedValue({
      ok: false,
      kind: 'api-error',
      status: 429,
      error: { code: 'too_many_attempts', message: 'x', retryAfterSeconds: 600 },
    });
    render(<LoginScreen />);

    submitCredentials(`${randomText()}@example.test`, randomText());

    expect((await screen.findByRole('alert')).textContent).toContain('Zbyt wiele prób logowania');
  });
});
