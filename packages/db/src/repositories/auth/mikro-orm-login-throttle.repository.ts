import type { LoginThrottleRepository, ThrottleCounter, ThrottleReservation } from '@aitl/core';
import { LOGIN_THROTTLES_TABLE, LoginThrottle } from '../../entities/auth/login-throttle.entity';
import type { EntityManagerProvider } from '../../orm-provider';

const FIRST_ATTEMPT = 1;

const WINDOW_EXPIRED_CONDITION = `(${LOGIN_THROTTLES_TABLE}.window_started_at <= ? and (${LOGIN_THROTTLES_TABLE}.locked_until is null or ${LOGIN_THROTTLES_TABLE}.locked_until <= ?))`;

const RESERVE_ATTEMPT_SQL = `
insert into ${LOGIN_THROTTLES_TABLE} (id, created_at, updated_at, key_hash, failures, window_started_at, locked_until)
values (gen_random_uuid(), ?, ?, ?, ${FIRST_ATTEMPT}, ?, case when ${FIRST_ATTEMPT} >= ? then ?::timestamptz else null end)
on conflict (key_hash) do update set
  failures = case when ${WINDOW_EXPIRED_CONDITION} then ${FIRST_ATTEMPT} else ${LOGIN_THROTTLES_TABLE}.failures + 1 end,
  window_started_at = case when ${WINDOW_EXPIRED_CONDITION} then ?::timestamptz else ${LOGIN_THROTTLES_TABLE}.window_started_at end,
  locked_until = case
    when ${WINDOW_EXPIRED_CONDITION} then null
    when ${LOGIN_THROTTLES_TABLE}.locked_until > ? then ${LOGIN_THROTTLES_TABLE}.locked_until
    when ${LOGIN_THROTTLES_TABLE}.failures + 1 >= ? then ?::timestamptz
    else ${LOGIN_THROTTLES_TABLE}.locked_until
  end,
  updated_at = ?
returning failures, locked_until`;

type ReservationRow = Readonly<{ failures: number; locked_until: Date | string | null }>;

export class MikroOrmLoginThrottleRepository implements LoginThrottleRepository {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async reserveAttempt(
    { keyHash, limit, windowMs, lockMs }: ThrottleCounter,
    now: Date,
  ): Promise<ThrottleReservation> {
    const em = await this.entityManagerProvider.getEntityManager();
    const windowExpiredBefore = new Date(now.getTime() - windowMs);
    const lockedUntil = new Date(now.getTime() + lockMs);

    const [row] = await em.getConnection().execute<[ReservationRow]>(RESERVE_ATTEMPT_SQL, [
      now,
      now,
      keyHash,
      now,
      limit,
      lockedUntil,
      windowExpiredBefore,
      now,
      windowExpiredBefore,
      now,
      now,
      windowExpiredBefore,
      now,
      now,
      limit,
      lockedUntil,
      now,
    ]);

    return { failures: row.failures, lockedUntil: row.locked_until === null ? null : new Date(row.locked_until) };
  }

  async deleteByKeyHashes(keyHashes: readonly string[]): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    await em.nativeDelete(LoginThrottle, { keyHash: { $in: [...keyHashes] } });
  }

  async deleteStale(staleBefore: Date): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    await em.nativeDelete(LoginThrottle, { updatedAt: { $lte: staleBefore } });
  }
}
