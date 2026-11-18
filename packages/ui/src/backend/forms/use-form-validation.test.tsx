import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { ErrorSummary } from './error-summary';
import { useFormValidation } from './use-form-validation';
import type { FieldErrors, SubmitHelpers, SubmitResult } from './use-form-validation';

afterEach(cleanup);

type Values = { email: string; password: string; remember: boolean };

const INITIAL_VALUES: Values = { email: '', password: '', remember: false };
const EMAIL_ERROR = 'Podaj adres e-mail.';
const PASSWORD_ERROR = 'Podaj hasło.';

function validate(values: Values): FieldErrors<Values> {
  return {
    email: values.email === '' ? EMAIL_ERROR : undefined,
    password: values.password === '' ? PASSWORD_ERROR : undefined,
  };
}

interface HarnessProps {
  onSubmit: (values: Values, helpers: SubmitHelpers) => Promise<SubmitResult<Values>>;
}

function Harness({ onSubmit }: HarnessProps) {
  const form = useFormValidation({ initialValues: INITIAL_VALUES, validate, onSubmit });

  return (
    <form {...form.formProps} aria-label="Logowanie">
      <ErrorSummary title="Popraw pola" errors={form.summary} onSelect={form.focusField} />
      <output aria-label="Błąd formularza">{form.formError}</output>
      <output aria-label="Status">{form.submitting ? 'wysyłanie' : 'gotowy'}</output>
      <output aria-label="Zapamiętaj">{String(form.values.remember)}</output>
      <Field label="E-mail" {...form.getFieldProps('email')}>
        <Input type="email" {...form.getInputProps('email')} />
      </Field>
      <Field label="Hasło" {...form.getFieldProps('password')}>
        <Input type="password" {...form.getInputProps('password')} />
      </Field>
      <button type="button" onClick={() => form.setValue('remember', true)}>
        Zapamiętaj mnie
      </button>
      <button type="button" onClick={() => form.touch('remember')}>
        Dotknij pole
      </button>
      <button type="button" onClick={() => form.focusField('password')}>
        Fokus na haśle
      </button>
      <button type="button" onClick={() => form.focusField('remember')}>
        Fokus na brakującym polu
      </button>
      <button type="button" onClick={form.reset}>
        Wyczyść
      </button>
      <button type="submit">Zaloguj</button>
    </form>
  );
}

function renderForm(onSubmit: HarnessProps['onSubmit'] = () => Promise.resolve({ ok: true })) {
  render(<Harness onSubmit={onSubmit} />);
  return {
    email: screen.getByLabelText('E-mail'),
    password: screen.getByLabelText('Hasło'),
    form: screen.getByRole('form', { name: 'Logowanie' }),
  };
}

function type(control: HTMLElement, value: string) {
  fireEvent.change(control, { target: { value } });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('useFormValidation', () => {
  it('renders the form without native validation', () => {
    const { form } = renderForm();

    expect(form.hasAttribute('novalidate')).toBe(true);
  });

  it('shows no errors before the user touched a field', () => {
    const { email } = renderForm();

    expect(screen.queryByRole('alert')).toBeNull();
    expect(email.hasAttribute('aria-invalid')).toBe(false);
  });

  it('validates a field on blur only after it was touched, and only that field', () => {
    const { email, password } = renderForm();

    fireEvent.blur(email);

    expect(screen.getByText(EMAIL_ERROR)).toBeTruthy();
    expect(email.getAttribute('aria-invalid')).toBe('true');
    expect(password.hasAttribute('aria-invalid')).toBe(false);
    expect(screen.queryByText(PASSWORD_ERROR)).toBeNull();
  });

  it('does not show an error while the user is typing in an untouched field', () => {
    const { email } = renderForm();

    type(email, 'a');
    type(email, '');

    expect(screen.queryByText(EMAIL_ERROR)).toBeNull();
  });

  it('keeps validating a touched field live and clears the error when it becomes valid', () => {
    const { email } = renderForm();
    fireEvent.blur(email);

    type(email, 'jan@example.com');

    expect(screen.queryByText(EMAIL_ERROR)).toBeNull();
    expect(email.hasAttribute('aria-invalid')).toBe(false);
  });

  it('touching a field twice keeps it touched', () => {
    const { email } = renderForm();

    fireEvent.blur(email);
    fireEvent.blur(email);

    expect(screen.getAllByText(EMAIL_ERROR)).toHaveLength(1);
  });

  it('touches a field that is not an input through touch()', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Dotknij pole' }));

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('validates all fields on submit, focuses the first invalid one and shows the summary for several errors', () => {
    const onSubmit = vi.fn();
    const { email, form } = renderForm(onSubmit);

    fireEvent.submit(form);

    const summary = screen.getAllByRole('alert').find((element) => element.getAttribute('data-slot') === 'error-summary');
    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(email);
    expect(summary).toBeTruthy();
    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([EMAIL_ERROR, PASSWORD_ERROR]);
    expect(email.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows no summary for a single error, only the field message and focus', () => {
    const { password, form, email } = renderForm();
    type(email, 'jan@example.com');

    fireEvent.submit(form);

    expect(document.activeElement).toBe(password);
    expect(screen.getByText(PASSWORD_ERROR)).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('hides the summary again when only one error is left', () => {
    const { email, form } = renderForm();
    fireEvent.submit(form);

    type(email, 'jan@example.com');

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText(PASSWORD_ERROR)).toBeTruthy();
  });

  it('moves focus to the field when a summary link is activated', () => {
    const { password, form } = renderForm();
    fireEvent.submit(form);

    fireEvent.click(screen.getByRole('link', { name: PASSWORD_ERROR }));

    expect(document.activeElement).toBe(password);
  });

  it('ignores focusing a field that is not rendered', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Fokus na brakującym polu' }));

    expect(document.activeElement).toBe(document.body);
  });

  it('submits the current values, shows the loading state and unlocks after success', async () => {
    const pending = deferred<SubmitResult<Values>>();
    const onSubmit = vi.fn(() => pending.promise);
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'tajne-haslo');

    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByLabelText('Status').textContent).toBe('wysyłanie'));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(
      { email: 'jan@example.com', password: 'tajne-haslo', remember: false },
      { reset: expect.any(Function) },
    );

    await act(async () => {
      pending.resolve({ ok: true });
    });

    expect(screen.getByLabelText('Status').textContent).toBe('gotowy');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('blocks a second submit while the first is pending', async () => {
    const pending = deferred<SubmitResult<Values>>();
    const onSubmit = vi.fn(() => pending.promise);
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'tajne-haslo');

    fireEvent.submit(form);
    fireEvent.submit(form);
    fireEvent.submit(form);

    await act(async () => {
      pending.resolve({ ok: true });
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('allows submitting again after the first submit finished', async () => {
    const onSubmit = vi.fn(() => Promise.resolve<SubmitResult<Values>>({ ok: true }));
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'tajne-haslo');

    await act(async () => {
      fireEvent.submit(form);
    });
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(onSubmit).toHaveBeenCalledTimes(2);
  });

  it('shows a server field error, focuses that field and keeps the typed values', async () => {
    const onSubmit = () => Promise.resolve<SubmitResult<Values>>({ ok: false, fieldErrors: { password: 'To hasło jest za krótkie.' } });
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'abc');

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(screen.getByText('To hasło jest za krótkie.')).toBeTruthy();
    expect(password.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(password);
    expect((email as HTMLInputElement).value).toBe('jan@example.com');
    expect((password as HTMLInputElement).value).toBe('abc');
  });

  it('keeps a server field error while another field changes and clears it when its own field changes', async () => {
    const onSubmit = () => Promise.resolve<SubmitResult<Values>>({ ok: false, fieldErrors: { password: 'To hasło jest za krótkie.' } });
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'abc');
    await act(async () => {
      fireEvent.submit(form);
    });

    type(email, 'anna@example.com');
    expect(screen.getByText('To hasło jest za krótkie.')).toBeTruthy();

    type(password, 'abcdefghijkl');
    expect(screen.queryByText('To hasło jest za krótkie.')).toBeNull();
  });

  it('shows a form error from the server without moving focus, and clears it on the next submit', async () => {
    const responses: SubmitResult<Values>[] = [{ ok: false, formError: 'Brak połączenia z serwerem.' }, { ok: true }];
    const onSubmit = vi.fn(() => Promise.resolve(responses.shift() as SubmitResult<Values>));
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'tajne-haslo');
    screen.getByRole('button', { name: 'Zaloguj' }).focus();

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(screen.getByLabelText('Błąd formularza').textContent).toBe('Brak połączenia z serwerem.');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Zaloguj' }));

    await act(async () => {
      fireEvent.submit(form);
    });

    expect(screen.getByLabelText('Błąd formularza').textContent).toBe('');
  });

  it('sets non-text values through setValue', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Zapamiętaj mnie' }));

    expect(screen.getByLabelText('Zapamiętaj').textContent).toBe('true');
  });

  it('resets values, touched state, errors and the form error', async () => {
    const onSubmit = () => Promise.resolve<SubmitResult<Values>>({ ok: false, formError: 'Brak połączenia z serwerem.' });
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'tajne-haslo');
    await act(async () => {
      fireEvent.submit(form);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Zapamiętaj mnie' }));
    type(email, '');
    expect(screen.getByText(EMAIL_ERROR)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Wyczyść' }));

    expect((email as HTMLInputElement).value).toBe('');
    expect((password as HTMLInputElement).value).toBe('');
    expect(screen.queryByText(EMAIL_ERROR)).toBeNull();
    expect(screen.getByLabelText('Błąd formularza').textContent).toBe('');
    expect(screen.getByLabelText('Zapamiętaj').textContent).toBe('false');
  });

  it('lets the submit handler reset the form after a successful save', async () => {
    const onSubmit = (_values: Values, helpers: SubmitHelpers) => {
      helpers.reset();
      return Promise.resolve<SubmitResult<Values>>({ ok: true });
    };
    const { email, password, form } = renderForm(onSubmit);
    type(email, 'jan@example.com');
    type(password, 'tajne-haslo');

    await act(async () => {
      fireEvent.submit(form);
    });

    expect((email as HTMLInputElement).value).toBe('');
    expect((password as HTMLInputElement).value).toBe('');
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
