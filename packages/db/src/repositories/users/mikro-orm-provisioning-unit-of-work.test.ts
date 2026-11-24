import { describe, expect, it, vi } from 'vitest';
import type { EntityManager } from '../../orm-provider';
import { MikroOrmBankAccountMembershipRepository } from '../bank-accounts/mikro-orm-bank-account-membership.repository';
import { MikroOrmBankAccountRepository } from '../bank-accounts/mikro-orm-bank-account.repository';
import { MikroOrmProvisioningUnitOfWork } from './mikro-orm-provisioning-unit-of-work';
import { MikroOrmUserRepository } from './mikro-orm-user.repository';

describe('MikroOrmProvisioningUnitOfWork', () => {
  it('runs the work in a transaction with repositories bound to the transactional manager', async () => {
    const findOne = vi.fn().mockResolvedValue(null);
    const transactionalManager = { findOne } as unknown as EntityManager;
    const transactional = vi.fn((callback: (manager: EntityManager) => Promise<unknown>) =>
      callback(transactionalManager),
    );
    const sut = new MikroOrmProvisioningUnitOfWork({
      getEntityManager: async () => ({ transactional }) as unknown as EntityManager,
    });

    const actual = await sut.run(async (repositories) => repositories);

    await actual.users.findByEmail('someone@example.test');

    expect(transactional).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(actual.users).toBeInstanceOf(MikroOrmUserRepository);
    expect(actual.bankAccounts).toBeInstanceOf(MikroOrmBankAccountRepository);
    expect(actual.memberships).toBeInstanceOf(MikroOrmBankAccountMembershipRepository);
  });

  it('returns the result of the work', async () => {
    const transactional = vi.fn((callback: (manager: EntityManager) => Promise<unknown>) =>
      callback({} as EntityManager),
    );
    const sut = new MikroOrmProvisioningUnitOfWork({
      getEntityManager: async () => ({ transactional }) as unknown as EntityManager,
    });

    const actual = await sut.run(async () => 'done');

    expect(actual).toBe('done');
  });
});
