import { z } from 'zod';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
export const DEFAULT_NODE_ENVIRONMENT = 'development';

const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default(DEFAULT_NODE_ENVIRONMENT),
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const SESSION_SECRET_MIN_LENGTH = 32;
export const BOOLEAN_ENV_VALUES = ['true', 'false'] as const;
export const PRODUCTION_ENVIRONMENT = 'production';

const sessionEnvSchema = z.object({
  SESSION_SECRET: z.string().min(SESSION_SECRET_MIN_LENGTH),
  SESSION_COOKIE_SECURE: z.enum(BOOLEAN_ENV_VALUES).optional(),
  TRUSTED_PROXY_HOPS: z.string().regex(/^\d+$/).optional(),
});

export const DEFAULT_TRUSTED_PROXY_HOPS = 0;

export const envSchema = runtimeEnvSchema
  .extend(databaseEnvSchema.shape)
  .extend(sessionEnvSchema.shape)
  .transform((env) => ({
    ...env,
    SESSION_COOKIE_SECURE:
      env.SESSION_COOKIE_SECURE === undefined
        ? env.NODE_ENV === PRODUCTION_ENVIRONMENT
        : env.SESSION_COOKIE_SECURE === 'true',
    TRUSTED_PROXY_HOPS:
      env.TRUSTED_PROXY_HOPS === undefined
        ? DEFAULT_TRUSTED_PROXY_HOPS
        : Number(env.TRUSTED_PROXY_HOPS),
  }));

export type Env = z.infer<typeof envSchema>;

export class EnvValidationError extends Error {
  readonly invalidKeys: readonly string[];

  constructor(invalidKeys: readonly string[]) {
    super(`Invalid environment variables: ${invalidKeys.join(', ')}`);
    this.name = 'EnvValidationError';
    this.invalidKeys = invalidKeys;
  }
}

export function parseEnv(source: Readonly<Record<string, string | undefined>>): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    const invalidKeys = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))];
    throw new EnvValidationError(invalidKeys);
  }

  return result.data;
}
