import { describe, expect, it } from 'vitest';
import { readDatabaseUrl } from './database-url';

describe('readDatabaseUrl', () => {
  it('returns DATABASE_URL when it is set', () => {
    const env = { DATABASE_URL: 'postgres://aitl@localhost:5432/aitl' };

    const actual = readDatabaseUrl(env);

    expect(actual).toBe('postgres://aitl@localhost:5432/aitl');
  });

  it.each([
    { caseName: 'missing', env: {} },
    { caseName: 'empty', env: { DATABASE_URL: '' } },
  ])('throws when DATABASE_URL is $caseName', ({ env }) => {
    expect(() => readDatabaseUrl(env)).toThrow('DATABASE_URL is not set');
  });
});
