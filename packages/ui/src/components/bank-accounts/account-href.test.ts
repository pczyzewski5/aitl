import { describe, expect, it } from 'vitest';
import { buildAccountHref } from './account-href';

describe('buildAccountHref', () => {
  it.each<{ accountId: string; expected: string }>([
    { accountId: '7c9e6679-7425-40de-944b-e07fc1f90ae7', expected: '/?account=7c9e6679-7425-40de-944b-e07fc1f90ae7' },
    { accountId: 'a b&c=d', expected: '/?account=a+b%26c%3Dd' },
  ])('builds the account link for $accountId', ({ accountId, expected }) => {
    const actual = buildAccountHref(accountId);

    expect(actual).toBe(expected);
  });
});
