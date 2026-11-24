import { Alert, AlertDescription, AlertTitle, TextLink } from '@aitl/ui';
import { DEMO_USERS } from '../fixtures';
import { navigateTo } from '../navigation';
import { SessionShell } from '../session-shell';
import { logOut, useScenario } from '../store';

function logOutAndRedirect(): void {
  logOut();
  navigateTo('s01');
}

function AccountScreen() {
  const { sessionUserId, openedAccountId } = useScenario();
  const user = sessionUserId === null ? null : DEMO_USERS[sessionUserId];
  const account = user?.accounts.find((candidate) => candidate.id === openedAccountId);

  return (
    <SessionShell displayName={user?.displayName ?? ''} onLogout={logOutAndRedirect}>
      <div className="flex flex-col gap-(--space-between-groups)">
        <h1 className="min-w-0 text-xl font-semibold leading-base wrap-anywhere">{account?.name ?? 'Ekran konta (nie wybrano konta z listy)'}</h1>
        <Alert variant="neutral">
          <AlertTitle>Atrapa: poza zakresem E01</AlertTitle>
          <AlertDescription>
            Tu będzie ekran konta z epików E02 i E03 (adres /?account=&lt;id&gt;). W prototypie E01 to tylko cel linku z listy kont (P8).
          </AlertDescription>
        </Alert>
        <p>
          <TextLink href="#s02">Wróć do listy kont</TextLink>
        </p>
      </div>
    </SessionShell>
  );
}

export { AccountScreen };
