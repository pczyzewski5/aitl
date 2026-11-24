import type { EntitySchema } from '@mikro-orm/postgresql';
import { LoginThrottle } from './auth/login-throttle.entity';
import { Session } from './auth/session.entity';
import { BankAccount } from './bank-accounts/bank-account.entity';
import { BankAccountMembership } from './bank-accounts/bank-account-membership.entity';
import { User } from './users/user.entity';

export const entities: EntitySchema[] = [
  User,
  BankAccount,
  BankAccountMembership,
  Session,
  LoginThrottle,
];

export * from './auth/login-throttle.entity';
export * from './auth/session.entity';
export * from './bank-accounts/bank-account.entity';
export * from './bank-accounts/bank-account-membership.entity';
export * from './users/user.entity';
