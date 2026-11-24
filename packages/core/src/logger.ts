import pino, { type DestinationStream, type Logger } from 'pino';

export const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'token',
  'sessionToken',
  'secret',
  'DATABASE_URL',
  'SESSION_SECRET',
  'SEED_PASSWORD',
  'cookie',
  'Cookie',
  'authorization',
  'Authorization',
  'set-cookie',
  'Set-Cookie',
] as const;

export const REDACTION_MAX_DEPTH = 2;

const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const WILDCARD_SEGMENT = '*';

function formatKeySegment(key: string): string {
  return IDENTIFIER_PATTERN.test(key) ? `.${key}` : `["${key}"]`;
}

function buildRedactedPaths(keys: readonly string[], maxDepth: number): string[] {
  const paths: string[] = [];

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const prefix = Array<string>(depth).fill(WILDCARD_SEGMENT).join('.');

    for (const key of keys) {
      const segment = formatKeySegment(key);
      const path = prefix === '' ? segment : `${prefix}${segment}`;

      paths.push(path.startsWith('.') ? path.slice(1) : path);
    }
  }

  return paths;
}

export const REDACTED_PATHS = buildRedactedPaths(SENSITIVE_KEYS, REDACTION_MAX_DEPTH);

export const REDACTED_PLACEHOLDER = '[Redacted]';

export function createLogger(destination?: DestinationStream): Logger {
  return pino({ redact: { paths: [...REDACTED_PATHS], censor: REDACTED_PLACEHOLDER } }, destination);
}

export const logger = createLogger();
