import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiCall } from './apiCall';

const fetchMock = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe('apiCall', () => {
  it('returns the data of a success envelope and sends a GET with the CSRF header and no body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: { bankAccounts: [] } }));

    const actual = await apiCall<{ bankAccounts: unknown[] }>('/api/bank-accounts');

    expect(actual).toEqual({ ok: true, status: 200, data: { bankAccounts: [] } });
    expect(fetchMock).toHaveBeenCalledWith('/api/bank-accounts', { method: 'GET', headers: { 'X-Requested-With': 'aitl' } });
  });

  it('sends a JSON body with the content type and the chosen method', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, data: null }));

    await apiCall('/api/auth/login', { method: 'POST', body: { email: 'jan@example.com' } });

    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'X-Requested-With': 'aitl', 'Content-Type': 'application/json' },
      body: '{"email":"jan@example.com"}',
    });
  });

  it('returns the error body of an error envelope with the status', async () => {
    const error = { code: 'validation_error', message: 'Niepoprawne dane', fieldErrors: { email: ['Wpisz e-mail'] } };
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error }, 400));

    const actual = await apiCall('/api/auth/login', { method: 'POST', body: {} });

    expect(actual).toEqual({ ok: false, kind: 'api-error', status: 400, error });
  });

  it('keeps retryAfterSeconds from a lockout envelope', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ok: false, error: { code: 'too_many_attempts', message: 'Zbyt wiele prób', retryAfterSeconds: 87 } }, 429),
    );

    const actual = await apiCall('/api/auth/login', { method: 'POST', body: {} });

    expect(actual).toEqual({
      ok: false,
      kind: 'api-error',
      status: 429,
      error: { code: 'too_many_attempts', message: 'Zbyt wiele prób', retryAfterSeconds: 87 },
    });
  });

  it('drops optional error fields of the wrong type', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ok: false, error: { code: 'x', message: 'y', fieldErrors: 'nope', retryAfterSeconds: 'soon' } }, 400),
    );

    const actual = await apiCall('/api/anything');

    expect(actual).toEqual({ ok: false, kind: 'api-error', status: 400, error: { code: 'x', message: 'y' } });
  });

  it('reports a network failure when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const actual = await apiCall('/api/health');

    expect(actual).toEqual({ ok: false, kind: 'network' });
  });

  it('reports an invalid response for a body that is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad gateway</html>', { status: 502 }));

    const actual = await apiCall('/api/health');

    expect(actual).toEqual({ ok: false, kind: 'invalid-response', status: 502 });
  });

  it('reports an invalid response for an empty body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const actual = await apiCall('/api/health');

    expect(actual).toEqual({ ok: false, kind: 'invalid-response', status: 204 });
  });

  it.each<{ name: string; body: unknown }>([
    { name: 'a JSON array', body: [] },
    { name: 'a JSON null', body: null },
    { name: 'an object without ok', body: { data: 1 } },
    { name: 'a success envelope without data', body: { ok: true } },
    { name: 'an error envelope without error', body: { ok: false } },
    { name: 'an error envelope with a non-object error', body: { ok: false, error: 'boom' } },
    { name: 'an error envelope without a code', body: { ok: false, error: { message: 'boom' } } },
    { name: 'an error envelope without a message', body: { ok: false, error: { code: 'boom' } } },
  ])('reports an invalid response for $name', async ({ body }) => {
    fetchMock.mockResolvedValue(jsonResponse(body, 200));

    const actual = await apiCall('/api/health');

    expect(actual).toEqual({ ok: false, kind: 'invalid-response', status: 200 });
  });

  it.each(['/health', 'https://example.com/api/health', '/apix/health', 'api/health'])('rejects the path %s outside /api/', async (path) => {
    const actual = apiCall(path);

    await expect(actual).rejects.toThrow(TypeError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
