import { createHmac, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  PROVISIONING_MODE,
  SESSION_ABSOLUTE_TTL_SECONDS,
  SESSION_IDLE_TTL_MS,
} from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret, startApp, type RunningApp } from './support/app-server.ts';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const SESSION_COOKIE_NAME = 'aitl_session';
const LOGIN_PATH = '/api/auth/login';
const LOGOUT_PATH = '/api/auth/logout';
const UNREACHABLE_DATABASE_URL = 'postgres://aitl@127.0.0.1:1/aitl';
const RANDOM_BYTES = 12;
const DAY_MS = 24 * 60 * 60 * 1000;

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');

type SessionRow = { user_id: string; expires_at: string | Date; absolute_expires_at: string | Date };

const toTime = (value: string | Date | undefined): number => new Date(value ?? 0).getTime();

function readCookie(response: Response): string | undefined {
  return response.headers.getSetCookie().find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));
}

function readToken(cookie: string | undefined): string {
  return cookie?.split(';')[0]?.slice(SESSION_COOKIE_NAME.length + 1) ?? '';
}

describe('session login and logout against PostgreSQL', () => {
  const sessionSecret = createSessionSecret();
  const orms: MikroORM[] = [];
  const apps: RunningApp[] = [];
  let app: RunningApp;
  let orm: MikroORM;
  let email: string;
  let password: string;
  let userId: string;

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const trackedOrm = await MikroORM.init(config);
    orms.push(trackedOrm);

    return trackedOrm;
  };

  const container = () =>
    createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret }, initTrackedOrm);

  const startTrackedApp = async (env: Record<string, string | undefined>): Promise<RunningApp> => {
    const started = await startApp({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret, ...env });
    apps.push(started);

    return started;
  };

  const post = (
    runningApp: RunningApp,
    path: string,
    body: unknown,
    headers: Record<string, string> = { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
  ): Promise<Response> =>
    fetch(`${runningApp.url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  const postWithCookie = (runningApp: RunningApp, path: string, token: string): Promise<Response> =>
    fetch(`${runningApp.url}${path}`, {
      method: 'POST',
      headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });

  const findSessions = (tokenHash: string): Promise<SessionRow[]> =>
    orm.em.getConnection().execute('select * from sessions where token_hash = ?', [tokenHash]);

  const hashToken = (token: string): string =>
    createHmac('sha256', sessionSecret).update(`session:${token}`).digest('hex');

  const login = async (): Promise<string> => {
    const response = await post(app, LOGIN_PATH, { email, password });

    return readToken(readCookie(response));
  };

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
    email = `${randomText()}@example.test`;
    password = randomText();
    const provisioned = await container().createScope().cradle.userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      email,
      displayName: randomText(),
      password,
      sharedAccountName: randomText(),
    });
    userId = provisioned.user.id;
    app = await startTrackedApp({});
  });

  afterAll(async () => {
    await Promise.all(apps.map((running) => running.stop()));
    await Promise.all([orm, ...orms].map((connection) => connection.close()));
  });

  describe('login', () => {
    it('answers with the user without secrets and sets an httpOnly lax cookie that lives as long as the absolute limit', async () => {
      const response = await post(app, LOGIN_PATH, { email: email.toUpperCase(), password });

      const body = await response.json();
      const cookie = readCookie(response);
      expect(response.status).toBe(200);
      expect(body).toEqual({ ok: true, data: { user: { id: userId, email, displayName: expect.any(String) } } });
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=lax');
      expect(cookie).toContain('Path=/');
      expect(cookie).toContain(`Max-Age=${SESSION_ABSOLUTE_TTL_SECONDS}`);
      expect(cookie).not.toContain('Secure');
    });

    it('stores only the HMAC of the token with the user and both deadlines', async () => {
      const token = await login();

      const rows = await findSessions(hashToken(token));
      const plainTokenRows = await findSessions(token);
      expect(token.length).toBeGreaterThanOrEqual(43);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.user_id).toBe(userId);
      expect(toTime(rows[0]?.absolute_expires_at)).toBeGreaterThan(toTime(rows[0]?.expires_at));
      expect(plainTokenRows).toHaveLength(0);
    });

    it('answers a wrong password and an unknown e-mail with the same response and no cookie', async () => {
      const wrongPassword = await post(app, LOGIN_PATH, { email, password: randomText() });
      const unknownEmail = await post(app, LOGIN_PATH, { email: `${randomText()}@example.test`, password });

      expect(wrongPassword.status).toBe(401);
      expect(unknownEmail.status).toBe(wrongPassword.status);
      expect(await unknownEmail.json()).toEqual(await wrongPassword.json());
      expect(readCookie(wrongPassword)).toBeUndefined();
      expect(readCookie(unknownEmail)).toBeUndefined();
    });

    it('rejects an invalid body with 400 and no session', async () => {
      const response = await post(app, LOGIN_PATH, { email: 'not-an-email', password });

      expect(response.status).toBe(400);
      expect(readCookie(response)).toBeUndefined();
    });

    it('rejects a request without the CSRF header with 403 even for correct credentials', async () => {
      const response = await post(app, LOGIN_PATH, { email, password }, {});

      expect(response.status).toBe(403);
      expect(readCookie(response)).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('deletes the session record, clears the cookie and makes the old token unusable', async () => {
      const token = await login();

      const response = await postWithCookie(app, LOGOUT_PATH, token);

      const resolved = await container().createScope().cradle.sessionResolver.resolve(token);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true, data: null });
      expect(readCookie(response)).toContain('Max-Age=0');
      expect(await findSessions(hashToken(token))).toHaveLength(0);
      expect(resolved).toBeNull();
    });

    it('keeps the other sessions of the same user', async () => {
      const first = await login();
      const second = await login();

      await postWithCookie(app, LOGOUT_PATH, first);

      expect(await findSessions(hashToken(first))).toHaveLength(0);
      expect(await findSessions(hashToken(second))).toHaveLength(1);
    });

    it('answers 200 and clears the cookie without a session, also when repeated', async () => {
      const token = await login();
      await postWithCookie(app, LOGOUT_PATH, token);

      const repeated = await postWithCookie(app, LOGOUT_PATH, token);
      const withoutCookie = await post(app, LOGOUT_PATH, {});

      expect(repeated.status).toBe(200);
      expect(withoutCookie.status).toBe(200);
      expect(readCookie(withoutCookie)).toContain('Max-Age=0');
    });

    it('rejects a request without the CSRF header and keeps the session', async () => {
      const token = await login();

      const response = await fetch(`${app.url}${LOGOUT_PATH}`, {
        method: 'POST',
        headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
      });

      expect(response.status).toBe(403);
      expect(await findSessions(hashToken(token))).toHaveLength(1);
    });
  });

  describe('session lifetime', () => {
    const setDeadlines = (token: string, expiresAt: Date, absoluteExpiresAt: Date): Promise<unknown> =>
      orm.em
        .getConnection()
        .execute('update sessions set expires_at = ?, absolute_expires_at = ? where token_hash = ?', [
          expiresAt,
          absoluteExpiresAt,
          hashToken(token),
        ]);

    it('resolves a fresh session to its user', async () => {
      const token = await login();

      const actual = await container().createScope().cradle.sessionResolver.resolve(token);

      expect(actual).toEqual({ userId });
    });

    it('does not resolve a session after the idle deadline', async () => {
      const token = await login();
      await setDeadlines(token, new Date(Date.now() - 1000), new Date(Date.now() + DAY_MS));

      const actual = await container().createScope().cradle.sessionResolver.resolve(token);

      expect(actual).toBeNull();
    });

    it('does not resolve a session after the absolute limit even when the idle deadline is later', async () => {
      const token = await login();
      await setDeadlines(token, new Date(Date.now() + DAY_MS), new Date(Date.now() - 1000));

      const actual = await container().createScope().cradle.sessionResolver.resolve(token);

      expect(actual).toBeNull();
    });

    it('slides the idle deadline of a session that has not been used for a while', async () => {
      const token = await login();
      await setDeadlines(token, new Date(Date.now() + DAY_MS), new Date(Date.now() + 60 * DAY_MS));

      await container().createScope().cradle.sessionResolver.resolve(token);

      const [row] = await findSessions(hashToken(token));
      const slidBy = toTime(row?.expires_at) - Date.now();
      expect(slidBy).toBeGreaterThan(SESSION_IDLE_TTL_MS - DAY_MS);
      expect(slidBy).toBeLessThanOrEqual(SESSION_IDLE_TTL_MS);
    });

    it('removes expired sessions of everyone on the next login', async () => {
      const staleToken = await login();
      await setDeadlines(staleToken, new Date(Date.now() - 1000), new Date(Date.now() + DAY_MS));

      await login();

      expect(await findSessions(hashToken(staleToken))).toHaveLength(0);
    });
  });

  describe('cookie flags depending on the environment', () => {
    it('sets Secure by default in a production start', async () => {
      const productionApp = await startTrackedApp({ NODE_ENV: 'production', SESSION_COOKIE_SECURE: undefined });

      const response = await post(productionApp, LOGIN_PATH, { email, password });

      expect(readCookie(response)).toContain('Secure');
    });

    it('sets no Secure flag when SESSION_COOKIE_SECURE is false and sets it when true', async () => {
      const insecureApp = await startTrackedApp({ SESSION_COOKIE_SECURE: 'false' });
      const secureApp = await startTrackedApp({ SESSION_COOKIE_SECURE: 'true' });

      const insecure = await post(insecureApp, LOGIN_PATH, { email, password });
      const secure = await post(secureApp, LOGIN_PATH, { email, password });

      expect(readCookie(insecure)).not.toContain('Secure');
      expect(readCookie(secure)).toContain('Secure');
    });
  });

  describe('logs', () => {
    it('never contain passwords, tokens or the session secret', async () => {
      const wrongPassword = randomText();
      const token = await login();
      await post(app, LOGIN_PATH, { email, password: wrongPassword });
      await postWithCookie(app, LOGOUT_PATH, token);
      const brokenDatabaseApp = await startTrackedApp({ DATABASE_URL: UNREACHABLE_DATABASE_URL });
      const failingResponse = await post(brokenDatabaseApp, LOGIN_PATH, { email, password: wrongPassword });

      const output = `${app.output()}${brokenDatabaseApp.output()}`;
      expect(failingResponse.status).toBe(500);
      expect(brokenDatabaseApp.output()).toContain('Unhandled error in API handler');
      for (const secret of [password, wrongPassword, token, sessionSecret]) {
        expect(output).not.toContain(secret);
      }
    });
  });
});
