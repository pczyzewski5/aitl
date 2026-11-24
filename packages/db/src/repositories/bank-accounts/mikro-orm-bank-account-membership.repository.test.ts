import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { BankAccountMembership } from '../../entities/bank-accounts/bank-account-membership.entity';
import type { EntityManager } from '../../orm-provider';
import { MikroOrmBankAccountMembershipRepository } from './mikro-orm-bank-account-membership.repository';

function createSut(entityManager: Partial<EntityManager>): MikroOrmBankAccountMembershipRepository {
  return new MikroOrmBankAccountMembershipRepository({
    getEntityManager: async () => entityManager as EntityManager,
  });
}

describe('MikroOrmBankAccountMembershipRepository', () => {
  it.each([
    { count: 1, expected: true },
    { count: 0, expected: false },
  ])('reports a membership as $expected when $count rows match', async ({ count, expected }) => {
    const userId = randomUUID();
    const bankAccountId = randomUUID();
    const countRows = vi.fn().mockResolvedValue(count);
    const sut = createSut({ count: countRows });

    const actual = await sut.isMember(userId, bankAccountId);

    expect(actual).toBe(expected);
    expect(countRows).toHaveBeenCalledWith(BankAccountMembership, {
      user: userId,
      bankAccount: bankAccountId,
    });
  });

  it('creates the membership and flushes it', async () => {
    const userId = randomUUID();
    const bankAccountId = randomUUID();
    const create = vi.fn();
    const flush = vi.fn().mockResolvedValue(undefined);
    const sut = createSut({ create, flush });

    await sut.add(userId, bankAccountId);

    expect(create).toHaveBeenCalledWith(BankAccountMembership, {
      user: userId,
      bankAccount: bankAccountId,
    });
    expect(flush).toHaveBeenCalledTimes(1);
  });
});
