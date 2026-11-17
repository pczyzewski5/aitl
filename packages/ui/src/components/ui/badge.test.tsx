import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge } from './badge';

afterEach(cleanup);

describe('Badge', () => {
  it('renders the neutral variant by default', () => {
    render(<Badge>Jednorazowy</Badge>);

    const actual = screen.getByText('Jednorazowy');

    expect(actual.tagName).toBe('SPAN');
    expect(actual.getAttribute('data-variant')).toBe('neutral');
    expect(actual.className).toContain('bg-background');
    expect(actual.className).toContain('text-foreground');
    expect(actual.className).toContain('rounded-pill');
  });

  it('renders the shared variant with the shared tokens', () => {
    render(<Badge variant="shared">Wspólne</Badge>);

    const actual = screen.getByText('Wspólne');

    expect(actual.getAttribute('data-variant')).toBe('shared');
    expect(actual.className).toContain('bg-badge-shared');
    expect(actual.className).toContain('text-badge-shared-foreground');
  });

  it('renders the personal variant with the personal tokens', () => {
    render(<Badge variant="personal">Osobiste</Badge>);

    const actual = screen.getByText('Osobiste');

    expect(actual.getAttribute('data-variant')).toBe('personal');
    expect(actual.className).toContain('bg-badge-personal');
    expect(actual.className).toContain('text-badge-personal-foreground');
  });

  it('is not interactive and has no weight 500 or shadow', () => {
    render(<Badge>Wspólne</Badge>);

    const actual = screen.getByText('Wspólne');

    expect(actual.className).toContain('font-normal');
    expect(actual.className).not.toContain('font-medium');
    expect(actual.className).not.toContain('shadow');
    expect(actual.hasAttribute('tabindex')).toBe(false);
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Badge className="px-4">Wspólne</Badge>);

    const actual = screen.getByText('Wspólne');

    expect(actual.className).toContain('px-4');
    expect(actual.className).not.toContain('px-2');
  });
});
