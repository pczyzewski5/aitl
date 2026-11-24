import { defineEntity, p } from '@mikro-orm/postgresql';
import { baseEntityProperties } from '../base.entity';
import { User } from '../users/user.entity';

export const SESSIONS_TABLE = 'sessions';

export const Session = defineEntity({
  name: 'Session',
  tableName: SESSIONS_TABLE,
  properties: {
    ...baseEntityProperties,
    user: p.manyToOne(User).deleteRule('cascade'),
    tokenHash: p.string().unique(),
    expiresAt: p.datetime(),
    absoluteExpiresAt: p.datetime(),
  },
  indexes: [{ properties: ['expiresAt'] }, { properties: ['absoluteExpiresAt'] }],
});
