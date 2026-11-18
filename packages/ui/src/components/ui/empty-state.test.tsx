import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EmptyState, type StateTitleLevel } from './empty-state';

afterEach(cleanup);

describe('EmptyState', () => {
  it('renders a level 3 heading by default and no live role', () => {
    render(<EmptyState title="Brak wpisów w tym miesiącu" />);

    const actual = screen.getByRole('heading', { level: 3, name: 'Brak wpisów w tym miesiącu' });

    expect(actual.getAttribute('data-slot')).toBe('empty-state-title');
    expect(actual.className).toContain('font-semibold');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each<{ titleLevel: StateTitleLevel; level: number }>([
    { titleLevel: 'h2', level: 2 },
    { titleLevel: 'h3', level: 3 },
    { titleLevel: 'h4', level: 4 },
  ])('renders $titleLevel as heading level $level', ({ titleLevel, level }) => {
    render(<EmptyState title="Brak kont" titleLevel={titleLevel} />);

    const actual = screen.getByRole('heading', { level });

    expect(actual.textContent).toBe('Brak kont');
  });

  it('renders a muted description only when it is passed', () => {
    const { rerender } = render(<EmptyState title="Brak kont" />);

    expect(document.querySelector('[data-slot="empty-state-description"]')).toBeNull();

    rerender(<EmptyState title="Brak kont" description="Konta pojawią się tutaj." />);

    const actual = screen.getByText('Konta pojawią się tutaj.');

    expect(actual.className).toContain('text-muted-foreground');
    expect(actual.className).toContain('max-w-prose');
  });

  it('renders no button without an action', () => {
    render(<EmptyState title="Brak kont" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('calls the action when its button is clicked', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Brak wpisów" action={{ label: 'Dodaj wpis', onClick }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Dodaj wpis' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('lets a passed class and attributes reach the container', () => {
    render(<EmptyState title="Brak kont" className="gap-4" data-testid="empty" />);

    const actual = screen.getByTestId('empty');

    expect(actual.getAttribute('data-slot')).toBe('empty-state');
    expect(actual.className).toContain('gap-4');
    expect(actual.className).not.toContain('space-within-group');
  });
});
