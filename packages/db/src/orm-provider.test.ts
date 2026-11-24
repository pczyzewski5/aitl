import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MikroORM, Options } from '@mikro-orm/postgresql';
import { createOrmConfig } from './orm-config';
import {
  ORM_GLOBAL_KEY,
  createEntityManagerProvider,
  createOrmProvider,
  type EntityManager,
  type OrmInit,
} from './orm-provider';

const DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';
const config: Options = { clientUrl: DATABASE_URL };

function createFakeOrm(): { orm: MikroORM; forkedManagers: EntityManager[] } {
  const forkedManagers: EntityManager[] = [];
  const fork = (): EntityManager => {
    const manager = {} as EntityManager;
    forkedManagers.push(manager);

    return manager;
  };
  const orm = { em: { fork } } as unknown as MikroORM;

  return { orm, forkedManagers };
}

describe('createOrmProvider', () => {
  afterEach(() => {
    delete (globalThis as Record<symbol, unknown>)[ORM_GLOBAL_KEY];
  });

  it('does not initialize the ORM until an entity manager is requested', () => {
    const init = vi.fn<OrmInit>();

    createOrmProvider({ config, init });

    expect(init).not.toHaveBeenCalled();
  });

  it('initializes the ORM once with the given config and forks a manager per request', async () => {
    const { orm, forkedManagers } = createFakeOrm();
    const init = vi.fn<OrmInit>().mockResolvedValue(orm);
    const sut = createOrmProvider({ config, init });

    const first = await sut.forkEntityManager();
    const second = await sut.forkEntityManager();

    expect(init).toHaveBeenCalledExactlyOnceWith(config);
    expect(forkedManagers).toEqual([first, second]);
    expect(first).not.toBe(second);
  });

  it('retries initialization after a failure, for example a configuration or discovery error', async () => {
    const { orm } = createFakeOrm();
    const init = vi
      .fn<OrmInit>()
      .mockRejectedValueOnce(new Error('entity discovery failed'))
      .mockResolvedValueOnce(orm);
    const sut = createOrmProvider({ config, init });

    await expect(sut.forkEntityManager()).rejects.toThrow('entity discovery failed');
    await expect(sut.forkEntityManager()).resolves.toBeDefined();

    expect(init).toHaveBeenCalledTimes(2);
  });

  it('keeps a newer initialization when an older failed one settles late', async () => {
    const { orm } = createFakeOrm();
    let rejectFirst: (error: Error) => void = () => undefined;
    const first = new Promise<MikroORM>((_, reject) => {
      rejectFirst = reject;
    });
    const init = vi.fn<OrmInit>().mockReturnValueOnce(first).mockResolvedValue(orm);
    const sut = createOrmProvider({ config, init, shareAcrossReloads: true });
    const pendingFork = sut.forkEntityManager();
    const replacement = Promise.resolve(orm);
    const store = (globalThis as Record<symbol, { current?: Promise<MikroORM> }>)[ORM_GLOBAL_KEY];
    store!.current = replacement;

    rejectFirst(new Error('late failure'));

    await expect(pendingFork).rejects.toThrow('late failure');
    expect(store!.current).toBe(replacement);
  });

  it('does not share the ORM between providers by default', async () => {
    const { orm } = createFakeOrm();
    const init = vi.fn<OrmInit>().mockResolvedValue(orm);

    await createOrmProvider({ config, init }).forkEntityManager();
    await createOrmProvider({ config, init }).forkEntityManager();

    expect(init).toHaveBeenCalledTimes(2);
  });

  it('shares the ORM between providers when asked, to survive module reloads', async () => {
    const { orm } = createFakeOrm();
    const init = vi.fn<OrmInit>().mockResolvedValue(orm);

    await createOrmProvider({ config, init, shareAcrossReloads: true }).forkEntityManager();
    await createOrmProvider({ config, init, shareAcrossReloads: true }).forkEntityManager();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('initializes the real ORM by default', async () => {
    const sut = createOrmProvider({ config: createOrmConfig({ databaseUrl: DATABASE_URL }) });

    await expect(sut.forkEntityManager()).resolves.toBeDefined();
  });
});

describe('createEntityManagerProvider', () => {
  it('forks the manager on first use and reuses it afterwards', async () => {
    const manager = {} as EntityManager;
    const forkEntityManager = vi.fn().mockResolvedValue(manager);
    const sut = createEntityManagerProvider({ forkEntityManager });

    const first = await sut.getEntityManager();
    const second = await sut.getEntityManager();

    expect(forkEntityManager).toHaveBeenCalledTimes(1);
    expect(first).toBe(manager);
    expect(second).toBe(manager);
  });

  it('does not fork before the manager is requested', () => {
    const forkEntityManager = vi.fn();

    createEntityManagerProvider({ forkEntityManager });

    expect(forkEntityManager).not.toHaveBeenCalled();
  });
});
