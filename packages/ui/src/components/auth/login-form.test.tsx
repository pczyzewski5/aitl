import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';
import type { LoginFormProps } from './login-form';
import type { LoginResult } from './login-failure';

afterEach(cleanup);

const EMAIL = 'jan@example.com';
const PASSWORD = 'tajne-haslo';

function renderForm(props: Partial<LoginFormProps> = {}) {
  const onSubmit = props.onSubmit ?? vi.fn(async (): Promise<LoginResult> => ({ ok: true }));
  render(<LoginForm {...props} onSubmit={onSubmit} />);

  return onSubmit;
}

function fill(email: string, password: string) {
  fireEvent.change(screen.getByLabelText('Adres e-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: password } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Zaloguj się|Logowanie…/ }));
}

describe('LoginForm', () => {
  it('renders an h1 heading naming the form and labelled fields with autocomplete hints', () => {
    renderForm();

    const heading = screen.getByRole('heading', { level: 1, name: 'Logowanie' });
    const email = screen.getByLabelText('Adres e-mail');
    const password = screen.getByLabelText('Hasło');

    expect(screen.getByRole('form', { name: 'Logowanie' })).toBeTruthy();
    expect(heading.id).not.toBe('');
    expect(email.getAttribute('type')).toBe('email');
    expect(email.getAttribute('autocomplete')).toBe('username');
    expect(email.getAttribute('aria-required')).toBe('true');
    expect(password.getAttribute('type')).toBe('password');
    expect(password.getAttribute('autocomplete')).toBe('current-password');
    expect(screen.getByRole('form', { name: 'Logowanie' }).hasAttribute('novalidate')).toBe(true);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('can render the heading at level 2 and accepts a class name', () => {
    render(<LoginForm onSubmit={vi.fn()} headingLevel="h2" className="extra" />);

    const actual = screen.getByRole('heading', { level: 2, name: 'Logowanie' });

    expect(actual.closest('[data-slot="login-form"]')?.className).toContain('extra');
  });

  it('shows a field error only after the touched field is left', () => {
    renderForm();
    const email = screen.getByLabelText('Adres e-mail');

    fireEvent.blur(email);

    expect(screen.getByText('Wpisz adres e-mail, np. jan@example.com.')).toBeTruthy();
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByLabelText('Hasło').hasAttribute('aria-invalid')).toBe(false);
  });

  it('rejects an incomplete e-mail address', () => {
    renderForm();
    fill('jan@', PASSWORD);

    submit();

    expect(screen.getByText(/wygląda na niepełny/)).toBeTruthy();
  });

  it('focuses the first invalid field and shows no summary for a single error', () => {
    const onSubmit = renderForm();
    fill(EMAIL, '');

    submit();

    expect(document.activeElement).toBe(screen.getByLabelText('Hasło'));
    expect(screen.getByText('Wpisz hasło.')).toBeTruthy();
    expect(screen.queryByText('Popraw dane logowania, żeby się zalogować')).toBeNull();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a summary with links for several errors and moves focus to the clicked field', () => {
    renderForm();

    submit();

    expect(document.activeElement).toBe(screen.getByLabelText('Adres e-mail'));
    expect(screen.getByText('Popraw dane logowania, żeby się zalogować')).toBeTruthy();
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Wpisz adres e-mail, np. jan@example.com.', 'Wpisz hasło.']);

    fireEvent.click(links[1] as HTMLElement);

    expect(document.activeElement).toBe(screen.getByLabelText('Hasło'));
  });

  it('submits trimmed e-mail and the untouched password', async () => {
    const onSubmit = renderForm();
    fill(`  ${EMAIL}  `, ` ${PASSWORD} `);

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({ email: EMAIL, password: ` ${PASSWORD} ` });
  });

  it('blocks a double submit while loading and keeps the data', async () => {
    let finish: (result: LoginResult) => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<LoginResult>((resolve) => (finish = resolve)));
    renderForm({ onSubmit });
    fill(EMAIL, PASSWORD);

    submit();
    const busyButton = await screen.findByRole('button', { name: 'Logowanie…' });
    fireEvent.click(busyButton);
    fireEvent.submit(screen.getByRole('form', { name: 'Logowanie' }));

    expect(busyButton.getAttribute('aria-busy')).toBe('true');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect((screen.getByLabelText('Adres e-mail') as HTMLInputElement).value).toBe(EMAIL);

    finish({ ok: true });
    await screen.findByRole('button', { name: 'Zaloguj się' });
  });

  it('does not send a second request after a successful login', async () => {
    const onSubmit = renderForm();
    fill(EMAIL, PASSWORD);
    submit();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await screen.findByRole('button', { name: 'Zaloguj się' });

    fireEvent.submit(screen.getByRole('form', { name: 'Logowanie' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeTruthy());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each<{ name: string; result: LoginResult; expected: string }>([
    {
      name: 'invalid credentials',
      result: { ok: false, kind: 'invalid-credentials' },
      expected: 'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.',
    },
    {
      name: 'lockout with seconds',
      result: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 87 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za 87 sekund.',
    },
    {
      name: 'lockout with one second',
      result: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 1 },
      expected: 'Zbyt wiele prób logowania. Spróbuj ponownie za 1 sekundę.',
    },
    {
      name: 'network failure result',
      result: { ok: false, kind: 'network' },
      expected: 'Nie udało się połączyć z serwerem. Sprawdź połączenie z internetem i spróbuj ponownie; wpisane dane zostały w formularzu.',
    },
  ])('shows the $name as an alert at the top and keeps the data', async ({ result, expected }) => {
    renderForm({ onSubmit: vi.fn(async () => result) });
    fill(EMAIL, PASSWORD);

    submit();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(expected);
    expect(screen.getByRole('form', { name: 'Logowanie' }).firstElementChild).toBe(alert);
    expect((screen.getByLabelText('Hasło') as HTMLInputElement).value).toBe(PASSWORD);
    expect(screen.getByLabelText('Adres e-mail').hasAttribute('aria-invalid')).toBe(false);
  });

  it('shows the network message when the request itself rejects', async () => {
    renderForm({ onSubmit: vi.fn(async () => Promise.reject(new Error('offline'))) });
    fill(EMAIL, PASSWORD);

    submit();

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Nie udało się połączyć z serwerem');
    expect(screen.getByRole('button', { name: 'Zaloguj się' }).hasAttribute('aria-busy')).toBe(false);
  });

  it('uses overridden messages', async () => {
    renderForm({
      messages: { title: 'Sign in', submitLabel: 'Go', invalidCredentials: 'Wrong data', emailLabel: 'E-mail' },
      onSubmit: vi.fn(async (): Promise<LoginResult> => ({ ok: false, kind: 'invalid-credentials' })),
    });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: EMAIL } });
    fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: PASSWORD } });

    fireEvent.click(screen.getByRole('button', { name: 'Go' }));

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong data');
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeTruthy();
  });
});
