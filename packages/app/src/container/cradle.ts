import type { Env, createLogger } from '@aitl/core';
import type { EntityManagerProvider, OrmProvider } from '@aitl/db';

export type Cradle = {
  env: Env;
  logger: ReturnType<typeof createLogger>;
  ormProvider: OrmProvider;
  entityManagerProvider: EntityManagerProvider;
};
