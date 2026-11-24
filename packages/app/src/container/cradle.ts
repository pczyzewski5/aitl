import type { AuthCradle } from './registrations/auth';
import type { BankAccountsCradle } from './registrations/bank-accounts';
import type { CoreCradle } from './registrations/core';
import type { DbCradle } from './registrations/db';
import type { UsersCradle } from './registrations/users';

export type Cradle = CoreCradle & DbCradle & AuthCradle & BankAccountsCradle & UsersCradle;
