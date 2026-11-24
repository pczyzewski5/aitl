import { loginSchema, parseJsonBody, requireCsrfHeader } from '@aitl/core';
import { apiHandler } from '../../../../http/api-handler';
import { setSessionCookie } from '../../../../http/session-cookie';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request, scope) => {
  requireCsrfHeader(request);
  const input = await parseJsonBody(request, loginSchema);
  const { authService, env } = scope.cradle;

  const { user, sessionToken } = await authService.login(input);
  await setSessionCookie(sessionToken, env.SESSION_COOKIE_SECURE);

  return { user };
});
