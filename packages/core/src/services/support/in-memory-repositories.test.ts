import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  createInMemoryRepositories,
  FakePasswordHasher,
  InMemorySessionRepository,
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

describe('InMemorySessionRepository', () => {
  const NOW = new Date('2026-01-01T00:00:00Z');
  const HOUR_MS = 60 * 60 * 1000;
  const newSession = (tokenHash: string, expiresAt: Date, absoluteExpiresAt: Date) => ({
    userId: randomText(),
    tokenHash,
    expiresAt,
    absoluteExpiresAt,
  });

  it('finds, extends and deletes a session by its token hash', async () => {
    const sut = new InMemorySessionRepository(new InMemoryStore());
    const tokenHash = randomText();
    const later = new Date(NOW.getTime() + HOUR_MS);
    await sut.create(newSession(tokenHash, later, later));
    const created = await sut.findByTokenHash(tokenHash);

    await sut.updateExpiresAt(created?.id ?? '', NOW);
    const extended = await sut.findByTokenHash(tokenHash);
    await sut.deleteByTokenHash(tokenHash);

    expect(extended?.expiresAt).toEqual(NOW);
    expect(await sut.findByTokenHash(tokenHash)).toBeNull();
  });

  it('leaves other sessions alone when one is extended or deleted', async () => {
    const sut = new InMemorySessionRepository(new InMemoryStore());
    const later = new Date(NOW.getTime() + HOUR_MS);
    const [first, second] = [randomText(), randomText()];
    await sut.create(newSession(first, later, later));
    await sut.create(newSession(second, later, later));
    const firstRecord = await sut.findByTokenHash(first);

    await sut.updateExpiresAt(firstRecord?.id ?? '', NOW);
    await sut.deleteByTokenHash(first);

    expect((await sut.findByTokenHash(second))?.expiresAt).toEqual(later);
  });

  it('deletes sessions past either of the two deadlines', async () => {
    const sut = new InMemorySessionRepository(new InMemoryStore());
    const later = new Date(NOW.getTime() + HOUR_MS);
    const [idleExpired, absoluteExpired, valid] = [randomText(), randomText(), randomText()];
    await sut.create(newSession(idleExpired, NOW, later));
    await sut.create(newSession(absoluteExpired, later, NOW));
    await sut.create(newSession(valid, later, later));

    await sut.deleteExpired(NOW);

    expect(await sut.findByTokenHash(idleExpired)).toBeNull();
    expect(await sut.findByTokenHash(absoluteExpired)).toBeNull();
    expect(await sut.findByTokenHash(valid)).not.toBeNull();
  });
});
