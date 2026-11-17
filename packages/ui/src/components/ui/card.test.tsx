import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Card, CardContent, CardHeader, CardTitle } from './card';

afterEach(cleanup);

describe('Card', () => {
  it('renders a bordered surface with token spacing and no shadow class', () => {
    render(<Card data-testid="card">Treść</Card>);

    const actual = screen.getByTestId('card');

    expect(actual.getAttribute('data-slot')).toBe('card');
    expect(actual.className).toContain('bg-card');
    expect(actual.className).toContain('border-border');
    expect(actual.className).toContain('rounded-card');
    expect(actual.className).toContain('p-(--space-panel)');
    expect(actual.className).toContain('gap-(--space-card-gap)');
    expect(actual.className).not.toContain('shadow');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(
      <Card data-testid="card" className="p-2">
        Treść
      </Card>,
    );

    const actual = screen.getByTestId('card');

    expect(actual.className).toContain('p-2');
    expect(actual.className).not.toContain('space-panel');
  });

  it('renders the header and content slots', () => {
    render(
      <Card>
        <CardHeader data-testid="header">
          <CardTitle>Konto wspólne</CardTitle>
        </CardHeader>
        <CardContent data-testid="content">Saldo</CardContent>
      </Card>,
    );

    expect(screen.getByTestId('header').getAttribute('data-slot')).toBe('card-header');
    expect(screen.getByTestId('content').getAttribute('data-slot')).toBe('card-content');
  });

  it('renders the title as an h3 by default', () => {
    render(<CardTitle>Konto wspólne</CardTitle>);

    const actual = screen.getByRole('heading', { name: 'Konto wspólne' });

    expect(actual.tagName).toBe('H3');
    expect(actual.className).toContain('font-semibold');
  });

  it('renders the title at the requested heading level', () => {
    render(<CardTitle as="h2">Konta</CardTitle>);

    const actual = screen.getByRole('heading', { name: 'Konta', level: 2 });

    expect(actual.tagName).toBe('H2');
  });
});
