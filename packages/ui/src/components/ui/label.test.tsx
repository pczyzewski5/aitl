import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Label } from './label';

afterEach(cleanup);

describe('Label', () => {
  it('renders a native label bound to its control', () => {
    render(
      <>
        <Label htmlFor="email">E-mail</Label>
        <input id="email" />
      </>,
    );

    const actual = screen.getByLabelText('E-mail');

    expect(actual.id).toBe('email');
    expect(screen.getByText('E-mail').tagName).toBe('LABEL');
    expect(screen.getByText('E-mail').getAttribute('data-slot')).toBe('label');
  });

  it('uses the 14 px semibold label style', () => {
    render(<Label>Kwota</Label>);

    const actual = screen.getByText('Kwota');

    expect(actual.className).toContain('text-sm');
    expect(actual.className).toContain('font-semibold');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Label className="text-muted-foreground">Kwota</Label>);

    const actual = screen.getByText('Kwota');

    expect(actual.className).toContain('text-muted-foreground');
    expect(actual.className).not.toContain('text-foreground');
  });
});
