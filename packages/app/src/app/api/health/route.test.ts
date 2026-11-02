import { describe, expect, it } from 'vitest';
import { GET } from './route';

describe('GET /api/health', () => {
  it('reports the application as up', async () => {
    const actual = await GET().json();

    expect(actual).toEqual({ ok: true, data: { status: 'up' } });
  });
});
