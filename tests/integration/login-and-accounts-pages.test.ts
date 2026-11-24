import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, PROVISIONING_MODE } from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret, startApp, type RunningApp } from './support/app-server.ts';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const SESSION_COOKIE_NAME = 'aitl_session';
const LOGIN_API_PATH = '/api/auth/login';
const LOGOUT_API_PATH = '/api/auth/logout';
const ME_API_PATH = '/api/auth/me';
const LOGIN_PAGE_PATH = '/login';
const RANDOM_BYTES = 12;
const REDIRECT_STATUS = 307;

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');

type UserEnvelope = { data: { user: { id: string; email: string; displayName: string } }; error: { code: string } };

describe('login and accounts pages against PostgreSQL', () => {
  const sessionSecret = createSessionSecret();
  const orms: MikroORM[] = [];
  let app: RunningApp;
  let orm: MikroORM;
  let email: string;
  let password: string;
  let displayName: string;

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const trackedOrm = await MikroORM.init(config);
    orms.push(trackedOrm);

    return trackedOrm;
  };

  const login = async (): Promise<string> => {
    const response = await fetch(`${app.url}${LOGIN_API_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      body: JSON.stringify({ email, password }),
    });
    const cookie = response.headers.getSetCookie().find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));

    return cookie?.split(';')[0]?.slice(SESSION_COOKIE_NAME.length + 1) ?? '';
  };

  const logout = (token: string): Promise<Response> =>
    fetch(`${app.url}${LOGOUT_API_PATH}`, {
      method: 'POST',
      headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });

  const get = (path: string, token?: string): Promise<Response> =>
    fetch(`${app.url}${path}`, {
      redirect: 'manual',
      headers: token === undefined ? {} : { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
    email = `${randomText()}@example.test`;
    password = randomText();
    displayName = `Osoba ${randomText()}`;
    const { userProvisioningService } = createAppContainer(
      { DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret },
      initTrackedOrm,
    ).createScope().cradle;
    await userProvisioningService.provision({
      mode: PROVISIONING_MODE.Owner,
      email,
      displayName,
      password,
      sharedAccountName: `Wspolne ${randomText()}`,
      personalAccountName: `Osobiste ${randomText()}`,
    });
    app = await startApp({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret });
  });

  afterAll(async () => {
    await app.stop();
    await Promise.all([orm, ...orms].map((connection) => connection.close()));
  });

  it('redirects a visitor without a session from the home page to the login page', async () => {
    const actual = await get('/');

    expect(actual.status).toBe(REDIRECT_STATUS);
    expect(new URL(actual.headers.get('location') ?? '', app.url).pathname).toBe(LOGIN_PAGE_PATH);
  });

  it('renders the login page for a visitor without a session', async () => {
    const actual = await get(LOGIN_PAGE_PATH);

    expect(actual.status).toBe(200);
    expect(await actual.text()).toContain('Logowanie');
  });

  it('redirects a signed-in user from the login page to the home page', async () => {
    const token = await login();

    const actual = await get(LOGIN_PAGE_PATH, token);

    expect(actual.status).toBe(REDIRECT_STATUS);
    expect(new URL(actual.headers.get('location') ?? '', app.url).pathname).toBe('/');
  });

  it('renders the home page with the name of the signed-in user', async () => {
    const token = await login();

    const actual = await get('/', token);

    expect(actual.status).toBe(200);
    expect(await actual.text()).toContain(displayName);
  });

  it('redirects to the login page when the session was ended', async () => {
    const token = await login();
    await logout(token);

    const actual = await get('/', token);

    expect(actual.status).toBe(REDIRECT_STATUS);
    expect(new URL(actual.headers.get('location') ?? '', app.url).pathname).toBe(LOGIN_PAGE_PATH);
  });

  describe('GET /api/auth/me', () => {
    it('returns the user of the session without secrets', async () => {
      const token = await login();

      const response = await get(ME_API_PATH, token);

      const body = (await response.json()) as UserEnvelope;
      expect(response.status).toBe(200);
      expect(body.data.user).toEqual({ id: body.data.user.id, email, displayName });
    });

    it('answers 401 without a session', async () => {
      const response = await get(ME_API_PATH);

      expect(response.status).toBe(401);
      expect(((await response.json()) as UserEnvelope).error.code).toBe('unauthorized');
    });
  });

  it('keeps two sessions of one user independent: ending one does not end the other', async () => {
    const first = await login();
    const second = await login();

    await logout(first);

    expect(first).not.toBe(second);
    expect((await get(ME_API_PATH, first)).status).toBe(401);
    expect((await get(ME_API_PATH, second)).status).toBe(200);
  });
});
