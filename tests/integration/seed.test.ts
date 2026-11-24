import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BANK_ACCOUNT_TYPE } from '@aitl/core';
import { createOrmConfig } from '@aitl/db';
import { MikroORM, type Options } from '@mikro-orm/postgresql';
import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { createAppContainer } from '../../packages/app/src/container/container.ts';
import { SEED_EXIT_CODE, SEED_MESSAGE, SEED_PASSWORD_ENV } from '../../packages/app/src/seed/seed-config.ts';

const MIGRATIONS_PATH = fileURLToPath(new URL('../../packages/db/migrations', import.meta.url));
const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const SEED_COMMAND = ['--import', 'tsx', 'scripts/seed-user.ts'];
const SEED_TIMEOUT_MS = 60_000;
const RANDOM_BYTES = 12;

const randomText = (): string => randomBytes(RANDOM_BYTES).toString('hex');

type SeedRun = { status: number | null; stdout: string; stderr: string };

const runSeedScript = (args: string[], password: string): SeedRun => {
  const result = spawnSync(process.execPath, [...SEED_COMMAND, ...args], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    timeout: SEED_TIMEOUT_MS,
    env: { ...process.env, DATABASE_URL: inject('databaseUrl'), [SEED_PASSWORD_ENV]: password },
  });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

describe('seed:user against PostgreSQL', () => {
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

  it('seeds two accounts, stays idempotent and warns about a different password without changing it', async () => {
    const sharedAccountName = randomText();
    const ownerEmail = `${randomText()}@example.test`;
    const spouseEmail = `${randomText()}@example.test`;
    const ownerPassword = randomText();
    const otherPassword = randomText();
    const ownerArgs = ['--email', ownerEmail, '--name', 'Owner', '--shared-account-name', sharedAccountName];
    const spouseArgs = [
      '--email',
      spouseEmail,
      '--name',
      'Spouse',
      '--shared-only',
      '--shared-account-name',
      sharedAccountName,
    ];

    const firstOwnerRun = runSeedScript(ownerArgs, ownerPassword);
    const spouseRun = runSeedScript(spouseArgs, randomText());
    const secondOwnerRun = runSeedScript(ownerArgs, ownerPassword);
    const differentPasswordRun = runSeedScript(ownerArgs, otherPassword);

    const scope = createAppContainer({ DATABASE_URL: inject('databaseUrl') }, initTrackedOrm).createScope();
    const owner = await scope.cradle.userRepository.findByEmail(ownerEmail);
    const spouse = await scope.cradle.userRepository.findByEmail(spouseEmail);
    const ownerAccounts = await scope.cradle.bankAccountService.listForUser(owner?.id ?? '');
    const spouseAccounts = await scope.cradle.bankAccountService.listForUser(spouse?.id ?? '');
    const hasher = scope.cradle.passwordHasher;
    expect(firstOwnerRun).toEqual({
      status: SEED_EXIT_CODE.Success,
      stdout: `${SEED_MESSAGE.created(ownerEmail)}\n`,
      stderr: '',
    });
    expect(spouseRun.status).toBe(SEED_EXIT_CODE.Success);
    expect(secondOwnerRun).toEqual({
      status: SEED_EXIT_CODE.Success,
      stdout: `${SEED_MESSAGE.unchanged(ownerEmail)}\n`,
      stderr: '',
    });
    expect(differentPasswordRun).toEqual({
      status: SEED_EXIT_CODE.PasswordMismatch,
      stdout: '',
      stderr: `${SEED_MESSAGE.passwordMismatch(ownerEmail)}\n`,
    });
    expect(differentPasswordRun.stderr).not.toContain(otherPassword);
    expect(await hasher.verify(ownerPassword, owner?.passwordHash ?? '')).toBe(true);
    expect(await hasher.verify(otherPassword, owner?.passwordHash ?? '')).toBe(false);
    expect(ownerAccounts.map((account) => account.type)).toEqual([
      BANK_ACCOUNT_TYPE.Shared,
      BANK_ACCOUNT_TYPE.Personal,
    ]);
    expect(spouseAccounts.map((account) => account.type)).toEqual([BANK_ACCOUNT_TYPE.Shared]);
    expect(spouseAccounts[0]?.id).toBe(ownerAccounts[0]?.id);
  });

  it('rejects a too short password without creating the user', async () => {
    const email = `${randomText()}@example.test`;

    const actual = runSeedScript(['--email', email, '--name', 'Owner'], randomText().slice(0, 4));

    const scope = createAppContainer({ DATABASE_URL: inject('databaseUrl') }, initTrackedOrm).createScope();
    expect(actual.status).toBe(SEED_EXIT_CODE.InvalidInput);
    expect(await scope.cradle.userRepository.findByEmail(email)).toBeNull();
  });
});
