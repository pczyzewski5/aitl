import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Skeleton } from './skeleton';

afterEach(cleanup);

describe('Skeleton', () => {
  it('renders a static muted block hidden from assistive technology', () => {
    const { container } = render(<Skeleton />);

    const actual = container.querySelector('[data-slot="skeleton"]');

    expect(actual?.getAttribute('aria-hidden')).toBe('true');
    expect(actual?.className).toContain('bg-muted');
    expect(actual?.className).toContain('rounded-control');
    expect(actual?.className).toContain('h-4');
    expect(actual?.className).toContain('w-full');
  });

  it('has no animation or shadow classes', () => {
    const { container } = render(<Skeleton />);

    const actual = container.querySelector('[data-slot="skeleton"]');

    expect(actual?.className).not.toContain('animate');
    expect(actual?.className).not.toContain('pulse');
    expect(actual?.className).not.toContain('shadow');
  });

  it('lets a passed class override the default size', () => {
    const { container } = render(<Skeleton className="h-6 w-1/2" />);

    const actual = container.querySelector('[data-slot="skeleton"]');

    expect(actual?.className).toContain('h-6');
    expect(actual?.className).toContain('w-1/2');
    expect(actual?.className).not.toContain('h-4');
    expect(actual?.className).not.toContain('w-full');
  });
});
