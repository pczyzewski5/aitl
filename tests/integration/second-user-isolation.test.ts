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
const LOGOUT_PATH = '/api/auth/logout';
const ME_PATH = '/api/auth/me';
const BANK_ACCOUNTS_PATH = '/api/bank-accounts';
const HOME_PATH = '/';
const RANDOM_BYTES = 12;
const PARALLEL_ROUNDS = 10;
const STATUS_OK = 200;
const STATUS_UNAUTHORIZED = 401;
const STATUS_FORBIDDEN = 403;
const STATUS_METHOD_NOT_ALLOWED = 405;
const PERSONAL_TYPE = 'personal';
const SHARED_TYPE = 'shared';

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');

type AccountBody = { id: string; type: string; name: string };
type Envelope = {
  data: { bankAccounts: AccountBody[]; user: { id: string; email: string; displayName: string } };
  error: { code: string };
};
type Person = { email: string; displayName: string; password: string; userId: string };
type Credentials = Pick<Person, 'email' | 'password'>;

const readEnvelope = async (response: Response): Promise<Envelope> => (await response.json()) as Envelope;
const accountIds = (envelope: Envelope): string[] => envelope.data.bankAccounts.map((account) => account.id);

describe('second person and data isolation against PostgreSQL', () => {
  const sessionSecret = createSessionSecret();
  const orms: MikroORM[] = [];
  const sharedName = `Wspolne ${randomText()}`;
  const ownerPersonalName = `Osobiste ${randomText()}`;
  let app: RunningApp;
  let orm: MikroORM;
  let owner: Person;
  let wife: Person;
  let stranger: Person;
  let sharedId: string;
  let ownerPersonalId: string;
  let strangerPersonalId: string;

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const trackedOrm = await MikroORM.init(config);
    orms.push(trackedOrm);

    return trackedOrm;
  };

  const scope = () =>
    createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret }, initTrackedOrm).createScope()
      .cradle;

  const login = (credentials: Credentials): Promise<Response> =>
    fetch(`${app.url}${LOGIN_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

  const loginForToken = async (credentials: Credentials): Promise<string> => {
    const response = await login(credentials);
    const cookie = response.headers.getSetCookie().find((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));

    return cookie?.split(';')[0]?.slice(SESSION_COOKIE_NAME.length + 1) ?? '';
  };

  const logout = (token: string): Promise<Response> =>
    fetch(`${app.url}${LOGOUT_PATH}`, {
      method: 'POST',
      headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });

  const request = (path: string, token?: string, method = 'GET'): Promise<Response> =>
    fetch(`${app.url}${path}`, {
      method,
      redirect: 'manual',
      headers: token === undefined ? {} : { Cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });

  const findUserId = async (email: string): Promise<string> => {
    const rows: Array<{ id: string }> = await orm.em
      .getConnection()
      .execute('select id from users where email = ?', [email]);

    return rows[0]?.id ?? '';
  };

  const newPerson = (): Omit<Person, 'userId'> => ({
    email: `${randomText()}@example.test`,
    displayName: `Osoba ${randomText()}`,
    password: randomText(),
  });

  const provisionOwner = async (sharedAccountName: string, personalAccountName: string): Promise<Person> => {
    const person = newPerson();
    await scope().userProvisioningService.provision({
      mode: PROVISIONING_MODE.Owner,
      ...person,
      sharedAccountName,
      personalAccountName,
    });

    return { ...person, userId: await findUserId(person.email) };
  };

  const provisionSharedOnly = async (sharedAccountName: string): Promise<Person> => {
    const person = newPerson();
    await scope().userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      ...person,
      sharedAccountName,
    });

    return { ...person, userId: await findUserId(person.email) };
  };

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await orm.migrator.up();
    owner = await provisionOwner(sharedName, ownerPersonalName);
    wife = await provisionSharedOnly(sharedName);
    stranger = await provisionOwner(`Wspolne ${randomText()}`, `Osobiste ${randomText()}`);
    const { bankAccountRepository } = scope();
    sharedId = (await bankAccountRepository.findSharedByName(sharedName))?.id ?? '';
    ownerPersonalId = (await bankAccountRepository.findPersonalByOwner(owner.userId))?.id ?? '';
    strangerPersonalId = (await bankAccountRepository.findPersonalByOwner(stranger.userId))?.id ?? '';
    app = await startApp({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: sessionSecret });
  });

  afterAll(async () => {
    await app.stop();
    await Promise.all([orm, ...orms].map((connection) => connection.close()));
  });

  describe('the account of the second person', () => {
    it('is a member of the shared account only', async () => {
      const rows: Array<{ type: string }> = await orm.em
        .getConnection()
        .execute(
          'select b.type from bank_account_memberships m join bank_accounts b on b.id = m.bank_account_id where m.user_id = ?',
          [wife.userId],
        );

      expect(rows.map((row) => row.type)).toEqual([SHARED_TYPE]);
    });

    it('logs in with correct credentials and sees the shared account', async () => {
      const response = await login(wife);

      const hasSessionCookie = response.headers
        .getSetCookie()
        .some((entry) => entry.startsWith(`${SESSION_COOKIE_NAME}=`));
      const list = await readEnvelope(await request(BANK_ACCOUNTS_PATH, await loginForToken(wife)));
      expect(response.status).toBe(STATUS_OK);
      expect(hasSessionCookie).toBe(true);
      expect(list.data.bankAccounts.map((account) => [account.id, account.name])).toEqual([[sharedId, sharedName]]);
    });

    it('is refused with a generic answer and no cookie for a wrong password', async () => {
      const response = await login({ email: wife.email, password: randomText() });

      expect(response.status).toBe(STATUS_UNAUTHORIZED);
      expect(response.headers.getSetCookie()).toEqual([]);
    });
  });

  describe('home page', () => {
    it('shows the second person under her own name and nothing of the owner', async () => {
      const token = await loginForToken(wife);

      const response = await request(HOME_PATH, token);

      const html = await response.text();
      expect(response.status).toBe(STATUS_OK);
      expect(html).toContain(wife.displayName);
      expect(html).not.toContain(owner.displayName);
      expect(html).not.toContain(owner.email);
      expect(html).not.toContain(ownerPersonalName);
      expect(html).not.toContain(ownerPersonalId);
    });

    it('ignores an account parameter pointing at the personal account of the owner', async () => {
      const token = await loginForToken(wife);

      const response = await request(`${HOME_PATH}?account=${ownerPersonalId}`, token);

      const html = await response.text();
      expect(response.status).toBe(STATUS_OK);
      expect(html).not.toContain(ownerPersonalName);
      expect(html).not.toContain(owner.displayName);
    });
  });

  describe('personal account of the owner', () => {
    it('answers 403 to the second person and returns none of its data', async () => {
      const token = await loginForToken(wife);

      const response = await request(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, token);

      const text = await response.text();
      expect(response.status).toBe(STATUS_FORBIDDEN);
      expect((JSON.parse(text) as Envelope).error.code).toBe('forbidden');
      expect(text).not.toContain(ownerPersonalName);
      expect(text).not.toContain(ownerPersonalId);
      expect(text).not.toContain(PERSONAL_TYPE);
    });

    it('answers 403 with the same body to the second person and to the owner for the account of a stranger', async () => {
      const wifeResponse = await request(`${BANK_ACCOUNTS_PATH}/${strangerPersonalId}`, await loginForToken(wife));
      const ownerResponse = await request(`${BANK_ACCOUNTS_PATH}/${strangerPersonalId}`, await loginForToken(owner));

      expect(wifeResponse.status).toBe(STATUS_FORBIDDEN);
      expect(ownerResponse.status).toBe(STATUS_FORBIDDEN);
      expect(await wifeResponse.json()).toEqual(await ownerResponse.json());
    });

    it('answers 401 before any access decision without a valid session', async () => {
      const token = await loginForToken(wife);
      await logout(token);

      const anonymous = await request(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`);
      const ended = await request(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, token);
      const missingAnonymous = await request(`${BANK_ACCOUNTS_PATH}/${randomUUID()}`);

      expect(anonymous.status).toBe(STATUS_UNAUTHORIZED);
      expect(ended.status).toBe(STATUS_UNAUTHORIZED);
      expect(await anonymous.json()).toEqual(await missingAnonymous.json());
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('has no %s handler that could touch it', async (method) => {
      const token = await loginForToken(wife);

      const response = await request(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, token, method);

      expect(response.status).toBe(STATUS_METHOD_NOT_ALLOWED);
    });
  });

  describe('two people logged in at the same time', () => {
    it('keeps the sessions independent: each sees its own user and own accounts', async () => {
      const ownerToken = await loginForToken(owner);
      const wifeToken = await loginForToken(wife);

      const ownerMe = await readEnvelope(await request(ME_PATH, ownerToken));
      const wifeMe = await readEnvelope(await request(ME_PATH, wifeToken));
      const ownerList = await readEnvelope(await request(BANK_ACCOUNTS_PATH, ownerToken));
      const wifeList = await readEnvelope(await request(BANK_ACCOUNTS_PATH, wifeToken));

      expect(ownerToken).not.toBe(wifeToken);
      expect(ownerMe.data.user.email).toBe(owner.email);
      expect(wifeMe.data.user.email).toBe(wife.email);
      expect(accountIds(ownerList)).toEqual([sharedId, ownerPersonalId]);
      expect(accountIds(wifeList)).toEqual([sharedId]);
    });

    it('does not end the session of the second person when the owner logs out', async () => {
      const ownerToken = await loginForToken(owner);
      const wifeToken = await loginForToken(wife);

      const logoutResponse = await logout(ownerToken);

      expect(logoutResponse.status).toBe(STATUS_OK);
      expect((await request(ME_PATH, ownerToken)).status).toBe(STATUS_UNAUTHORIZED);
      expect((await request(BANK_ACCOUNTS_PATH, ownerToken)).status).toBe(STATUS_UNAUTHORIZED);
      expect((await request(ME_PATH, wifeToken)).status).toBe(STATUS_OK);
      expect((await request(`${BANK_ACCOUNTS_PATH}/${sharedId}`, wifeToken)).status).toBe(STATUS_OK);
    });

    it('does not end the session of the owner when the second person logs out', async () => {
      const ownerToken = await loginForToken(owner);
      const wifeToken = await loginForToken(wife);

      await logout(wifeToken);

      expect((await request(ME_PATH, wifeToken)).status).toBe(STATUS_UNAUTHORIZED);
      expect((await request(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, ownerToken)).status).toBe(STATUS_OK);
    });

    it('never mixes up data of parallel requests from both sessions', async () => {
      const ownerToken = await loginForToken(owner);
      const wifeToken = await loginForToken(wife);

      const rounds = await Promise.all(
        Array.from({ length: PARALLEL_ROUNDS }, async () => ({
          ownerList: await readEnvelope(await request(BANK_ACCOUNTS_PATH, ownerToken)),
          wifeList: await readEnvelope(await request(BANK_ACCOUNTS_PATH, wifeToken)),
          wifeDenied: (await request(`${BANK_ACCOUNTS_PATH}/${ownerPersonalId}`, wifeToken)).status,
        })),
      );

      for (const round of rounds) {
        expect(accountIds(round.ownerList)).toEqual([sharedId, ownerPersonalId]);
        expect(accountIds(round.wifeList)).toEqual([sharedId]);
        expect(round.wifeDenied).toBe(STATUS_FORBIDDEN);
      }
    });
  });
});
