import { cookies } from 'next/headers';
import { SESSION_ABSOLUTE_TTL_SECONDS } from '@aitl/core';

export const SESSION_COOKIE_NAME = 'aitl_session';
export const SESSION_COOKIE_PATH = '/';
export const SESSION_COOKIE_SAME_SITE = 'lax';
export const EXPIRED_COOKIE_MAX_AGE = 0;

function baseCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: SESSION_COOKIE_SAME_SITE,
    secure,
    path: SESSION_COOKIE_PATH,
  } as const;
}

export async function readSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function setSessionCookie(token: string, secure: boolean): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...baseCookieOptions(secure),
    maxAge: SESSION_ABSOLUTE_TTL_SECONDS,
  });
}

export async function clearSessionCookie(secure: boolean): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...baseCookieOptions(secure),
    maxAge: EXPIRED_COOKIE_MAX_AGE,
  });
}
