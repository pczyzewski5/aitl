import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MonthSwitcher } from './month-switcher';

afterEach(cleanup);

describe('MonthSwitcher', () => {
  it('shows the Polish month name in lowercase and the year inside a polite live region', () => {
    render(<MonthSwitcher month="2026-10" onMonthChange={vi.fn()} />);

    const actual = screen.getByText('październik 2026');

    expect(actual.getAttribute('aria-live')).toBe('polite');
    expect(actual.getAttribute('aria-atomic')).toBe('true');
  });

  it('groups the controls under an accessible name', () => {
    render(<MonthSwitcher month="2026-10" onMonthChange={vi.fn()} />);

    const actual = screen.getByRole('group', { name: 'Wybór miesiąca' });

    expect(actual.getAttribute('data-slot')).toBe('month-switcher');
  });

  it('names both arrows and keeps their icons out of the accessibility tree', () => {
    render(<MonthSwitcher month="2026-10" onMonthChange={vi.fn()} />);

    const previous = screen.getByRole('button', { name: 'Poprzedni miesiąc' });
    const next = screen.getByRole('button', { name: 'Następny miesiąc' });

    expect(previous.getAttribute('data-variant')).toBe('secondary');
    expect(previous.getAttribute('data-size')).toBe('icon');
    expect(previous.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(next.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reports the previous and the next month', () => {
    const onMonthChange = vi.fn();
    render(<MonthSwitcher month="2026-01" onMonthChange={onMonthChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Poprzedni miesiąc' }));
    fireEvent.click(screen.getByRole('button', { name: 'Następny miesiąc' }));

    expect(onMonthChange.mock.calls).toEqual([['2025-12'], ['2026-02']]);
  });

  it('does not compute the current month and shows exactly the month it is given', () => {
    const { rerender } = render(<MonthSwitcher month="2026-12" onMonthChange={vi.fn()} />);

    rerender(<MonthSwitcher month="2027-01" onMonthChange={vi.fn()} />);

    expect(screen.getByText('styczeń 2027')).toBeTruthy();
  });

  it('blocks the previous arrow at the lower bound and explains why', () => {
    const onMonthChange = vi.fn();
    render(<MonthSwitcher month="2000-01" min="2000-01" onMonthChange={onMonthChange} />);

    const previous = screen.getByRole('button', { name: 'Poprzedni miesiąc' });
    fireEvent.click(previous);

    expect(onMonthChange).not.toHaveBeenCalled();
    expect(previous.getAttribute('aria-disabled')).toBe('true');
    expect(previous.getAttribute('title')).toBe('Nie ma wcześniejszych miesięcy do wyświetlenia');
    expect(previous.getAttribute('aria-describedby')).toBe(
      screen.getByText('Nie ma wcześniejszych miesięcy do wyświetlenia').getAttribute('id'),
    );
    expect(screen.getByRole('button', { name: 'Następny miesiąc' }).getAttribute('aria-disabled')).toBeNull();
  });

  it('blocks the next arrow at the upper bound and explains why', () => {
    const onMonthChange = vi.fn();
    render(<MonthSwitcher month="2100-12" max="2100-12" onMonthChange={onMonthChange} />);

    const next = screen.getByRole('button', { name: 'Następny miesiąc' });
    fireEvent.click(next);

    expect(onMonthChange).not.toHaveBeenCalled();
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(next.getAttribute('aria-describedby')).toBe(
      screen.getByText('Nie ma późniejszych miesięcy do wyświetlenia').getAttribute('id'),
    );
    expect(screen.getByRole('button', { name: 'Poprzedni miesiąc' }).getAttribute('aria-disabled')).toBeNull();
  });

  it('allows moving inside the bounds', () => {
    const onMonthChange = vi.fn();
    render(<MonthSwitcher month="2026-10" min="2026-09" max="2026-11" onMonthChange={onMonthChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Poprzedni miesiąc' }));

    expect(onMonthChange).toHaveBeenCalledWith('2026-09');
    expect(screen.queryByText('Nie ma wcześniejszych miesięcy do wyświetlenia')).toBeNull();
  });

  it('lets props override the default texts and merges the rest', () => {
    render(
      <MonthSwitcher
        month="2026-10"
        onMonthChange={vi.fn()}
        messages={{ previousLabel: 'Previous month', monthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Previous month' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Następny miesiąc' })).toBeTruthy();
    expect(screen.getByText('Oct 2026')).toBeTruthy();
  });

  it('passes className and attributes to the group', () => {
    render(<MonthSwitcher month="2026-10" onMonthChange={vi.fn()} className="w-full" data-testid="switcher" />);

    const actual = screen.getByTestId('switcher');

    expect(actual.className).toContain('w-full');
  });
});
