import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret } from './support/app-server.ts';

describe('application container against PostgreSQL', () => {
  const orms: MikroORM[] = [];

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const orm = await MikroORM.init(config);
    orms.push(orm);

    return orm;
  };

  afterAll(async () => {
    await Promise.all(orms.map((orm) => orm.close()));
  });

  it('gives each scope an entity manager that queries the database', async () => {
    const sut = createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: createSessionSecret() }, initTrackedOrm);
    const firstManager = await sut.createScope().cradle.entityManagerProvider.getEntityManager();
    const secondManager = await sut.createScope().cradle.entityManagerProvider.getEntityManager();

    const actual = await firstManager.getConnection().execute('SELECT 1 AS answer');

    expect(actual).toEqual([{ answer: 1 }]);
    expect(firstManager).not.toBe(secondManager);
    expect(orms).toHaveLength(1);
  });
});
