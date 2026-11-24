import type { BankAccountMembershipRepository } from '../bank-accounts/bank-account-membership-repository.port';
import type { BankAccountRepository } from '../bank-accounts/bank-account-repository.port';
import type { UserRepository } from './user-repository.port';

export type ProvisioningRepositories = Readonly<{
  users: UserRepository;
  bankAccounts: BankAccountRepository;
  memberships: BankAccountMembershipRepository;
}>;

export interface ProvisioningUnitOfWork {
  run<T>(work: (repositories: ProvisioningRepositories) => Promise<T>): Promise<T>;
}
