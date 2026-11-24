import type { BankAccountMembershipRepository } from '@aitl/core';
import { BankAccountMembership } from '../../entities/bank-accounts/bank-account-membership.entity';
import type { EntityManagerProvider } from '../../orm-provider';

export class MikroOrmBankAccountMembershipRepository implements BankAccountMembershipRepository {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async isMember(userId: string, bankAccountId: string): Promise<boolean> {
    const em = await this.entityManagerProvider.getEntityManager();
    const memberships = await em.count(BankAccountMembership, {
      user: userId,
      bankAccount: bankAccountId,
    });

    return memberships > 0;
  }

  async add(userId: string, bankAccountId: string): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    em.create(BankAccountMembership, { user: userId, bankAccount: bankAccountId });
    await em.flush();
  }
}
