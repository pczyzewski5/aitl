import { describe, expect, it } from 'vitest';
import {
  CSRF_FORBIDDEN_MESSAGE,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
  requireCsrfHeader,
} from './csrf';
import { ForbiddenError } from './errors';

const createRequest = (headers: Record<string, string>): Request =>
  new Request('http://localhost/api/example', { method: 'POST', headers });

describe('requireCsrfHeader', () => {
  it('accepts a request with the expected header value', () => {
    const request = createRequest({ [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE });

    expect(() => requireCsrfHeader(request)).not.toThrow();
  });

  it.each<{ name: string; headers: Record<string, string> }>([
    { name: 'the header is missing', headers: {} },
    { name: 'the header value is different', headers: { [CSRF_HEADER_NAME]: 'other' } },
    { name: 'the header value is empty', headers: { [CSRF_HEADER_NAME]: '' } },
  ])('rejects the request when $name', ({ headers }) => {
    const request = createRequest(headers);

    expect(() => requireCsrfHeader(request)).toThrow(new ForbiddenError(CSRF_FORBIDDEN_MESSAGE));
  });
});
