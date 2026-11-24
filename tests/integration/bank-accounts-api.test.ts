import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE, PROVISIONING_MODE } from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret, startApp, type RunningApp } from './support/app-server.ts';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const SESSION_COOKIE_NAME = 'aitl_session';
const LOGIN_PATH = '/api/auth/login';
const BANK_ACCOUNTS_PATH = '/api/bank-accounts';
const RANDOM_BYTES = 12;
const SHARED_NAME = 'Wspolne';
const PERSONAL_NAME = 'Alfa osobiste';

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');
const randomEmail = (): string => `${randomText()}@example.test`;

type AccountBody = { id: string; type: string; name: string };
type Envelope = {
  data: { bankAccounts: AccountBody[] } & AccountBody;
  error: { code: string };
};

const readEnvelope = async (response: Response): Promise<Envelope> => (await response.json()) as Envelope;

describe('bank accounts API against PostgreSQL', () => {
  const sessionSecret = createSessionSecret();
  const orms: MikroORM[] = [];
  let app: RunningApp;
  let orm: MikroORM;
  let ownerToken: string;
  let wifeToken: string;
  let sharedId: string;
  let ownerPersonalId: string;
  let otherSharedId: string;

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const trackedOrm = await MikroORM.init(config);
    orms.push(trackedOrm);

    return trackedOrm;
  };

  const scope = () =>
    createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret }, initTrackedOrm).createScope()
      .cradle;

  const login = async (email: string, password: string): Promise<string> => {
    const response = await fetch(`${app.url}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      body: JSON.stringify({ email, password }),
    });
    const cookie = response.headers.getSetCookie().find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));

    return cookie?.split(';')[0]?.slice(SESSION_COOKIE_NAME.length + 1) ?? '';
  };

  const get = (path: string, token?: string): Promise<Response> =>
    fetch(`${app.url}${path}`, { headers: token === undefined ? {} : { Cookie: `${SESSION_COOKIE_NAME}=${token}` } });

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
    const { userProvisioningService, bankAccountRepository } = scope();
    const sharedName = `${SHARED_NAME} ${randomText()}`;
    const ownerEmail = randomEmail();
    const wifeEmail = randomEmail();
    const password = randomText();
    await userProvisioningService.provision({
      mode: PROVISIONING_MODE.Owner,
      email: ownerEmail,
      displayName: randomText(),
      password,
      sharedAccountName: sharedName,
      personalAccountName: PERSONAL_NAME,
    });
    await userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      email: wifeEmail,
      displayName: randomText(),
      password,
      sharedAccountName: sharedName,
    });
    await userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      email: randomEmail(),
      displayName: randomText(),
      password,
      sharedAccountName: `${SHARED_NAME} ${randomText()}`,
    });
    sharedId = (await bankAccountRepository.findSharedByName(sharedName))?.id ?? '';
    const ownerRow: Array<{ id: string }> = await orm.em
      .getConnection()
      .execute("select id from users where email = ?", [ownerEmail]);
    ownerPersonalId = (await bankAccountRepository.findPersonalByOwner(ownerRow[0]?.id ?? ''))?.id ?? '';
    const otherRows: Array<{ id: string }> = await orm.em
      .getConnection()
      .execute("select id from bank_accounts where type = 'shared' and id <> ? limit 1", [sharedId]);
    otherSharedId = otherRows[0]?.id ?? '';
    app = await startApp({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret });
    ownerToken = await login(ownerEmail, password);
    wifeToken = await login(wifeEmail, password);
  });

  afterAll(async () => {
    await app.stop();
    await Promise.all([orm, ...orms].map((connection) => connection.close()));
  });

  describe('GET /api/bank-accounts', () => {
    it('lists the shared account before the personal one for the owner', async () => {
      const response = await get(BANK_ACCOUNTS_PATH, ownerToken);

      const body = await readEnvelope(response);
      expect(response.status).toBe(200);
      expect(body.data.bankAccounts.map((account) => [account.id, account.type])).toEqual([
        [sharedId, 'shared'],
        [ownerPersonalId, 'personal'],
      ]);
      expect(Object.keys(body.data.bankAccounts[0] ?? {}).sort()).toEqual(['id', 'name', 'type']);
    });

    it('lists only the shared account for the second person and never the personal account of the owner', async () => {
      const response = await get(BANK_ACCOUNTS_PATH, wifeToken);

      const body = await readEnvelope(response);
      expect(body.data.bankAccounts.map((account) => account.id)).toEqual([sharedId]);
    });

    it.each([
      { name: 'without a cookie', token: undefined },
      { name: 'with an unknown token', token: randomText() },
    ])('answers 401 $name', async ({ token }) => {
      const response = await get(BANK_ACCOUNTS_PATH, token);

      expect(response.status).toBe(401);
      expect((await readEnvelope(response)).error.code).toBe('unauthorized');
    });
  });

  describe('GET /api/bank-accounts/{id}', () => {
    it('returns the own account', async () => {
      const response = await get(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, ownerToken);

      expect(response.status).toBe(200);
      expect((await readEnvelope(response)).data).toEqual({ id: ownerPersonalId, type: 'personal', name: PERSONAL_NAME });
    });

    it('answers 403 to the second person for the personal account of the owner', async () => {
      const response = await get(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, wifeToken);

      expect(response.status).toBe(403);
      expect((await readEnvelope(response)).error.code).toBe('forbidden');
    });

    it('answers 403 for the shared account of someone else', async () => {
      const response = await get(`${BANK_ACCOUNTS_PATH}/${otherSharedId}`, ownerToken);

      expect(response.status).toBe(403);
    });

    it('answers a missing account exactly like a foreign one', async () => {
      const foreign = await get(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, wifeToken);
      const missing = await get(`${BANK_ACCOUNTS_PATH}/${randomUUID()}`, wifeToken);

      expect(missing.status).toBe(foreign.status);
      expect(await missing.json()).toEqual(await foreign.json());
    });

    it('answers 401 without a session and 400 for an id that is not a UUID', async () => {
      const anonymous = await get(`${BANK_ACCOUNTS_PATH}/${sharedId}`);
      const malformed = await get(`${BANK_ACCOUNTS_PATH}/not-a-uuid`, ownerToken);

      expect(anonymous.status).toBe(401);
      expect(malformed.status).toBe(400);
    });
  });
});
