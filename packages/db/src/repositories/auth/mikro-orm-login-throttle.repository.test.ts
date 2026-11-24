import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { LoginThrottle } from '../../entities/auth/login-throttle.entity';
import type { EntityManager } from '../../orm-provider';
import { MikroOrmLoginThrottleRepository } from './mikro-orm-login-throttle.repository';

const randomText = (): string => randomBytes(8).toString('hex');
const NOW = new Date('2026-01-01T00:00:00Z');
const LOCKED_UNTIL = new Date('2026-01-01T00:15:00Z');
const WINDOW_START = new Date('2025-12-31T23:45:00Z');
const FIFTEEN_MINUTES_MS = 900_000;
const LIMIT = 5;

function createSut(entityManager: Partial<EntityManager>): MikroOrmLoginThrottleRepository {
  return new MikroOrmLoginThrottleRepository({
    getEntityManager: async () => entityManager as EntityManager,
  });
}

function createConnectionEntityManager(execute: ReturnType<typeof vi.fn>): Partial<EntityManager> {
  return { getConnection: () => ({ execute }) } as unknown as Partial<EntityManager>;
}

describe('MikroOrmLoginThrottleRepository', () => {
  it.each([
    { name: 'a Date', value: LOCKED_UNTIL, expected: LOCKED_UNTIL },
    { name: 'a string', value: LOCKED_UNTIL.toISOString(), expected: LOCKED_UNTIL },
    { name: 'null', value: null, expected: null },
  ])('maps the latest lock returned as $name', async ({ value, expected }) => {
    const execute = vi.fn().mockResolvedValue([{ locked_until: value }]);
    const sut = createSut(createConnectionEntityManager(execute));
    const keyHashes = [randomText(), randomText()];

    const actual = await sut.findActiveLockUntil(keyHashes, NOW);

    expect(actual).toEqual(expected);
    expect(execute).toHaveBeenCalledWith(expect.stringContaining('locked_until > ?'), [keyHashes, NOW]);
  });

  it('treats an empty result as no lock', async () => {
    const sut = createSut(createConnectionEntityManager(vi.fn().mockResolvedValue([])));

    const actual = await sut.findActiveLockUntil([randomText()], NOW);

    expect(actual).toBeNull();
  });

  it('records a failure with one atomic upsert keyed by the hash', async () => {
    const execute = vi.fn().mockResolvedValue(undefined);
    const sut = createSut(createConnectionEntityManager(execute));
    const keyHash = randomText();

    await sut.recordFailure(
      { keyHash, limit: LIMIT, windowMs: FIFTEEN_MINUTES_MS, lockMs: FIFTEEN_MINUTES_MS },
      NOW,
    );

    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(execute).toHaveBeenCalledTimes(1);
    expect(sql).toContain('on conflict (key_hash) do update');
    expect(params).toContain(keyHash);
    expect(params.filter((param) => param === LIMIT)).toHaveLength(3);
    expect(params).toContainEqual(LOCKED_UNTIL);
    expect(params).toContainEqual(WINDOW_START);
  });

  it('deletes the counters of the given keys', async () => {
    const nativeDelete = vi.fn().mockResolvedValue(2);
    const sut = createSut({ nativeDelete });
    const keyHashes = [randomText(), randomText()];

    await sut.deleteByKeyHashes(keyHashes);

    expect(nativeDelete).toHaveBeenCalledWith(LoginThrottle, { keyHash: { $in: keyHashes } });
  });
});
