export const BANK_ACCOUNT_TYPE = {
  Shared: 'shared',
  Personal: 'personal',
} as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPE)[keyof typeof BANK_ACCOUNT_TYPE];

export type BankAccountRecord = Readonly<{
  id: string;
  type: BankAccountType;
  name: string;
  ownerUserId: string | null;
}>;

export type BankAccountSummary = Readonly<{
  id: string;
  type: BankAccountType;
  name: string;
}>;
