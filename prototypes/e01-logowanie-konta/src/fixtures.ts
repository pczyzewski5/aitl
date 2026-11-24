import type { BankAccountListItem } from '@aitl/ui';

export const DEMO_NOW_LABEL = '2026-11-24, 10:00 (Europe/Warsaw)';

export type UserId = 'pawel' | 'zona' | 'gosc';

export interface DemoAccount {
  id: string;
  name: string;
  type: BankAccountListItem['type'];
}

export interface DemoUser {
  id: UserId;
  displayName: string;
  email: string;
  accounts: readonly DemoAccount[];
}

const SHARED_ACCOUNT: DemoAccount = { id: 'a1', name: 'Konto wspólne (przykład)', type: 'shared' };
const PERSONAL_ACCOUNT: DemoAccount = { id: 'a2', name: 'Konto osobiste Pawła (przykład)', type: 'personal' };

export const DEMO_USERS: Record<UserId, DemoUser> = {
  pawel: { id: 'pawel', displayName: 'Paweł (przykład)', email: 'pawel@example.com', accounts: [PERSONAL_ACCOUNT, SHARED_ACCOUNT] },
  zona: { id: 'zona', displayName: 'Żona (przykład)', email: 'zona@example.com', accounts: [SHARED_ACCOUNT] },
  gosc: { id: 'gosc', displayName: 'Gość bez kont (przykład)', email: 'gosc@example.com', accounts: [] },
};

export const USER_ROLE_LABELS: Record<UserId, string> = {
  pawel: 'Paweł (przykład), właściciel: 2 konta',
  zona: 'Żona (przykład): tylko konto wspólne',
  gosc: 'Gość bez kont (przykład): brak członkostwa',
};

const ACCOUNT_TYPE_ORDER: Record<DemoAccount['type'], number> = { shared: 0, personal: 1 };

export function sortAccounts(accounts: readonly DemoAccount[]): DemoAccount[] {
  return [...accounts].sort(
    (left, right) => ACCOUNT_TYPE_ORDER[left.type] - ACCOUNT_TYPE_ORDER[right.type] || left.name.localeCompare(right.name, 'pl'),
  );
}
