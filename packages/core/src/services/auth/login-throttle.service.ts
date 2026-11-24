import { TooManyRequestsError } from '../../http/errors';
import type { Clock } from './clock.port';
import type { LoginThrottleRepository, ThrottleCounter } from './login-throttle-repository.port';
import { HMAC_DOMAIN, type SessionTokens } from './session-tokens';

export const LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL = 5;
export const LOGIN_FAILURE_LIMIT_PER_EMAIL = 20;
export const LOGIN_THROTTLE_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_THROTTLE_LOCK_MS = 15 * 60 * 1000;
export const TOO_MANY_ATTEMPTS_MESSAGE = 'Too many login attempts';

const MILLISECONDS_PER_SECOND = 1000;

export type LoginAttemptIdentity = Readonly<{ email: string; clientIp: string }>;

export class LoginThrottleService {
  private readonly repository: LoginThrottleRepository;
  private readonly tokens: SessionTokens;
  private readonly clock: Clock;

  constructor(repository: LoginThrottleRepository, tokens: SessionTokens, clock: Clock) {
    this.repository = repository;
    this.tokens = tokens;
    this.clock = clock;
  }

  async reserveAttempt(identity: LoginAttemptIdentity): Promise<void> {
    const now = this.clock();
    const counters = this.counters(identity);
    const reservations = await Promise.all(counters.map((counter) => this.repository.reserveAttempt(counter, now)));

    const lockEndTimes = reservations.flatMap(({ failures, lockedUntil }, index) => {
      const { limit, lockMs } = counters[index] as ThrottleCounter;

      return failures > limit ? [(lockedUntil ?? new Date(now.getTime() + lockMs)).getTime()] : [];
    });

    if (lockEndTimes.length === 0) {
      return;
    }

    const retryAfterSeconds = Math.ceil((Math.max(...lockEndTimes) - now.getTime()) / MILLISECONDS_PER_SECOND);

    throw new TooManyRequestsError(TOO_MANY_ATTEMPTS_MESSAGE, retryAfterSeconds);
  }

  reset(identity: LoginAttemptIdentity): Promise<void> {
    return this.repository.deleteByKeyHashes([this.ipAndEmailCounter(identity).keyHash]);
  }

  private counters(identity: LoginAttemptIdentity): ThrottleCounter[] {
    return [this.ipAndEmailCounter(identity), this.emailCounter(identity)];
  }

  private ipAndEmailCounter({ email, clientIp }: LoginAttemptIdentity): ThrottleCounter {
    return this.counter(`ip:${clientIp}|email:${email}`, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);
  }

  private emailCounter({ email }: LoginAttemptIdentity): ThrottleCounter {
    return this.counter(`email:${email}`, LOGIN_FAILURE_LIMIT_PER_EMAIL);
  }

  private counter(key: string, limit: number): ThrottleCounter {
    return {
      keyHash: this.tokens.hash(key, HMAC_DOMAIN.Throttle),
      limit,
      windowMs: LOGIN_THROTTLE_WINDOW_MS,
      lockMs: LOGIN_THROTTLE_LOCK_MS,
    };
  }
}
