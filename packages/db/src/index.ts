import { packageName as corePackageName } from '@aitl/core';

export const packageName = '@aitl/db';
export const dependsOn = [corePackageName];

export * from './database-url';
export * from './entities';
export * from './entities/base.entity';
export * from './orm-config';
