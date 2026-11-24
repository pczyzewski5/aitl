export const NODE_RUNTIME = 'nodejs';
export const PASSWORD_HASHER_REGISTRATION = 'passwordHasher';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== NODE_RUNTIME) {
    return;
  }

  const { parseEnv } = await import('@aitl/core');

  parseEnv(process.env);

  const { container } = await import('./container/container');

  container.resolve(PASSWORD_HASHER_REGISTRATION);
}
