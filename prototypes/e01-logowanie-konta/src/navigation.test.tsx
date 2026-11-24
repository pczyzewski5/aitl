import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NAVIGATE_EVENT, SCREEN_CHANGE_EVENT, SCREEN_IDS, SCREEN_TITLES, installNavigationGate, isScreenId, navigateTo, resolveScreen } from './navigation';
import type { ScreenId } from './navigation';
import { AccountScreen } from './screens/account-screen';
import { HomeScreen } from './screens/home-screen';
import { LoginScreen } from './screens/login-screen';
import { ReviewBar } from './review-bar';
import { getState, logIn, resetSimulation, setLoginUser, setTwoSessions } from './store';

function recordNavigation(): ScreenId[] {
  const visited: ScreenId[] = [];
  const listener = (event: Event): void => {
    visited.push((event as CustomEvent<ScreenId>).detail);
  };
  document.addEventListener(NAVIGATE_EVENT, listener);
  removeListeners.push(() => document.removeEventListener(NAVIGATE_EVENT, listener));

  return visited;
}

const removeListeners: Array<() => void> = [];

afterEach(() => {
  removeListeners.splice(0).forEach((remove) => remove());
  document.body.className = '';
});

function signIn(userId: 'pawel' | 'zona' = 'pawel'): void {
  resetSimulation();
  setLoginUser(userId);
  logIn();
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

describe('navigation gate, more routes', () => {
  afterEach(() => cleanup());

  it('sends a signed-in user from a link to s01 to s02', () => {
    signIn();
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));
    render(<a href="#s01">s01</a>);

    fireEvent.click(screen.getByRole('link', { name: 's01' }));

    expect(visited).toEqual(['s02']);
  });

  it('does not redirect when the requested screen is allowed', () => {
    signIn();
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));
    render(<a href="#s03">s03</a>);

    fireEvent.click(screen.getByRole('link', { name: 's03' }));

    expect(visited).toEqual([]);
  });

  it('gates a data-goto hotspot the same way as a link', () => {
    resetSimulation();
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));
    render(<button type="button" data-goto="s03">hotspot</button>);

    fireEvent.click(screen.getByRole('button', { name: 'hotspot' }));

    expect(visited).toEqual(['s01']);
  });

  it('ignores clicks on unknown targets and on non-screen links', () => {
    resetSimulation();
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));
    render(
      <>
        <a href="#other">other</a>
        <button type="button">plain</button>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'other' }));
    fireEvent.click(screen.getByRole('button', { name: 'plain' }));
    fireEvent.click(document);

    expect(visited).toEqual([]);
  });

  it('does not gate clicks on the page in comment mode, but still gates the review toolbar', () => {
    resetSimulation();
    document.body.classList.add('proto-comment');
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));
    render(
      <>
        <div className="doc-toolbar">
          <a href="#s02">toolbar</a>
        </div>
        <a href="#s02">page</a>
      </>,
    );

    fireEvent.click(screen.getByRole('link', { name: 'page' }));
    expect(visited).toEqual([]);

    fireEvent.click(screen.getByRole('link', { name: 'toolbar' }));
    expect(visited).toEqual(['s01']);
  });

  it('redirects a screen change made by the engine (hash, Back button)', () => {
    resetSimulation();
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));

    document.dispatchEvent(new CustomEvent(SCREEN_CHANGE_EVENT, { detail: 's02' }));
    document.dispatchEvent(new CustomEvent(SCREEN_CHANGE_EVENT, { detail: 's01' }));
    document.dispatchEvent(new CustomEvent(SCREEN_CHANGE_EVENT, { detail: 'nonsense' }));

    expect(visited).toEqual(['s01']);
  });

  it('sends a signed-in user away from s01 when the engine lands there', () => {
    signIn();
    const visited = recordNavigation();
    removeListeners.push(installNavigationGate(getState));

    document.dispatchEvent(new CustomEvent(SCREEN_CHANGE_EVENT, { detail: 's01' }));

    expect(visited).toEqual(['s02']);
  });

  it('stops listening after the returned remover is called', () => {
    resetSimulation();
    const visited = recordNavigation();
    const remove = installNavigationGate(getState);
    render(<a href="#s02">s02</a>);
    remove();

    fireEvent.click(screen.getByRole('link', { name: 's02' }));
    document.dispatchEvent(new CustomEvent(SCREEN_CHANGE_EVENT, { detail: 's02' }));

    expect(visited).toEqual([]);
  });
});

describe('screen registry and review bar navigation', () => {
  afterEach(() => cleanup());

  it('keeps the screen ids from the map and recognises only them', () => {
    expect(SCREEN_IDS).toEqual(['s01', 's02', 's03']);
    expect(isScreenId('s02')).toBe(true);
    expect(isScreenId('s04')).toBe(false);
    expect(isScreenId(null)).toBe(false);
  });

  it('lists every screen in the toolbar navigation with a link to its id', () => {
    resetSimulation();
    render(<ReviewBar />);

    const navigation = screen.getByRole('navigation', { name: 'Ekrany prototypu' });
    const links = Array.from(navigation.querySelectorAll('a'));

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#s01', '#s02', '#s03']);
    expect(links.map((link) => link.textContent)).toEqual(SCREEN_IDS.map((screenId) => SCREEN_TITLES[screenId]));
  });

  it('keeps the scenario panel inside a collapsed details element with a label', () => {
    resetSimulation();
    const { container } = render(<ReviewBar />);

    const details = container.querySelector('details.scenario-details');

    expect(details?.hasAttribute('open')).toBe(false);
    expect(details?.querySelector('summary')?.textContent).toContain('Scenariusze (symulacja)');
    expect(details?.querySelector('.scenario-panel')).not.toBeNull();
  });

  it('dispatches the navigate event for the requested screen', () => {
    const visited = recordNavigation();

    navigateTo('s03');

    expect(visited).toEqual(['s03']);
  });

  it('logs out from the account mock back to s01 and offers the way back to the list', () => {
    signIn();
    const visited = recordNavigation();
    render(<AccountScreen />);

    expect(screen.getByRole('heading', { level: 1, name: 'Ekran konta (nie wybrano konta z listy)' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Wróć do listy kont' }).getAttribute('href')).toBe('#s02');

    fireEvent.click(screen.getByRole('button', { name: 'Wyloguj' }));

    expect(getState().sessionUserId).toBeNull();
    expect(visited).toEqual(['s01']);
  });

  it('shows the pending sign-in hint on s02 without a session and follows the two-session switch', () => {
    resetSimulation();
    const { rerender } = render(<HomeScreen />);

    expect(screen.getByText(/Brak sesji: w aplikacji ten adres przekierowuje na s01/)).toBeTruthy();

    act(() => setTwoSessions(true));
    rerender(<HomeScreen />);

    expect(screen.queryByText(/Brak sesji/)).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Wyloguj' })).toHaveLength(2);
    expect(resolveScreen('s02', getState())).toBe('s02');
  });
});
