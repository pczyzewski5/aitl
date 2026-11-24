import type { CoreCradle } from './registrations/core';
import type { DbCradle } from './registrations/db';

export type Cradle = CoreCradle & DbCradle;
