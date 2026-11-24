import { randomBytes } from 'node:crypto';
import type { Logger } from 'pino';
import { describe, expect, it } from 'vitest';
import { createLogger, logger, REDACTED_PLACEHOLDER } from './logger';

function captureLogLine(write: (log: Logger) => void): Record<string, unknown> {
  const lines: string[] = [];
  const log = createLogger({ write: (line: string) => void lines.push(line) });

  write(log);

  return JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
}

describe('createLogger', () => {
  it('redacts password, passwordHash and token in nested objects', () => {
    const secret = randomBytes(16).toString('hex');

    const actual = captureLogLine((log) =>
      log.info({ user: { password: secret, passwordHash: secret, token: secret, email: 'a@b.c' } }, 'login'),
    );

    expect(actual.user).toEqual({
      password: REDACTED_PLACEHOLDER,
      passwordHash: REDACTED_PLACEHOLDER,
      token: REDACTED_PLACEHOLDER,
      email: 'a@b.c',
    });
  });

  it('redacts request cookie and authorization headers and the response set-cookie header', () => {
    const secret = randomBytes(16).toString('hex');

    const actual = captureLogLine((log) =>
      log.info(
        {
          req: { headers: { cookie: secret, authorization: secret, accept: 'json' } },
          res: { headers: { 'set-cookie': secret } },
        },
        'request',
      ),
    );

    expect(actual.req).toEqual({
      headers: { cookie: REDACTED_PLACEHOLDER, authorization: REDACTED_PLACEHOLDER, accept: 'json' },
    });
    expect(actual.res).toEqual({ headers: { 'set-cookie': REDACTED_PLACEHOLDER } });
  });

  it('exposes a ready shared logger', () => {
    expect(typeof logger.info).toBe('function');
  });
});
