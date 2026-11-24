import { NotFoundError } from '../../http/errors';
import { BANK_ACCOUNT_TYPE, type BankAccountRecord, type BankAccountSummary } from './bank-account';
import type { BankAccountMembershipRepository } from './bank-account-membership-repository.port';
import { assertCanBeMember } from './bank-account-membership.rules';
import type { BankAccountRepository } from './bank-account-repository.port';

export const BANK_ACCOUNT_NOT_FOUND_MESSAGE = 'Bank account not found';
export const BANK_ACCOUNT_NAME_COLLATION_LOCALE = 'pl';

function typeRank(bankAccount: BankAccountRecord): number {
  return bankAccount.type === BANK_ACCOUNT_TYPE.Shared ? 0 : 1;
}

function compareForListing(first: BankAccountRecord, second: BankAccountRecord): number {
  const byType = typeRank(first) - typeRank(second);

  if (byType !== 0) {
    return byType;
  }

  return first.name.localeCompare(second.name, BANK_ACCOUNT_NAME_COLLATION_LOCALE);
}

export class BankAccountService {
  private readonly bankAccounts: BankAccountRepository;
  private readonly memberships: BankAccountMembershipRepository;

  constructor(
    bankAccounts: BankAccountRepository,
    memberships: BankAccountMembershipRepository,
  ) {
    this.bankAccounts = bankAccounts;
    this.memberships = memberships;
  }

  async listForUser(userId: string): Promise<BankAccountSummary[]> {
    const bankAccounts = await this.bankAccounts.listForUser(userId);

    return [...bankAccounts]
      .sort(compareForListing)
      .map(({ id, type, name }) => ({ id, type, name }));
  }

  async getSummary(bankAccountId: string): Promise<BankAccountSummary> {
    const bankAccount = await this.bankAccounts.findById(bankAccountId);

    if (bankAccount === null) {
      throw new NotFoundError(BANK_ACCOUNT_NOT_FOUND_MESSAGE);
    }

    const { id, type, name } = bankAccount;

    return { id, type, name };
  }

  async addMember(bankAccountId: string, userId: string): Promise<void> {
    const bankAccount = await this.bankAccounts.findById(bankAccountId);

    if (bankAccount === null) {
      throw new NotFoundError(BANK_ACCOUNT_NOT_FOUND_MESSAGE);
    }

    assertCanBeMember(bankAccount, userId);

    if (await this.memberships.isMember(userId, bankAccountId)) {
      return;
    }

    await this.memberships.add(userId, bankAccountId);
  }
}
