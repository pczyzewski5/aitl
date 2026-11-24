import { afterEach, describe, expect, it, vi } from 'vitest';
import { ORM_GLOBAL_KEY, type EntityManager, type OrmInit } from '@aitl/db';
import { logger } from '@aitl/core';
import { DEVELOPMENT_ENVIRONMENT, container, createAppContainer } from './container';

const DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';

function createFakeOrmInit(): OrmInit {
  const fork = (): EntityManager => ({}) as EntityManager;

  return vi.fn().mockResolvedValue({ em: { fork } }) as unknown as OrmInit;
}

describe('createAppContainer', () => {
  afterEach(() => {
    delete (globalThis as Record<symbol, unknown>)[ORM_GLOBAL_KEY];
  });

  it('resolves the validated environment', () => {
    const sut = createAppContainer({ DATABASE_URL, NODE_ENV: 'test' });

    expect(sut.cradle.env).toEqual({ DATABASE_URL, NODE_ENV: 'test' });
  });

  it('fails to resolve the environment when it is invalid', () => {
    const sut = createAppContainer({});

    expect(() => sut.cradle.env).toThrow('Invalid environment variables: DATABASE_URL');
  });

  it('resolves the shared logger', () => {
    const sut = createAppContainer({ DATABASE_URL });

    expect(sut.cradle.logger).toBe(logger);
  });

  it('does not touch the database when the providers are resolved', () => {
    const init = createFakeOrmInit();
    const sut = createAppContainer({ DATABASE_URL }, init);

    const actual = sut.createScope().cradle.entityManagerProvider;

    expect(actual).toBeDefined();
    expect(init).not.toHaveBeenCalled();
  });

  it('shares one ORM provider between scopes', () => {
    const sut = createAppContainer({ DATABASE_URL });

    expect(sut.createScope().cradle.ormProvider).toBe(sut.createScope().cradle.ormProvider);
  });

  it('gives every scope its own entity manager and reuses it within the scope', async () => {
    const init = createFakeOrmInit();
    const sut = createAppContainer({ DATABASE_URL }, init);
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
    const development = { DATABASE_URL, NODE_ENV: DEVELOPMENT_ENVIRONMENT };
    await createAppContainer(development, init).cradle.ormProvider.forkEntityManager();

    await createAppContainer(development, reloadedInit).cradle.ormProvider.forkEntityManager();

    expect(reloadedInit).not.toHaveBeenCalled();
  });

  it('does not share the ORM across containers outside development', async () => {
    const init = createFakeOrmInit();
    const otherInit = createFakeOrmInit();
    const production = { DATABASE_URL, NODE_ENV: 'production' };
    await createAppContainer(production, init).cradle.ormProvider.forkEntityManager();

    await createAppContainer(production, otherInit).cradle.ormProvider.forkEntityManager();

    expect(otherInit).toHaveBeenCalledTimes(1);
  });
});

describe('container', () => {
  it('can be created without a resolved environment', () => {
    expect(() => container.createScope()).not.toThrow();
  });
});
