import { BankAccountList } from '@aitl/ui';
import type { BankAccountListHeadingLevel, BankAccountListItem, BankAccountListStatus } from '@aitl/ui';
import { useState } from 'react';
import type { MouseEvent } from 'react';
import { DEMO_USERS, accountsOf } from './fixtures';
import type { DemoAccount, UserId } from './fixtures';
import { openAccount, setListScenario, useScenario } from './store';

const SIMULATED_RETRY_DELAY_MS = 600;

interface AccountListViewProps {
  userId: UserId;
  accountHref: string;
  headingLevel: BankAccountListHeadingLevel;
  rememberOpenedAccount: boolean;
}

function AccountListView({ userId, accountHref, headingLevel, rememberOpenedAccount }: AccountListViewProps) {
  const { listScenario, accountOptions } = useScenario();
  const [retrying, setRetrying] = useState(false);
  const accounts: DemoAccount[] = listScenario === 'empty' ? [] : accountsOf(DEMO_USERS[userId], accountOptions);
  const items: BankAccountListItem[] = accounts.map((account) => ({ ...account, href: accountHref }));
  const status: BankAccountListStatus = listScenario === 'empty' ? 'loaded' : listScenario;

  const retry = (): void => {
    setRetrying(true);
    setTimeout(() => {
      setListScenario('loaded');
      setRetrying(false);
    }, SIMULATED_RETRY_DELAY_MS);
  };

  const onAccountClick = (event: MouseEvent<HTMLElement>): void => {
    const link = (event.target as HTMLElement).closest('a');
    const account = accounts.find((candidate) => candidate.name === link?.textContent);
    if (rememberOpenedAccount && account) {
      openAccount(account.id);
    }
  };

  return (
    <div onClick={onAccountClick}>
      <BankAccountList status={status} accounts={items} onRetry={retry} retrying={retrying} headingLevel={headingLevel} />
    </div>
  );
}

export { AccountListView };
