import { asFunction, asValue, type Resolver } from 'awilix';
import { logger, parseEnv, type Env, type createLogger } from '@aitl/core';

export type EnvSource = Readonly<Record<string, string | undefined>>;

export type CoreCradle = {
  env: Env;
  logger: ReturnType<typeof createLogger>;
};

export function createCoreRegistrations(source: EnvSource) {
  return {
    env: asFunction(() => parseEnv(source)).singleton(),
    logger: asValue(logger),
  } satisfies { [Key in keyof CoreCradle]: Resolver<CoreCradle[Key]> };
}
