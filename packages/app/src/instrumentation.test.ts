import { afterEach, describe, expect, it, vi } from 'vitest';
import { NODE_RUNTIME, register } from './instrumentation';

const VALID_DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';

describe('register', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('accepts a valid environment in the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', NODE_RUNTIME);
    vi.stubEnv('DATABASE_URL', VALID_DATABASE_URL);

    await expect(register()).resolves.toBeUndefined();
  });

  it('fails fast on an invalid environment in the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', NODE_RUNTIME);
    vi.stubEnv('DATABASE_URL', '');

    await expect(register()).rejects.toThrow('Invalid environment variables: DATABASE_URL');
  });

  it('skips validation outside the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('DATABASE_URL', '');

    await expect(register()).resolves.toBeUndefined();
  });
});
