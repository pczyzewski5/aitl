import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountRemainderCard } from './account-remainder-card';

afterEach(cleanup);

const NBSP = ' ';
const MINUS = '−';
const EXACT = { normalizer: (text: string) => text };

const ready = {
  name: 'Konto wspólne',
  accountType: 'shared',
  remainderMinor: 397550,
  incomeMinor: 650000,
  expensesMinor: 252450,
  selected: false,
  onSelect: vi.fn(),
} as const;

describe('AccountRemainderCard ready', () => {
  it('is a toggle button that exposes the selection through aria-pressed', () => {
    const { rerender } = render(<AccountRemainderCard {...ready} />);

    const inactive = screen.getByRole('button').getAttribute('aria-pressed');
    rerender(<AccountRemainderCard {...ready} selected />);
    const active = screen.getByRole('button').getAttribute('aria-pressed');

    expect(inactive).toBe('false');
    expect(active).toBe('true');
  });

  it('reports the selection request on click', () => {
    const onSelect = vi.fn();
    render(<AccountRemainderCard {...ready} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('keeps a constant two pixel border and only swaps its colour token', () => {
    const { rerender } = render(<AccountRemainderCard {...ready} />);

    const inactiveClasses = screen.getByRole('button').className;
    rerender(<AccountRemainderCard {...ready} selected />);
    const activeClasses = screen.getByRole('button').className;

    expect(inactiveClasses).toContain('border-2');
    expect(inactiveClasses).toContain('border-border');
    expect(inactiveClasses).not.toContain('border-primary');
    expect(activeClasses).toContain('border-2');
    expect(activeClasses).toContain('border-primary');
    expect(activeClasses).not.toContain('border-border');
  });

  it('always renders the text marker and hides it from view only when inactive', () => {
    const { rerender } = render(<AccountRemainderCard {...ready} />);

    const inactiveClasses = screen.getByText('Wybrane').className;
    rerender(<AccountRemainderCard {...ready} selected />);
    const active = screen.getByText('Wybrane');

    expect(inactiveClasses).toContain('invisible');
    expect(active.className).not.toContain('invisible');
    expect(active.getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the name and the account type badge', () => {
    const { rerender } = render(<AccountRemainderCard {...ready} />);

    const shared = screen.getByText('Wspólne').getAttribute('data-variant');
    rerender(<AccountRemainderCard {...ready} accountType="personal" name="Konto osobiste" />);
    const personal = screen.getByText('Osobiste').getAttribute('data-variant');

    expect(shared).toBe('shared');
    expect(personal).toBe('personal');
    expect(screen.getByText('Konto osobiste')).toBeTruthy();
  });

  it('writes the remainder, the income with a plus and the expenses with a true minus', () => {
    render(<AccountRemainderCard {...ready} />);

    const value = screen.getByText(`3${NBSP}975,50${NBSP}zł`, EXACT);
    const income = screen.getByText(`+6${NBSP}500,00${NBSP}zł`, EXACT);
    const expenses = screen.getByText(`${MINUS}2${NBSP}524,50${NBSP}zł`, EXACT);

    expect(value.className).toContain('text-xl');
    expect(value.className).toContain('font-bold');
    expect(value.className).toContain('text-income');
    expect(income.className).toContain('text-income');
    expect(expenses.className).toContain('text-expense');
    expect(screen.getByText('Wpływy:')).toBeTruthy();
    expect(screen.getByText('Wydatki:')).toBeTruthy();
    expect(screen.getByText('Ile zostanie')).toBeTruthy();
  });

  it('writes a negative remainder with the minus sign in the expense colour', () => {
    render(<AccountRemainderCard {...ready} remainderMinor={-123450} incomeMinor={100000} expensesMinor={223450} />);

    const actual = screen.getByText(`${MINUS}1${NBSP}234,50${NBSP}zł`, EXACT);

    expect(actual.className).toContain('text-expense');
    expect(actual.className).toContain('font-bold');
  });

  it('keeps zero neutral and without a sign', () => {
    render(<AccountRemainderCard {...ready} remainderMinor={0} incomeMinor={0} expensesMinor={0} />);

    const actual = screen.getAllByText(`0,00${NBSP}zł`, EXACT);

    expect(actual).toHaveLength(3);
    for (const element of actual) {
      expect(element.className).toContain('text-card-foreground');
      expect(element.className).not.toContain('text-income');
      expect(element.className).not.toContain('text-expense');
    }
  });

  it('accepts bigint amounts', () => {
    render(<AccountRemainderCard {...ready} remainderMinor={100n} incomeMinor={100n} expensesMinor={0n} />);

    expect(screen.getAllByText(`1,00${NBSP}zł`, EXACT).length).toBeGreaterThan(0);
  });

  it('never shows a combined total', () => {
    render(<AccountRemainderCard {...ready} />);

    expect(screen.queryByText(/razem|łącznie|suma/i)).toBeNull();
  });

  it('lets props override the default texts and merges the rest', () => {
    render(
      <AccountRemainderCard
        {...ready}
        selected
        messages={{ remainderLabel: 'Left over', selectedMarker: 'Selected', sharedAccountLabel: 'Shared' }}
      />,
    );

    expect(screen.getByText('Left over')).toBeTruthy();
    expect(screen.getByText('Selected')).toBeTruthy();
    expect(screen.getByText('Shared')).toBeTruthy();
    expect(screen.getByText('Wpływy:')).toBeTruthy();
  });

  it('adds a passed class name', () => {
    render(<AccountRemainderCard {...ready} className="w-80" />);

    expect(screen.getByRole('button').className).toContain('w-80');
  });
});

describe('AccountRemainderCard loading', () => {
  it('keeps the toggle, marks it busy and replaces the amounts with skeletons', () => {
    const onSelect = vi.fn();
    render(<AccountRemainderCard status="loading" name="Konto wspólne" accountType="shared" selected onSelect={onSelect} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(button.getAttribute('aria-busy')).toBe('true');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.getAttribute('data-state')).toBe('loading');
    expect(button.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    expect(screen.getByText('Wczytywanie wyniku konta').className).toContain('sr-only');
    expect(button.querySelector('[data-slot="account-remainder-value"]')).toBeNull();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('AccountRemainderCard error', () => {
  it('shows the name, the badge and an announced inline error with a retry button', () => {
    const onRetry = vi.fn();
    render(<AccountRemainderCard status="error" name="Konto osobiste" accountType="personal" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(screen.getByRole('heading', { name: 'Konto osobiste' })).toBeTruthy();
    expect(screen.getByText('Osobiste')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Nie udało się wczytać wyniku konta');
    expect(screen.queryByRole('button', { pressed: false })).toBeNull();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('keeps the same border width as the toggle and shows the retrying state', () => {
    const { container } = render(
      <AccountRemainderCard status="error" name="Konto osobiste" accountType="personal" onRetry={vi.fn()} retrying className="w-80" />,
    );

    const card = container.querySelector('[data-slot="account-remainder-card"]') as HTMLElement;

    expect(card.className).toContain('border-2');
    expect(card.className).toContain('w-80');
    expect(card.getAttribute('data-state')).toBe('error');
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' }).getAttribute('aria-busy')).toBe('true');
  });
});
