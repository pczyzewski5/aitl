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

export const ERROR_LOG_KEY = 'err';

export type SerializedError = {
  type: string;
  message: string;
  code?: string | number;
  stack?: string;
};

function readErrorCode(error: Error): string | number | undefined {
  const code = (error as { code?: unknown }).code;

  return typeof code === 'string' || typeof code === 'number' ? code : undefined;
}

export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return { type: typeof error, message: String(error) };
  }

  const serialized: SerializedError = { type: error.constructor.name, message: error.message };
  const code = readErrorCode(error);

  if (code !== undefined) {
    serialized.code = code;
  }

  if (error.stack !== undefined) {
    serialized.stack = error.stack;
  }

  return serialized;
}

export function createLogger(destination?: DestinationStream): Logger {
  return pino(
    {
      redact: { paths: [...REDACTED_PATHS], censor: REDACTED_PLACEHOLDER },
      serializers: { [ERROR_LOG_KEY]: serializeError },
    },
    destination,
  );
}

export const logger = createLogger();
