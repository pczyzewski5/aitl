import { MikroORM, type EntityManager, type Options } from '@mikro-orm/postgresql';

export type { EntityManager };

export const ORM_GLOBAL_KEY = Symbol.for('aitl.db.orm');

type OrmStore = { current?: Promise<MikroORM> };

export type OrmInit = (config: Options) => Promise<MikroORM>;

export type OrmProviderOptions = {
  config: Options;
  init?: OrmInit;
  shareAcrossReloads?: boolean;
};

export type OrmProvider = {
  forkEntityManager: () => Promise<EntityManager>;
};

export type EntityManagerProvider = {
  getEntityManager: () => Promise<EntityManager>;
};

function resolveStore(shareAcrossReloads: boolean): OrmStore {
  if (!shareAcrossReloads) {
    return {};
  }

  const holder = globalThis as { [ORM_GLOBAL_KEY]?: OrmStore };
  holder[ORM_GLOBAL_KEY] ??= {};

  return holder[ORM_GLOBAL_KEY];
}

export function createOrmProvider({
  config,
  init = (options) => MikroORM.init(options),
  shareAcrossReloads = false,
}: OrmProviderOptions): OrmProvider {
  const store = resolveStore(shareAcrossReloads);

  const getOrm = (): Promise<MikroORM> => {
    if (store.current === undefined) {
      const pending = init(config);
      store.current = pending;
      pending.catch(() => {
        if (store.current === pending) {
          store.current = undefined;
        }
      });
    }

    return store.current;
  };

  return {
    forkEntityManager: async () => (await getOrm()).em.fork(),
  };
}

export function createEntityManagerProvider(ormProvider: OrmProvider): EntityManagerProvider {
  let entityManager: Promise<EntityManager> | undefined;

  return {
    getEntityManager: () => {
      entityManager ??= ormProvider.forkEntityManager();

      return entityManager;
    },
  };
}
