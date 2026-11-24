import { ConflictError } from '../../http/errors';
import { BANK_ACCOUNT_TYPE, type BankAccountRecord } from './bank-account';

export const PERSONAL_ACCOUNT_MEMBER_MESSAGE =
  'Only the owner can be a member of a personal bank account';

export function assertCanBeMember(bankAccount: BankAccountRecord, userId: string): void {
  if (bankAccount.type === BANK_ACCOUNT_TYPE.Personal && bankAccount.ownerUserId !== userId) {
    throw new ConflictError(PERSONAL_ACCOUNT_MEMBER_MESSAGE);
  }
}
