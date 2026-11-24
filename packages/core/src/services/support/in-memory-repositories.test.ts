import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createInMemoryRepositories,
  FakePasswordHasher,
  InMemoryStore,
  InMemoryUnitOfWork,
} from './in-memory-repositories';

const randomText = (): string => randomBytes(8).toString('hex');

describe('FakePasswordHasher', () => {
  it('verifies only the password it hashed', async () => {
    const sut = new FakePasswordHasher();
    const password = randomText();
    const passwordHash = await sut.hash(password);

    expect(await sut.verify(password, passwordHash)).toBe(true);
    expect(await sut.verify(randomText(), passwordHash)).toBe(false);
  });

  it('accepts a decoy verification', async () => {
    const sut = new FakePasswordHasher();

    await expect(sut.verifyAgainstDecoy()).resolves.toBeUndefined();
  });
});

describe('in-memory repositories', () => {
  it('finds users by email and stores created users', async () => {
    const { users } = createInMemoryRepositories(new InMemoryStore());
    const email = `${randomText()}@example.test`;

    const created = await users.create({ email, displayName: randomText(), passwordHash: randomText() });

    expect(await users.findByEmail(email)).toEqual(created);
    expect(await users.findByEmail(`${randomText()}@example.test`)).toBeNull();
  });

  it('finds bank accounts by id, shared name and personal owner', async () => {
    const { bankAccounts } = createInMemoryRepositories(new InMemoryStore());
    const ownerId = randomText();
    const shared = await bankAccounts.createShared(randomText());
    const personal = await bankAccounts.createPersonal(ownerId, randomText());

    expect(await bankAccounts.findById(shared.id)).toEqual(shared);
    expect(await bankAccounts.findById(randomText())).toBeNull();
    expect(await bankAccounts.findSharedByName(shared.name)).toEqual(shared);
    expect(await bankAccounts.findSharedByName(personal.name)).toBeNull();
    expect(await bankAccounts.findPersonalByOwner(ownerId)).toEqual(personal);
    expect(await bankAccounts.findPersonalByOwner(randomText())).toBeNull();
  });

  it('lists the bank accounts of the memberships of a user', async () => {
    const { bankAccounts, memberships } = createInMemoryRepositories(new InMemoryStore());
    const userId = randomText();
    const own = await bankAccounts.createShared(randomText());
    await bankAccounts.createShared(randomText());
    await memberships.add(userId, own.id);

    const actual = await bankAccounts.listForUser(userId);

    expect(actual).toEqual([own]);
    expect(await memberships.isMember(userId, own.id)).toBe(true);
    expect(await memberships.isMember(randomText(), own.id)).toBe(false);
  });

  it('counts the runs of the unit of work and hands out repositories of one store', async () => {
    const store = new InMemoryStore();
    const sut = new InMemoryUnitOfWork(store);

    const actual = await sut.run(async (repositories) =>
      repositories.users.create({
        email: `${randomText()}@example.test`,
        displayName: randomText(),
        passwordHash: randomText(),
      }),
    );

    expect(sut.runs).toBe(1);
    expect(store.users).toEqual([actual]);
  });
});
