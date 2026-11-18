import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, buttonVariants } from './button';

afterEach(cleanup);

describe('Button', () => {
  it('renders a native button with the default variant and size', () => {
    render(<Button>Zapisz</Button>);

    const actual = screen.getByRole('button', { name: 'Zapisz' });

    expect(actual.tagName).toBe('BUTTON');
    expect(actual.getAttribute('data-variant')).toBe('default');
    expect(actual.getAttribute('data-size')).toBe('default');
    expect(actual.className).toContain('bg-primary');
  });

  it.each([
    { variant: 'secondary', expectedClass: 'bg-muted' },
    { variant: 'ghost', expectedClass: 'bg-transparent' },
    { variant: 'destructive', expectedClass: 'bg-destructive' },
  ] as const)('applies the $variant variant', ({ variant, expectedClass }) => {
    render(<Button variant={variant}>Akcja</Button>);

    const actual = screen.getByRole('button', { name: 'Akcja' });

    expect(actual.getAttribute('data-variant')).toBe(variant);
    expect(actual.className).toContain(expectedClass);
  });

  it('darkens the destructive variant on hover only when it is enabled', () => {
    render(<Button variant="destructive">Usuń wpis</Button>);

    const actual = screen.getByRole('button', { name: 'Usuń wpis' }).className;

    expect(actual).toContain('enabled:not-aria-disabled:hover:bg-destructive-hover');
  });

  it('applies the icon size', () => {
    render(
      <Button size="icon" aria-label="Poprzedni miesiąc">
        ‹
      </Button>,
    );

    const actual = screen.getByRole('button', { name: 'Poprzedni miesiąc' });

    expect(actual.getAttribute('data-size')).toBe('icon');
    expect(actual.className).toContain('size-control');
  });

  it('lets a passed class override a conflicting utility', () => {
    render(<Button className="rounded-card">Zapisz</Button>);

    const actual = screen.getByRole('button', { name: 'Zapisz' });

    expect(actual.className).toContain('rounded-card');
    expect(actual.className).not.toContain('rounded-control');
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Zapisz</Button>);

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fail when clicked without an onClick handler', () => {
    render(<Button>Zapisz</Button>);

    const actual = fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(actual).toBe(true);
  });

  it('does not call onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Zapisz
      </Button>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks a loading button as busy and ignores clicks', () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Zapisywanie…
      </Button>,
    );

    const actual = screen.getByRole('button', { name: 'Zapisywanie…' });
    const notPrevented = fireEvent.click(actual);

    expect(actual.getAttribute('aria-busy')).toBe('true');
    expect(actual.getAttribute('aria-disabled')).toBe('true');
    expect(notPrevented).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('omits the busy attributes when not loading', () => {
    render(<Button>Zapisz</Button>);

    const actual = screen.getByRole('button', { name: 'Zapisz' });

    expect(actual.hasAttribute('aria-busy')).toBe(false);
    expect(actual.hasAttribute('aria-disabled')).toBe(false);
  });

  it('renders its child element when asChild is set', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/login">Wróć do logowania</a>
      </Button>,
    );

    const actual = screen.getByRole('link', { name: 'Wróć do logowania' });

    expect(actual.getAttribute('href')).toBe('/login');
    expect(actual.getAttribute('data-variant')).toBe('secondary');
  });
});

describe('buttonVariants', () => {
  it('returns the class names for a variant and size', () => {
    const actual = buttonVariants({ variant: 'ghost', size: 'icon' });

    expect(actual).toContain('size-control');
    expect(actual).toContain('bg-transparent');
  });
});
