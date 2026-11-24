import { Alert, AlertDescription, Badge, Button, Select } from '@aitl/ui';
import type { SelectOption } from '@aitl/ui';
import { useId, useState } from 'react';
import { DEMO_NOW_LABEL, DEMO_USERS, USER_ROLE_LABELS } from './fixtures';
import type { UserId } from './fixtures';
import { SCREEN_IDS, SCREEN_TITLES, navigateTo } from './navigation';
import { resetSimulation, setLoginUser, useScenario } from './store';

type Theme = 'light' | 'dark';

const LOGIN_USER_OPTIONS: SelectOption[] = (Object.keys(DEMO_USERS) as UserId[]).map((userId) => ({
  value: userId,
  label: USER_ROLE_LABELS[userId],
}));

function isUserId(value: string): value is UserId {
  return value in DEMO_USERS;
}

function resetAndRedirect(): void {
  resetSimulation();
  navigateTo('s01');
}

function ReviewBar() {
  const { loginUserId } = useScenario();
  const [theme, setTheme] = useState<Theme>('light');
  const userSelectId = useId();

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
        <div className="scenario-control">
          <label htmlFor={userSelectId}>Kto się loguje (symulacja)</label>
          <Select
            id={userSelectId}
            options={LOGIN_USER_OPTIONS}
            value={loginUserId}
            onChange={(event) => {
              if (isUserId(event.target.value)) {
                setLoginUser(event.target.value);
              }
            }}
          />
        </div>
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
    </>
  );
}

export { ReviewBar };
