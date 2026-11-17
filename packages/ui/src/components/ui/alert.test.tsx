import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Alert, AlertDescription, AlertTitle } from './alert';

afterEach(cleanup);

describe('Alert', () => {
  it('is a polite status region by default', () => {
    render(<Alert>Zapisano zmiany.</Alert>);

    const actual = screen.getByRole('status');

    expect(actual.getAttribute('data-variant')).toBe('neutral');
    expect(actual.className).toContain('border-border');
    expect(actual.className).toContain('text-foreground');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('is an assertive alert for the error variant', () => {
    render(<Alert variant="error">Nie udało się zalogować.</Alert>);

    const actual = screen.getByRole('alert');

    expect(actual.getAttribute('data-variant')).toBe('error');
    expect(actual.className).toContain('border-destructive');
    expect(actual.className).toContain('text-destructive');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('uses a bordered card surface without a shadow', () => {
    render(<Alert>Treść</Alert>);

    const actual = screen.getByRole('status');

    expect(actual.className).toContain('rounded-card');
    expect(actual.className).toContain('bg-card');
    expect(actual.className).toContain('p-(--space-panel)');
    expect(actual.className).not.toContain('shadow');
  });

  it('renders an optional title and a description', () => {
    render(
      <Alert variant="error">
        <AlertTitle>Nie udało się zalogować</AlertTitle>
        <AlertDescription>Sprawdź e-mail i hasło i spróbuj ponownie.</AlertDescription>
      </Alert>,
    );

    const title = screen.getByText('Nie udało się zalogować');
    const description = screen.getByText('Sprawdź e-mail i hasło i spróbuj ponownie.');

    expect(title.getAttribute('data-slot')).toBe('alert-title');
    expect(title.className).toContain('font-semibold');
    expect(description.getAttribute('data-slot')).toBe('alert-description');
    expect(description.className).toContain('font-normal');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Alert className="p-2">Treść</Alert>);

    const actual = screen.getByRole('status');

    expect(actual.className).toContain('p-2');
    expect(actual.className).not.toContain('space-panel');
  });
});
