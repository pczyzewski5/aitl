import { asFunction, type Resolver } from 'awilix';
import { BankAccountService } from '@aitl/core';
import type { BankAccountMembershipRepository, BankAccountRepository } from '@aitl/core';
import {
  MikroOrmBankAccountMembershipRepository,
  MikroOrmBankAccountRepository,
} from '@aitl/db';
import type { DbCradle } from './db';

export type BankAccountsCradle = {
  bankAccountRepository: BankAccountRepository;
  bankAccountMembershipRepository: BankAccountMembershipRepository;
  bankAccountService: BankAccountService;
};

type BankAccountsDependencies = DbCradle & BankAccountsCradle;

export function createBankAccountsRegistrations() {
  return {
    bankAccountRepository: asFunction(
      ({ entityManagerProvider }: BankAccountsDependencies): BankAccountRepository =>
        new MikroOrmBankAccountRepository(entityManagerProvider),
    ).scoped(),
    bankAccountMembershipRepository: asFunction(
      ({ entityManagerProvider }: BankAccountsDependencies): BankAccountMembershipRepository =>
        new MikroOrmBankAccountMembershipRepository(entityManagerProvider),
    ).scoped(),
    bankAccountService: asFunction(
      ({ bankAccountRepository, bankAccountMembershipRepository }: BankAccountsDependencies) =>
        new BankAccountService(bankAccountRepository, bankAccountMembershipRepository),
    ).scoped(),
  } satisfies { [Key in keyof BankAccountsCradle]: Resolver<BankAccountsCradle[Key]> };
}
