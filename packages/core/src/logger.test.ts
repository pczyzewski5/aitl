import { randomBytes } from 'node:crypto';
import type { Logger } from 'pino';
import { describe, expect, it } from 'vitest';
import { createLogger, logger, REDACTED_PLACEHOLDER, SENSITIVE_KEYS, serializeError } from './logger';

function captureLogLine(write: (log: Logger) => void): Record<string, unknown> {
  const lines: string[] = [];
  const log = createLogger({ write: (line: string) => void lines.push(line) });

  write(log);

  return JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
}

describe('createLogger', () => {
  it.each(SENSITIVE_KEYS)('redacts %s at depth 0, 1 and 2', (key) => {
    const secret = randomBytes(16).toString('hex');

    const actual = captureLogLine((log) =>
      log.info({ [key]: secret, one: { [key]: secret }, two: { inner: { [key]: secret } } }, 'event'),
    );

    expect(actual[key]).toBe(REDACTED_PLACEHOLDER);
    expect(actual.one).toEqual({ [key]: REDACTED_PLACEHOLDER });
    expect(actual.two).toEqual({ inner: { [key]: REDACTED_PLACEHOLDER } });
  });

  it.each(SENSITIVE_KEYS)('redacts %s inside an array of objects', (key) => {
    const secret = randomBytes(16).toString('hex');

    const actual = captureLogLine((log) => log.info({ items: [{ [key]: secret }, { [key]: secret }] }, 'event'));

    expect(actual.items).toEqual([{ [key]: REDACTED_PLACEHOLDER }, { [key]: REDACTED_PLACEHOLDER }]);
  });

  it('keeps non-sensitive fields untouched next to redacted ones', () => {
    const secret = randomBytes(16).toString('hex');

    const actual = captureLogLine((log) => log.info({ user: { password: secret, email: 'a@b.c' } }, 'login'));

    expect(actual.user).toEqual({ password: REDACTED_PLACEHOLDER, email: 'a@b.c' });
  });

  it('redacts request headers and the response set-cookie header', () => {
    const secret = randomBytes(16).toString('hex');

    const actual = captureLogLine((log) =>
      log.info(
        {
          req: { headers: { Cookie: secret, Authorization: secret, accept: 'json' } },
          res: { headers: { 'set-cookie': secret } },
        },
        'request',
      ),
    );

    expect(actual.req).toEqual({
      headers: { Cookie: REDACTED_PLACEHOLDER, Authorization: REDACTED_PLACEHOLDER, accept: 'json' },
    });
    expect(actual.res).toEqual({ headers: { 'set-cookie': REDACTED_PLACEHOLDER } });
  });

  it('logs only type, message, code and stack of an error', () => {
    const detail = randomBytes(8).toString('hex');
    const error = Object.assign(new TypeError('boom'), { code: '28P01', detail });

    const actual = captureLogLine((log) => log.error({ err: error }, 'failed'));

    expect(actual.err).toEqual({ type: 'TypeError', message: 'boom', code: '28P01', stack: error.stack });
    expect(JSON.stringify(actual)).not.toContain(detail);
  });

  it('exposes a ready shared logger', () => {
    expect(typeof logger.info).toBe('function');
  });
});

describe('serializeError', () => {
  it('keeps a numeric code', () => {
    const error = Object.assign(new Error('boom'), { code: 42 });

    expect(serializeError(error).code).toBe(42);
  });

  it('omits a code that is neither a string nor a number', () => {
    const error = Object.assign(new Error('boom'), { code: { nested: true } });

    expect(serializeError(error)).not.toHaveProperty('code');
  });

  it('omits the stack when the error has none', () => {
    const error = new Error('boom');
    error.stack = undefined;

    expect(serializeError(error)).toEqual({ type: 'Error', message: 'boom' });
  });

  it('describes a thrown non-error value', () => {
    expect(serializeError('plain text')).toEqual({ type: 'string', message: 'plain text' });
  });
});
