import { randomUUID } from 'node:crypto';
import { BANK_ACCOUNT_TYPE } from '@aitl/core';
import { describe, expect, it, vi } from 'vitest';
import { BankAccount } from '../../entities/bank-accounts/bank-account.entity';
import { BankAccountMembership } from '../../entities/bank-accounts/bank-account-membership.entity';
import type { EntityManager } from '../../orm-provider';
import { MikroOrmBankAccountRepository } from './mikro-orm-bank-account.repository';

function createSut(entityManager: Partial<EntityManager>): MikroOrmBankAccountRepository {
  return new MikroOrmBankAccountRepository({
    getEntityManager: async () => entityManager as EntityManager,
  });
}

function createSharedRow() {
  return { id: randomUUID(), type: BANK_ACCOUNT_TYPE.Shared, name: randomUUID(), owner: null };
}

function createPersonalRow(ownerId: string) {
  return {
    id: randomUUID(),
    type: BANK_ACCOUNT_TYPE.Personal,
    name: randomUUID(),
    owner: { id: ownerId },
  };
}

describe('MikroOrmBankAccountRepository', () => {
  it('finds a bank account by id and maps a shared account without an owner', async () => {
    const row = createSharedRow();
    const findOne = vi.fn().mockResolvedValue(row);
    const sut = createSut({ findOne });
    const expected = { id: row.id, type: row.type, name: row.name, ownerUserId: null };

    const actual = await sut.findById(row.id);

    expect(actual).toEqual(expected);
    expect(findOne).toHaveBeenCalledWith(BankAccount, { id: row.id });
  });

  it('maps a personal account with its owner id', async () => {
    const ownerId = randomUUID();
    const row = createPersonalRow(ownerId);
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(row) });

    const actual = await sut.findById(row.id);

    expect(actual?.ownerUserId).toBe(ownerId);
  });

  it('maps an account whose owner field is absent to no owner', async () => {
    const row = { id: randomUUID(), type: BANK_ACCOUNT_TYPE.Shared, name: randomUUID() };
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(row) });

    const actual = await sut.findById(row.id);

    expect(actual?.ownerUserId).toBeNull();
  });

  it('returns null when the id is unknown', async () => {
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(null) });

    const actual = await sut.findById(randomUUID());

    expect(actual).toBeNull();
  });

  it('finds a shared account by type and name', async () => {
    const row = createSharedRow();
    const findOne = vi.fn().mockResolvedValue(row);
    const sut = createSut({ findOne });

    const actual = await sut.findSharedByName(row.name);

    expect(actual?.id).toBe(row.id);
    expect(findOne).toHaveBeenCalledWith(BankAccount, {
      type: BANK_ACCOUNT_TYPE.Shared,
      name: row.name,
    });
  });

  it('returns null when no shared account has the name', async () => {
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(null) });

    const actual = await sut.findSharedByName(randomUUID());

    expect(actual).toBeNull();
  });

  it('finds the personal account of an owner', async () => {
    const ownerId = randomUUID();
    const row = createPersonalRow(ownerId);
    const findOne = vi.fn().mockResolvedValue(row);
    const sut = createSut({ findOne });

    const actual = await sut.findPersonalByOwner(ownerId);

    expect(actual?.id).toBe(row.id);
    expect(findOne).toHaveBeenCalledWith(BankAccount, {
      type: BANK_ACCOUNT_TYPE.Personal,
      owner: ownerId,
    });
  });

  it('returns null when the owner has no personal account', async () => {
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(null) });

    const actual = await sut.findPersonalByOwner(randomUUID());

    expect(actual).toBeNull();
  });

  it('creates a shared account and flushes it', async () => {
    const row = createSharedRow();
    const create = vi.fn().mockReturnValue(row);
    const flush = vi.fn().mockResolvedValue(undefined);
    const sut = createSut({ create, flush });

    const actual = await sut.createShared(row.name);

    expect(create).toHaveBeenCalledWith(BankAccount, { type: BANK_ACCOUNT_TYPE.Shared, name: row.name });
    expect(flush).toHaveBeenCalledTimes(1);
    expect(actual.id).toBe(row.id);
  });

  it('creates a personal account for the owner and flushes it', async () => {
    const ownerId = randomUUID();
    const row = createPersonalRow(ownerId);
    const create = vi.fn().mockReturnValue(row);
    const flush = vi.fn().mockResolvedValue(undefined);
    const sut = createSut({ create, flush });

    const actual = await sut.createPersonal(ownerId, row.name);

    expect(create).toHaveBeenCalledWith(BankAccount, {
      type: BANK_ACCOUNT_TYPE.Personal,
      name: row.name,
      owner: ownerId,
    });
    expect(flush).toHaveBeenCalledTimes(1);
    expect(actual.ownerUserId).toBe(ownerId);
  });

  it('lists the bank accounts of the memberships of a user', async () => {
    const userId = randomUUID();
    const shared = createSharedRow();
    const personal = createPersonalRow(userId);
    const find = vi.fn().mockResolvedValue([{ bankAccount: shared }, { bankAccount: personal }]);
    const sut = createSut({ find });

    const actual = await sut.listForUser(userId);

    expect(actual.map((account) => account.id)).toEqual([shared.id, personal.id]);
    expect(find).toHaveBeenCalledWith(
      BankAccountMembership,
      { user: userId },
      { populate: ['bankAccount'] },
    );
  });
});
