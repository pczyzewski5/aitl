import type { ProvisionedUser } from '@aitl/core';
import { container } from '../container/container';
import { SESSION_CHECK_FAILED_LOG_MESSAGE } from '../messages';
import { readSessionToken } from './session-cookie';

export async function loadCurrentUser(): Promise<ProvisionedUser | null> {
  try {
    const { sessionResolver, authService } = container.createScope().cradle;
    const session = await sessionResolver.resolve(await readSessionToken());

    return session === null ? null : await authService.getCurrentUser(session.userId);
  } catch (error) {
    container.cradle.logger.error({ err: error }, SESSION_CHECK_FAILED_LOG_MESSAGE);

    return null;
  }
}
