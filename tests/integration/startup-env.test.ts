import { describe, expect, it } from 'vitest';
import { startAppWithInvalidEnv } from './support/app-server.ts';

describe('application start without DATABASE_URL', () => {
  it('reports the invalid variable name and refuses to serve requests', async () => {
    const app = await startAppWithInvalidEnv({});

    try {
      expect(app.output()).toContain('Invalid environment variables: DATABASE_URL');
      expect(app.healthStatus).toBe(500);
    } finally {
      await app.stop();
    }
  });
});
