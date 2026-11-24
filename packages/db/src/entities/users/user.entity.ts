import { defineEntity, p } from '@mikro-orm/postgresql';
import { baseEntityProperties } from '../base.entity';

export const USERS_TABLE = 'users';
export const USERS_EMAIL_LOWERCASE_CHECK = 'users_email_lowercase_check';

export const User = defineEntity({
  name: 'User',
  tableName: USERS_TABLE,
  properties: {
    ...baseEntityProperties,
    email: p.string().unique(),
    displayName: p.string(),
    passwordHash: p.string(),
  },
  checks: [{ name: USERS_EMAIL_LOWERCASE_CHECK, expression: 'email = lower(email)' }],
});
