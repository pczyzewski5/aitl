import { AppShell, LoginForm } from '@aitl/ui';
import type { LoginResult } from '@aitl/ui';
import { useRef } from 'react';
import { LOCK_SECONDS } from '../fixtures';
import { navigateTo } from '../navigation';
import { attemptLogin, logIn, useScenario } from '../store';
import type { LoginDecision } from '../store';

const SIMULATED_LOGIN_DELAY_MS = 700;

// ZAŁOŻENIE (A-P1 z szarego prototypu, LDS4): DS nie ma komunikatu dla błędu serwera 500; tekst jest mój,
// wstawiony w miejsce komunikatu "brak sieci". Do akceptacji lub poprawki przez właściciela produktu.
const SERVER_ERROR_MESSAGE = 'Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę; wpisane dane zostały w formularzu.';

const EMAIL_INPUT_SELECTOR = 'input[type="email"]';

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function toLoginResult(decision: Exclude<LoginDecision, 'success'>): LoginResult {
  switch (decision) {
    case 'invalid-credentials':
      return { ok: false, kind: 'invalid-credentials' };
    case 'too-many-attempts':
      return { ok: false, kind: 'too-many-attempts', retryAfterSeconds: LOCK_SECONDS };
    case 'network':
    case 'server':
      return { ok: false, kind: 'network' };
  }
}

function LoginScreen() {
  const { loginFormEpoch, loginOutcome } = useScenario();
  const containerRef = useRef<HTMLDivElement>(null);

  // ZAŁOŻENIE (A-P6 z szarego prototypu): po błędzie logowania fokus wraca na pole e-mail; spec mówi tylko "fokus na błędzie".
  const focusEmailField = (): void => {
    setTimeout(() => containerRef.current?.querySelector<HTMLInputElement>(EMAIL_INPUT_SELECTOR)?.focus(), 0);
  };

  const simulateLogin = async (): Promise<LoginResult> => {
    await wait(SIMULATED_LOGIN_DELAY_MS);
    const decision = attemptLogin();
    if (decision === 'success') {
      logIn();
      navigateTo('s02');

      return { ok: true };
    }
    focusEmailField();

    return toLoginResult(decision);
  };

  return (
    <AppShell className="min-h-0">
      <div ref={containerRef} className="flex flex-col gap-(--space-between-groups)">
        <LoginForm
          key={loginFormEpoch}
          onSubmit={simulateLogin}
          headingLevel="h1"
          messages={loginOutcome === 'server' ? { network: SERVER_ERROR_MESSAGE } : undefined}
        />
        <p className="max-w-md text-sm text-muted-foreground">
          Symulacja: hasło nie jest sprawdzane ani zapisywane, a wynik logowania i to, kto zostanie zalogowany, wybierają kontrolki
          w panelu scenariuszy nad ekranami. Wpisz dowolny poprawny adres e-mail i dowolne hasło (przykład).
        </p>
      </div>
    </AppShell>
  );
}

export { LoginScreen };
