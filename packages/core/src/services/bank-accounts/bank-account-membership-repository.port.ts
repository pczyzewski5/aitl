import type { BankAccountMembershipLookup } from '../../http/auth';

export interface BankAccountMembershipRepository extends BankAccountMembershipLookup {
  add(userId: string, bankAccountId: string): Promise<void>;
}
