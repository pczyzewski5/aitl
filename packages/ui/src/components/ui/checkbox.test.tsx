import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';

afterEach(cleanup);

describe('Checkbox', () => {
  it('renders an unchecked checkbox named by its visible label', () => {
    render(<Checkbox label="Zapłacone" />);

    const actual = screen.getByRole('checkbox', { name: 'Zapłacone' });

    expect(actual.tagName).toBe('BUTTON');
    expect(actual.getAttribute('aria-checked')).toBe('false');
    expect(actual.getAttribute('data-state')).toBe('unchecked');
    expect(actual.className).toContain('size-checkbox');
    expect(actual.className).toContain('rounded-control');
  });

  it('is named by aria-label when there is no visible label', () => {
    render(<Checkbox aria-label="Zapłacone: Czynsz (przykład)" />);

    const actual = screen.getByRole('checkbox', { name: 'Zapłacone: Czynsz (przykład)' });

    expect(actual.getAttribute('aria-checked')).toBe('false');
    expect(actual.closest('label')?.className).toContain('justify-center');
  });

  it('keeps the label at the start of a 36 px click target', () => {
    render(<Checkbox label="Zapłacone" />);

    const actual = screen.getByRole('checkbox', { name: 'Zapłacone' }).closest('label');

    expect(actual?.className).toContain('min-h-control');
    expect(actual?.className).toContain('justify-start');
    expect(actual?.textContent).toBe('Zapłacone');
  });

  it('toggles when the box is clicked and reports the new state', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Zapłacone" onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Zapłacone' });

    fireEvent.click(checkbox);

    expect(checkbox.getAttribute('aria-checked')).toBe('true');
    expect(checkbox.getAttribute('data-state')).toBe('checked');
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    fireEvent.click(checkbox);

    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it('toggles when the label text is clicked', () => {
    render(<Checkbox label="Zapłacone" />);

    fireEvent.click(screen.getByText('Zapłacone'));

    expect(screen.getByRole('checkbox', { name: 'Zapłacone' }).getAttribute('aria-checked')).toBe('true');
  });

  it('shows the check icon when checked and the dash only when indeterminate', () => {
    const { rerender } = render(<Checkbox label="Zapłacone" checked />);

    expect(screen.getByRole('checkbox').querySelector('.lucide-check')).not.toBeNull();
    expect(screen.getByRole('checkbox').querySelector('.lucide-minus')?.getAttribute('class')).toContain(
      'in-data-[state=indeterminate]:block',
    );

    rerender(<Checkbox label="Zapłacone" checked="indeterminate" />);

    const actual = screen.getByRole('checkbox');

    expect(actual.getAttribute('aria-checked')).toBe('mixed');
    expect(actual.getAttribute('data-state')).toBe('indeterminate');
  });

  it('leaves the icons out when unchecked', () => {
    render(<Checkbox label="Zapłacone" />);

    expect(screen.getByRole('checkbox').querySelector('svg')).toBeNull();
  });

  it('becomes checked when an indeterminate checkbox is clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Wszystkie" defaultChecked="indeterminate" onCheckedChange={onCheckedChange} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Wszystkie' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  it('does not toggle when disabled', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Zapłacone" disabled onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox', { name: 'Zapłacone' });

    fireEvent.click(checkbox);

    expect((checkbox as HTMLButtonElement).disabled).toBe(true);
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(checkbox.className).toContain('disabled:bg-muted');
    expect(checkbox.closest('label')?.className).toContain('has-disabled:cursor-not-allowed');
  });

  it('exposes the invalid state through aria-invalid', () => {
    render(<Checkbox label="Akceptuję regulamin" aria-invalid />);

    const actual = screen.getByRole('checkbox', { name: 'Akceptuję regulamin' });

    expect(actual.getAttribute('aria-invalid')).toBe('true');
    expect(actual.className).toContain('aria-invalid:border-destructive');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Checkbox label="Zapłacone" className="bg-form-surface" />);

    const actual = screen.getByRole('checkbox', { name: 'Zapłacone' });

    expect(actual.className).toContain('bg-form-surface');
    expect(actual.className).not.toContain(' bg-card ');
  });

  it('prevents the Enter key from acting on the checkbox', () => {
    render(<Checkbox label="Zapłacone" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Zapłacone' });

    const notPrevented = fireEvent.keyDown(checkbox, { key: 'Enter' });

    expect(notPrevented).toBe(false);
    expect(checkbox.getAttribute('aria-checked')).toBe('false');
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

    it('submits its value under its name when checked', () => {
      render(
        <form aria-label="Wpis">
          <Checkbox label="Zapłacone" name="paid" value="yes" defaultChecked />
        </form>,
      );

      const actual = new FormData(screen.getByRole('form', { name: 'Wpis' }) as HTMLFormElement).get('paid');

      expect(actual).toBe('yes');
    });
  });
});
