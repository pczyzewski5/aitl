import type { ProvisioningRepositories, ProvisioningUnitOfWork } from '@aitl/core';
import type { EntityManager, EntityManagerProvider } from '../../orm-provider';
import { MikroOrmBankAccountMembershipRepository } from '../bank-accounts/mikro-orm-bank-account-membership.repository';
import { MikroOrmBankAccountRepository } from '../bank-accounts/mikro-orm-bank-account.repository';
import { MikroOrmUserRepository } from './mikro-orm-user.repository';

function createRepositories(entityManager: EntityManager): ProvisioningRepositories {
  const provider: EntityManagerProvider = { getEntityManager: async () => entityManager };

  return {
    users: new MikroOrmUserRepository(provider),
    bankAccounts: new MikroOrmBankAccountRepository(provider),
    memberships: new MikroOrmBankAccountMembershipRepository(provider),
  };
}

export class MikroOrmProvisioningUnitOfWork implements ProvisioningUnitOfWork {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async run<T>(work: (repositories: ProvisioningRepositories) => Promise<T>): Promise<T> {
    const entityManager = await this.entityManagerProvider.getEntityManager();

    return entityManager.transactional((transactionalEntityManager) =>
      work(createRepositories(transactionalEntityManager)),
    );
  }
}
