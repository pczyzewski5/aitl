import { describe, expect, it } from 'vitest';
import { startAppWithInvalidEnv } from './support/app-server.ts';

describe('application start without required variables', () => {
  it('reports the invalid variable names and refuses to serve requests', async () => {
    const app = await startAppWithInvalidEnv({});

    try {
      expect(app.output()).toContain('Invalid environment variables: DATABASE_URL, SESSION_SECRET');
      expect(app.healthStatus).toBe(500);
    } finally {
      await app.stop();
    }
  });
});
