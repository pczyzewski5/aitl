import { requireCsrfHeader } from '@aitl/core';
import { apiHandler } from '../../../../http/api-handler';
import { clearSessionCookie, readSessionToken } from '../../../../http/session-cookie';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request, scope) => {
  requireCsrfHeader(request);
  const { authService, env } = scope.cradle;

  await authService.logout(await readSessionToken());
  await clearSessionCookie(env.SESSION_COOKIE_SECURE);

  return null;
});
