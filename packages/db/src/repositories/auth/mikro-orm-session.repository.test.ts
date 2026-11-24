import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Session } from '../../entities/auth/session.entity';
import type { EntityManager } from '../../orm-provider';
import { MikroOrmSessionRepository } from './mikro-orm-session.repository';

const randomText = (): string => randomBytes(8).toString('hex');
const NOW = new Date('2026-01-01T00:00:00Z');
const LATER = new Date('2026-02-01T00:00:00Z');

function createSut(entityManager: Partial<EntityManager>): MikroOrmSessionRepository {
  return new MikroOrmSessionRepository({
    getEntityManager: async () => entityManager as EntityManager,
  });
}

describe('MikroOrmSessionRepository', () => {
  it('creates a session for the user and flushes it', async () => {
    const create = vi.fn();
    const flush = vi.fn().mockResolvedValue(undefined);
    const sut = createSut({ create, flush });
    const newSession = {
      userId: randomText(),
      tokenHash: randomText(),
      expiresAt: NOW,
      absoluteExpiresAt: LATER,
    };

    await sut.create(newSession);

    expect(create).toHaveBeenCalledWith(Session, {
      user: newSession.userId,
      tokenHash: newSession.tokenHash,
      expiresAt: NOW,
      absoluteExpiresAt: LATER,
    });
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('finds a session by its token hash and maps it to a record without the hash', async () => {
    const row = {
      id: randomText(),
      user: { id: randomText() },
      tokenHash: randomText(),
      expiresAt: NOW,
      absoluteExpiresAt: LATER,
    };
    const findOne = vi.fn().mockResolvedValue(row);
    const sut = createSut({ findOne });
    const expected = {
      id: row.id,
      userId: row.user.id,
      expiresAt: NOW,
      absoluteExpiresAt: LATER,
    };

    const actual = await sut.findByTokenHash(row.tokenHash);

    expect(actual).toEqual(expected);
    expect(findOne).toHaveBeenCalledWith(Session, { tokenHash: row.tokenHash });
  });

  it('returns null for an unknown token hash', async () => {
    const sut = createSut({ findOne: vi.fn().mockResolvedValue(null) });

    const actual = await sut.findByTokenHash(randomText());

    expect(actual).toBeNull();
  });

  it('updates the idle deadline of one session', async () => {
    const nativeUpdate = vi.fn().mockResolvedValue(1);
    const sut = createSut({ nativeUpdate });
    const id = randomText();

    await sut.updateExpiresAt(id, LATER);

    expect(nativeUpdate).toHaveBeenCalledWith(Session, { id }, { expiresAt: LATER });
  });

  it('deletes a session by its token hash', async () => {
    const nativeDelete = vi.fn().mockResolvedValue(1);
    const sut = createSut({ nativeDelete });
    const tokenHash = randomText();

    await sut.deleteByTokenHash(tokenHash);

    expect(nativeDelete).toHaveBeenCalledWith(Session, { tokenHash });
  });

  it('deletes sessions past the idle or the absolute deadline', async () => {
    const nativeDelete = vi.fn().mockResolvedValue(2);
    const sut = createSut({ nativeDelete });

    await sut.deleteExpired(NOW);

    expect(nativeDelete).toHaveBeenCalledWith(Session, {
      $or: [{ expiresAt: { $lte: NOW } }, { absoluteExpiresAt: { $lte: NOW } }],
    });
  });
});
