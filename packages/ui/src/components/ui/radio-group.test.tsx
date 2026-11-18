import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { RadioGroup } from './radio-group';

afterEach(cleanup);

const ENTRY_TYPES = [
  { value: 'income', label: 'Wpływ' },
  { value: 'expense', label: 'Wydatek' },
];

const RECURRENCES = [
  { value: 'none', label: 'Jednorazowy' },
  { value: 'monthly', label: 'Co miesiąc' },
  { value: 'yearly', label: 'Co rok' },
];

describe('RadioGroup', () => {
  it('renders a fieldset radiogroup named by its legend with one radio per option', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    const group = screen.getByRole('radiogroup', { name: 'Typ wpisu' });
    const radios = screen.getAllByRole('radio');

    expect(group.tagName).toBe('FIELDSET');
    expect(group.querySelector('legend')?.textContent).toBe('Typ wpisu');
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'false']);
    expect(screen.getByRole('radio', { name: 'Wpływ' }).className).toContain('size-checkbox');
    expect(screen.getByRole('radio', { name: 'Wpływ' }).className).toContain('rounded-pill');
  });

  it('lays out two options horizontally from a container width and more than two vertically', () => {
    const { rerender } = render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    expect(screen.getByRole('radiogroup').querySelector('[data-slot="radio-group-options"]')?.className).toContain(
      '@sm:flex-row',
    );

    rerender(<RadioGroup legend="Cykliczność" options={RECURRENCES} />);

    const actual = screen.getByRole('radiogroup').querySelector('[data-slot="radio-group-options"]');

    expect(actual?.className).toContain('flex-col');
    expect(actual?.className).not.toContain('@sm:flex-row');
  });

  it('selects an option when its radio is clicked and reports the value', () => {
    const onValueChange = vi.fn();
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Wydatek' }));

    expect(screen.getByRole('radio', { name: 'Wydatek' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: 'Wpływ' }).getAttribute('aria-checked')).toBe('false');
    expect(onValueChange).toHaveBeenCalledWith('expense');
  });

  it('selects an option when its label text is clicked', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    fireEvent.click(screen.getByText('Wpływ'));

    expect(screen.getByRole('radio', { name: 'Wpływ' }).getAttribute('aria-checked')).toBe('true');
  });

  it('keeps the label inside a 36 px click target', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    const actual = screen.getByRole('radio', { name: 'Wpływ' }).closest('label');

    expect(actual?.className).toContain('min-h-control');
    expect(actual?.textContent).toBe('Wpływ');
  });

  it('shows the dot only in the selected option', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} defaultValue="income" />);

    const selected = screen.getByRole('radio', { name: 'Wpływ' });
    const other = screen.getByRole('radio', { name: 'Wydatek' });

    expect(selected.getAttribute('data-state')).toBe('checked');
    expect(selected.querySelector('[data-slot="radio-group-indicator"]')?.className).toContain('bg-primary-foreground');
    expect(other.querySelector('[data-slot="radio-group-indicator"]')).toBeNull();
  });

  it('works as a controlled group', () => {
    const { rerender } = render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} value="income" />);

    expect(screen.getByRole('radio', { name: 'Wpływ' }).getAttribute('aria-checked')).toBe('true');

    rerender(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} value="expense" />);

    expect(screen.getByRole('radio', { name: 'Wydatek' }).getAttribute('aria-checked')).toBe('true');
  });

  it('moves the selection with the arrow keys and wraps around', async () => {
    render(<RadioGroup legend="Cykliczność" options={RECURRENCES} defaultValue="none" />);
    const none = screen.getByRole('radio', { name: 'Jednorazowy' });
    const monthly = screen.getByRole('radio', { name: 'Co miesiąc' });
    const yearly = screen.getByRole('radio', { name: 'Co rok' });

    none.focus();
    fireEvent.keyDown(none, { key: 'ArrowDown' });

    await waitFor(() => expect(monthly.getAttribute('aria-checked')).toBe('true'));
    expect(monthly).toBe(document.activeElement);

    fireEvent.keyDown(monthly, { key: 'ArrowRight' });

    await waitFor(() => expect(yearly.getAttribute('aria-checked')).toBe('true'));

    fireEvent.keyDown(yearly, { key: 'ArrowDown' });

    await waitFor(() => expect(none.getAttribute('aria-checked')).toBe('true'));

    fireEvent.keyDown(none, { key: 'ArrowUp' });

    await waitFor(() => expect(yearly.getAttribute('aria-checked')).toBe('true'));
  });

  it('prevents the Enter key from acting on a radio', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    const notPrevented = fireEvent.keyDown(screen.getByRole('radio', { name: 'Wpływ' }), { key: 'Enter' });

    expect(notPrevented).toBe(false);
    expect(screen.getByRole('radio', { name: 'Wpływ' }).getAttribute('aria-checked')).toBe('false');
  });

  it('describes an option with its hint without adding the hint to the name', () => {
    render(
      <RadioGroup
        legend="Cykliczność"
        options={[{ value: 'monthly', label: 'Co miesiąc', hint: 'Zapisz raz, widoczne co miesiąc.' }]}
      />,
    );

    const actual = screen.getByRole('radio', { name: 'Co miesiąc' });

    expect(screen.getByText('Zapisz raz, widoczne co miesiąc.').id).toBe(actual.getAttribute('aria-describedby'));
  });

  it('leaves aria-describedby off an option without a hint', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    expect(screen.getByRole('radio', { name: 'Wpływ' }).hasAttribute('aria-describedby')).toBe(false);
  });

  it('marks the group required by default and adds the optional text when optional', () => {
    const { rerender } = render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    expect(screen.getByRole('radiogroup').getAttribute('aria-required')).toBe('true');

    rerender(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} optional />);

    expect(screen.getByRole('radiogroup').hasAttribute('aria-required')).toBe(false);
    expect(screen.getByRole('radiogroup').querySelector('legend')?.textContent).toBe('Typ wpisu (opcjonalne)');

    rerender(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} optional optionalText="(nieobowiązkowe)" />);

    expect(screen.getByRole('radiogroup').querySelector('legend')?.textContent).toBe('Typ wpisu (nieobowiązkowe)');
  });

  it('links the hint and the error to the group and marks it invalid', () => {
    render(
      <RadioGroup
        legend="Typ wpisu"
        options={ENTRY_TYPES}
        hint="Wpływ zwiększa saldo, wydatek je zmniejsza."
        error="Wybierz typ wpisu."
        aria-describedby="extra"
      />,
    );

    const group = screen.getByRole('radiogroup');
    const error = screen.getByRole('alert');

    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(error.textContent).toBe('Wybierz typ wpisu.');
    expect(group.getAttribute('aria-describedby')).toBe(
      `extra ${screen.getByText('Wpływ zwiększa saldo, wydatek je zmniejsza.').id} ${error.id}`,
    );
    expect(group.className).toContain('group/radio-group');
    expect(screen.getByRole('radio', { name: 'Wpływ' }).className).toContain(
      'group-aria-invalid/radio-group:data-[state=unchecked]:border-destructive',
    );
  });

  it('has no description and no alert without a hint or an error', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} />);

    expect(screen.getByRole('radiogroup').hasAttribute('aria-describedby')).toBe(false);
    expect(screen.getByRole('radiogroup').hasAttribute('aria-invalid')).toBe(false);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('passes an explicit aria-invalid through when there is no error text', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} aria-invalid />);

    expect(screen.getByRole('radiogroup').getAttribute('aria-invalid')).toBe('true');
  });

  it('disables every option when the group is disabled', () => {
    const onValueChange = vi.fn();
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} disabled onValueChange={onValueChange} />);

    fireEvent.click(screen.getByRole('radio', { name: 'Wpływ' }));

    expect(screen.getAllByRole('radio').every((radio) => (radio as HTMLButtonElement).disabled)).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Wpływ' }).className).toContain('disabled:bg-muted');
    expect(screen.getByRole('radio', { name: 'Wpływ' }).closest('label')?.className).toContain(
      'has-disabled:cursor-not-allowed',
    );
  });

  it('disables only the option marked disabled and skips it with the arrow keys', async () => {
    render(
      <RadioGroup
        legend="Cykliczność"
        options={[
          { value: 'none', label: 'Jednorazowy' },
          { value: 'monthly', label: 'Co miesiąc', disabled: true },
          { value: 'yearly', label: 'Co rok' },
        ]}
        defaultValue="none"
      />,
    );
    const none = screen.getByRole('radio', { name: 'Jednorazowy' });

    none.focus();
    fireEvent.keyDown(none, { key: 'ArrowDown' });

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Co rok' }).getAttribute('aria-checked')).toBe('true'));
    expect((screen.getByRole('radio', { name: 'Co miesiąc' }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('radio', { name: 'Co miesiąc' }).getAttribute('aria-checked')).toBe('false');
  });

  it('uses a given id as the base of the generated ids', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} id="entry-type" error="Wybierz." />);

    expect(screen.getByRole('radiogroup').id).toBe('entry-type');
    expect(screen.getByRole('alert').id).toBe('entry-type-error');
    expect(screen.getByRole('radiogroup').getAttribute('aria-labelledby')).toBe('entry-type-legend');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} className="gap-(--space-4)" />);

    const actual = screen.getByRole('radiogroup');

    expect(actual.className).toContain('gap-(--space-4)');
    expect(actual.className).not.toContain('gap-(--space-label-field)');
  });

  describe('inside a form', () => {
    beforeAll(() => {
      vi.stubGlobal(
        'ResizeObserver',
        class {
          observe() {}
          unobserve() {}
          disconnect() {}
        },
      );
    });

    it('submits the selected value under its name', () => {
      render(
        <form aria-label="Wpis">
          <RadioGroup legend="Typ wpisu" options={ENTRY_TYPES} name="type" defaultValue="expense" />
        </form>,
      );

      const actual = new FormData(screen.getByRole('form', { name: 'Wpis' }) as HTMLFormElement).get('type');

      expect(actual).toBe('expense');
    });
  });
});
