import { defineEntity, p } from '@mikro-orm/postgresql';
import { baseEntityProperties } from '../base.entity';
import { User } from '../users/user.entity';

export const BANK_ACCOUNTS_TABLE = 'bank_accounts';
export const BANK_ACCOUNT_TYPES = ['shared', 'personal'] as const;
export const BANK_ACCOUNT_OWNER_CHECK = 'bank_accounts_owner_by_type_check';
export const BANK_ACCOUNT_ONE_PERSONAL_PER_OWNER_INDEX = 'bank_accounts_one_personal_per_owner';
export const BANK_ACCOUNT_SHARED_NAME_INDEX = 'bank_accounts_shared_name_unique';

export const BankAccount = defineEntity({
  name: 'BankAccount',
  tableName: BANK_ACCOUNTS_TABLE,
  properties: {
    ...baseEntityProperties,
    type: p.enum(BANK_ACCOUNT_TYPES).columnType('text'),
    name: p.string(),
    owner: p.manyToOne(User).nullable().deleteRule('restrict'),
  },
  checks: [
    {
      name: BANK_ACCOUNT_OWNER_CHECK,
      expression:
        "(type = 'personal' AND owner_id IS NOT NULL) OR (type = 'shared' AND owner_id IS NULL)",
    },
  ],
  uniques: [
    {
      name: BANK_ACCOUNT_ONE_PERSONAL_PER_OWNER_INDEX,
      properties: ['owner'],
      where: { type: 'personal' },
    },
    {
      name: BANK_ACCOUNT_SHARED_NAME_INDEX,
      properties: ['type', 'name'],
      where: { type: 'shared' },
    },
  ],
});
