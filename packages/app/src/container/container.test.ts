import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ORM_GLOBAL_KEY, type EntityManager, type OrmInit } from '@aitl/db';
import { logger, SessionTokens, systemClock } from '@aitl/core';
import { DEVELOPMENT_ENVIRONMENT, container, createAppContainer } from './container';
import { createAuthRegistrations } from './registrations/auth';
import { createBankAccountsRegistrations } from './registrations/bank-accounts';
import { createCoreRegistrations } from './registrations/core';
import { createDbRegistrations } from './registrations/db';
import { createUsersRegistrations } from './registrations/users';

const DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';
const SESSION_SECRET = randomBytes(32).toString('hex');
const VALID_ENV = { DATABASE_URL, SESSION_SECRET };

function createFakeOrmInit(): OrmInit {
  const fork = (): EntityManager => ({}) as EntityManager;

  return vi.fn().mockResolvedValue({ em: { fork } }) as unknown as OrmInit;
}

describe('createAppContainer', () => {
  afterEach(() => {
    delete (globalThis as Record<symbol, unknown>)[ORM_GLOBAL_KEY];
  });

  it('resolves the validated environment', () => {
    const sut = createAppContainer({ ...VALID_ENV, NODE_ENV: 'test' });

    expect(sut.cradle.env).toEqual({
      DATABASE_URL,
      SESSION_SECRET,
      NODE_ENV: 'test',
      SESSION_COOKIE_SECURE: false,
      TRUSTED_PROXY_HOPS: 0,
    });
  });

  it('fails to resolve the environment when it is invalid', () => {
    const sut = createAppContainer({});

    expect(() => sut.cradle.env).toThrow('Invalid environment variables: DATABASE_URL, SESSION_SECRET');
  });

  it('resolves the shared logger', () => {
    const sut = createAppContainer(VALID_ENV);

    expect(sut.cradle.logger).toBe(logger);
  });

  it('does not touch the database when the providers are resolved', () => {
    const init = createFakeOrmInit();
    const sut = createAppContainer(VALID_ENV, init);

    const actual = sut.createScope().cradle.entityManagerProvider;

    expect(actual).toBeDefined();
    expect(init).not.toHaveBeenCalled();
  });

  it('shares one ORM provider between scopes', () => {
    const sut = createAppContainer(VALID_ENV);

    expect(sut.createScope().cradle.ormProvider).toBe(sut.createScope().cradle.ormProvider);
  });

  it('gives every scope its own entity manager and reuses it within the scope', async () => {
    const init = createFakeOrmInit();
    const sut = createAppContainer(VALID_ENV, init);
    const firstScope = sut.createScope();
    const secondScope = sut.createScope();

    const first = await firstScope.cradle.entityManagerProvider.getEntityManager();
    const firstAgain = await firstScope.cradle.entityManagerProvider.getEntityManager();
    const second = await secondScope.cradle.entityManagerProvider.getEntityManager();

    expect(first).toBe(firstAgain);
    expect(first).not.toBe(second);
    expect(init).toHaveBeenCalledTimes(1);
  });

  it('shares the ORM across module reloads in development', async () => {
    const init = createFakeOrmInit();
    const reloadedInit = createFakeOrmInit();
    const development = { ...VALID_ENV, NODE_ENV: DEVELOPMENT_ENVIRONMENT };
    await createAppContainer(development, init).cradle.ormProvider.forkEntityManager();

    await createAppContainer(development, reloadedInit).cradle.ormProvider.forkEntityManager();

    expect(reloadedInit).not.toHaveBeenCalled();
  });

  it('does not share the ORM across containers outside development', async () => {
    const init = createFakeOrmInit();
    const otherInit = createFakeOrmInit();
    const production = { ...VALID_ENV, NODE_ENV: 'production' };
    await createAppContainer(production, init).cradle.ormProvider.forkEntityManager();

    await createAppContainer(production, otherInit).cradle.ormProvider.forkEntityManager();

    expect(otherInit).toHaveBeenCalledTimes(1);
  });
});

describe('container registrations', () => {
  const registeredKeys = [
    ...Object.keys(createCoreRegistrations({})),
    ...Object.keys(createDbRegistrations()),
    ...Object.keys(createAuthRegistrations()),
    ...Object.keys(createBankAccountsRegistrations()),
    ...Object.keys(createUsersRegistrations()),
  ];

  it('registers every key of the per-concept registration files', () => {
    const sut = createAppContainer(VALID_ENV);

    expect(Object.keys(sut.registrations).sort()).toEqual([...registeredKeys].sort());
  });

  it.each(registeredKeys)('resolves %s in a scope', (key) => {
    const sut = createAppContainer(VALID_ENV, createFakeOrmInit());
    const scope = sut.createScope();

    const actual = (scope.cradle as Record<string, unknown>)[key];

    expect(actual).toBeDefined();
  });
});

describe('container services', () => {
  it('shares one password hasher between scopes', () => {
    const sut = createAppContainer(VALID_ENV, createFakeOrmInit());

    expect(sut.createScope().cradle.passwordHasher).toBe(sut.createScope().cradle.passwordHasher);
  });

  it('gives every scope its own services bound to the entity manager of the scope', () => {
    const sut = createAppContainer(VALID_ENV, createFakeOrmInit());
    const firstScope = sut.createScope();
    const secondScope = sut.createScope();

    expect(firstScope.cradle.bankAccountService).toBe(firstScope.cradle.bankAccountService);
    expect(firstScope.cradle.bankAccountService).not.toBe(secondScope.cradle.bankAccountService);
    expect(firstScope.cradle.userProvisioningService).not.toBe(
      secondScope.cradle.userProvisioningService,
    );
  });
});

describe('container session services', () => {
  it('shares one token hasher keyed with the session secret between scopes', () => {
    const sut = createAppContainer(VALID_ENV, createFakeOrmInit());
    const token = 'token';

    const actual = sut.createScope().cradle.sessionTokens.hash(token);

    expect(actual).toBe(new SessionTokens(SESSION_SECRET).hash(token));
    expect(sut.createScope().cradle.sessionTokens).toBe(sut.createScope().cradle.sessionTokens);
  });

  it('resolves the session service as the session resolver of the same scope', () => {
    const sut = createAppContainer(VALID_ENV, createFakeOrmInit());
    const scope = sut.createScope();

    expect(scope.cradle.sessionResolver).toBe(scope.cradle.sessionService);
    expect(scope.cradle.sessionService).not.toBe(sut.createScope().cradle.sessionService);
  });

  it('gives the services the system clock', () => {
    const sut = createAppContainer(VALID_ENV, createFakeOrmInit());

    expect(sut.createScope().cradle.clock).toBe(systemClock);
  });
});

describe('container', () => {
  it('can be created without a resolved environment', () => {
    expect(() => container.createScope()).not.toThrow();
  });
});
