import { asFunction, asValue, type Resolver } from 'awilix';
import {
  AuthService,
  LoginThrottleService,
  SessionService,
  SessionTokens,
  systemClock,
  type Clock,
  type LoginThrottleRepository,
  type PasswordHasher,
  type SessionRepository,
  type SessionResolver,
} from '@aitl/core';
import { MikroOrmLoginThrottleRepository, MikroOrmSessionRepository } from '@aitl/db';
import { ARGON2_PRODUCTION_PARAMETERS, Argon2PasswordHasher } from '../../adapters/argon2-password-hasher';
import type { CoreCradle } from './core';
import type { DbCradle } from './db';
import type { UsersCradle } from './users';

export type AuthCradle = {
  passwordHasher: PasswordHasher;
  clock: Clock;
  sessionTokens: SessionTokens;
  sessionRepository: SessionRepository;
  sessionService: SessionService;
  loginThrottleRepository: LoginThrottleRepository;
  loginThrottleService: LoginThrottleService;
  sessionResolver: SessionResolver;
  authService: AuthService;
};

type AuthDependencies = CoreCradle & DbCradle & UsersCradle & AuthCradle;

export function createAuthRegistrations() {
  return {
    passwordHasher: asFunction(
      (): PasswordHasher => new Argon2PasswordHasher(ARGON2_PRODUCTION_PARAMETERS),
    ).singleton(),
    clock: asValue(systemClock),
    sessionTokens: asFunction(
      ({ env }: AuthDependencies) => new SessionTokens(env.SESSION_SECRET),
    ).singleton(),
    sessionRepository: asFunction(
      ({ entityManagerProvider }: AuthDependencies): SessionRepository =>
        new MikroOrmSessionRepository(entityManagerProvider),
    ).scoped(),
    sessionService: asFunction(
      ({ sessionRepository, sessionTokens, clock }: AuthDependencies) =>
        new SessionService(sessionRepository, sessionTokens, clock),
    ).scoped(),
    sessionResolver: asFunction(
      ({ sessionService }: AuthDependencies): SessionResolver => sessionService,
    ).scoped(),
    loginThrottleRepository: asFunction(
      ({ entityManagerProvider }: AuthDependencies): LoginThrottleRepository =>
        new MikroOrmLoginThrottleRepository(entityManagerProvider),
    ).scoped(),
    loginThrottleService: asFunction(
      ({ loginThrottleRepository, sessionTokens, clock }: AuthDependencies) =>
        new LoginThrottleService(loginThrottleRepository, sessionTokens, clock),
    ).scoped(),
    authService: asFunction(
      ({ userRepository, passwordHasher, sessionService, loginThrottleService }: AuthDependencies) =>
        new AuthService(userRepository, passwordHasher, sessionService, loginThrottleService),
    ).scoped(),
  } satisfies { [Key in keyof AuthCradle]: Resolver<AuthCradle[Key]> };
}
