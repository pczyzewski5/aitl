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

  it('serves the design system stylesheet linked from the home page', async () => {
    const html = await (await fetch(app.url)).text();
    const stylesheetPath = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/.exec(html)?.[1];

    const css = await (await fetch(`${app.url}${stylesheetPath}`)).text();

    expect(stylesheetPath).toBeDefined();
    expect(css).toContain('--raw-blue-600');
    expect(css).toContain('.bg-primary');
  });
});
