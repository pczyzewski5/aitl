import { defineConfig, type Options } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { entities } from './entities';

export const POOL_MIN_CONNECTIONS = 2;
export const POOL_MAX_CONNECTIONS = 10;
export const MIGRATIONS_TABLE_NAME = 'migrations';

export type OrmConfigOptions = {
  databaseUrl: string;
  migrationsPath: string;
};

export function createOrmConfig({ databaseUrl, migrationsPath }: OrmConfigOptions): Options {
  return defineConfig({
    clientUrl: databaseUrl,
    entities,
    discovery: { warnWhenNoEntities: false },
    pool: { min: POOL_MIN_CONNECTIONS, max: POOL_MAX_CONNECTIONS },
    extensions: [Migrator],
    migrations: {
      path: migrationsPath,
      tableName: MIGRATIONS_TABLE_NAME,
      transactional: true,
    },
  });
}
