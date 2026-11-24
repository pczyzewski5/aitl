import { defineEntity, p } from '@mikro-orm/postgresql';
import { baseEntityProperties } from '../base.entity';

export const LOGIN_THROTTLES_TABLE = 'login_throttles';

export const LoginThrottle = defineEntity({
  name: 'LoginThrottle',
  tableName: LOGIN_THROTTLES_TABLE,
  properties: {
    ...baseEntityProperties,
    keyHash: p.string().unique(),
    failures: p.integer().default(0),
    windowStartedAt: p.datetime(),
    lockedUntil: p.datetime().nullable(),
  },
  indexes: [{ properties: ['updatedAt'] }],
});
