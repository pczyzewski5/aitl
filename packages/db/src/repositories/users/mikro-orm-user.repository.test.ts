import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { User } from '../../entities/users/user.entity';
import type { EntityManager } from '../../orm-provider';
import { MikroOrmUserRepository } from './mikro-orm-user.repository';

const randomText = (): string => randomBytes(8).toString('hex');

function createRow() {
  return {
    id: randomText(),
    email: `${randomText()}@example.test`,
    displayName: randomText(),
    passwordHash: randomText(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createSut(entityManager: Partial<EntityManager>): MikroOrmUserRepository {
  return new MikroOrmUserRepository({
    getEntityManager: async () => entityManager as EntityManager,
  });
}

describe('MikroOrmUserRepository', () => {
  it('finds a user by e-mail and maps it to a record without entity fields', async () => {
    const row = createRow();
    const findOne = vi.fn().mockResolvedValue(row);
    const sut = createSut({ findOne });
    const expected = {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      passwordHash: row.passwordHash,
    };

    const actual = await sut.findByEmail(row.email);

    expect(actual).toEqual(expected);
    expect(findOne).toHaveBeenCalledWith(User, { email: row.email });
  });

  it('returns null for an unknown e-mail', async () => {
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(null) });

    const actual = await sut.findByEmail(`${randomText()}@example.test`);

    expect(actual).toBeNull();
  });

  it('finds a user by id and maps it to a record', async () => {
    const row = createRow();
    const findOne = vi.fn().mockResolvedValue(row);
    const sut = createSut({ findOne });
    const expected = { id: row.id, email: row.email, displayName: row.displayName, passwordHash: row.passwordHash };

    const actual = await sut.findById(row.id);

    expect(actual).toEqual(expected);
    expect(findOne).toHaveBeenCalledWith(User, { id: row.id });
  });

  it('returns null for an unknown id', async () => {
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(null) });

    const actual = await sut.findById(randomText());

    expect(actual).toBeNull();
  });

  it('creates a user, flushes it and maps the result', async () => {
    const row = createRow();
    const create = vi.fn().mockReturnValue(row);
    const flush = vi.fn().mockResolvedValue(undefined);
    const sut = createSut({ create, flush });
    const newUser = { email: row.email, displayName: row.displayName, passwordHash: row.passwordHash };

    const actual = await sut.create(newUser);

    expect(create).toHaveBeenCalledWith(User, newUser);
    expect(flush).toHaveBeenCalledTimes(1);
    expect(actual).toEqual({ id: row.id, ...newUser });
  });
});
