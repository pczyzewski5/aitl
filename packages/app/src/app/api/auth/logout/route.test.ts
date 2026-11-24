import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CSRF_HEADER_NAME, CSRF_HEADER_VALUE } from '@aitl/core';
import { container } from '../../../../container/container';
import { POST } from './route';

const sessionCookie = vi.hoisted(() => ({
  readSessionToken: vi.fn(),
  clearSessionCookie: vi.fn(),
}));

vi.mock('../../../../http/session-cookie', () => sessionCookie);

const createRequest = (headers: Record<string, string>): Request =>
  new Request('http://localhost/api/auth/logout', { method: 'POST', headers });

describe('POST /api/auth/logout', () => {
  const logout = vi.fn();

  beforeEach(() => {
    logout.mockReset();
    logout.mockResolvedValue(undefined);
    sessionCookie.readSessionToken.mockReset();
    sessionCookie.clearSessionCookie.mockReset();
    vi.spyOn(container, 'createScope').mockReturnValue({
      cradle: { authService: { logout }, env: { SESSION_COOKIE_SECURE: false } },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ends the session of the cookie and clears the cookie', async () => {
    sessionCookie.readSessionToken.mockResolvedValue('token-value');

    const actual = await POST(createRequest({ [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE }), undefined);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: null });
    expect(logout).toHaveBeenCalledWith('token-value');
    expect(sessionCookie.clearSessionCookie).toHaveBeenCalledWith(false);
  });

  it('answers 200 and clears the cookie also when there is no session cookie', async () => {
    sessionCookie.readSessionToken.mockResolvedValue(null);

    const actual = await POST(createRequest({ [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE }), undefined);

    expect(actual.status).toBe(200);
    expect(logout).toHaveBeenCalledWith(null);
    expect(sessionCookie.clearSessionCookie).toHaveBeenCalledWith(false);
  });

  it('rejects a request without the CSRF header and leaves the session alone', async () => {
    const actual = await POST(createRequest({}), undefined);

    expect(actual.status).toBe(403);
    expect(logout).not.toHaveBeenCalled();
    expect(sessionCookie.clearSessionCookie).not.toHaveBeenCalled();
  });
});
