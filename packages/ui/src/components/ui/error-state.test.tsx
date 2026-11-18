import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StateTitleLevel } from './empty-state';
import { ErrorState } from './error-state';

afterEach(cleanup);

describe('ErrorState', () => {
  it('renders a level 3 heading, a description and a retry button without a live role by default', () => {
    render(
      <ErrorState
        title="Nie udało się wczytać wpisów"
        description="Sprawdź połączenie i spróbuj ponownie."
        retryLabel="Spróbuj ponownie"
        onRetry={vi.fn()}
      />,
    );

    const heading = screen.getByRole('heading', { level: 3, name: 'Nie udało się wczytać wpisów' });
    const description = screen.getByText('Sprawdź połączenie i spróbuj ponownie.');

    expect(heading.getAttribute('data-slot')).toBe('error-state-title');
    expect(description.className).toContain('text-muted-foreground');
    expect(screen.getByRole('button', { name: 'Spróbuj ponownie' })).not.toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('is an assertive alert when it is announced', () => {
    render(<ErrorState title="Nie udało się wczytać wpisów" retryLabel="Spróbuj ponownie" onRetry={vi.fn()} announce />);

    const actual = screen.getByRole('alert');

    expect(actual.getAttribute('data-slot')).toBe('error-state');
  });

  it('renders the description only when it is passed', () => {
    render(<ErrorState title="Błąd" retryLabel="Ponów" onRetry={vi.fn()} />);

    expect(document.querySelector('[data-slot="error-state-description"]')).toBeNull();
  });

  it.each<{ titleLevel: StateTitleLevel; level: number }>([
    { titleLevel: 'h2', level: 2 },
    { titleLevel: 'h4', level: 4 },
  ])('renders $titleLevel as heading level $level', ({ titleLevel, level }) => {
    render(<ErrorState title="Błąd" retryLabel="Ponów" onRetry={vi.fn()} titleLevel={titleLevel} />);

    expect(screen.getByRole('heading', { level })).not.toBeNull();
  });

  it('calls onRetry when the retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Błąd" retryLabel="Spróbuj ponownie" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('marks the retry button busy and ignores clicks while retrying', () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Błąd" retryLabel="Ponawianie…" onRetry={onRetry} retrying />);

    const actual = screen.getByRole('button', { name: 'Ponawianie…' });
    fireEvent.click(actual);

    expect(actual.getAttribute('aria-busy')).toBe('true');
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('lets a passed class reach the container', () => {
    render(<ErrorState title="Błąd" retryLabel="Ponów" onRetry={vi.fn()} className="gap-4" data-testid="error" />);

    const actual = screen.getByTestId('error');

    expect(actual.className).toContain('gap-4');
    expect(actual.className).not.toContain('space-within-group');
  });
});
