import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TextLink } from './text-link';

afterEach(cleanup);

describe('TextLink', () => {
  it('renders an anchor with the action colour, a permanent underline and a hover colour', () => {
    render(<TextLink href="/login">Zaloguj się</TextLink>);

    const actual = screen.getByRole('link', { name: 'Zaloguj się' });

    expect(actual.tagName).toBe('A');
    expect(actual.getAttribute('href')).toBe('/login');
    expect(actual.getAttribute('data-slot')).toBe('text-link');
    expect(actual.className).toContain('text-primary');
    expect(actual.className).toContain('underline');
    expect(actual.className).toContain('hover:text-primary-hover');
    expect(actual.className).not.toContain('hover:no-underline');
    expect(actual.className).not.toContain('shadow');
  });

  it('keeps an external link in the same tab without extra attributes', () => {
    render(<TextLink href="https://example.com/pomoc">Pomoc</TextLink>);

    const actual = screen.getByRole('link', { name: 'Pomoc' });

    expect(actual.getAttribute('target')).toBeNull();
    expect(actual.getAttribute('rel')).toBeNull();
  });

  it('lets a passed class override a conflicting utility', () => {
    render(
      <TextLink href="/" className="text-foreground">
        Start
      </TextLink>,
    );

    const actual = screen.getByRole('link', { name: 'Start' });

    expect(actual.className).toContain('text-foreground');
    expect(actual.className).not.toContain('text-primary ');
  });

  it('renders the passed element with the link styles when used as a child', () => {
    render(
      <TextLink asChild>
        <button type="button">Wyloguj</button>
      </TextLink>,
    );

    const actual = screen.getByRole('button', { name: 'Wyloguj' });

    expect(actual.getAttribute('data-slot')).toBe('text-link');
    expect(actual.className).toContain('underline');
    expect(screen.queryByRole('link')).toBeNull();
  });
});
