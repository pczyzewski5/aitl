export function readDatabaseUrl(env: Readonly<Record<string, string | undefined>>): string {
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  return databaseUrl;
}
