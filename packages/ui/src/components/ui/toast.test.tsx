import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ToastProvider, useToast } from './toast';

afterEach(() => {
  cleanup();
  document.documentElement.style.removeProperty('--toast-duration');
});

interface Handles {
  toast: ReturnType<typeof useToast>['toast'];
  dismiss: ReturnType<typeof useToast>['dismiss'];
}

function renderProvider(): Handles {
  const handles = {} as Handles;
  function Capture() {
    const api = useToast();
    handles.toast = api.toast;
    handles.dismiss = api.dismiss;
    return null;
  }
  render(
    <ToastProvider closeLabel="Zamknij" viewportLabel="Powiadomienia ({hotkey})" announcementLabel="Powiadomienie">
      <p>Treść strony</p>
      <Capture />
    </ToastProvider>,
  );
  return handles;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe('Toast', () => {
  it('renders the page content and an empty viewport region named by the prop with the hotkey', () => {
    renderProvider();

    const actual = screen.getByRole('region', { name: 'Powiadomienia (F8)' });

    expect(screen.getByText('Treść strony')).toBeTruthy();
    expect(actual.querySelector('ol')?.getAttribute('data-slot')).toBe('toast-viewport');
    expect(screen.queryByRole('button', { name: 'Zamknij' })).toBeNull();
  });

  it('shows the message with a text close button and returns an id', () => {
    const handles = renderProvider();

    let actual = '';
    act(() => {
      actual = handles.toast({ message: 'Zapisano wpis Czynsz (przykład).' });
    });

    expect(actual).toBe('toast-1');
    expect(screen.getByText('Zapisano wpis Czynsz (przykład).').getAttribute('data-slot')).toBe('toast-message');
    expect(screen.getByRole('button', { name: 'Zamknij' }).textContent).toBe('Zamknij');
    expect(screen.getByRole('listitem').getAttribute('data-slot')).toBe('toast');
  });

  it('announces a confirmation politely with the localized label', async () => {
    const handles = renderProvider();

    act(() => {
      handles.toast({ message: 'Zapisano wpis.' });
    });

    await waitFor(() =>
      expect(document.querySelector('[role="status"][aria-live="polite"]')?.textContent).toBe('Powiadomienie Zapisano wpis.'),
    );
    expect(document.querySelector('[aria-live="assertive"]')).toBeNull();
  });

  it('announces assertively only when asked to', async () => {
    const handles = renderProvider();

    act(() => {
      handles.toast({ message: 'Nie udało się zsynchronizować.', announce: 'assertive' });
    });

    await waitFor(() =>
      expect(document.querySelector('[role="status"][aria-live="assertive"]')?.textContent).toBe(
        'Powiadomienie Nie udało się zsynchronizować.',
      ),
    );
    expect(document.querySelector('[aria-live="polite"]')).toBeNull();
  });

  it('does not move focus when a toast appears', () => {
    const handles = renderProvider();
    const before = document.activeElement;

    act(() => {
      handles.toast({ message: 'Zapisano wpis.' });
    });

    expect(document.activeElement).toBe(before);
  });

  it('shows one toast at a time and shows the queued one after the first is closed', async () => {
    const handles = renderProvider();

    act(() => {
      handles.toast({ message: 'Pierwszy' });
      handles.toast({ message: 'Drugi' });
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByText('Pierwszy')).toBeTruthy();
    expect(screen.queryByText('Drugi')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Zamknij' }));

    expect(await screen.findByText('Drugi')).toBeTruthy();
    expect(screen.queryByText('Pierwszy')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Zamknij' }));

    await waitFor(() => expect(screen.queryByRole('listitem')).toBeNull());
  });

  it('closes on Escape from the toast', async () => {
    const handles = renderProvider();
    act(() => {
      handles.toast({ message: 'Zapisano wpis.' });
    });

    fireEvent.keyDown(screen.getByRole('listitem'), { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('listitem')).toBeNull());
  });

  it('dismisses a toast by id, both a queued and the visible one', async () => {
    const handles = renderProvider();
    let visibleId = '';
    let queuedId = '';
    act(() => {
      visibleId = handles.toast({ message: 'Pierwszy' });
      queuedId = handles.toast({ message: 'Drugi' });
    });

    act(() => {
      handles.dismiss(queuedId);
      handles.dismiss(visibleId);
    });

    expect(screen.queryByRole('listitem')).toBeNull();
  });

  it('closes itself after the duration read from the token', async () => {
    document.documentElement.style.setProperty('--toast-duration', '150ms');
    const handles = renderProvider();

    act(() => {
      handles.toast({ message: 'Zapisano wpis.' });
    });

    expect(screen.getByText('Zapisano wpis.')).toBeTruthy();
    await waitFor(() => expect(screen.queryByText('Zapisano wpis.')).toBeNull(), { timeout: 2000 });
  });

  it('keeps the toast while the pointer is over the viewport', async () => {
    document.documentElement.style.setProperty('--toast-duration', '150ms');
    const handles = renderProvider();
    act(() => {
      handles.toast({ message: 'Zapisano wpis.' });
    });
    const region = screen.getByRole('region', { name: 'Powiadomienia (F8)' });

    fireEvent.pointerMove(region);
    await act(() => wait(500));

    expect(screen.getByText('Zapisano wpis.')).toBeTruthy();

    fireEvent.pointerLeave(region);

    await waitFor(() => expect(screen.queryByText('Zapisano wpis.')).toBeNull(), { timeout: 2000 });
  });

  it('keeps the toast while focus is inside the viewport', async () => {
    document.documentElement.style.setProperty('--toast-duration', '150ms');
    const handles = renderProvider();
    act(() => {
      handles.toast({ message: 'Zapisano wpis.' });
    });
    const close = screen.getByRole('button', { name: 'Zamknij' });

    act(() => {
      close.focus();
    });
    await act(() => wait(500));

    expect(screen.getByText('Zapisano wpis.')).toBeTruthy();

    fireEvent.click(close);

    await waitFor(() => expect(screen.queryByText('Zapisano wpis.')).toBeNull());
  });

  it('throws a clear error when the hook is used outside the provider', () => {
    function Orphan() {
      useToast();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow('useToast must be used inside ToastProvider');
  });
});
