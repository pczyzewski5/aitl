import { BankAccountList } from '@aitl/ui';
import type { BankAccountListItem } from '@aitl/ui';
import type { MouseEvent } from 'react';
import { DEMO_USERS, sortAccounts } from '../fixtures';
import { navigateTo } from '../navigation';
import { SessionShell } from '../session-shell';
import { logOut, openAccount, useScenario } from '../store';

const ACCOUNT_SCREEN_HREF = '#s03';

function noop(): void {}

function logOutAndRedirect(): void {
  logOut();
  navigateTo('s01');
}

function HomeScreen() {
  const { sessionUserId } = useScenario();

  if (sessionUserId === null) {
    return (
      <SessionShell displayName="" onLogout={logOutAndRedirect}>
        <p className="text-muted-foreground">Brak sesji: w aplikacji ten adres przekierowuje na s01 (logowanie).</p>
      </SessionShell>
    );
  }

  const user = DEMO_USERS[sessionUserId];
  const accounts = sortAccounts(user.accounts);
  const items: BankAccountListItem[] = accounts.map((account) => ({ ...account, href: ACCOUNT_SCREEN_HREF }));

  const onAccountClick = (event: MouseEvent<HTMLElement>): void => {
    const link = (event.target as HTMLElement).closest('a');
    const account = accounts.find((candidate) => candidate.name === link?.textContent);
    if (account) {
      openAccount(account.id);
    }
  };

  return (
    <SessionShell displayName={user.displayName} onLogout={logOutAndRedirect}>
      <div onClick={onAccountClick}>
        <BankAccountList status="loaded" accounts={items} onRetry={noop} headingLevel="h1" />
      </div>
    </SessionShell>
  );
}

export { HomeScreen };
