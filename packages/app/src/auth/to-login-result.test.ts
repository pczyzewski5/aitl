import { describe, expect, it } from 'vitest';
import type { ApiCallResult, LoginResult } from '@aitl/ui';
import { toLoginResult } from './to-login-result';

const apiError = (status: number, retryAfterSeconds?: number): ApiCallResult<unknown> => ({
  ok: false,
  kind: 'api-error',
  status,
  error: { code: 'any', message: 'any', retryAfterSeconds },
});

describe('toLoginResult', () => {
  it.each<{ name: string; result: ApiCallResult<unknown>; expected: LoginResult }>([
    { name: 'success', result: { ok: true, status: 200, data: null }, expected: { ok: true } },
    { name: 'network failure', result: { ok: false, kind: 'network' }, expected: { ok: false, kind: 'network' } },
    { name: '401', result: apiError(401), expected: { ok: false, kind: 'invalid-credentials' } },
    {
      name: '429 with the lock time',
      result: apiError(429, 90),
      expected: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: 90 },
    },
    {
      name: '429 without the lock time',
      result: apiError(429),
      expected: { ok: false, kind: 'too-many-attempts', retryAfterSeconds: undefined },
    },
    { name: '500', result: apiError(500), expected: { ok: false, kind: 'server-error' } },
    { name: '400', result: apiError(400), expected: { ok: false, kind: 'invalid-credentials' } },
    {
      name: 'an invalid response',
      result: { ok: false, kind: 'invalid-response', status: 502 },
      expected: { ok: false, kind: 'server-error' },
    },
    {
      name: 'an invalid response with status 401',
      result: { ok: false, kind: 'invalid-response', status: 401 },
      expected: { ok: false, kind: 'server-error' },
    },
  ])('maps $name', ({ result, expected }) => {
    const actual = toLoginResult(result);

    expect(actual).toEqual(expected);
  });
});
