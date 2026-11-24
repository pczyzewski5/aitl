import { describe, expect, it } from 'vitest';
import { EnvValidationError, parseEnv } from './env';

const DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';
const SECRET_LOOKING_VALUE = 'value-that-must-not-leak';

function catchError(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
}

describe('parseEnv', () => {
  it('returns the parsed environment for valid input', () => {
    const actual = parseEnv({ DATABASE_URL, NODE_ENV: 'production' });

    expect(actual).toEqual({ DATABASE_URL, NODE_ENV: 'production' });
  });

  it('defaults NODE_ENV to development', () => {
    const actual = parseEnv({ DATABASE_URL });

    expect(actual.NODE_ENV).toBe('development');
  });

  it.each([
    { name: 'DATABASE_URL is missing', source: {}, invalidKeys: ['DATABASE_URL'] },
    { name: 'DATABASE_URL is empty', source: { DATABASE_URL: '' }, invalidKeys: ['DATABASE_URL'] },
    { name: 'NODE_ENV is unknown', source: { DATABASE_URL, NODE_ENV: SECRET_LOOKING_VALUE }, invalidKeys: ['NODE_ENV'] },
    { name: 'several variables are invalid', source: { NODE_ENV: SECRET_LOOKING_VALUE }, invalidKeys: ['NODE_ENV', 'DATABASE_URL'] },
  ])('throws EnvValidationError listing invalid keys when $name', ({ source, invalidKeys }) => {
    const actual = catchError(() => parseEnv(source));

    expect(actual).toBeInstanceOf(EnvValidationError);
    expect((actual as EnvValidationError).invalidKeys).toEqual(invalidKeys);
  });

  it('does not include variable values in the error message', () => {
    const actual = catchError(() => parseEnv({ NODE_ENV: SECRET_LOOKING_VALUE })) as EnvValidationError;

    expect(actual.message).toBe('Invalid environment variables: NODE_ENV, DATABASE_URL');
    expect(actual.message).not.toContain(SECRET_LOOKING_VALUE);
  });
});
