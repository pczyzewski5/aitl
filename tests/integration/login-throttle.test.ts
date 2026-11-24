import { createHmac, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  LOGIN_FAILURE_LIMIT_PER_EMAIL,
  LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL,
  LOGIN_THROTTLE_LOCK_MS,
  LOGIN_THROTTLE_WINDOW_MS,
  PROVISIONING_MODE,
} from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret, startApp, type RunningApp } from './support/app-server.ts';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const LOGIN_PATH = '/api/auth/login';
const FORWARDED_FOR = 'X-Forwarded-For';
const RANDOM_BYTES = 12;
const PARALLEL_ATTEMPTS = 10;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');
const randomEmail = (): string => `${randomText()}@example.test`;

type ThrottleRow = { failures: number; locked_until: Date | string | null };

describe('login throttling against PostgreSQL', () => {
  const sessionSecret = createSessionSecret();
  const orms: MikroORM[] = [];
  const apps: RunningApp[] = [];
  let app: RunningApp;
  let proxiedApp: RunningApp;
  let orm: MikroORM;
  let email: string;
  let password: string;

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const trackedOrm = await MikroORM.init(config);
    orms.push(trackedOrm);

    return trackedOrm;
  };

  const scope = () =>
    createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret }, initTrackedOrm).createScope()
      .cradle;

  const startTrackedApp = async (env: Record<string, string | undefined>): Promise<RunningApp> => {
    const started = await startApp({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret, ...env });
    apps.push(started);

    return started;
  };

  const attempt = (
    runningApp: RunningApp,
    credentials: { email: string; password: string },
    headers: Record<string, string> = {},
  ): Promise<Response> =>
    fetch(`${runningApp.url}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, ...headers },
      body: JSON.stringify(credentials),
    });

  const keyHash = (key: string): string =>
    createHmac('sha256', sessionSecret).update(`throttle:${key}`).digest('hex');

  const findThrottle = async (hash: string): Promise<ThrottleRow | undefined> => {
    const rows: ThrottleRow[] = await orm.em
      .getConnection()
      .execute('select failures, locked_until from login_throttles where key_hash = ?', [hash]);

    return rows[0];
  };

  const countThrottleRows = async (hashes: string[]): Promise<number> => {
    const rows: unknown[] = await orm.em
      .getConnection()
      .execute('select id from login_throttles where key_hash in (?)', [hashes]);

    return rows.length;
  };

  const failMany = async (runningApp: RunningApp, loginEmail: string, times: number, headers = {}): Promise<void> => {
    for (let count = 0; count < times; count += 1) {
      await attempt(runningApp, { email: loginEmail, password: randomText() }, headers);
    }
  };

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
    email = randomEmail();
    password = randomText();
    await scope().userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      email,
      displayName: randomText(),
      password,
      sharedAccountName: randomText(),
    });
    app = await startTrackedApp({});
    proxiedApp = await startTrackedApp({ TRUSTED_PROXY_HOPS: '1' });
  });

  afterAll(async () => {
    await Promise.all(apps.map((running) => running.stop()));
    await Promise.all([orm, ...orms].map((connection) => connection.close()));
  });

  describe('over HTTP', () => {
    it('answers 429 with Retry-After after the limit of failures and refuses even the correct password', async () => {
      const lockedEmail = randomEmail();
      await scope().userProvisioningService.provision({
        mode: PROVISIONING_MODE.SharedOnly,
        email: lockedEmail,
        displayName: randomText(),
        password,
        sharedAccountName: randomText(),
      });
      await failMany(app, lockedEmail, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);

      const correct = await attempt(app, { email: lockedEmail, password });
      const wrong = await attempt(app, { email: lockedEmail, password: randomText() });

      const retryAfter = Number(correct.headers.get('Retry-After'));
      const body = await correct.json();
      expect(correct.status).toBe(429);
      expect(wrong.status).toBe(429);
      expect(correct.headers.getSetCookie()).toEqual([]);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(LOGIN_THROTTLE_LOCK_MS / SECOND_MS);
      expect(body).toEqual({
        ok: false,
        error: { code: 'too_many_attempts', message: expect.any(String), retryAfterSeconds: retryAfter },
      });
    });

    it('keeps failures below the limit harmless and a success clears them', async () => {
      const loginEmail = randomEmail();
      await scope().userProvisioningService.provision({
        mode: PROVISIONING_MODE.SharedOnly,
        email: loginEmail,
        displayName: randomText(),
        password,
        sharedAccountName: randomText(),
      });
      await failMany(app, loginEmail, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);

      const success = await attempt(app, { email: loginEmail, password });
      await failMany(app, loginEmail, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);
      const again = await attempt(app, { email: loginEmail, password });

      expect(success.status).toBe(200);
      expect(again.status).toBe(200);
      expect(await countThrottleRows([keyHash(`ip:unknown|email:${loginEmail}`), keyHash(`email:${loginEmail}`)])).toBe(0);
    });

    it('answers an unknown e-mail like a known one: 401 first, 429 after the limit, with a row stored', async () => {
      const unknownEmail = randomEmail();
      const first = await attempt(app, { email: unknownEmail, password: randomText() });
      await failMany(app, unknownEmail, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);

      const locked = await attempt(app, { email: unknownEmail, password: randomText() });

      expect(first.status).toBe(401);
      expect(locked.status).toBe(429);
      expect(await findThrottle(keyHash(`ip:unknown|email:${unknownEmail}`))).toBeDefined();
    });

    it('stores only hashes of the e-mail and the address', async () => {
      const loginEmail = randomEmail();
      await attempt(proxiedApp, { email: loginEmail, password: randomText() }, { [FORWARDED_FOR]: '203.0.113.7' });

      const rows: Array<{ key_hash: string }> = await orm.em
        .getConnection()
        .execute('select key_hash from login_throttles order by created_at desc limit 20');

      expect(rows.map((row) => row.key_hash).join()).not.toContain('203.0.113.7');
      expect(rows.map((row) => row.key_hash).join()).not.toContain(loginEmail);
      expect(await findThrottle(keyHash(`ip:203.0.113.7|email:${loginEmail}`))).toBeDefined();
    });

    it('counts per address behind a trusted proxy and ignores the header without one', async () => {
      const loginEmail = randomEmail();
      await failMany(proxiedApp, loginEmail, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL, { [FORWARDED_FOR]: '198.51.100.1' });

      const sameAddress = await attempt(proxiedApp, { email: loginEmail, password }, { [FORWARDED_FOR]: '198.51.100.1' });
      const otherAddress = await attempt(proxiedApp, { email: loginEmail, password: randomText() }, { [FORWARDED_FOR]: '198.51.100.2' });
      await failMany(app, loginEmail, LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL, { [FORWARDED_FOR]: '198.51.100.3' });
      const spoofed = await attempt(app, { email: loginEmail, password: randomText() }, { [FORWARDED_FOR]: '198.51.100.4' });

      expect(sameAddress.status).toBe(429);
      expect(otherAddress.status).toBe(401);
      expect(spoofed.status).toBe(429);
    });

    it('locks one e-mail for every address after the higher per-email limit', async () => {
      const loginEmail = randomEmail();
      for (let count = 0; count < LOGIN_FAILURE_LIMIT_PER_EMAIL; count += 1) {
        await attempt(
          proxiedApp,
          { email: loginEmail, password: randomText() },
          { [FORWARDED_FOR]: `192.0.2.${count + 1}` },
        );
      }

      const fresh = await attempt(proxiedApp, { email: loginEmail, password }, { [FORWARDED_FOR]: '192.0.2.250' });

      expect(fresh.status).toBe(429);
    });

    it('counts every failure of ten parallel attempts without losing increments', async () => {
      const loginEmail = randomEmail();

      const responses = await Promise.all(
        Array.from({ length: PARALLEL_ATTEMPTS }, () => attempt(app, { email: loginEmail, password: randomText() })),
      );

      const statuses = responses.map((response) => response.status);
      const recordedFailures = statuses.filter((status) => status === 401).length;
      const row = await findThrottle(keyHash(`ip:unknown|email:${loginEmail}`));
      expect(statuses.every((status) => status === 401 || status === 429)).toBe(true);
      expect(recordedFailures).toBeGreaterThanOrEqual(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);
      expect(row?.failures).toBe(recordedFailures);
      expect((await attempt(app, { email: loginEmail, password: randomText() })).status).toBe(429);
    });
  });

  describe('repository on the real database', () => {
    const counterFor = (hash: string, limit = LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL) => ({
      keyHash: hash,
      limit,
      windowMs: LOGIN_THROTTLE_WINDOW_MS,
      lockMs: LOGIN_THROTTLE_LOCK_MS,
    });

    it('does not lose increments when many failures are recorded at once', async () => {
      const { loginThrottleRepository } = scope();
      const hash = randomText();
      const now = new Date();

      await Promise.all(
        Array.from({ length: PARALLEL_ATTEMPTS * 2 }, () =>
          loginThrottleRepository.recordFailure(counterFor(hash, PARALLEL_ATTEMPTS * 2), now),
        ),
      );

      const row = await findThrottle(hash);
      expect(row?.failures).toBe(PARALLEL_ATTEMPTS * 2);
      expect(row?.locked_until).not.toBeNull();
    });

    it('locks exactly at the limit and not before', async () => {
      const { loginThrottleRepository } = scope();
      const hash = randomText();
      const now = new Date();
      for (let count = 1; count < LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL; count += 1) {
        await loginThrottleRepository.recordFailure(counterFor(hash), now);
      }
      const before = await loginThrottleRepository.findActiveLockUntil([hash], now);

      await loginThrottleRepository.recordFailure(counterFor(hash), now);

      const after = await loginThrottleRepository.findActiveLockUntil([hash], now);
      expect(before).toBeNull();
      expect(after).toEqual(new Date(now.getTime() + LOGIN_THROTTLE_LOCK_MS));
    });

    it('releases the lock after the lock time and starts a fresh window afterwards', async () => {
      const { loginThrottleRepository } = scope();
      const hash = randomText();
      const now = new Date();
      for (let count = 0; count < LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL; count += 1) {
        await loginThrottleRepository.recordFailure(counterFor(hash), now);
      }
      const justBeforeEnd = new Date(now.getTime() + LOGIN_THROTTLE_LOCK_MS - SECOND_MS);
      const atEnd = new Date(now.getTime() + LOGIN_THROTTLE_LOCK_MS);

      expect(await loginThrottleRepository.findActiveLockUntil([hash], justBeforeEnd)).not.toBeNull();
      expect(await loginThrottleRepository.findActiveLockUntil([hash], atEnd)).toBeNull();

      await loginThrottleRepository.recordFailure(counterFor(hash), atEnd);

      const row = await findThrottle(hash);
      expect(row?.failures).toBe(1);
      expect(row?.locked_until).toBeNull();
    });

    it('resets the count after the window without a lock', async () => {
      const { loginThrottleRepository } = scope();
      const hash = randomText();
      const now = new Date();
      await loginThrottleRepository.recordFailure(counterFor(hash), now);
      await loginThrottleRepository.recordFailure(counterFor(hash), new Date(now.getTime() + MINUTE_MS));
      expect((await findThrottle(hash))?.failures).toBe(2);

      await loginThrottleRepository.recordFailure(
        counterFor(hash),
        new Date(now.getTime() + LOGIN_THROTTLE_WINDOW_MS),
      );

      expect((await findThrottle(hash))?.failures).toBe(1);
    });

    it('deletes the given counters only', async () => {
      const { loginThrottleRepository } = scope();
      const removed = randomText();
      const kept = randomText();
      const now = new Date();
      await loginThrottleRepository.recordFailure(counterFor(removed), now);
      await loginThrottleRepository.recordFailure(counterFor(kept), now);

      await loginThrottleRepository.deleteByKeyHashes([removed]);

      expect(await findThrottle(removed)).toBeUndefined();
      expect(await findThrottle(kept)).toBeDefined();
    });
  });
});
