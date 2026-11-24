import type { ApiCallResult, LoginResult } from '@aitl/ui';
import { HTTP_BAD_REQUEST, HTTP_TOO_MANY_REQUESTS, HTTP_UNAUTHORIZED } from '../routes';

const INVALID_CREDENTIALS_STATUSES: readonly number[] = [HTTP_BAD_REQUEST, HTTP_UNAUTHORIZED];

export function toLoginResult(result: ApiCallResult<unknown>): LoginResult {
  if (result.ok) {
    return { ok: true };
  }

  if (result.kind === 'network') {
    return { ok: false, kind: 'network' };
  }

  if (result.kind === 'api-error' && INVALID_CREDENTIALS_STATUSES.includes(result.status)) {
    return { ok: false, kind: 'invalid-credentials' };
  }

  if (result.kind === 'api-error' && result.status === HTTP_TOO_MANY_REQUESTS) {
    return { ok: false, kind: 'too-many-attempts', retryAfterSeconds: result.error.retryAfterSeconds };
  }

  return { ok: false, kind: 'server-error' };
}
