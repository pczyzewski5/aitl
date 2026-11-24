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
  ])('maps the reserved attempt with the lock returned as $name', async ({ value, expected }) => {
    const failures = 3;
    const execute = vi.fn().mockResolvedValue([{ failures, locked_until: value }]);
    const sut = createSut(createConnectionEntityManager(execute));

    const actual = await sut.reserveAttempt(
      { keyHash: randomText(), limit: LIMIT, windowMs: FIFTEEN_MINUTES_MS, lockMs: FIFTEEN_MINUTES_MS },
      NOW,
    );

    expect(actual).toEqual({ failures, lockedUntil: expected });
  });

  it('reserves an attempt with one atomic upsert keyed by the hash that returns the counter', async () => {
    const execute = vi.fn().mockResolvedValue([{ failures: 1, locked_until: null }]);
    const sut = createSut(createConnectionEntityManager(execute));
    const keyHash = randomText();

    await sut.reserveAttempt(
      { keyHash, limit: LIMIT, windowMs: FIFTEEN_MINUTES_MS, lockMs: FIFTEEN_MINUTES_MS },
      NOW,
    );

    const [sql, params] = execute.mock.calls[0] as [string, unknown[]];
    expect(execute).toHaveBeenCalledTimes(1);
    expect(sql).toContain('on conflict (key_hash) do update');
    expect(sql).toContain('returning failures, locked_until');
    expect(sql.match(/\?/g)).toHaveLength(params.length);
    expect(params).toContain(keyHash);
    expect(params.filter((param) => param === LIMIT)).toHaveLength(2);
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
