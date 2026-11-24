import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_ABSOLUTE_TTL_SECONDS } from '@aitl/core';
import {
  clearSessionCookie,
  readSessionToken,
  SESSION_COOKIE_NAME,
  setSessionCookie,
} from './session-cookie';

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));

vi.mock('next/headers', () => ({ cookies: async () => cookieStore }));

describe('session cookie', () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  describe('readSessionToken', () => {
    it('returns the value of the session cookie', async () => {
      cookieStore.get.mockReturnValue({ name: SESSION_COOKIE_NAME, value: 'token-value' });

      const actual = await readSessionToken();

      expect(actual).toBe('token-value');
      expect(cookieStore.get).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    });

    it('returns null when the cookie is missing', async () => {
      cookieStore.get.mockReturnValue(undefined);

      const actual = await readSessionToken();

      expect(actual).toBeNull();
    });
  });

  describe('setSessionCookie', () => {
    it.each([
      { name: 'secure', secure: true },
      { name: 'not secure', secure: false },
    ])('sets an httpOnly lax cookie for the whole site that lives as long as the absolute limit ($name)', async ({ secure }) => {
      const expected = {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge: SESSION_ABSOLUTE_TTL_SECONDS,
      };

      await setSessionCookie('token-value', secure);

      expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, 'token-value', expected);
    });
  });

  describe('clearSessionCookie', () => {
    it('expires the cookie keeping the same flags', async () => {
      const expected = { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 0 };

      await clearSessionCookie(true);

      expect(cookieStore.set).toHaveBeenCalledWith(SESSION_COOKIE_NAME, '', expected);
    });
  });
});
