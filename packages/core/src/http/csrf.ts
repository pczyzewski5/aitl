import { ForbiddenError } from './errors';

export const CSRF_HEADER_NAME = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'aitl';
export const CSRF_FORBIDDEN_MESSAGE = 'Missing or invalid CSRF header';

export function requireCsrfHeader(request: Request): void {
  if (request.headers.get(CSRF_HEADER_NAME) !== CSRF_HEADER_VALUE) {
    throw new ForbiddenError(CSRF_FORBIDDEN_MESSAGE);
  }
}
