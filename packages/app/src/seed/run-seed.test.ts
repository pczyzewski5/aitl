import { randomBytes } from 'node:crypto';
import { PROVISIONING_MODE, type ProvisionUserInput, type UserRecord } from '@aitl/core';
import { describe, expect, it, vi } from 'vitest';
import { runSeed, type SeedDependencies } from './run-seed';
import {
  DEFAULT_PERSONAL_ACCOUNT_NAME,
  DEFAULT_SHARED_ACCOUNT_NAME,
  MIN_PASSWORD_LENGTH,
  MIN_PRODUCTION_PASSWORD_LENGTH,
  SEED_EXIT_CODE,
  SEED_MESSAGE,
  SEED_PASSWORD_ENV,
} from './seed-config';

const RANDOM_BYTES = 12;
const randomText = (length = RANDOM_BYTES * 2): string =>
  randomBytes(RANDOM_BYTES).toString('hex').slice(0, length);

const EMAIL = 'Owner@Example.test';
const baseArgv = ['--email', EMAIL, '--name', 'Owner'];

type Harness = {
  dependencies: SeedDependencies;
  out: string[];
  err: string[];
  provision: ReturnType<typeof vi.fn>;
  verify: ReturnType<typeof vi.fn>;
};

const createHarness = (options: {
  argv?: readonly string[];
  env?: Record<string, string | undefined>;
  created?: boolean;
  stored?: UserRecord | null;
  matches?: boolean;
}): Harness => {
  const out: string[] = [];
  const err: string[] = [];
  const provision = vi.fn(async (input: ProvisionUserInput) => ({
    user: { id: 'user-id', email: input.email.toLowerCase(), displayName: input.displayName },
    created: options.created ?? true,
  }));
  const verify = vi.fn(async () => options.matches ?? true);
  const dependencies: SeedDependencies = {
    argv: options.argv ?? baseArgv,
    env: options.env ?? {},
    provisioning: { provision },
    users: {
      findByEmail: vi.fn(async () =>
        options.stored === undefined
          ? { id: 'user-id', email: 'owner@example.test', displayName: 'Owner', passwordHash: randomText() }
          : options.stored,
      ),
    },
    passwordHasher: { verify },
    writeOut: (text) => out.push(text),
    writeErr: (text) => err.push(text),
  };

  return { dependencies, out, err, provision, verify };
};

describe('runSeed', () => {
  it('provisions the owner with the default account names and reports creation', async () => {
    const password = randomText();
    const { dependencies, out, err, provision } = createHarness({
      env: { [SEED_PASSWORD_ENV]: password },
    });
    const expectedInput = {
      mode: PROVISIONING_MODE.Owner,
      email: EMAIL,
      displayName: 'Owner',
      password,
      sharedAccountName: DEFAULT_SHARED_ACCOUNT_NAME,
      personalAccountName: DEFAULT_PERSONAL_ACCOUNT_NAME,
    };

    const actual = await runSeed(dependencies);

    expect(actual).toBe(SEED_EXIT_CODE.Success);
    expect(provision).toHaveBeenCalledWith(expectedInput);
    expect(out).toEqual([`${SEED_MESSAGE.created('owner@example.test')}\n`]);
    expect(err).toEqual([]);
  });

  it('provisions the shared-only user without a personal account name', async () => {
    const password = randomText();
    const { dependencies, provision } = createHarness({
      argv: [...baseArgv, '--shared-only'],
      env: { [SEED_PASSWORD_ENV]: password },
    });
    const expectedInput = {
      mode: PROVISIONING_MODE.SharedOnly,
      email: EMAIL,
      displayName: 'Owner',
      password,
      sharedAccountName: DEFAULT_SHARED_ACCOUNT_NAME,
    };

    await runSeed(dependencies);

    expect(provision).toHaveBeenCalledWith(expectedInput);
  });

  it('reports an unchanged account on a rerun with the same password', async () => {
    const { dependencies, out, err, verify } = createHarness({
      env: { [SEED_PASSWORD_ENV]: randomText() },
      created: false,
      matches: true,
    });

    const actual = await runSeed(dependencies);

    expect(actual).toBe(SEED_EXIT_CODE.Success);
    expect(verify).toHaveBeenCalledOnce();
    expect(out).toEqual([`${SEED_MESSAGE.unchanged('owner@example.test')}\n`]);
    expect(err).toEqual([]);
  });

  it('warns without leaking passwords when the existing user has a different password', async () => {
    const password = randomText();
    const storedHash = randomText();
    const { dependencies, out, err } = createHarness({
      env: { [SEED_PASSWORD_ENV]: password },
      created: false,
      matches: false,
      stored: { id: 'user-id', email: 'owner@example.test', displayName: 'Owner', passwordHash: storedHash },
    });

    const actual = await runSeed(dependencies);

    const output = [...out, ...err].join('');
    expect(actual).toBe(SEED_EXIT_CODE.PasswordMismatch);
    expect(err).toEqual([`${SEED_MESSAGE.passwordMismatch('owner@example.test')}\n`]);
    expect(output).not.toContain(password);
    expect(output).not.toContain(storedHash);
  });

  it('warns when the existing user cannot be read back', async () => {
    const { dependencies, err, verify } = createHarness({
      env: { [SEED_PASSWORD_ENV]: randomText() },
      created: false,
      stored: null,
    });

    const actual = await runSeed(dependencies);

    expect(actual).toBe(SEED_EXIT_CODE.PasswordMismatch);
    expect(verify).not.toHaveBeenCalled();
    expect(err).toHaveLength(1);
  });

  it('rejects invalid arguments before touching the database', async () => {
    const { dependencies, err, provision } = createHarness({
      argv: ['--name', 'Owner'],
      env: { [SEED_PASSWORD_ENV]: randomText() },
    });

    const actual = await runSeed(dependencies);

    expect(actual).toBe(SEED_EXIT_CODE.InvalidInput);
    expect(provision).not.toHaveBeenCalled();
    expect(err.join('')).toContain(SEED_MESSAGE.usage);
  });

  it.each([
    { name: 'missing', env: {}, message: SEED_MESSAGE.missingPassword },
    { name: 'empty', env: { [SEED_PASSWORD_ENV]: '' }, message: SEED_MESSAGE.missingPassword },
    {
      name: 'shorter than the minimum',
      env: { [SEED_PASSWORD_ENV]: randomText(MIN_PASSWORD_LENGTH - 1) },
      message: SEED_MESSAGE.passwordTooShort(MIN_PASSWORD_LENGTH),
    },
    {
      name: 'shorter than the production minimum',
      env: { NODE_ENV: 'production', [SEED_PASSWORD_ENV]: randomText(MIN_PRODUCTION_PASSWORD_LENGTH - 1) },
      message: SEED_MESSAGE.passwordTooShort(MIN_PRODUCTION_PASSWORD_LENGTH),
    },
  ])('rejects a $name password', async ({ env, message }) => {
    const { dependencies, err, provision } = createHarness({ env });

    const actual = await runSeed(dependencies);

    expect(actual).toBe(SEED_EXIT_CODE.InvalidInput);
    expect(provision).not.toHaveBeenCalled();
    expect(err).toEqual([`${message}\n`]);
  });

  it('accepts a password of the exact production minimum length', async () => {
    const { dependencies, provision } = createHarness({
      env: { NODE_ENV: 'production', [SEED_PASSWORD_ENV]: randomText(MIN_PRODUCTION_PASSWORD_LENGTH) },
    });

    const actual = await runSeed(dependencies);

    expect(actual).toBe(SEED_EXIT_CODE.Success);
    expect(provision).toHaveBeenCalledOnce();
  });
});
