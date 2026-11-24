import { z } from 'zod';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;
export const DEFAULT_NODE_ENVIRONMENT = 'development';

const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(NODE_ENVIRONMENTS).default(DEFAULT_NODE_ENVIRONMENT),
});

const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export const envSchema = runtimeEnvSchema.extend(databaseEnvSchema.shape);

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
