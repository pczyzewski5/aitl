import { defineEntity, p } from '@mikro-orm/postgresql';
import { baseEntityProperties } from '../base.entity';
import { User } from '../users/user.entity';
import { BankAccount } from './bank-account.entity';

export const BANK_ACCOUNT_MEMBERSHIPS_TABLE = 'bank_account_memberships';

export const BankAccountMembership = defineEntity({
  name: 'BankAccountMembership',
  tableName: BANK_ACCOUNT_MEMBERSHIPS_TABLE,
  properties: {
    ...baseEntityProperties,
    user: p.manyToOne(User).deleteRule('cascade'),
    bankAccount: p.manyToOne(BankAccount).deleteRule('cascade'),
  },
  uniques: [{ properties: ['user', 'bankAccount'] }],
});
