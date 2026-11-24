import { createHmac } from 'node:crypto';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  PROVISIONING_MODE,
} from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret, startApp, type RunningApp } from './support/app-server.ts';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const ROOT_ENV_FILE = `${REPOSITORY_ROOT}.env`;
const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const SESSION_COOKIE_NAME = 'aitl_session';
const ROOT_ENV_ALREADY_EXISTS = existsSync(ROOT_ENV_FILE);

describe.skipIf(ROOT_ENV_ALREADY_EXISTS)('environment of the application read from the repository root', () => {
  const sessionSecret = createSessionSecret();
  const orms: MikroORM[] = [];
  let app: RunningApp;
  let orm: MikroORM;

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const trackedOrm = await MikroORM.init(config);
    orms.push(trackedOrm);

    return trackedOrm;
  };

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
    writeFileSync(ROOT_ENV_FILE, `DATABASE_URL=${inject('databaseUrl')}\nSESSION_SECRET=${sessionSecret}\n`);
    app = await startApp({ DATABASE_URL: undefined, SESSION_SECRET: undefined });
  });

  afterAll(async () => {
    await app?.stop();
    rmSync(ROOT_ENV_FILE, { force: true });
    await Promise.all([orm, ...orms].map((connection) => connection.close()));
  });

  it('gives the runtime the DATABASE_URL and the SESSION_SECRET of the root .env file', async () => {
    const email = `${createSessionSecret().slice(0, 12)}@example.test`;
    const password = createSessionSecret();
    const container = createAppContainer(
      { DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret },
      initTrackedOrm,
    );
    await container.createScope().cradle.userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      email,
      displayName: 'Root env',
      password,
      sharedAccountName: createSessionSecret(),
    });

    const response = await fetch(`${app.url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      body: JSON.stringify({ email, password }),
    });

    const cookie = response.headers.getSetCookie().find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
    const token = cookie?.split(';')[0]?.slice(SESSION_COOKIE_NAME.length + 1) ?? '';
    const tokenHash = createHmac('sha256', sessionSecret).update(`session:${token}`).digest('hex');
    const rows = await orm.em.getConnection().execute('select 1 from sessions where token_hash = ?', [tokenHash]);
    expect(response.status).toBe(200);
    expect(rows).toHaveLength(1);
  });
});
