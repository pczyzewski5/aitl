import { asFunction, type Resolver } from 'awilix';
import type { PasswordHasher } from '@aitl/core';
import { ARGON2_PRODUCTION_PARAMETERS, Argon2PasswordHasher } from '../../adapters/argon2-password-hasher';

export type AuthCradle = {
  passwordHasher: PasswordHasher;
};

export function createAuthRegistrations() {
  return {
    passwordHasher: asFunction(
      (): PasswordHasher => new Argon2PasswordHasher(ARGON2_PRODUCTION_PARAMETERS),
    ).singleton(),
  } satisfies { [Key in keyof AuthCradle]: Resolver<AuthCradle[Key]> };
}
