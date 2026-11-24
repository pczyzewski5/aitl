import type { BankAccountListItem } from '@aitl/ui';

export const DEMO_NOW_LABEL = '2026-11-24, 10:00 (Europe/Warsaw)';
export const SESSION_STARTED_LABEL = '2026-11-20, 10:00';
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_SECONDS = 900;

export type UserId = 'pawel' | 'zona' | 'gosc';
export type AccountNameStyle = 'short' | 'long';
export type SharedAccountCount = 1 | 2;

export interface DemoAccount {
  id: string;
  name: string;
  type: BankAccountListItem['type'];
}

export interface DemoUser {
  id: UserId;
  displayName: string;
  email: string;
  hasSharedAccounts: boolean;
  personalAccounts: readonly DemoAccount[];
}

export interface AccountOptions {
  nameStyle: AccountNameStyle;
  sharedCount: SharedAccountCount;
}

export const DEFAULT_ACCOUNT_OPTIONS: AccountOptions = { nameStyle: 'short', sharedCount: 1 };

const SHORT_SHARED_NAME = 'Konto wspólne (przykład)';
const LONG_SHARED_NAME = 'KontoWspólneRodzinyKowalskichNowakówNaWydatkiDomoweRachunkiIWakacje (przykład)';
const EXTRA_SHARED_ACCOUNT: DemoAccount = { id: 'a3', name: 'Konto wspólne: wakacje (przykład)', type: 'shared' };
const PERSONAL_ACCOUNT: DemoAccount = { id: 'a2', name: 'Konto osobiste Pawła (przykład)', type: 'personal' };

export const DEMO_USERS: Record<UserId, DemoUser> = {
  pawel: {
    id: 'pawel',
    displayName: 'Paweł (przykład)',
    email: 'pawel@example.com',
    hasSharedAccounts: true,
    personalAccounts: [PERSONAL_ACCOUNT],
  },
  zona: { id: 'zona', displayName: 'Żona (przykład)', email: 'zona@example.com', hasSharedAccounts: true, personalAccounts: [] },
  gosc: { id: 'gosc', displayName: 'Gość bez kont (przykład)', email: 'gosc@example.com', hasSharedAccounts: false, personalAccounts: [] },
};

export const USER_IDS = Object.keys(DEMO_USERS) as UserId[];

export const USER_ROLE_LABELS: Record<UserId, string> = {
  pawel: 'Paweł (przykład), właściciel: wspólne i osobiste',
  zona: 'Żona (przykład): tylko konta wspólne',
  gosc: 'Gość bez kont (przykład): brak członkostwa',
};

const ACCOUNT_TYPE_ORDER: Record<DemoAccount['type'], number> = { shared: 0, personal: 1 };

export function sortAccounts(accounts: readonly DemoAccount[]): DemoAccount[] {
  return [...accounts].sort(
    (left, right) => ACCOUNT_TYPE_ORDER[left.type] - ACCOUNT_TYPE_ORDER[right.type] || left.name.localeCompare(right.name, 'pl'),
  );
}

export function accountsOf(user: DemoUser, options: AccountOptions): DemoAccount[] {
  const shared: DemoAccount[] = [];
  if (user.hasSharedAccounts) {
    shared.push({ id: 'a1', name: options.nameStyle === 'long' ? LONG_SHARED_NAME : SHORT_SHARED_NAME, type: 'shared' });
    if (options.sharedCount === 2) {
      shared.push(EXTRA_SHARED_ACCOUNT);
    }
  }

  return sortAccounts([...shared, ...user.personalAccounts]);
}
