import { asFunction, asValue, createContainer, InjectionMode, type AwilixContainer } from 'awilix';
import { logger, parseEnv } from '@aitl/core';
import {
  createEntityManagerProvider,
  createOrmConfig,
  createOrmProvider,
  type OrmInit,
} from '@aitl/db';
import type { Cradle } from './cradle';

export const DEVELOPMENT_ENVIRONMENT = 'development';

export type EnvSource = Readonly<Record<string, string | undefined>>;

export function createAppContainer(source: EnvSource, ormInit?: OrmInit): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    env: asFunction(() => parseEnv(source)).singleton(),
    logger: asValue(logger),
    ormProvider: asFunction(({ env }: Cradle) =>
      createOrmProvider({
        config: createOrmConfig({ databaseUrl: env.DATABASE_URL }),
        init: ormInit,
        shareAcrossReloads: env.NODE_ENV === DEVELOPMENT_ENVIRONMENT,
      }),
    ).singleton(),
    entityManagerProvider: asFunction(({ ormProvider }: Cradle) =>
      createEntityManagerProvider(ormProvider),
    ).scoped(),
  });

  return container;
}

export const container = createAppContainer(process.env);
