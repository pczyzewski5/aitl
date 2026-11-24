import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '../container/container';
import { SESSION_CHECK_FAILED_LOG_MESSAGE } from '../messages';
import { loadCurrentUser } from './current-user';

const sessionCookie = vi.hoisted(() => ({ readSessionToken: vi.fn() }));

vi.mock('./session-cookie', () => sessionCookie);

const randomText = (): string => randomBytes(8).toString('hex');

describe('loadCurrentUser', () => {
  const resolve = vi.fn();
  const getCurrentUser = vi.fn();
  const logError = vi.fn();

  beforeEach(() => {
    resolve.mockReset();
    getCurrentUser.mockReset();
    logError.mockReset();
    sessionCookie.readSessionToken.mockReset();
    vi.spyOn(container, 'createScope').mockReturnValue({
      cradle: { sessionResolver: { resolve }, authService: { getCurrentUser } },
    } as never);
    vi.spyOn(container.cradle.logger, 'error').mockImplementation(logError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the user of the live session', async () => {
    const token = randomText();
    const userId = randomText();
    const user = { id: userId, email: `${randomText()}@example.test`, displayName: randomText() };
    sessionCookie.readSessionToken.mockResolvedValue(token);
    resolve.mockResolvedValue({ userId });
    getCurrentUser.mockResolvedValue(user);

    const actual = await loadCurrentUser();

    expect(actual).toEqual(user);
    expect(resolve).toHaveBeenCalledWith(token);
    expect(getCurrentUser).toHaveBeenCalledWith(userId);
  });

  it('returns null without a live session', async () => {
    sessionCookie.readSessionToken.mockResolvedValue(null);
    resolve.mockResolvedValue(null);

    const actual = await loadCurrentUser();

    expect(actual).toBeNull();
    expect(getCurrentUser).not.toHaveBeenCalled();
  });

  it('logs the failure and returns null when the check throws', async () => {
    const failure = new Error(randomText());
    sessionCookie.readSessionToken.mockResolvedValue(randomText());
    resolve.mockRejectedValue(failure);

    const actual = await loadCurrentUser();

    expect(actual).toBeNull();
    expect(logError).toHaveBeenCalledWith({ err: failure }, SESSION_CHECK_FAILED_LOG_MESSAGE);
  });
});
