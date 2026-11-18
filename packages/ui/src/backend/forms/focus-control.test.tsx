import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { focusControl } from './focus-control';

afterEach(cleanup);

describe('focusControl', () => {
  it('focuses a focusable element directly', () => {
    render(<input aria-label="Kwota" />);

    focusControl(screen.getByLabelText('Kwota'));

    expect(document.activeElement).toBe(screen.getByLabelText('Kwota'));
  });

  it('focuses the tabbable item inside a group container', () => {
    render(
      <div data-testid="group">
        <button type="button" tabIndex={-1}>
          Wpływ
        </button>
        <button type="button" tabIndex={0}>
          Wydatek
        </button>
      </div>,
    );

    focusControl(screen.getByTestId('group'));

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Wydatek' }));
  });

  it('falls back to the first focusable descendant when none is tabbable', () => {
    render(
      <div data-testid="group">
        <input aria-label="Pierwsze" tabIndex={-1} />
      </div>,
    );

    focusControl(screen.getByTestId('group'));

    expect(document.activeElement).toBe(screen.getByLabelText('Pierwsze'));
  });

  it('does nothing for a missing element', () => {
    render(<input aria-label="Kwota" />);

    focusControl(null);

    expect(document.activeElement).toBe(document.body);
  });

  it('does nothing for a container without focusable descendants', () => {
    render(<div data-testid="empty" />);

    focusControl(screen.getByTestId('empty'));

    expect(document.activeElement).toBe(document.body);
  });
});
