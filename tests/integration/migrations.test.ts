import { fileURLToPath } from 'node:url';
import { createOrmConfig } from '@aitl/db';
import { MikroORM } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));

describe('database migrations', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
  });

  afterAll(async () => {
    await orm.close();
  });

  it('applies all pending migrations and can be repeated safely', async () => {
    const migrator = orm.migrator;

    const applied = await migrator.up();
    const pendingAfter = await migrator.getPending();

    expect(applied.length).toBeGreaterThan(0);
    expect(pendingAfter).toEqual([]);
  });
});
