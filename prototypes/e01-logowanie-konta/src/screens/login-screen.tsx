import { AppShell, LoginForm } from '@aitl/ui';
import type { LoginResult } from '@aitl/ui';
import { navigateTo } from '../navigation';
import { logIn, useScenario } from '../store';

const SIMULATED_LOGIN_DELAY_MS = 700;

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function simulateLogin(): Promise<LoginResult> {
  await wait(SIMULATED_LOGIN_DELAY_MS);
  logIn();
  navigateTo('s02');

  return { ok: true };
}

function LoginScreen() {
  const { loginFormEpoch } = useScenario();

  return (
    <AppShell className="min-h-0">
      <div className="flex flex-col gap-(--space-between-groups)">
        <LoginForm key={loginFormEpoch} onSubmit={simulateLogin} headingLevel="h1" />
        <p className="max-w-md text-sm text-muted-foreground">
          Symulacja: hasło nie jest sprawdzane ani zapisywane, a to, kto zostanie zalogowany, wybiera kontrolka &bdquo;Kto się
          loguje&rdquo; na pasku przeglądu. Wpisz dowolny poprawny adres e-mail i dowolne hasło (przykład).
        </p>
      </div>
    </AppShell>
  );
}

export { LoginScreen };
