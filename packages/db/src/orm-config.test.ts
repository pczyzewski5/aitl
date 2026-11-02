import { describe, expect, it } from 'vitest';
import {
  MIGRATIONS_TABLE_NAME,
  POOL_MAX_CONNECTIONS,
  POOL_MIN_CONNECTIONS,
  createOrmConfig,
} from './orm-config';

describe('createOrmConfig', () => {
  const options = {
    databaseUrl: 'postgres://aitl@localhost:5432/aitl',
    migrationsPath: '/tmp/migrations',
  };

  it('connects with the given database URL', () => {
    expect(createOrmConfig(options).clientUrl).toBe(options.databaseUrl);
  });

  it('configures a bounded connection pool', () => {
    expect(createOrmConfig(options).pool).toEqual({
      min: POOL_MIN_CONNECTIONS,
      max: POOL_MAX_CONNECTIONS,
    });
  });

  it('stores migrations in the given path and table, inside transactions', () => {
    expect(createOrmConfig(options).migrations).toEqual({
      path: options.migrationsPath,
      tableName: MIGRATIONS_TABLE_NAME,
      transactional: true,
    });
  });

  it('allows an empty entity list until the first domain entity exists', () => {
    const actual = createOrmConfig(options);

    expect(actual.entities).toEqual([]);
    expect(actual.discovery?.warnWhenNoEntities).toBe(false);
  });
});
