import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LoadingMessage } from './loading-message';

afterEach(cleanup);

describe('LoadingMessage', () => {
  it('renders the default text as a polite status', () => {
    render(<LoadingMessage />);

    const actual = screen.getByRole('status');

    expect(actual.textContent).toBe('Ładowanie…');
  });

  it('renders a custom message and forwards the class name and attributes', () => {
    render(<LoadingMessage message="Wczytywanie kont…" className="extra" id="accounts-loading" />);

    const actual = screen.getByRole('status');

    expect(actual.textContent).toBe('Wczytywanie kont…');
    expect(actual.className).toContain('extra');
    expect(actual.id).toBe('accounts-loading');
  });
});
