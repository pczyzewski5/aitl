'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, apiCall, AppShell, BankAccountList, buildAccountHref } from '@aitl/ui';
import type { BankAccountListItem, BankAccountListStatus, BankAccountType } from '@aitl/ui';
import { requestHeadingFocus, useRequestedHeadingFocus } from '../focus/heading-focus';
import { LOGOUT_FAILED_MESSAGE } from '../messages';
import { BANK_ACCOUNTS_API_PATH, HTTP_UNAUTHORIZED, LOGIN_PATH, LOGOUT_API_PATH } from '../routes';

type BankAccountsData = { bankAccounts: { id: string; type: BankAccountType; name: string }[] };

interface AccountsScreenProps {
  displayName: string;
}

export function AccountsScreen({ displayName }: AccountsScreenProps) {
  const router = useRouter();
  const content = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<BankAccountListStatus>('loading');
  const [accounts, setAccounts] = useState<BankAccountListItem[]>([]);
  const [logoutFailed, setLogoutFailed] = useState(false);
  useRequestedHeadingFocus(content);

  const load = useCallback(async () => {
    setStatus('loading');
    const result = await apiCall<BankAccountsData>(BANK_ACCOUNTS_API_PATH);
    if (result.ok) {
      setAccounts(result.data.bankAccounts.map((account) => ({ ...account, href: buildAccountHref(account.id) })));
      setStatus('loaded');
    } else if (result.kind === 'api-error' && result.status === HTTP_UNAUTHORIZED) {
      router.replace(LOGIN_PATH);
    } else {
      setStatus('error');
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    setLogoutFailed(false);
    const result = await apiCall(LOGOUT_API_PATH, { method: 'POST' });
    if (result.ok) {
      requestHeadingFocus();
      router.replace(LOGIN_PATH);
    } else {
      setLogoutFailed(true);
    }
  };

  return (
    <AppShell displayName={displayName} onLogout={() => void logout()}>
      <div ref={content} className="flex flex-col gap-(--space-between-groups)">
        {logoutFailed && (
          <Alert variant="error">
            <AlertDescription>{LOGOUT_FAILED_MESSAGE}</AlertDescription>
          </Alert>
        )}
        <BankAccountList status={status} accounts={accounts} onRetry={() => void load()} headingLevel="h1" />
      </div>
    </AppShell>
  );
}
