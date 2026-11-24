import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  BANK_ACCOUNT_TYPE,
  BankAccountService,
  PROVISIONING_MODE,
  UserProvisioningService,
  type PasswordHasher,
} from '@aitl/core';
import {
  MikroOrmBankAccountMembershipRepository,
  MikroOrmBankAccountRepository,
  MikroOrmProvisioningUnitOfWork,
  MikroOrmUserRepository,
  createEntityManagerProvider,
  createOrmConfig,
  createOrmProvider,
  type EntityManagerProvider,
} from '@aitl/db';
import { MikroORM } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const RANDOM_BYTES = 8;
const UNIQUE_VIOLATION = '23505';

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');
const randomEmail = (): string => `${randomText()}@example.test`;

class PrefixPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed:${password}`;
  }

  async verifyAgainstDecoy(): Promise<void> {}
}

describe('MikroORM repositories against PostgreSQL', () => {
  let orm: MikroORM;

  const newProvider = (): EntityManagerProvider => {
    const ormProvider = createOrmProvider({
      config: createOrmConfig({ databaseUrl: inject('databaseUrl') }),
      init: async () => orm,
    });

    return createEntityManagerProvider(ormProvider);
  };

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('users', () => {
    it('stores a user and finds it by e-mail in another scope', async () => {
      const newUser = { email: randomEmail(), displayName: randomText(), passwordHash: randomText() };
      const created = await new MikroOrmUserRepository(newProvider()).create(newUser);

      const actual = await new MikroOrmUserRepository(newProvider()).findByEmail(newUser.email);

      expect(actual).toEqual({ id: created.id, ...newUser });
    });

    it('returns null for an unknown e-mail', async () => {
      const actual = await new MikroOrmUserRepository(newProvider()).findByEmail(randomEmail());

      expect(actual).toBeNull();
    });
  });

  describe('bank accounts and memberships', () => {
    it('creates shared and personal accounts and finds them back', async () => {
      const provider = newProvider();
      const users = new MikroOrmUserRepository(provider);
      const bankAccounts = new MikroOrmBankAccountRepository(provider);
      const owner = await users.create({
        email: randomEmail(),
        displayName: randomText(),
        passwordHash: randomText(),
      });
      const sharedName = randomText();
      const personalName = randomText();

      const shared = await bankAccounts.createShared(sharedName);
      const personal = await bankAccounts.createPersonal(owner.id, personalName);

      const otherScope = new MikroOrmBankAccountRepository(newProvider());
      expect(shared).toEqual({
        id: shared.id,
        type: BANK_ACCOUNT_TYPE.Shared,
        name: sharedName,
        ownerUserId: null,
      });
      expect(personal).toEqual({
        id: personal.id,
        type: BANK_ACCOUNT_TYPE.Personal,
        name: personalName,
        ownerUserId: owner.id,
      });
      expect(await otherScope.findById(shared.id)).toEqual(shared);
      expect(await otherScope.findSharedByName(sharedName)).toEqual(shared);
      expect(await otherScope.findPersonalByOwner(owner.id)).toEqual(personal);
      expect(await otherScope.findById(randomUUID())).toBeNull();
      expect(await otherScope.findSharedByName(randomText())).toBeNull();
      expect(await otherScope.findPersonalByOwner(randomUUID())).toBeNull();
    });

    it('lists only the accounts of the memberships of the user', async () => {
      const provider = newProvider();
      const users = new MikroOrmUserRepository(provider);
      const bankAccounts = new MikroOrmBankAccountRepository(provider);
      const memberships = new MikroOrmBankAccountMembershipRepository(provider);
      const member = await users.create({
        email: randomEmail(),
        displayName: randomText(),
        passwordHash: randomText(),
      });
      const shared = await bankAccounts.createShared(randomText());
      const personal = await bankAccounts.createPersonal(member.id, randomText());
      await bankAccounts.createShared(randomText());
      await memberships.add(member.id, shared.id);
      await memberships.add(member.id, personal.id);

      const actual = await new MikroOrmBankAccountRepository(newProvider()).listForUser(member.id);

      expect(actual.map((account) => account.id).sort()).toEqual([shared.id, personal.id].sort());
    });

    it('reports membership only for existing pairs', async () => {
      const provider = newProvider();
      const users = new MikroOrmUserRepository(provider);
      const member = await users.create({
        email: randomEmail(),
        displayName: randomText(),
        passwordHash: randomText(),
      });
      const shared = await new MikroOrmBankAccountRepository(provider).createShared(randomText());
      const memberships = new MikroOrmBankAccountMembershipRepository(provider);
      await memberships.add(member.id, shared.id);

      const other = new MikroOrmBankAccountMembershipRepository(newProvider());

      expect(await other.isMember(member.id, shared.id)).toBe(true);
      expect(await other.isMember(randomUUID(), shared.id)).toBe(false);
    });

    it('lets the database reject a second personal account of one owner', async () => {
      const provider = newProvider();
      const owner = await new MikroOrmUserRepository(provider).create({
        email: randomEmail(),
        displayName: randomText(),
        passwordHash: randomText(),
      });
      const bankAccounts = new MikroOrmBankAccountRepository(provider);
      await bankAccounts.createPersonal(owner.id, randomText());

      const actual = new MikroOrmBankAccountRepository(newProvider()).createPersonal(
        owner.id,
        randomText(),
      );

      await expect(actual).rejects.toMatchObject({ code: UNIQUE_VIOLATION });
    });
  });

  describe('provisioning in a transaction', () => {
    const createService = (provider: EntityManagerProvider): UserProvisioningService =>
      new UserProvisioningService(
        new MikroOrmProvisioningUnitOfWork(provider),
        new PrefixPasswordHasher(),
      );

    it('provisions the owner and is idempotent', async () => {
      const sharedAccountName = randomText();
      const input = {
        mode: PROVISIONING_MODE.Owner,
        email: randomEmail(),
        displayName: randomText(),
        password: randomBytes(RANDOM_BYTES).toString('hex'),
        sharedAccountName,
        personalAccountName: randomText(),
      } as const;

      const first = await createService(newProvider()).provision(input);
      const second = await createService(newProvider()).provision(input);

      const provider = newProvider();
      const listed = await new BankAccountService(
        new MikroOrmBankAccountRepository(provider),
        new MikroOrmBankAccountMembershipRepository(provider),
      ).listForUser(first.user.id);
      expect(first.created).toBe(true);
      expect(second).toEqual({ user: first.user, created: false });
      expect(listed.map((account) => account.type)).toEqual([
        BANK_ACCOUNT_TYPE.Shared,
        BANK_ACCOUNT_TYPE.Personal,
      ]);
    });

    it('gives the shared-only user only the shared account', async () => {
      const sharedAccountName = randomText();
      const owner = await createService(newProvider()).provision({
        mode: PROVISIONING_MODE.Owner,
        email: randomEmail(),
        displayName: randomText(),
        password: randomText(),
        sharedAccountName,
        personalAccountName: randomText(),
      });

      const spouse = await createService(newProvider()).provision({
        mode: PROVISIONING_MODE.SharedOnly,
        email: randomEmail(),
        displayName: randomText(),
        password: randomText(),
        sharedAccountName,
      });

      const provider = newProvider();
      const service = new BankAccountService(
        new MikroOrmBankAccountRepository(provider),
        new MikroOrmBankAccountMembershipRepository(provider),
      );
      const spouseAccounts = await service.listForUser(spouse.user.id);
      const ownerAccounts = await service.listForUser(owner.user.id);
      expect(spouseAccounts.map((account) => account.type)).toEqual([BANK_ACCOUNT_TYPE.Shared]);
      expect(spouseAccounts[0]?.id).toBe(ownerAccounts[0]?.id);
    });

    it('rolls back the whole provisioning when a step fails', async () => {
      const email = randomEmail();
      const provider = newProvider();
      const failingUnitOfWork = new MikroOrmProvisioningUnitOfWork(provider);
      const sut = new UserProvisioningService(
        {
          run: (work) =>
            failingUnitOfWork.run((repositories) =>
              work({
                ...repositories,
                memberships: {
                  isMember: (userId, bankAccountId) =>
                    repositories.memberships.isMember(userId, bankAccountId),
                  add: async () => {
                    throw new Error('membership failed');
                  },
                },
              }),
            ),
        },
        new PrefixPasswordHasher(),
      );

      const actual = sut.provision({
        mode: PROVISIONING_MODE.SharedOnly,
        email,
        displayName: randomText(),
        password: randomText(),
        sharedAccountName: randomText(),
      });

      await expect(actual).rejects.toThrow('membership failed');
      const found = await new MikroOrmUserRepository(newProvider()).findByEmail(email);
      expect(found).toBeNull();
    });
  });
});
