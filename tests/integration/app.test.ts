import { afterAll, beforeAll, describe, expect, inject, it } from 'vitest';
import { startApp, type RunningApp } from './support/app-server.ts';

describe('temporary application instance', () => {
  let app: RunningApp;

  beforeAll(async () => {
    app = await startApp({ DATABASE_URL: inject('databaseUrl') });
  });

  afterAll(async () => {
    await app.stop();
  });

  it('reports the health endpoint as up', async () => {
    const response = await fetch(`${app.url}/api/health`);

    expect(await response.json()).toEqual({ ok: true, data: { status: 'up' } });
  });

  it('renders the home page', async () => {
    const response = await fetch(app.url);

    expect(await response.text()).toContain('AITL');
  });
});
