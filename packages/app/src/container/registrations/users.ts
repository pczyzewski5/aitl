import { asFunction, type Resolver } from 'awilix';
import { UserProvisioningService } from '@aitl/core';
import type { ProvisioningUnitOfWork, UserRepository } from '@aitl/core';
import { MikroOrmProvisioningUnitOfWork, MikroOrmUserRepository } from '@aitl/db';
import type { AuthCradle } from './auth';
import type { DbCradle } from './db';

export type UsersCradle = {
  userRepository: UserRepository;
  provisioningUnitOfWork: ProvisioningUnitOfWork;
  userProvisioningService: UserProvisioningService;
};

type UsersDependencies = AuthCradle & DbCradle & UsersCradle;

export function createUsersRegistrations() {
  return {
    userRepository: asFunction(
      ({ entityManagerProvider }: UsersDependencies): UserRepository =>
        new MikroOrmUserRepository(entityManagerProvider),
    ).scoped(),
    provisioningUnitOfWork: asFunction(
      ({ entityManagerProvider }: UsersDependencies): ProvisioningUnitOfWork =>
        new MikroOrmProvisioningUnitOfWork(entityManagerProvider),
    ).scoped(),
    userProvisioningService: asFunction(
      ({ provisioningUnitOfWork, passwordHasher }: UsersDependencies) =>
        new UserProvisioningService(provisioningUnitOfWork, passwordHasher),
    ).scoped(),
  } satisfies { [Key in keyof UsersCradle]: Resolver<UsersCradle[Key]> };
}
