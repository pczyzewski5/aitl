import { packageName as corePackageName } from '@aitl/core';

export const packageName = '@aitl/db';
export const dependsOn = [corePackageName];

export * from './database-url';
export * from './entities';
export * from './entities/base.entity';
export * from './orm-config';
export * from './orm-provider';
export * from './repositories/auth/mikro-orm-session.repository';
export * from './repositories/bank-accounts/mikro-orm-bank-account.repository';
export * from './repositories/bank-accounts/mikro-orm-bank-account-membership.repository';
export * from './repositories/users/mikro-orm-provisioning-unit-of-work';
export * from './repositories/users/mikro-orm-user.repository';
