import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { probeAccountById } from './api-probe';
import { NAVIGATE_EVENT, resolveScreen } from './navigation';
import type { ScreenId } from './navigation';
import { ReviewBar } from './review-bar';
import { AccountScreen } from './screens/account-screen';
import { HomeScreen } from './screens/home-screen';
import { LoginScreen } from './screens/login-screen';
import { getState, logIn, resetSimulation, setListScenario, setLoginOutcome, setLoginUser, setNameStyle, setSharedCount, setTwoSessions } from './store';

const INVALID_CREDENTIALS_TEXT = 'Nie udało się zalogować. Sprawdź adres e-mail i hasło, a potem spróbuj ponownie.';
const LOCK_TEXT = 'Zbyt wiele prób logowania. Spróbuj ponownie za 900 sekund.';
const NETWORK_TEXT_FRAGMENT = 'Nie udało się połączyć z serwerem';
const SERVER_TEXT_FRAGMENT = 'Coś poszło nie tak po naszej stronie';
const LONG_NAME = 'KontoWspólneRodzinyKowalskichNowakówNaWydatkiDomoweRachunkiIWakacje (przykład)';

const visited: ScreenId[] = [];
const recordNavigation = (event: Event): void => {
  visited.push((event as CustomEvent<ScreenId>).detail);
};

function renderAllScreens() {
  return render(
    <>
      <ReviewBar />
      <LoginScreen />
      <HomeScreen />
      <AccountScreen />
    </>,
  );
}

async function submitLogin(email = 'pawel@example.com'): Promise<void> {
  fireEvent.change(screen.getByLabelText('Adres e-mail'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Hasło'), { target: { value: 'przyklad' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Zaloguj się' }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000);
  });
}

function chooseScenario(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function listItemTexts(): string[] {
  return screen.getAllByRole('listitem').map((item) => item.textContent ?? '');
}

beforeEach(() => {
  vi.useFakeTimers();
  resetSimulation();
  visited.length = 0;
  document.addEventListener(NAVIGATE_EVENT, recordNavigation);
});

afterEach(() => {
  cleanup();
  document.removeEventListener(NAVIGATE_EVENT, recordNavigation);
  vi.useRealTimers();
});

describe('login outcomes', () => {
  it.each([
    ['wrong-password', 'pawel@example.com'],
    ['unknown-email', 'nikt@example.com'],
  ] as const)('shows the same generic message for %s, keeps the typed data and focuses the e-mail field', async (outcome, email) => {
    renderAllScreens();
    chooseScenario('Wynik logowania', outcome);

    await submitLogin(email);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(screen.getByText(INVALID_CREDENTIALS_TEXT)).toBeTruthy();
    expect((screen.getByLabelText('Adres e-mail') as HTMLInputElement).value).toBe(email);
    expect((screen.getByLabelText('Hasło') as HTMLInputElement).value).toBe('przyklad');
    expect(document.activeElement).toBe(screen.getByLabelText('Adres e-mail'));
    expect(getState().sessionUserId).toBeNull();
    expect(getState().failedAttempts).toBe(1);
  });

  it('locks after five failed attempts with a static time, even for correct data, until logout or reset', async () => {
    renderAllScreens();
    chooseScenario('Wynik logowania', 'wrong-password');

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      await submitLogin();
      expect(screen.getByText(INVALID_CREDENTIALS_TEXT)).toBeTruthy();
    }
    await submitLogin();

    expect(screen.getByText(LOCK_TEXT)).toBeTruthy();
    expect(getState().failedAttempts).toBe(5);

    chooseScenario('Wynik logowania', 'ok');
    await submitLogin();

    expect(screen.getByText(LOCK_TEXT)).toBeTruthy();
    expect(getState().sessionUserId).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Resetuj symulację' }));
    expect(getState().failedAttempts).toBe(0);
    expect(visited).toEqual(['s01']);
  });

  it('shows the lock message directly for the "too many attempts" outcome', async () => {
    renderAllScreens();
    chooseScenario('Wynik logowania', 'locked');

    await submitLogin();

    expect(screen.getByText(LOCK_TEXT)).toBeTruthy();
    expect(getState().failedAttempts).toBe(0);
  });

  it('shows the network message and keeps the typed data', async () => {
    renderAllScreens();
    chooseScenario('Wynik logowania', 'network');

    await submitLogin();

    expect(screen.getByText(new RegExp(NETWORK_TEXT_FRAGMENT))).toBeTruthy();
    expect((screen.getByLabelText('Adres e-mail') as HTMLInputElement).value).toBe('pawel@example.com');
  });

  it('shows the assumed server error text for the 500 outcome and keeps the typed data', async () => {
    renderAllScreens();
    chooseScenario('Wynik logowania', 'server');

    await submitLogin();

    expect(screen.getByText(new RegExp(SERVER_TEXT_FRAGMENT))).toBeTruthy();
    expect(screen.queryByText(new RegExp(NETWORK_TEXT_FRAGMENT))).toBeNull();
    expect((screen.getByLabelText('Hasło') as HTMLInputElement).value).toBe('przyklad');
  });

  it('shows validation errors without calling the simulated service', async () => {
    renderAllScreens();

    fireEvent.submit(screen.getByRole('button', { name: 'Zaloguj się' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(screen.getByText('Popraw dane logowania, żeby się zalogować')).toBeTruthy();
    expect(getState().sessionUserId).toBeNull();
  });

  it('signs in as the chosen demo user and resets the attempts counter', async () => {
    renderAllScreens();
    setLoginUser('zona');

    await submitLogin('zona@example.com');

    expect(getState().sessionUserId).toBe('zona');
    expect(getState().sessionStatus).toBe('active');
    expect(visited).toEqual(['s02']);
    expect(listItemTexts()).toHaveLength(1);
  });
});

describe('session state', () => {
  it.each([
    ['Wygaś sesję: 30 dni nieaktywności', 'expired-30'],
    ['Wygaś sesję: 90 dni od logowania', 'expired-90'],
  ] as const)('"%s" ends the session without a message and redirects to s01', (buttonName, status) => {
    renderAllScreens();
    act(() => logIn());

    fireEvent.click(screen.getByRole('button', { name: buttonName }));

    expect(getState().sessionUserId).toBeNull();
    expect(getState().sessionStatus).toBe(status);
    expect(visited).toEqual(['s01']);
    expect(screen.queryByText(/sesja wygasła/i)).toBeNull();
  });

  it('disables the expiry buttons without a session', () => {
    renderAllScreens();

    expect((screen.getByRole('button', { name: 'Wygaś sesję: 30 dni nieaktywności' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: 'Wygaś sesję: 90 dni od logowania' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('reports a logged-out session after the logout button', () => {
    renderAllScreens();
    act(() => logIn());

    fireEvent.click(screen.getAllByRole('button', { name: 'Wyloguj' })[0] as HTMLElement);

    expect(getState().sessionStatus).toBe('logged-out');
    expect(screen.getByText(/Sesja: wylogowana/)).toBeTruthy();
  });
});

describe('account list states', () => {
  it('shows the skeleton and no accounts while loading', () => {
    render(<HomeScreen />);
    act(() => {
      logIn();
      setListScenario('loading');
    });

    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('shows the empty state for the empty scenario and for a user without memberships', () => {
    render(<HomeScreen />);
    act(() => {
      logIn();
      setListScenario('empty');
    });
    expect(screen.getByText('Nie masz jeszcze żadnego konta bankowego')).toBeTruthy();

    act(() => {
      setListScenario('loaded');
      setLoginUser('gosc');
      logIn();
    });
    expect(screen.getByText('Nie masz jeszcze żadnego konta bankowego')).toBeTruthy();
  });

  it('shows the error with a retry that loads the list again', () => {
    render(<HomeScreen />);
    act(() => {
      logIn();
      setListScenario('error');
    });
    expect(screen.getByText('Nie udało się wczytać kont bankowych')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Spróbuj ponownie/ }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(getState().listScenario).toBe('loaded');
    expect(listItemTexts()).toHaveLength(2);
  });

  it('shows a long account name and two shared accounts in order: shared first, then personal', () => {
    render(<HomeScreen />);
    act(() => {
      logIn();
      setNameStyle('long');
      setSharedCount(2);
    });

    const names = listItemTexts();

    expect(names).toHaveLength(3);
    expect(names[0]).toContain('Konto wspólne: wakacje (przykład)');
    expect(names[1]).toContain(LONG_NAME);
    expect(names[2]).toContain('Konto osobiste Pawła (przykład)');
  });

  it('shows only the shared accounts for the wife', () => {
    render(<HomeScreen />);
    act(() => {
      setLoginUser('zona');
      logIn();
      setSharedCount(2);
    });

    expect(listItemTexts().every((text) => text.includes('Wspólne'))).toBe(true);
    expect(listItemTexts()).toHaveLength(2);
  });

  it('opens the long-named account on the mock screen', () => {
    render(
      <>
        <HomeScreen />
        <AccountScreen />
      </>,
    );
    act(() => {
      logIn();
      setNameStyle('long');
    });

    fireEvent.click(screen.getByRole('link', { name: LONG_NAME }));

    expect(getState().openedAccountId).toBe('a1');
    expect(screen.getByRole('heading', { level: 1, name: LONG_NAME })).toBeTruthy();
  });
});

describe('two sessions at once', () => {
  it('shows the owner and the wife side by side and signs out each independently', () => {
    render(<HomeScreen />);
    act(() => setTwoSessions(true));

    const [ownerLogout, wifeLogout] = screen.getAllByRole('button', { name: 'Wyloguj' }) as HTMLElement[];
    expect(listItemTexts()).toHaveLength(3);

    fireEvent.click(ownerLogout as HTMLElement);

    expect(screen.getByText('Paweł (przykład): wylogowano w tej ramce')).toBeTruthy();
    expect(listItemTexts()).toHaveLength(1);
    expect(within(document.body).getByText('Żona (przykład)')).toBeTruthy();
    expect(wifeLogout).toBeTruthy();
  });

  it('is reachable from the scenario panel and returns to s01 when switched off without a session', () => {
    renderAllScreens();

    chooseScenario('Dwie sesje naraz', 'on');
    expect(visited).toEqual(['s02']);
    expect(getState().twoSessions).toBe(true);

    chooseScenario('Dwie sesje naraz', 'off');
    expect(visited).toEqual(['s02', 's01']);
  });

  it('lets s02 through without a main session only while the two-session view is on', () => {
    expect(resolveScreen('s02', getState())).toBe('s01');
    expect(resolveScreen('s02', { ...getState(), twoSessions: true })).toBe('s02');
    expect(resolveScreen('s03', { ...getState(), twoSessions: true })).toBe('s01');
  });
});

describe('scenario panel controls', () => {
  it('wires every selector to the shared state', () => {
    renderAllScreens();

    chooseScenario('Kto się loguje', 'gosc');
    chooseScenario('Wynik logowania', 'network');
    chooseScenario('Lista kont', 'error');
    chooseScenario('Nazwa konta wspólnego', 'long');
    chooseScenario('Liczba kont wspólnych', '2');

    expect(getState().loginUserId).toBe('gosc');
    expect(getState().loginOutcome).toBe('network');
    expect(getState().listScenario).toBe('error');
    expect(getState().accountOptions).toEqual({ nameStyle: 'long', sharedCount: 2 });

    chooseScenario('Liczba kont wspólnych', '1');
    expect(getState().accountOptions.sharedCount).toBe(1);
  });

  it('prints the API indicator for own, foreign and no-session requests', () => {
    renderAllScreens();
    act(() => logIn());

    fireEvent.click(screen.getByRole('button', { name: 'Wyślij żądanie (symulacja)' }));
    expect(screen.getByText(/: 200, własne konto/)).toBeTruthy();

    chooseScenario('Żądanie konta po id (tylko API)', 'foreign');
    fireEvent.click(screen.getByRole('button', { name: 'Wyślij żądanie (symulacja)' }));
    expect(screen.getByText(/: 403, konto innego użytkownika/)).toBeTruthy();

    chooseScenario('Żądanie konta po id (tylko API)', 'no-session');
    fireEvent.click(screen.getByRole('button', { name: 'Wyślij żądanie (symulacja)' }));
    expect(screen.getByText(/bez sesji: 401/)).toBeTruthy();
  });

  it('reset restores all scenario values', () => {
    renderAllScreens();
    act(() => {
      setLoginOutcome('server');
      setListScenario('empty');
      setTwoSessions(true);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Resetuj symulację' }));

    expect(getState().loginOutcome).toBe('ok');
    expect(getState().listScenario).toBe('loaded');
    expect(getState().twoSessions).toBe(false);
  });
});

describe('probeAccountById', () => {
  it('answers 401 without a session, whatever was asked', () => {
    expect(probeAccountById('own', null)).toContain('401');
    expect(probeAccountById('foreign', null)).toContain('401');
    expect(probeAccountById('no-session', 'pawel')).toContain('401');
  });

  it('answers 200 for an own account and says so when the user has none', () => {
    expect(probeAccountById('own', 'pawel')).toContain('200');
    expect(probeAccountById('own', 'zona')).toContain('a1');
    expect(probeAccountById('own', 'gosc')).toContain('nie ma własnego konta');
  });

  it('answers 403 for foreign accounts, naming the owner personal account for the wife', () => {
    expect(probeAccountById('foreign', 'zona')).toContain('a2: 403');
    expect(probeAccountById('foreign', 'pawel')).toContain('a9: 403');
  });
});
