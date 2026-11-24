import type { LoginThrottleRepository, ThrottleCounter } from '@aitl/core';
import { LOGIN_THROTTLES_TABLE, LoginThrottle } from '../../entities/auth/login-throttle.entity';
import type { EntityManagerProvider } from '../../orm-provider';

const FIRST_FAILURE = 1;

const FIND_ACTIVE_LOCK_SQL = `select max(locked_until) as locked_until from ${LOGIN_THROTTLES_TABLE} where key_hash in (?) and locked_until > ?`;

const RECORD_FAILURE_SQL = `
insert into ${LOGIN_THROTTLES_TABLE} (id, created_at, updated_at, key_hash, failures, window_started_at, locked_until)
values (gen_random_uuid(), ?, ?, ?, ${FIRST_FAILURE}, ?, case when ${FIRST_FAILURE} >= ? then ?::timestamptz else null end)
on conflict (key_hash) do update set
  failures = case when ${LOGIN_THROTTLES_TABLE}.window_started_at <= ? then ${FIRST_FAILURE} else ${LOGIN_THROTTLES_TABLE}.failures + 1 end,
  window_started_at = case when ${LOGIN_THROTTLES_TABLE}.window_started_at <= ? then ?::timestamptz else ${LOGIN_THROTTLES_TABLE}.window_started_at end,
  locked_until = case
    when ${LOGIN_THROTTLES_TABLE}.window_started_at <= ? then (case when ${FIRST_FAILURE} >= ? then ?::timestamptz else null end)
    when ${LOGIN_THROTTLES_TABLE}.failures + 1 >= ? then ?::timestamptz
    else ${LOGIN_THROTTLES_TABLE}.locked_until
  end,
  updated_at = ?`;

type LockRow = Readonly<{ locked_until: Date | string | null }>;

export class MikroOrmLoginThrottleRepository implements LoginThrottleRepository {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async findActiveLockUntil(keyHashes: readonly string[], now: Date): Promise<Date | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const rows = await em.getConnection().execute<LockRow[]>(FIND_ACTIVE_LOCK_SQL, [[...keyHashes], now]);
    const lockedUntil = rows[0]?.locked_until ?? null;

    return lockedUntil === null ? null : new Date(lockedUntil);
  }

  async recordFailure({ keyHash, limit, windowMs, lockMs }: ThrottleCounter, now: Date): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    const windowExpiredBefore = new Date(now.getTime() - windowMs);
    const lockedUntil = new Date(now.getTime() + lockMs);

    await em.getConnection().execute(RECORD_FAILURE_SQL, [
      now,
      now,
      keyHash,
      now,
      limit,
      lockedUntil,
      windowExpiredBefore,
      windowExpiredBefore,
      now,
      windowExpiredBefore,
      limit,
      lockedUntil,
      limit,
      lockedUntil,
      now,
    ]);
  }

  async deleteByKeyHashes(keyHashes: readonly string[]): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    await em.nativeDelete(LoginThrottle, { keyHash: { $in: [...keyHashes] } });
  }
}
