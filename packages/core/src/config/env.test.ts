import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { EnvValidationError, SESSION_SECRET_MIN_LENGTH, parseEnv } from './env';

const DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';
const SESSION_SECRET = randomBytes(SESSION_SECRET_MIN_LENGTH).toString('hex');
const SECRET_LOOKING_VALUE = 'value-that-must-not-leak';
const VALID_SOURCE = { DATABASE_URL, SESSION_SECRET };

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
    const expected = {
      DATABASE_URL,
      SESSION_SECRET,
      NODE_ENV: 'test',
      SESSION_COOKIE_SECURE: false,
      TRUSTED_PROXY_HOPS: 0,
    };

    const actual = parseEnv({ ...VALID_SOURCE, NODE_ENV: 'test' });

    expect(actual).toEqual(expected);
  });

  it('defaults NODE_ENV to development', () => {
    const actual = parseEnv(VALID_SOURCE);

    expect(actual.NODE_ENV).toBe('development');
  });

  it.each([
    { name: 'in production', nodeEnv: 'production', cookieSecure: undefined, expected: true },
    { name: 'in development', nodeEnv: 'development', cookieSecure: undefined, expected: false },
    { name: 'in test', nodeEnv: 'test', cookieSecure: undefined, expected: false },
    { name: 'in production when turned off', nodeEnv: 'production', cookieSecure: 'false', expected: false },
    { name: 'in development when turned on', nodeEnv: 'development', cookieSecure: 'true', expected: true },
  ])('resolves the secure cookie flag $name', ({ nodeEnv, cookieSecure, expected }) => {
    const actual = parseEnv({
      ...VALID_SOURCE,
      NODE_ENV: nodeEnv,
      SESSION_COOKIE_SECURE: cookieSecure,
    });

    expect(actual.SESSION_COOKIE_SECURE).toBe(expected);
  });

  it.each([
    { name: 'unset', value: undefined, expected: 0 },
    { name: 'zero', value: '0', expected: 0 },
    { name: 'a positive number', value: '2', expected: 2 },
  ])('reads the trusted proxy hops when $name', ({ value, expected }) => {
    const actual = parseEnv({ ...VALID_SOURCE, TRUSTED_PROXY_HOPS: value });

    expect(actual.TRUSTED_PROXY_HOPS).toBe(expected);
  });

  it.each([
    { name: 'DATABASE_URL is missing', source: { SESSION_SECRET }, invalidKeys: ['DATABASE_URL'] },
    { name: 'DATABASE_URL is empty', source: { ...VALID_SOURCE, DATABASE_URL: '' }, invalidKeys: ['DATABASE_URL'] },
    { name: 'SESSION_SECRET is missing', source: { DATABASE_URL }, invalidKeys: ['SESSION_SECRET'] },
    {
      name: 'SESSION_SECRET is shorter than the minimum',
      source: { ...VALID_SOURCE, SESSION_SECRET: 'x'.repeat(SESSION_SECRET_MIN_LENGTH - 1) },
      invalidKeys: ['SESSION_SECRET'],
    },
    {
      name: 'SESSION_COOKIE_SECURE is not a boolean word',
      source: { ...VALID_SOURCE, SESSION_COOKIE_SECURE: SECRET_LOOKING_VALUE },
      invalidKeys: ['SESSION_COOKIE_SECURE'],
    },
    {
      name: 'TRUSTED_PROXY_HOPS is not a non-negative integer',
      source: { ...VALID_SOURCE, TRUSTED_PROXY_HOPS: '-1' },
      invalidKeys: ['TRUSTED_PROXY_HOPS'],
    },
    { name: 'NODE_ENV is unknown', source: { ...VALID_SOURCE, NODE_ENV: SECRET_LOOKING_VALUE }, invalidKeys: ['NODE_ENV'] },
    {
      name: 'several variables are invalid',
      source: { NODE_ENV: SECRET_LOOKING_VALUE },
      invalidKeys: ['NODE_ENV', 'DATABASE_URL', 'SESSION_SECRET'],
    },
  ])('throws EnvValidationError listing invalid keys when $name', ({ source, invalidKeys }) => {
    const actual = catchError(() => parseEnv(source));

    expect(actual).toBeInstanceOf(EnvValidationError);
    expect((actual as EnvValidationError).invalidKeys).toEqual(invalidKeys);
  });

  it('does not include variable values in the error message', () => {
    const actual = catchError(() =>
      parseEnv({ NODE_ENV: SECRET_LOOKING_VALUE, SESSION_SECRET: 'x' }),
    ) as EnvValidationError;

    expect(actual.message).toBe('Invalid environment variables: NODE_ENV, DATABASE_URL, SESSION_SECRET');
    expect(actual.message).not.toContain(SECRET_LOOKING_VALUE);
  });
});
