import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  InvalidCredentialsError,
  UNEXPECTED_ERROR_LOG_MESSAGE,
} from '@aitl/core';
import { container } from '../../../../container/container';
import { POST } from './route';

const sessionCookie = vi.hoisted(() => ({ setSessionCookie: vi.fn() }));

vi.mock('../../../../http/session-cookie', () => sessionCookie);

const randomText = (): string => randomBytes(8).toString('hex');

function createRequest(body: unknown, headers: Record<string, string>): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const csrfHeaders = { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE };

describe('POST /api/auth/login', () => {
  const login = vi.fn();
  let email: string;
  let password: string;

  beforeEach(() => {
    email = `${randomText()}@example.test`;
    password = randomText();
    login.mockReset();
    sessionCookie.setSessionCookie.mockReset();
    vi.spyOn(container, 'createScope').mockReturnValue({
      cradle: { authService: { login }, env: { SESSION_COOKIE_SECURE: true } },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the user and sets the session cookie', async () => {
    const user = { id: randomText(), email, displayName: randomText() };
    const sessionToken = randomText();
    login.mockResolvedValue({ user, sessionToken });

    const actual = await POST(createRequest({ email: ` ${email.toUpperCase()} `, password }, csrfHeaders), undefined);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: { user } });
    expect(login).toHaveBeenCalledWith({ email, password });
    expect(sessionCookie.setSessionCookie).toHaveBeenCalledWith(sessionToken, true);
  });

  it('rejects a request without the CSRF header before touching the service', async () => {
    const actual = await POST(createRequest({ email, password }, {}), undefined);

    expect(actual.status).toBe(403);
    expect(login).not.toHaveBeenCalled();
    expect(sessionCookie.setSessionCookie).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'a malformed e-mail', body: { email: 'not-an-email', password: 'x' } },
    { name: 'an empty password', body: { email: 'user@example.test', password: '' } },
    { name: 'a body that is not JSON', body: 'not json' },
  ])('answers 400 for $name', async ({ body }) => {
    const actual = await POST(createRequest(body, csrfHeaders), undefined);

    expect(actual.status).toBe(400);
    expect((await actual.json()).error.code).toBe('validation_error');
    expect(login).not.toHaveBeenCalled();
  });

  it('answers 401 without a cookie when the credentials are invalid', async () => {
    login.mockRejectedValue(new InvalidCredentialsError('Invalid credentials'));

    const actual = await POST(createRequest({ email, password }, csrfHeaders), undefined);

    expect(actual.status).toBe(401);
    expect((await actual.json()).error.code).toBe('invalid_credentials');
    expect(sessionCookie.setSessionCookie).not.toHaveBeenCalled();
  });

  it('keeps the password and the token out of the log when the service fails unexpectedly', async () => {
    const error = vi.spyOn(container.cradle.logger, 'error').mockImplementation(() => undefined);
    login.mockRejectedValue(new Error('connection lost'));

    const actual = await POST(createRequest({ email, password }, csrfHeaders), undefined);

    expect(actual.status).toBe(500);
    expect(error).toHaveBeenCalledWith({ err: expect.any(Error) }, UNEXPECTED_ERROR_LOG_MESSAGE);
    expect(JSON.stringify(error.mock.calls)).not.toContain(password);
  });
});
