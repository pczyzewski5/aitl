import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { Argon2PasswordHasher, ARGON2_PRODUCTION_PARAMETERS } from './argon2-password-hasher';

const CHEAP_PARAMETERS = { memoryCost: 8, timeCost: 1, parallelism: 1 };
const PASSWORD_BYTES = 16;

const randomPassword = (): string => randomBytes(PASSWORD_BYTES).toString('hex');

describe('Argon2PasswordHasher', () => {
  it('hashes with argon2id and the parameters given to the constructor', async () => {
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);

    const actual = await sut.hash(randomPassword());

    expect(actual).toMatch(/^\$argon2id\$v=19\$m=8,t=1,p=1\$/);
  });

  it('salts every hash', async () => {
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);
    const password = randomPassword();

    const first = await sut.hash(password);
    const second = await sut.hash(password);

    expect(first).not.toBe(second);
  });

  it('verifies the matching password', async () => {
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);
    const password = randomPassword();
    const passwordHash = await sut.hash(password);

    const actual = await sut.verify(password, passwordHash);

    expect(actual).toBe(true);
  });

  it('rejects another password', async () => {
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);
    const passwordHash = await sut.hash(randomPassword());

    const actual = await sut.verify(randomPassword(), passwordHash);

    expect(actual).toBe(false);
  });

  it('computes the decoy hash once and reuses it', async () => {
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);
    const hashSpy = vi.spyOn(sut, 'hash');

    await sut.verifyAgainstDecoy(randomPassword());
    await sut.verifyAgainstDecoy(randomPassword());

    expect(hashSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps the production parameters at 19 MiB, 2 iterations and 1 lane', () => {
    expect(ARGON2_PRODUCTION_PARAMETERS).toEqual({ memoryCost: 19_456, timeCost: 2, parallelism: 1 });
  });
});
