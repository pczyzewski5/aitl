import type { TestProject } from 'vitest/node';
import { startPostgres } from './postgres.ts';

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const postgres = await startPostgres();

  project.provide('databaseUrl', postgres.getConnectionUri());

  return async () => {
    await postgres.stop();
  };
}
