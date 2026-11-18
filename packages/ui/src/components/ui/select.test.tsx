import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Field } from './field';
import { Select } from './select';

afterEach(cleanup);

const ENTRY_TYPES = [
  { value: 'income', label: 'Wpływ' },
  { value: 'expense', label: 'Wydatek' },
];

describe('Select', () => {
  it('renders a native select with the given options', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} />);

    const actual = screen.getByRole('combobox', { name: 'Typ wpisu' });
    const options = screen.getAllByRole('option');

    expect(actual.tagName).toBe('SELECT');
    expect(options.map((option) => option.textContent)).toEqual(['Wpływ', 'Wydatek']);
    expect(options.map((option) => option.getAttribute('value'))).toEqual(['income', 'expense']);
    expect(actual.className).toContain('bg-card');
    expect(actual.className).toContain('h-control');
  });

  it('does not render an empty option without a placeholder', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} />);

    expect(screen.queryByRole('option', { name: 'Wybierz…' })).toBeNull();
  });

  it('renders an empty first option when a placeholder is given', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} placeholder="Wybierz…" />);

    const actual = screen.getAllByRole('option')[0] as HTMLOptionElement;

    expect(actual.textContent).toBe('Wybierz…');
    expect(actual.value).toBe('');
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('');
  });

  it('reports the chosen value through onChange', () => {
    const onChange = vi.fn();
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} onChange={onChange} />);

    fireEvent.change(screen.getByRole('combobox', { name: 'Typ wpisu' }), { target: { value: 'expense' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('expense');
  });

  it('uses the default value', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} defaultValue="expense" />);

    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('expense');
  });

  it('hides the decorative arrow from assistive technology', () => {
    const { container } = render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} />);

    const actual = container.querySelector('[data-slot="select-arrow"]');

    expect(actual?.getAttribute('aria-hidden')).toBe('true');
    expect(actual?.getAttribute('class')).toContain('pointer-events-none');
  });

  it('exposes the invalid state through aria-invalid', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} aria-invalid />);

    const actual = screen.getByRole('combobox', { name: 'Typ wpisu' });

    expect(actual.getAttribute('aria-invalid')).toBe('true');
    expect(actual.className).toContain('aria-invalid:border-destructive');
  });

  it('supports the disabled state', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} disabled />);

    expect((screen.getByRole('combobox') as HTMLSelectElement).disabled).toBe(true);
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Select aria-label="Typ wpisu" options={ENTRY_TYPES} className="bg-form-surface" />);

    const actual = screen.getByRole('combobox', { name: 'Typ wpisu' });

    expect(actual.className).toContain('bg-form-surface');
    expect(actual.className).not.toContain(' bg-card ');
  });

  it('works inside Field with label, hint, error and optional marker', () => {
    render(
      <Field label="Typ wpisu" hint="Wpływ zwiększa saldo." error="Wybierz typ wpisu." optional>
        <Select options={ENTRY_TYPES} />
      </Field>,
    );

    const actual = screen.getByRole('combobox', { name: 'Typ wpisu (opcjonalne)' });
    const hint = screen.getByText('Wpływ zwiększa saldo.');
    const error = screen.getByRole('alert');

    expect(actual.getAttribute('aria-invalid')).toBe('true');
    expect(actual.getAttribute('aria-describedby')).toBe(`${hint.id} ${error.id}`);
    expect(actual.hasAttribute('aria-required')).toBe(false);
  });

  it('is marked as required inside Field by default', () => {
    render(
      <Field label="Typ wpisu">
        <Select options={ENTRY_TYPES} />
      </Field>,
    );

    expect(screen.getByRole('combobox', { name: 'Typ wpisu' }).getAttribute('aria-required')).toBe('true');
  });
});
