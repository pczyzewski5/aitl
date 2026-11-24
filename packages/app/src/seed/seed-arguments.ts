import { parseArgs } from 'node:util';
import { loginSchema } from '@aitl/core';
import {
  DEFAULT_PERSONAL_ACCOUNT_NAME,
  DEFAULT_SHARED_ACCOUNT_NAME,
  SEED_MESSAGE,
  SEED_OPTION,
} from './seed-config';

export type SeedArguments = Readonly<{
  email: string;
  displayName: string;
  sharedOnly: boolean;
  sharedAccountName: string;
  personalAccountName: string;
}>;

export type SeedArgumentsResult =
  | Readonly<{ ok: true; value: SeedArguments }>
  | Readonly<{ ok: false; message: string }>;

const OPTIONS = {
  [SEED_OPTION.Email]: { type: 'string' },
  [SEED_OPTION.Name]: { type: 'string' },
  [SEED_OPTION.SharedOnly]: { type: 'boolean' },
  [SEED_OPTION.SharedAccountName]: { type: 'string' },
  [SEED_OPTION.PersonalAccountName]: { type: 'string' },
} as const;

export function parseSeedArguments(argv: readonly string[]): SeedArgumentsResult {
  let values;

  try {
    ({ values } = parseArgs({ args: [...argv], options: OPTIONS, strict: true }));
  } catch (error) {
    return { ok: false, message: String(error) };
  }

  const email = values[SEED_OPTION.Email];
  const displayName = values[SEED_OPTION.Name];

  if (email === undefined) {
    return { ok: false, message: SEED_MESSAGE.missingOption(SEED_OPTION.Email) };
  }

  if (displayName === undefined) {
    return { ok: false, message: SEED_MESSAGE.missingOption(SEED_OPTION.Name) };
  }

  if (!loginSchema.shape.email.safeParse(email).success) {
    return { ok: false, message: SEED_MESSAGE.invalidEmail };
  }

  return {
    ok: true,
    value: {
      email,
      displayName,
      sharedOnly: values[SEED_OPTION.SharedOnly] ?? false,
      sharedAccountName: values[SEED_OPTION.SharedAccountName] ?? DEFAULT_SHARED_ACCOUNT_NAME,
      personalAccountName: values[SEED_OPTION.PersonalAccountName] ?? DEFAULT_PERSONAL_ACCOUNT_NAME,
    },
  };
}
