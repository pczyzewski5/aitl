import { loginSchema, parseJsonBody, requireCsrfHeader, resolveClientIp } from '@aitl/core';
import { apiHandler } from '../../../../http/api-handler';
import { readSessionToken, setSessionCookie } from '../../../../http/session-cookie';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request, scope) => {
  requireCsrfHeader(request);
  const input = await parseJsonBody(request, loginSchema);
  const { authService, env } = scope.cradle;

  const clientIp = resolveClientIp(request.headers, env.TRUSTED_PROXY_HOPS);

  const { user, sessionToken } = await authService.login(input, clientIp, await readSessionToken());
  await setSessionCookie(sessionToken, env.SESSION_COOKIE_SECURE);

  return { user };
});
