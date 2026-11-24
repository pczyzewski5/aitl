import pino, { type DestinationStream, type Logger } from 'pino';

export const REDACTED_PATHS = [
  '*.password',
  '*.passwordHash',
  '*.token',
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
] as const;

export const REDACTED_PLACEHOLDER = '[Redacted]';

export function createLogger(destination?: DestinationStream): Logger {
  return pino({ redact: { paths: [...REDACTED_PATHS], censor: REDACTED_PLACEHOLDER } }, destination);
}

export const logger = createLogger();
