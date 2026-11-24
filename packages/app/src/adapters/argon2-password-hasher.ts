import { randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';
import type { PasswordHasher } from '@aitl/core';

export const ARGON2_PRODUCTION_PARAMETERS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

const DECOY_PASSWORD_BYTES = 32;

export type Argon2Parameters = {
  memoryCost: number;
  timeCost: number;
  parallelism: number;
};

export class Argon2PasswordHasher implements PasswordHasher {
  private decoyHash: Promise<string> | undefined;

  private readonly parameters: Argon2Parameters;

  constructor(parameters: Argon2Parameters) {
    this.parameters = parameters;
  }

  hash(password: string): Promise<string> {
    return hash(password, this.parameters);
  }

  verify(password: string, passwordHash: string): Promise<boolean> {
    return verify(passwordHash, password);
  }

  async verifyAgainstDecoy(password: string): Promise<void> {
    this.decoyHash ??= this.hash(randomBytes(DECOY_PASSWORD_BYTES).toString('hex'));

    await verify(await this.decoyHash, password);
  }
}
