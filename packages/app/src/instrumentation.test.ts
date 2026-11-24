import { randomBytes } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { container } from './container/container';
import { NODE_RUNTIME, PASSWORD_HASHER_REGISTRATION, register } from './instrumentation';

const VALID_DATABASE_URL = 'postgres://aitl@localhost:5432/aitl';

describe('register', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('accepts a valid environment in the Node runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', NODE_RUNTIME);
    vi.stubEnv('DATABASE_URL', VALID_DATABASE_URL);
    vi.stubEnv('SESSION_SECRET', randomBytes(32).toString('hex'));

    await expect(register()).resolves.toBeUndefined();
  });

  it('warms up the password hasher so the first login does not pay for the decoy hash', async () => {
    vi.stubEnv('NEXT_RUNTIME', NODE_RUNTIME);
    vi.stubEnv('DATABASE_URL', VALID_DATABASE_URL);
    vi.stubEnv('SESSION_SECRET', randomBytes(32).toString('hex'));
    const resolve = vi.spyOn(container, 'resolve').mockReturnValue(undefined as never);

    await register();

    expect(resolve).toHaveBeenCalledWith(PASSWORD_HASHER_REGISTRATION);
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
