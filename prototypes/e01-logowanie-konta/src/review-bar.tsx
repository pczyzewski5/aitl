import { Alert, AlertDescription, Badge, Button, Select } from '@aitl/ui';
import type { SelectOption } from '@aitl/ui';
import { useId, useState } from 'react';
import { ID_PROBE_LABELS, probeAccountById } from './api-probe';
import { DEMO_NOW_LABEL, DEMO_USERS, MAX_FAILED_ATTEMPTS, SESSION_STARTED_LABEL, USER_IDS, USER_ROLE_LABELS } from './fixtures';
import type { AccountNameStyle, SharedAccountCount, UserId } from './fixtures';
import { SCREEN_IDS, SCREEN_TITLES, navigateTo } from './navigation';
import {
  expireSession,
  getState,
  resetSimulation,
  setIdProbeResult,
  setListScenario,
  setLoginOutcome,
  setLoginUser,
  setNameStyle,
  setSharedCount,
  setTwoSessions,
  useScenario,
} from './store';
import type { IdProbeKind, ListScenario, LoginOutcome, SessionStatus } from './store';

type Theme = 'light' | 'dark';

const LOGIN_USER_OPTIONS: SelectOption[] = USER_IDS.map((userId) => ({ value: userId, label: USER_ROLE_LABELS[userId] }));

const LOGIN_OUTCOME_LABELS: Record<LoginOutcome, string> = {
  ok: 'Poprawne dane',
  'wrong-password': 'Złe hasło',
  'unknown-email': 'Nieznany e-mail (ten sam komunikat)',
  locked: 'Zbyt wiele prób (blokada, 900 s)',
  network: 'Brak sieci',
  server: 'Błąd serwera 500 (założenie)',
};

const LIST_SCENARIO_LABELS: Record<ListScenario, string> = {
  loaded: 'Wczytane',
  loading: 'Ładowanie (zatrzymane)',
  empty: 'Pusta (brak kont)',
  error: 'Błąd wczytania',
};

const NAME_STYLE_LABELS: Record<AccountNameStyle, string> = { short: 'Krótka', long: 'Bardzo długa' };
const SHARED_COUNT_LABELS: Record<`${SharedAccountCount}`, string> = { '1': 'Jedno konto wspólne', '2': 'Dwa konta wspólne' };
const TWO_SESSIONS_LABELS = { off: 'Wyłączone', on: 'Obok siebie: Paweł i Żona' };

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  none: 'brak sesji',
  active: `aktywna (założona ${SESSION_STARTED_LABEL})`,
  'expired-30': 'wygasła po 30 dniach nieaktywności (bez komunikatu, P4)',
  'expired-90': 'wygasła po 90 dniach od logowania (bez komunikatu, P4)',
  'logged-out': 'wylogowana (bez komunikatu)',
};

const ID_PROBE_KINDS: IdProbeKind[] = ['own', 'foreign', 'no-session'];

function toOptions<Value extends string>(labels: Record<Value, string>): SelectOption[] {
  return (Object.keys(labels) as Value[]).map((value) => ({ value, label: labels[value] }));
}

function isUserId(value: string): value is UserId {
  return value in DEMO_USERS;
}

function isKeyOf<Value extends string>(labels: Record<Value, string>, value: string): value is Value {
  return value in labels;
}

function resetAndRedirect(): void {
  resetSimulation();
  navigateTo('s01');
}

function toggleTwoSessions(enabled: boolean): void {
  setTwoSessions(enabled);
  navigateTo(enabled || getState().sessionUserId !== null ? 's02' : 's01');
}

function expireAndRedirect(reason: 'expired-30' | 'expired-90'): void {
  expireSession(reason);
  navigateTo('s01');
}

interface ScenarioSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

function ScenarioSelect({ label, value, options, onChange }: ScenarioSelectProps) {
  const selectId = useId();

  return (
    <div className="scenario-control">
      <label htmlFor={selectId}>{label}</label>
      <Select id={selectId} options={options} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ScenarioPanel() {
  const scenario = useScenario();
  const [idProbeKind, setIdProbeKind] = useState<IdProbeKind>('own');
  const hasSession = scenario.sessionUserId !== null;
  const loggedInAs = scenario.sessionUserId === null ? 'nikt' : DEMO_USERS[scenario.sessionUserId].displayName;

  const sendIdProbe = (): void => setIdProbeResult(probeAccountById(idProbeKind, scenario.sessionUserId));

  return (
    <section className="scenario-panel" aria-label="Scenariusze (symulacja)">
      <p className="scenario-title">Scenariusze (symulacja), osobno od nawigacji produktu</p>
      <div className="scenario-grid">
        <ScenarioSelect
          label="Kto się loguje"
          value={scenario.loginUserId}
          options={LOGIN_USER_OPTIONS}
          onChange={(value) => isUserId(value) && setLoginUser(value)}
        />
        <ScenarioSelect
          label="Wynik logowania"
          value={scenario.loginOutcome}
          options={toOptions(LOGIN_OUTCOME_LABELS)}
          onChange={(value) => isKeyOf(LOGIN_OUTCOME_LABELS, value) && setLoginOutcome(value)}
        />
        <ScenarioSelect
          label="Lista kont"
          value={scenario.listScenario}
          options={toOptions(LIST_SCENARIO_LABELS)}
          onChange={(value) => isKeyOf(LIST_SCENARIO_LABELS, value) && setListScenario(value)}
        />
        <ScenarioSelect
          label="Nazwa konta wspólnego"
          value={scenario.accountOptions.nameStyle}
          options={toOptions(NAME_STYLE_LABELS)}
          onChange={(value) => isKeyOf(NAME_STYLE_LABELS, value) && setNameStyle(value)}
        />
        <ScenarioSelect
          label="Liczba kont wspólnych"
          value={String(scenario.accountOptions.sharedCount)}
          options={toOptions(SHARED_COUNT_LABELS)}
          onChange={(value) => setSharedCount(value === '2' ? 2 : 1)}
        />
        <ScenarioSelect
          label="Dwie sesje naraz"
          value={scenario.twoSessions ? 'on' : 'off'}
          options={toOptions(TWO_SESSIONS_LABELS)}
          onChange={(value) => toggleTwoSessions(value === 'on')}
        />
      </div>
      <div className="scenario-row">
        <p className="scenario-status" role="status">
          Zalogowany: {loggedInAs}. Sesja: {SESSION_STATUS_LABELS[scenario.sessionStatus]}. Nieudane próby logowania: {scenario.failedAttempts} z{' '}
          {MAX_FAILED_ATTEMPTS}.
        </p>
        <Button type="button" variant="secondary" disabled={!hasSession} onClick={() => expireAndRedirect('expired-30')}>
          Wygaś sesję: 30 dni nieaktywności
        </Button>
        <Button type="button" variant="secondary" disabled={!hasSession} onClick={() => expireAndRedirect('expired-90')}>
          Wygaś sesję: 90 dni od logowania
        </Button>
        {!hasSession && <span className="scenario-hint">Przyciski wygaszania działają po zalogowaniu.</span>}
      </div>
      <div className="scenario-row">
        <ScenarioSelect
          label="Żądanie konta po id (tylko API)"
          value={idProbeKind}
          options={ID_PROBE_KINDS.map((kind) => ({ value: kind, label: ID_PROBE_LABELS[kind] }))}
          onChange={(value) => isKeyOf(ID_PROBE_LABELS, value) && setIdProbeKind(value)}
        />
        <Button type="button" variant="secondary" onClick={sendIdProbe}>
          Wyślij żądanie (symulacja)
        </Button>
        <p className="scenario-status" role="status">
          {scenario.idProbeResult ?? 'Odmowa dostępu istnieje tylko w API, bez ekranu (P14): wynik pojawi się tutaj.'}
        </p>
      </div>
    </section>
  );
}

function ReviewBar() {
  const [theme, setTheme] = useState<Theme>('light');

  const toggleTheme = (): void => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    setTheme(next);
  };

  return (
    <>
      <div className="doc-toolbar">
        <Badge variant="neutral">Prototyp</Badge>
        <nav className="screen-nav" aria-label="Ekrany prototypu">
          {SCREEN_IDS.map((screenId) => (
            <a key={screenId} href={`#${screenId}`}>
              {SCREEN_TITLES[screenId]}
            </a>
          ))}
        </nav>
        <Button type="button" variant="secondary" onClick={resetAndRedirect}>
          Resetuj symulację
        </Button>
        <Button id="theme-toggle" type="button" variant="secondary" aria-pressed={theme === 'dark'} onClick={toggleTheme}>
          Motyw: {theme === 'light' ? 'jasny' : 'ciemny (brak wartości, wygląda jak jasny)'}
        </Button>
      </div>
      <Alert variant="neutral" className="proto-banner">
        <AlertDescription>
          Prototyp klikalny: dane i usługi są symulowane, hasła nie są sprawdzane ani zapisywane. Stałe &bdquo;teraz&rdquo; w prototypie:{' '}
          {DEMO_NOW_LABEL}.
        </AlertDescription>
      </Alert>
      <ScenarioPanel />
    </>
  );
}

export { ReviewBar };
