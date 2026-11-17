import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Input } from './input';

afterEach(cleanup);

describe('Input', () => {
  it('renders a native text input by default', () => {
    render(<Input aria-label="Nazwa wpisu" />);

    const actual = screen.getByRole('textbox', { name: 'Nazwa wpisu' });

    expect(actual.tagName).toBe('INPUT');
    expect(actual.getAttribute('type')).toBe('text');
    expect(actual.getAttribute('data-type')).toBe('text');
    expect(actual.hasAttribute('inputmode')).toBe(false);
    expect(actual.className).toContain('bg-card');
    expect(actual.className).toContain('h-control');
  });

  it('renders an email input', () => {
    render(<Input type="email" aria-label="E-mail" />);

    const actual = screen.getByRole('textbox', { name: 'E-mail' });

    expect(actual.getAttribute('type')).toBe('email');
  });

  it('renders a password input', () => {
    render(<Input type="password" aria-label="Hasło" />);

    const actual = screen.getByLabelText('Hasło');

    expect(actual.getAttribute('type')).toBe('password');
  });

  it('renders the amount variant as text with a decimal keyboard', () => {
    render(<Input type="amount" aria-label="Kwota" />);

    const actual = screen.getByRole('textbox', { name: 'Kwota' });

    expect(actual.getAttribute('type')).toBe('text');
    expect(actual.getAttribute('inputmode')).toBe('decimal');
    expect(actual.getAttribute('data-type')).toBe('amount');
  });

  it('lets the caller override the input mode', () => {
    render(<Input type="amount" inputMode="numeric" aria-label="Kwota" />);

    const actual = screen.getByRole('textbox', { name: 'Kwota' });

    expect(actual.getAttribute('inputmode')).toBe('numeric');
  });

  it('reports typed values through onChange', () => {
    const onChange = vi.fn();
    render(<Input aria-label="Nazwa wpisu" onChange={onChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Nazwa wpisu' }), { target: { value: 'Czynsz' } });

    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('exposes the invalid state through aria-invalid', () => {
    render(<Input aria-label="E-mail" aria-invalid />);

    const actual = screen.getByRole('textbox', { name: 'E-mail' });

    expect(actual.getAttribute('aria-invalid')).toBe('true');
    expect(actual.className).toContain('aria-invalid:border-destructive');
  });

  it('supports the disabled and read-only states', () => {
    render(
      <>
        <Input aria-label="Zablokowane" disabled />
        <Input aria-label="Tylko do odczytu" readOnly defaultValue="3 975,50 zł" />
      </>,
    );

    const disabled = screen.getByRole('textbox', { name: 'Zablokowane' });
    const readOnly = screen.getByRole('textbox', { name: 'Tylko do odczytu' });

    expect((disabled as HTMLInputElement).disabled).toBe(true);
    expect((readOnly as HTMLInputElement).readOnly).toBe(true);
    expect((readOnly as HTMLInputElement).value).toBe('3 975,50 zł');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Input aria-label="Nazwa wpisu" className="bg-form-surface" />);

    const actual = screen.getByRole('textbox', { name: 'Nazwa wpisu' });

    expect(actual.className).toContain('bg-form-surface');
    expect(actual.className).not.toContain(' bg-card ');
  });
});
