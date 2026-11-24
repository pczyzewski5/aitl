import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '../../../../container/container';
import { GET } from './route';

const sessionCookie = vi.hoisted(() => ({ readSessionToken: vi.fn() }));

vi.mock('../../../../http/session-cookie', () => sessionCookie);

const randomText = (): string => randomBytes(8).toString('hex');

describe('GET /api/auth/me', () => {
  const resolve = vi.fn();
  const getCurrentUser = vi.fn();

  beforeEach(() => {
    resolve.mockReset();
    getCurrentUser.mockReset();
    sessionCookie.readSessionToken.mockReset();
    vi.spyOn(container, 'createScope').mockReturnValue({
      cradle: { sessionResolver: { resolve }, authService: { getCurrentUser } },
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the user of the session', async () => {
    const userId = randomText();
    const user = { id: userId, email: `${randomText()}@example.test`, displayName: randomText() };
    sessionCookie.readSessionToken.mockResolvedValue(randomText());
    resolve.mockResolvedValue({ userId });
    getCurrentUser.mockResolvedValue(user);

    const actual = await GET(new Request('http://localhost/api/auth/me'), undefined);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: { user } });
    expect(getCurrentUser).toHaveBeenCalledWith(userId);
  });

  it('answers 401 without a live session and reads no user', async () => {
    sessionCookie.readSessionToken.mockResolvedValue(null);
    resolve.mockResolvedValue(null);

    const actual = await GET(new Request('http://localhost/api/auth/me'), undefined);

    expect(actual.status).toBe(401);
    expect((await actual.json()).error.code).toBe('unauthorized');
    expect(getCurrentUser).not.toHaveBeenCalled();
  });
});
