import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { TooManyRequestsError } from '../../http/errors';
import { InMemoryLoginThrottleRepository, InMemoryStore } from '../support/in-memory-repositories';
import {
  LOGIN_FAILURE_LIMIT_PER_EMAIL,
  LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL,
  LOGIN_THROTTLE_LOCK_MS,
  LOGIN_THROTTLE_WINDOW_MS,
  LoginThrottleService,
  TOO_MANY_ATTEMPTS_MESSAGE,
} from './login-throttle.service';
import type { LoginThrottleRepository } from './login-throttle-repository.port';
import { SessionTokens } from './session-tokens';

const randomText = (): string => randomBytes(8).toString('hex');
const START = new Date('2026-01-01T00:00:00Z');
const PARTIAL_LOCK_ELAPSED_MS = 1500;
const MILLISECONDS_PER_SECOND = 1000;

describe('LoginThrottleService', () => {
  let store: InMemoryStore;
  let now: Date;
  let sut: LoginThrottleService;
  let email: string;
  let clientIp: string;

  const advance = (ms: number): void => {
    now = new Date(now.getTime() + ms);
  };
  const reserve = async (times: number): Promise<void> => {
    for (let attempt = 0; attempt < times; attempt += 1) {
      await sut.reserveAttempt({ email, clientIp });
    }
  };

  beforeEach(() => {
    store = new InMemoryStore();
    now = START;
    sut = new LoginThrottleService(
      new InMemoryLoginThrottleRepository(store),
      new SessionTokens(randomBytes(32).toString('hex')),
      () => now,
    );
    email = `${randomText()}@example.test`;
    clientIp = randomText();
  });

  it('lets the attempts up to the limit through', async () => {
    const actual = reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);

    await expect(actual).resolves.toBeUndefined();
  });

  it('refuses the attempt over the limit with the remaining lock time in whole seconds', async () => {
    await reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);
    advance(PARTIAL_LOCK_ELAPSED_MS);
    const expectedSeconds = Math.ceil((LOGIN_THROTTLE_LOCK_MS - PARTIAL_LOCK_ELAPSED_MS) / MILLISECONDS_PER_SECOND);

    const actual = sut.reserveAttempt({ email, clientIp });

    await expect(actual).rejects.toThrow(new TooManyRequestsError(TOO_MANY_ATTEMPTS_MESSAGE, expectedSeconds));
    await expect(actual).rejects.toMatchObject({ retryAfterSeconds: expectedSeconds });
  });

  it('keeps the lock until it ends and unlocks afterwards', async () => {
    await reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);

    advance(LOGIN_THROTTLE_LOCK_MS - 1);
    await expect(sut.reserveAttempt({ email, clientIp })).rejects.toBeInstanceOf(TooManyRequestsError);
    advance(1);

    await expect(sut.reserveAttempt({ email, clientIp })).resolves.toBeUndefined();
  });

  it('forgets failures older than the window', async () => {
    await reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);
    advance(LOGIN_THROTTLE_WINDOW_MS);

    await reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);

    await expect(sut.reserveAttempt({ email, clientIp })).resolves.toBeUndefined();
  });

  it('does not lock another e-mail from the same address', async () => {
    await reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);

    await expect(sut.reserveAttempt({ email: `${randomText()}@example.test`, clientIp })).resolves.toBeUndefined();
  });

  it('locks an e-mail for every address once the higher per-email limit is reached', async () => {
    for (let attempt = 0; attempt < LOGIN_FAILURE_LIMIT_PER_EMAIL; attempt += 1) {
      await sut.reserveAttempt({ email, clientIp: randomText() });
    }

    await expect(sut.reserveAttempt({ email, clientIp: randomText() })).rejects.toBeInstanceOf(TooManyRequestsError);
  });

  it('keeps hashed keys only', async () => {
    await reserve(1);

    const keys = store.throttles.map(({ keyHash }) => keyHash).join();
    expect(store.throttles).toHaveLength(2);
    expect(keys).not.toContain(email);
    expect(keys).not.toContain(clientIp);
  });

  it('removes both counters on reset', async () => {
    await reserve(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);

    await sut.reset({ email, clientIp });

    expect(store.throttles).toHaveLength(0);
    await expect(sut.reserveAttempt({ email, clientIp })).resolves.toBeUndefined();
  });

  it('falls back to the full lock time when the repository reports no end of the lock', async () => {
    const overLimit = { failures: LOGIN_FAILURE_LIMIT_PER_EMAIL + 1, lockedUntil: null };
    const repository: LoginThrottleRepository = {
      reserveAttempt: async () => overLimit,
      deleteByKeyHashes: async () => undefined,
    };
    const stubbedSut = new LoginThrottleService(repository, new SessionTokens(randomBytes(32).toString('hex')), () => now);

    const actual = stubbedSut.reserveAttempt({ email, clientIp });

    await expect(actual).rejects.toMatchObject({ retryAfterSeconds: LOGIN_THROTTLE_LOCK_MS / MILLISECONDS_PER_SECOND });
  });
});
