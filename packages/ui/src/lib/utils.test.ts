import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names and skips falsy values', () => {
    const actual = cn('p-4', false, undefined, null, ['text-sm'], { 'bg-card': true, 'bg-muted': false });

    expect(actual).toBe('p-4 text-sm bg-card');
  });

  it('keeps the last of two conflicting utilities', () => {
    const actual = cn('bg-primary', 'bg-muted');

    expect(actual).toBe('bg-muted');
  });

  it('treats the project radius names as one group', () => {
    const actual = cn('rounded-control', 'rounded-card');

    expect(actual).toBe('rounded-card');
  });

  it('treats the control size as a height and a width', () => {
    const actual = cn('h-9', 'h-control', 'w-4', 'w-control');

    expect(actual).toBe('h-control w-control');
  });
});
