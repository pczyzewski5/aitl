import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Field } from './field';
import { Input } from './input';

afterEach(cleanup);

describe('Field', () => {
  it('names the control with its label and marks it as required by default', () => {
    render(
      <Field label="E-mail">
        <Input type="email" />
      </Field>,
    );

    const actual = screen.getByRole('textbox', { name: 'E-mail' });

    expect(actual.getAttribute('aria-required')).toBe('true');
    expect(actual.hasAttribute('aria-invalid')).toBe(false);
    expect(actual.hasAttribute('aria-describedby')).toBe(false);
    expect(screen.queryByText('(opcjonalne)')).toBeNull();
  });

  it('shows the optional marker instead of an asterisk', () => {
    render(
      <Field label="Opis" optional>
        <Input />
      </Field>,
    );

    const actual = screen.getByRole('textbox', { name: 'Opis (opcjonalne)' });

    expect(actual.hasAttribute('aria-required')).toBe(false);
    expect(screen.getByText('(opcjonalne)')).toBeTruthy();
  });

  it('accepts a custom optional text', () => {
    render(
      <Field label="Opis" optional optionalText="(optional)">
        <Input />
      </Field>,
    );

    expect(screen.getByText('(optional)')).toBeTruthy();
    expect(screen.queryByText('(opcjonalne)')).toBeNull();
  });

  it('links the hint to the control through aria-describedby', () => {
    render(
      <Field label="Hasło" hint="Co najmniej 12 znaków.">
        <Input type="password" />
      </Field>,
    );

    const actual = screen.getByLabelText('Hasło');
    const hint = screen.getByText('Co najmniej 12 znaków.');

    expect(actual.getAttribute('aria-describedby')).toBe(hint.id);
    expect(actual.hasAttribute('aria-invalid')).toBe(false);
  });

  it('shows the error below the control, marks it invalid and links it', () => {
    render(
      <Field label="E-mail" error="Podaj adres e-mail w formacie nazwa@domena.pl.">
        <Input type="email" />
      </Field>,
    );

    const actual = screen.getByLabelText('E-mail');
    const error = screen.getByRole('alert');

    expect(error.textContent).toBe('Podaj adres e-mail w formacie nazwa@domena.pl.');
    expect(actual.getAttribute('aria-invalid')).toBe('true');
    expect(actual.getAttribute('aria-describedby')).toBe(error.id);
    expect(actual.compareDocumentPosition(error) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('links both the hint and the error, and keeps an existing description', () => {
    render(
      <Field label="Kwota" hint="Podaj kwotę w złotych." error="Wpisz kwotę większą od zera.">
        <Input type="amount" aria-describedby="external-note" />
      </Field>,
    );

    const actual = screen.getByLabelText('Kwota');
    const hint = screen.getByText('Podaj kwotę w złotych.');
    const error = screen.getByRole('alert');

    expect(actual.getAttribute('aria-describedby')).toBe(`external-note ${hint.id} ${error.id}`);
  });

  it('uses a given id for the control, hint and error', () => {
    render(
      <Field label="E-mail" id="login-email" hint="Adres z rejestracji.">
        <Input type="email" />
      </Field>,
    );

    const actual = screen.getByLabelText('E-mail');

    expect(actual.id).toBe('login-email');
    expect(actual.getAttribute('aria-describedby')).toBe('login-email-hint');
  });

  it('marks the field as invalid only when an error is present', () => {
    const { container, rerender } = render(
      <Field label="E-mail">
        <Input />
      </Field>,
    );
    const field = container.querySelector('[data-slot="field"]');

    expect(field?.hasAttribute('data-invalid')).toBe(false);

    rerender(
      <Field label="E-mail" error="Podaj adres e-mail.">
        <Input />
      </Field>,
    );

    expect(field?.getAttribute('data-invalid')).toBe('true');
  });

  it('lets a passed class override a conflicting utility', () => {
    const { container } = render(
      <Field label="E-mail" className="gap-2">
        <Input />
      </Field>,
    );

    const actual = container.querySelector('[data-slot="field"]');

    expect(actual?.className).toContain('gap-2');
    expect(actual?.className).not.toContain('space-label-field');
  });
});
