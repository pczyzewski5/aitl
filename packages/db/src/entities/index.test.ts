import { describe, expect, it } from 'vitest';
import { BankAccount, BankAccountMembership, LoginThrottle, Session, User, entities } from './index';

describe('entities', () => {
  it('registers every auth and bank account entity', () => {
    const expected = [User, BankAccount, BankAccountMembership, Session, LoginThrottle];

    expect(entities).toEqual(expected);
  });

  it('names tables in plural snake_case', () => {
    const actual = entities.map((entity) => entity.meta.tableName);

    expect(actual).toEqual([
      'users',
      'bank_accounts',
      'bank_account_memberships',
      'sessions',
      'login_throttles',
    ]);
  });
});
