import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConflictError } from '../../http/errors';
import { BANK_ACCOUNT_TYPE } from '../bank-accounts/bank-account';
import { PERSONAL_ACCOUNT_MEMBER_MESSAGE } from '../bank-accounts/bank-account-membership.rules';
import {
  createInMemoryRepositories,
  FAKE_HASH_PREFIX,
  FakePasswordHasher,
  InMemoryStore,
  InMemoryUnitOfWork,
} from '../support/in-memory-repositories';
import type { ProvisioningUnitOfWork } from './user-provisioning-unit-of-work.port';
import {
  normalizeEmail,
  PROVISIONING_MODE,
  UserProvisioningService,
  type ProvisionUserInput,
} from './user-provisioning.service';

const randomText = (): string => randomBytes(8).toString('hex');

describe('normalizeEmail', () => {
  it('trims and lower-cases the address', () => {
    expect(normalizeEmail('  Owner@Example.TEST ')).toBe('owner@example.test');
  });
});

describe('UserProvisioningService', () => {
  let store: InMemoryStore;
  let unitOfWork: InMemoryUnitOfWork;
  let sut: UserProvisioningService;
  let ownerInput: ProvisionUserInput;
  let sharedOnlyInput: ProvisionUserInput;

  beforeEach(() => {
    store = new InMemoryStore();
    unitOfWork = new InMemoryUnitOfWork(store);
    sut = new UserProvisioningService(unitOfWork, new FakePasswordHasher());
    const sharedAccountName = randomText();
    ownerInput = {
      mode: PROVISIONING_MODE.Owner,
      email: `${randomText()}@Example.test`,
      displayName: randomText(),
      password: randomText(),
      sharedAccountName,
      personalAccountName: randomText(),
    };
    sharedOnlyInput = {
      mode: PROVISIONING_MODE.SharedOnly,
      email: `${randomText()}@example.test`,
      displayName: randomText(),
      password: randomText(),
      sharedAccountName,
    };
  });

  it('creates the owner with a normalized email, a hashed password, and the shared and personal accounts', async () => {
    const actual = await sut.provision(ownerInput);

    const [user] = store.users;
    expect(actual).toEqual({
      user: { id: user?.id, email: ownerInput.email.toLowerCase(), displayName: ownerInput.displayName },
      created: true,
    });
    expect(user?.passwordHash).toBe(`${FAKE_HASH_PREFIX}${ownerInput.password}`);
    expect(store.bankAccounts.map((account) => account.type).sort()).toEqual([
      BANK_ACCOUNT_TYPE.Personal,
      BANK_ACCOUNT_TYPE.Shared,
    ]);
    expect(store.memberships).toHaveLength(2);
    expect(unitOfWork.runs).toBe(1);
  });

  it('gives the personal account the owner and the requested name', async () => {
    await sut.provision(ownerInput);

    const personal = store.bankAccounts.find((account) => account.type === BANK_ACCOUNT_TYPE.Personal);
    expect(personal).toMatchObject({
      name: 'personalAccountName' in ownerInput ? ownerInput.personalAccountName : undefined,
      ownerUserId: store.users[0]?.id,
    });
  });

  it('makes the shared-only user a member of the shared account only', async () => {
    const actual = await sut.provision(sharedOnlyInput);

    expect(actual.created).toBe(true);
    expect(store.bankAccounts).toHaveLength(1);
    expect(store.bankAccounts[0]).toMatchObject({
      type: BANK_ACCOUNT_TYPE.Shared,
      name: sharedOnlyInput.sharedAccountName,
    });
    expect(store.memberships).toEqual([
      { userId: store.users[0]?.id, bankAccountId: store.bankAccounts[0]?.id },
    ]);
  });

  it('is idempotent for the owner', async () => {
    const first = await sut.provision(ownerInput);

    const second = await sut.provision(ownerInput);

    expect(second).toEqual({ user: first.user, created: false });
    expect(store.users).toHaveLength(1);
    expect(store.bankAccounts).toHaveLength(2);
    expect(store.memberships).toHaveLength(2);
  });

  it('does not rehash the password of an existing user', async () => {
    await sut.provision(ownerInput);

    await sut.provision({ ...ownerInput, password: randomText() });

    expect(store.users[0]?.passwordHash).toBe(`${FAKE_HASH_PREFIX}${ownerInput.password}`);
  });

  it('reuses the shared account of the owner for the shared-only user', async () => {
    await sut.provision(ownerInput);

    await sut.provision(sharedOnlyInput);

    expect(store.bankAccounts.filter((account) => account.type === BANK_ACCOUNT_TYPE.Shared)).toHaveLength(1);
    expect(store.users).toHaveLength(2);
    expect(store.memberships).toHaveLength(3);
  });

  it('rejects a personal account owned by someone else and adds no membership', async () => {
    const foreignPersonal = {
      id: randomText(),
      type: BANK_ACCOUNT_TYPE.Personal,
      name: randomText(),
      ownerUserId: randomText(),
    };
    const repositories = createInMemoryRepositories(store);
    vi.spyOn(repositories.bankAccounts, 'findPersonalByOwner').mockResolvedValue(foreignPersonal);
    const foreignUnitOfWork: ProvisioningUnitOfWork = { run: (work) => work(repositories) };
    const foreignSut = new UserProvisioningService(foreignUnitOfWork, new FakePasswordHasher());

    const actual = foreignSut.provision(ownerInput);

    await expect(actual).rejects.toThrow(new ConflictError(PERSONAL_ACCOUNT_MEMBER_MESSAGE));
    expect(store.memberships).toHaveLength(1);
  });
});
