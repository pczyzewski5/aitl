import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NAVIGATE_EVENT, installNavigationGate, resolveScreen } from './navigation';
import type { ScreenId } from './navigation';
import { AccountScreen } from './screens/account-screen';
import { HomeScreen } from './screens/home-screen';
import { LoginScreen } from './screens/login-screen';
import { getState, resetSimulation, setLoginUser } from './store';

function recordNavigation(): ScreenId[] {
  const visited: ScreenId[] = [];
  document.addEventListener(NAVIGATE_EVENT, (event) => {
    visited.push((event as CustomEvent<ScreenId>).detail);
  });

  return visited;
}

describe('resolveScreen', () => {
  beforeEach(() => resetSimulation());

  it('sends a visitor without session to s01', () => {
    expect(resolveScreen('s02', getState())).toBe('s01');
    expect(resolveScreen('s03', getState())).toBe('s01');
    expect(resolveScreen('s01', getState())).toBe('s01');
  });

  it('sends a signed-in user from s01 to s02 and lets other screens through', () => {
    setLoginUser('zona');
    const signedIn = { ...getState(), sessionUserId: 'zona' as const };

    expect(resolveScreen('s01', signedIn)).toBe('s02');
    expect(resolveScreen('s02', signedIn)).toBe('s02');
    expect(resolveScreen('s03', signedIn)).toBe('s03');
  });
});

describe('happy path s01 -> s02 -> s03 -> logout', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('logs in, lists accounts shared first, opens the account mock and logs out', async () => {
    vi.useFakeTimers();
    resetSimulation();
    const visited = recordNavigation();
    render(
      <>
        <LoginScreen />
        <HomeScreen />
        <AccountScreen />
      </>,
    );

    fireEvent.change(screen.getByLabelText('Adres e-mail'), { target: { value: 'pawel@example.com' } });
    fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: 'przyklad' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Zaloguj się' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(getState().sessionUserId).toBe('pawel');
    expect(visited).toEqual(['s02']);
    const names = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(names[0]).toContain('Konto wspólne (przykład)');
    expect(names[1]).toContain('Konto osobiste Pawła (przykład)');

    fireEvent.click(screen.getByRole('link', { name: 'Konto osobiste Pawła (przykład)' }));
    expect(getState().openedAccountId).toBe('a2');
    expect(screen.getByRole('heading', { level: 1, name: 'Konto osobiste Pawła (przykład)' })).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: 'Wyloguj' })[0] as HTMLElement);
    expect(getState().sessionUserId).toBeNull();
    expect(visited).toEqual(['s02', 's01']);
  });
});

describe('navigation gate', () => {
  afterEach(() => cleanup());

  it('redirects a click on a screen link to s01 when there is no session', () => {
    resetSimulation();
    const visited = recordNavigation();
    const remove = installNavigationGate(getState);
    render(<a href="#s02">s02</a>);

    fireEvent.click(screen.getByRole('link', { name: 's02' }));

    expect(visited).toEqual(['s01']);
    remove();
  });
});
