export const NODE_RUNTIME = 'nodejs';

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== NODE_RUNTIME) {
    return;
  }

  const { parseEnv } = await import('@aitl/core');

  parseEnv(process.env);
}
