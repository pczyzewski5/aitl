import { createContainer, InjectionMode, type AwilixContainer } from 'awilix';
import type { OrmInit } from '@aitl/db';
import type { Cradle } from './cradle';
import { createCoreRegistrations, type EnvSource } from './registrations/core';
import { createDbRegistrations } from './registrations/db';

export { DEVELOPMENT_ENVIRONMENT } from './registrations/db';
export type { EnvSource } from './registrations/core';

export function createAppContainer(source: EnvSource, ormInit?: OrmInit): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    ...createCoreRegistrations(source),
    ...createDbRegistrations(ormInit),
  });

  return container;
}

export const container = createAppContainer(process.env);
