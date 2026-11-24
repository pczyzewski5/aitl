import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createLogger } from '../logger';
import {
  createApiHandler,
  INTERNAL_ERROR_CODE,
  INTERNAL_ERROR_MESSAGE,
  UNEXPECTED_ERROR_LOG_MESSAGE,
} from './apiHandler';
import {
  ConflictError,
  ForbiddenError,
  InvalidCredentialsError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
  ValidationError,
} from './errors';

const request = new Request('http://localhost/api/example');

function createCapturingLog() {
  const lines: string[] = [];
  const log = createLogger({ write: (line: string) => void lines.push(line) });

  return { log, lines };
}

describe('createApiHandler', () => {
  it('wraps returned data in the success envelope', async () => {
    const { log } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);

    const actual = await apiHandler(() => ({ status: 'up' }))(request);

    expect(actual.status).toBe(200);
    expect(await actual.json()).toEqual({ ok: true, data: { status: 'up' } });
  });

  it('awaits asynchronous route functions', async () => {
    const { log } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);

    const actual = await apiHandler(async () => 'later')(request);

    expect(await actual.json()).toEqual({ ok: true, data: 'later' });
  });

  it('passes the request and a fresh scope per call', async () => {
    const { log } = createCapturingLog();
    let scopeCounter = 0;
    const apiHandler = createApiHandler(() => ({ id: ++scopeCounter }), log);
    const handler = apiHandler((receivedRequest, scope) => ({ same: receivedRequest === request, id: scope.id }));

    const first = await (await handler(request)).json();
    const second = await (await handler(request)).json();

    expect(first).toEqual({ ok: true, data: { same: true, id: 1 } });
    expect(second).toEqual({ ok: true, data: { same: true, id: 2 } });
  });

  it.each([
    { error: new UnauthorizedError('no session'), code: 'unauthorized', status: 401 },
    { error: new ForbiddenError('not yours'), code: 'forbidden', status: 403 },
    { error: new NotFoundError('missing'), code: 'not_found', status: 404 },
    { error: new ConflictError('duplicate'), code: 'conflict', status: 409 },
    { error: new ValidationError('invalid'), code: 'validation_error', status: 400 },
    { error: new InvalidCredentialsError('bad login'), code: 'invalid_credentials', status: 401 },
  ])('maps $code to status $status without logging', async ({ error, code, status }) => {
    const { log, lines } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);

    const actual = await apiHandler(() => {
      throw error;
    })(request);

    expect(actual.status).toBe(status);
    expect(await actual.json()).toEqual({ ok: false, error: { code, message: error.message } });
    expect(lines).toEqual([]);
  });

  it('adds the retry delay to the body and the Retry-After header of a 429', async () => {
    const { log, lines } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);
    const retryAfterSeconds = 900;

    const actual = await apiHandler(() => {
      throw new TooManyRequestsError('slow down', retryAfterSeconds);
    })(request);

    expect(actual.status).toBe(429);
    expect(actual.headers.get('Retry-After')).toBe('900');
    expect(await actual.json()).toEqual({
      ok: false,
      error: { code: 'too_many_attempts', message: 'slow down', retryAfterSeconds },
    });
    expect(lines).toEqual([]);
  });

  it('does not set Retry-After on other errors', async () => {
    const { log } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);

    const actual = await apiHandler(() => {
      throw new ForbiddenError('not yours');
    })(request);

    expect(actual.headers.get('Retry-After')).toBeNull();
  });

  it('includes field errors of a validation error', async () => {
    const { log } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);
    const fieldErrors = { email: ['Required'] };

    const actual = await apiHandler(() => {
      throw new ValidationError('invalid', fieldErrors);
    })(request);

    expect(await actual.json()).toEqual({
      ok: false,
      error: { code: 'validation_error', message: 'invalid', fieldErrors },
    });
  });

  it('maps an unexpected error to 500 internal without leaking details and logs it', async () => {
    const { log, lines } = createCapturingLog();
    const apiHandler = createApiHandler(() => ({}), log);
    const secretMessage = randomBytes(8).toString('hex');

    const actual = await apiHandler(() => {
      throw new Error(secretMessage);
    })(request);

    const rawBody = await actual.text();
    const logged = JSON.parse(lines[0] ?? '{}') as { msg: string; err: { message: string } };
    expect(actual.status).toBe(500);
    expect(JSON.parse(rawBody)).toEqual({
      ok: false,
      error: { code: INTERNAL_ERROR_CODE, message: INTERNAL_ERROR_MESSAGE },
    });
    expect(rawBody).not.toContain(secretMessage);
    expect(rawBody).not.toContain('stack');
    expect(logged.msg).toBe(UNEXPECTED_ERROR_LOG_MESSAGE);
    expect(logged.err.message).toBe(secretMessage);
  });

  it('maps an error thrown while creating the scope to 500', async () => {
    const { log, lines } = createCapturingLog();
    const apiHandler = createApiHandler((): object => {
      throw new Error('no scope');
    }, log);

    const actual = await apiHandler(() => 'never')(request);

    expect(actual.status).toBe(500);
    expect(lines).toHaveLength(1);
  });

  it('uses the shared logger by default', async () => {
    const apiHandler = createApiHandler(() => ({}));

    const actual = await apiHandler(() => 'ok')(request);

    expect(actual.status).toBe(200);
  });
});
