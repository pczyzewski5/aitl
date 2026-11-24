import { asFunction, type Resolver } from 'awilix';
import {
  createEntityManagerProvider,
  createOrmConfig,
  createOrmProvider,
  type EntityManagerProvider,
  type OrmInit,
  type OrmProvider,
} from '@aitl/db';
import type { CoreCradle } from './core';

export const DEVELOPMENT_ENVIRONMENT = 'development';

export type DbCradle = {
  ormProvider: OrmProvider;
  entityManagerProvider: EntityManagerProvider;
};

type DbDependencies = CoreCradle & DbCradle;

export function createDbRegistrations(ormInit?: OrmInit) {
  return {
    ormProvider: asFunction(({ env }: DbDependencies) =>
      createOrmProvider({
        config: createOrmConfig({ databaseUrl: env.DATABASE_URL }),
        init: ormInit,
        shareAcrossReloads: env.NODE_ENV === DEVELOPMENT_ENVIRONMENT,
      }),
    ).singleton(),
    entityManagerProvider: asFunction(({ ormProvider }: DbDependencies) =>
      createEntityManagerProvider(ormProvider),
    ).scoped(),
  } satisfies { [Key in keyof DbCradle]: Resolver<DbCradle[Key]> };
}
