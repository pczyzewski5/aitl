import {
  normalizeEmail,
  PROVISIONING_MODE,
  type PasswordHasher,
  type ProvisionUserInput,
  type ProvisionUserResult,
  type UserRepository,
} from '@aitl/core';
import { parseSeedArguments, type SeedArguments } from './seed-arguments';
import {
  MIN_PASSWORD_LENGTH,
  MIN_PRODUCTION_PASSWORD_LENGTH,
  PRODUCTION_ENVIRONMENT,
  SEED_EXIT_CODE,
  SEED_MESSAGE,
  SEED_PASSWORD_ENV,
} from './seed-config';

export type SeedDependencies = Readonly<{
  argv: readonly string[];
  env: Readonly<Record<string, string | undefined>>;
  provisioning: Readonly<{ provision: (input: ProvisionUserInput) => Promise<ProvisionUserResult> }>;
  users: Pick<UserRepository, 'findByEmail'>;
  passwordHasher: Pick<PasswordHasher, 'verify'>;
  writeOut: (text: string) => void;
  writeErr: (text: string) => void;
}>;

type Validation<Value> =
  | Readonly<{ ok: true; value: Value }>
  | Readonly<{ ok: false; message: string }>;

function readPassword(env: SeedDependencies['env']): Validation<string> {
  const password = env[SEED_PASSWORD_ENV];

  if (password === undefined || password === '') {
    return { ok: false, message: SEED_MESSAGE.missingPassword };
  }

  const minLength =
    env.NODE_ENV === PRODUCTION_ENVIRONMENT ? MIN_PRODUCTION_PASSWORD_LENGTH : MIN_PASSWORD_LENGTH;

  if (password.length < minLength) {
    return { ok: false, message: SEED_MESSAGE.passwordTooShort(minLength) };
  }

  return { ok: true, value: password };
}

function buildInput(seedArguments: SeedArguments, password: string): ProvisionUserInput {
  const { email, displayName, sharedAccountName } = seedArguments;
  const base = { email, displayName, password, sharedAccountName };

  if (seedArguments.sharedOnly) {
    return { ...base, mode: PROVISIONING_MODE.SharedOnly };
  }

  return {
    ...base,
    mode: PROVISIONING_MODE.Owner,
    personalAccountName: seedArguments.personalAccountName,
  };
}

export async function runSeed(dependencies: SeedDependencies): Promise<number> {
  const { writeOut, writeErr } = dependencies;
  const parsed = parseSeedArguments(dependencies.argv);

  if (!parsed.ok) {
    writeErr(`${parsed.message}\n${SEED_MESSAGE.usage}\n`);

    return SEED_EXIT_CODE.InvalidInput;
  }

  const passwordResult = readPassword(dependencies.env);

  if (!passwordResult.ok) {
    writeErr(`${passwordResult.message}\n`);

    return SEED_EXIT_CODE.InvalidInput;
  }

  const password = passwordResult.value;
  const result = await dependencies.provisioning.provision(buildInput(parsed.value, password));

  if (result.created) {
    writeOut(`${SEED_MESSAGE.created(result.user.email)}\n`);

    return SEED_EXIT_CODE.Success;
  }

  const stored = await dependencies.users.findByEmail(normalizeEmail(parsed.value.email));
  const passwordMatches =
    stored !== null && (await dependencies.passwordHasher.verify(password, stored.passwordHash));

  if (passwordMatches) {
    writeOut(`${SEED_MESSAGE.unchanged(result.user.email)}\n`);

    return SEED_EXIT_CODE.Success;
  }

  writeErr(`${SEED_MESSAGE.passwordMismatch(result.user.email)}\n`);

  return SEED_EXIT_CODE.PasswordMismatch;
}
