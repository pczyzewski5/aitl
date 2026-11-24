import { requireSession } from '@aitl/core';
import { apiHandler } from '../../../../http/api-handler';
import { readSessionToken } from '../../../../http/session-cookie';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (_request, scope) => {
  const { sessionResolver, authService } = scope.cradle;

  const session = await requireSession(await readSessionToken(), sessionResolver);

  return { user: await authService.getCurrentUser(session.userId) };
});
