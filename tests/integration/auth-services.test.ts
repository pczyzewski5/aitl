import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BANK_ACCOUNT_TYPE, PROVISIONING_MODE } from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { createSessionSecret } from './support/app-server.ts';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const RANDOM_BYTES = 12;
const ARGON2ID_PRODUCTION_PREFIX = '$argon2id$v=19$m=19456,t=2,p=1$';

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');

describe('services resolved from the application container against PostgreSQL', () => {
  const orms: MikroORM[] = [];

  const initTrackedOrm = async (config: Options): Promise<MikroORM> => {
    const orm = await MikroORM.init(config);
    orms.push(orm);

    return orm;
  };

  beforeAll(async () => {
    const migrationOrm = await MikroORM.init(
      createOrmConfig({ databaseUrl: inject('databaseUrl'), migrationsPath: MIGRATIONS_PATH }),
    );
    await migrationOrm.migrator.up();
    await migrationOrm.close();
  });

  afterAll(async () => {
    await Promise.all(orms.map((orm) => orm.close()));
  });

  it('provisions the owner with a real argon2id hash made with the production parameters', async () => {
    const container = createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: createSessionSecret() }, initTrackedOrm);
    const password = randomText();
    const input = {
      mode: PROVISIONING_MODE.Owner,
      email: `${randomText()}@Example.test`,
      displayName: randomText(),
      password,
      sharedAccountName: randomText(),
      personalAccountName: randomText(),
    } as const;

    const result = await container.createScope().cradle.userProvisioningService.provision(input);

    const scope = container.createScope();
    const stored = await scope.cradle.userRepository.findByEmail(input.email.toLowerCase());
    const accounts = await scope.cradle.bankAccountService.listForUser(result.user.id);
    expect(result.created).toBe(true);
    expect(stored?.passwordHash.startsWith(ARGON2ID_PRODUCTION_PREFIX)).toBe(true);
    expect(await scope.cradle.passwordHasher.verify(password, stored?.passwordHash ?? '')).toBe(true);
    expect(await scope.cradle.passwordHasher.verify(randomText(), stored?.passwordHash ?? '')).toBe(false);
    expect(accounts.map((account) => account.type)).toEqual([
      BANK_ACCOUNT_TYPE.Shared,
      BANK_ACCOUNT_TYPE.Personal,
    ]);
  });

  it('keeps the personal account of the owner out of the shared-only user listing', async () => {
    const container = createAppContainer({ DATABASE_URL: inject('databaseUrl'), SESSION_SECRET: createSessionSecret() }, initTrackedOrm);
    const sharedAccountName = randomText();
    const owner = await container.createScope().cradle.userProvisioningService.provision({
      mode: PROVISIONING_MODE.Owner,
      email: `${randomText()}@example.test`,
      displayName: randomText(),
      password: randomText(),
      sharedAccountName,
      personalAccountName: randomText(),
    });

    const spouse = await container.createScope().cradle.userProvisioningService.provision({
      mode: PROVISIONING_MODE.SharedOnly,
      email: `${randomText()}@example.test`,
      displayName: randomText(),
      password: randomText(),
      sharedAccountName,
    });

    const service = container.createScope().cradle.bankAccountService;
    const ownerAccounts = await service.listForUser(owner.user.id);
    const spouseAccounts = await service.listForUser(spouse.user.id);
    const personal = ownerAccounts.find((account) => account.type === BANK_ACCOUNT_TYPE.Personal);
    expect(spouseAccounts).toEqual(ownerAccounts.filter((account) => account.id !== personal?.id));
  });
});
