import { randomBytes, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConflictError, NotFoundError } from '../../http/errors';
import {
  createInMemoryRepositories,
  InMemoryStore,
} from '../support/in-memory-repositories';
import { BANK_ACCOUNT_TYPE } from './bank-account';
import { PERSONAL_ACCOUNT_MEMBER_MESSAGE } from './bank-account-membership.rules';
import { BANK_ACCOUNT_NOT_FOUND_MESSAGE, BankAccountService } from './bank-account.service';

const randomName = (): string => randomBytes(8).toString('hex');

describe('BankAccountService', () => {
  let store: InMemoryStore;
  let sut: BankAccountService;

  beforeEach(() => {
    store = new InMemoryStore();
    const { bankAccounts, memberships } = createInMemoryRepositories(store);
    sut = new BankAccountService(bankAccounts, memberships);
  });

  describe('getSummary', () => {
    it('returns id, type and name without the owner', async () => {
      const { bankAccounts } = createInMemoryRepositories(store);
      const personal = await bankAccounts.createPersonal(randomUUID(), randomName());
      const expected = { id: personal.id, type: BANK_ACCOUNT_TYPE.Personal, name: personal.name };

      const actual = await sut.getSummary(personal.id);

      expect(actual).toEqual(expected);
    });

    it('throws NotFoundError for an unknown account', async () => {
      const actual = sut.getSummary(randomUUID());

      await expect(actual).rejects.toThrow(new NotFoundError(BANK_ACCOUNT_NOT_FOUND_MESSAGE));
    });
  });

  describe('listForUser', () => {
    it('lists shared accounts before personal ones, then alphabetically by name', async () => {
      const { bankAccounts, memberships } = createInMemoryRepositories(store);
      const userId = randomUUID();
      const personalA = await bankAccounts.createPersonal(userId, 'Alfa');
      const sharedZ = await bankAccounts.createShared('Zeta');
      const sharedLetterWithDiacritic = await bankAccounts.createShared('Żyto');
      const sharedB = await bankAccounts.createShared('Beta');
      for (const account of [personalA, sharedZ, sharedLetterWithDiacritic, sharedB]) {
        await memberships.add(userId, account.id);
      }

      const actual = await sut.listForUser(userId);

      expect(actual.map((account) => account.name)).toEqual(['Beta', 'Zeta', 'Żyto', 'Alfa']);
    });

    it('returns only id, type and name', async () => {
      const { bankAccounts, memberships } = createInMemoryRepositories(store);
      const userId = randomUUID();
      const personal = await bankAccounts.createPersonal(userId, randomName());
      await memberships.add(userId, personal.id);
      const expected = [{ id: personal.id, type: BANK_ACCOUNT_TYPE.Personal, name: personal.name }];

      const actual = await sut.listForUser(userId);

      expect(actual).toEqual(expected);
    });

    it('does not list accounts of other users', async () => {
      const { bankAccounts, memberships } = createInMemoryRepositories(store);
      const other = await bankAccounts.createShared(randomName());
      await memberships.add(randomUUID(), other.id);

      const actual = await sut.listForUser(randomUUID());

      expect(actual).toEqual([]);
    });
  });

  describe('addMember', () => {
    it('adds a member to a shared account', async () => {
      const { bankAccounts } = createInMemoryRepositories(store);
      const shared = await bankAccounts.createShared(randomName());
      const userId = randomUUID();

      await sut.addMember(shared.id, userId);

      expect(store.memberships).toEqual([{ userId, bankAccountId: shared.id }]);
    });

    it('adds the owner to a personal account', async () => {
      const { bankAccounts } = createInMemoryRepositories(store);
      const ownerId = randomUUID();
      const personal = await bankAccounts.createPersonal(ownerId, randomName());

      await sut.addMember(personal.id, ownerId);

      expect(store.memberships).toEqual([{ userId: ownerId, bankAccountId: personal.id }]);
    });

    it('rejects a member other than the owner of a personal account', async () => {
      const { bankAccounts } = createInMemoryRepositories(store);
      const personal = await bankAccounts.createPersonal(randomUUID(), randomName());

      const actual = sut.addMember(personal.id, randomUUID());

      await expect(actual).rejects.toThrow(new ConflictError(PERSONAL_ACCOUNT_MEMBER_MESSAGE));
      expect(store.memberships).toEqual([]);
    });

    it('does not duplicate an existing membership', async () => {
      const { bankAccounts } = createInMemoryRepositories(store);
      const shared = await bankAccounts.createShared(randomName());
      const userId = randomUUID();
      await sut.addMember(shared.id, userId);

      await sut.addMember(shared.id, userId);

      expect(store.memberships).toHaveLength(1);
    });

    it('rejects an unknown bank account', async () => {
      const actual = sut.addMember(randomUUID(), randomUUID());

      await expect(actual).rejects.toThrow(new NotFoundError(BANK_ACCOUNT_NOT_FOUND_MESSAGE));
    });
  });
});
