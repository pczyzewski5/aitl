import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('reports the application as up', async () => {
    const actual = await GET(new Request('http://localhost/api/health'), undefined);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: { status: 'up' } });
  });
});
