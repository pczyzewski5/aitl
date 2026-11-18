import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorSummary } from './error-summary';

afterEach(cleanup);

const ERRORS = [
  { name: 'amount', fieldId: 'form-amount', message: 'Podaj kwotę, np. 12,50.' },
  { name: 'date', fieldId: 'form-date', message: 'Wybierz datę wpisu.' },
];

describe('ErrorSummary', () => {
  it('renders nothing without errors', () => {
    const { container } = render(<ErrorSummary title="Popraw pola" errors={[]} onSelect={vi.fn()} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders an error alert with the title and one link per error pointing at its field', () => {
    render(<ErrorSummary title="Popraw 2 pola" errors={ERRORS} onSelect={vi.fn()} />);

    const alert = screen.getByRole('alert');
    const links = screen.getAllByRole('link');

    expect(alert.getAttribute('data-variant')).toBe('error');
    expect(screen.getByText('Popraw 2 pola')).toBeTruthy();
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#form-amount', '#form-date']);
    expect(links.map((link) => link.textContent)).toEqual(['Podaj kwotę, np. 12,50.', 'Wybierz datę wpisu.']);
  });

  it('selects the field instead of following the anchor when a link is clicked', () => {
    const onSelect = vi.fn();
    render(<ErrorSummary title="Popraw 2 pola" errors={ERRORS} onSelect={onSelect} />);

    const notPrevented = fireEvent.click(screen.getByRole('link', { name: 'Wybierz datę wpisu.' }));

    expect(notPrevented).toBe(false);
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('date');
  });

  it('merges a custom class name', () => {
    render(<ErrorSummary title="Popraw 2 pola" errors={ERRORS} onSelect={vi.fn()} className="max-w-md" />);

    expect(screen.getByRole('alert').className).toContain('max-w-md');
  });
});
