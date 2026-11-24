import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Argon2PasswordHasher, ARGON2_PRODUCTION_PARAMETERS } from './argon2-password-hasher';

const CHEAP_PARAMETERS = { memoryCost: 8, timeCost: 1, parallelism: 1 };
const PASSWORD_BYTES = 16;

const randomPassword = (): string => randomBytes(PASSWORD_BYTES).toString('hex');

describe('Argon2PasswordHasher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('computes the decoy hash at construction and reuses it', async () => {
    const hashSpy = vi.spyOn(Argon2PasswordHasher.prototype, 'hash');
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);
    const callsAfterConstruction = hashSpy.mock.calls.length;

    await sut.verifyAgainstDecoy(randomPassword());
    await sut.verifyAgainstDecoy(randomPassword());

    expect(callsAfterConstruction).toBe(1);
    expect(hashSpy).toHaveBeenCalledTimes(1);
  });

  it('does not cache a failed decoy hash and computes it again on the next call', async () => {
    const hashSpy = vi
      .spyOn(Argon2PasswordHasher.prototype, 'hash')
      .mockRejectedValueOnce(new Error(randomPassword()));
    const sut = new Argon2PasswordHasher(CHEAP_PARAMETERS);

    const failed = sut.verifyAgainstDecoy(randomPassword());

    await expect(failed).rejects.toThrow();
    await expect(sut.verifyAgainstDecoy(randomPassword())).resolves.toBeUndefined();
    expect(hashSpy).toHaveBeenCalledTimes(2);
  });

  it('keeps the production parameters at 19 MiB, 2 iterations and 1 lane', () => {
    expect(ARGON2_PRODUCTION_PARAMETERS).toEqual({ memoryCost: 19_456, timeCost: 2, parallelism: 1 });
  });
});
