import { startApp } from './app-server.ts';
import { startPostgres } from './postgres.ts';

const postgres = await startPostgres();
const app = await startApp({ DATABASE_URL: postgres.getConnectionUri() });

process.stdout.write(`AITL is running at ${app.url}\n`);
process.stdout.write('Press Ctrl+C to stop the application and its PostgreSQL container.\n');

const shutdown = async (): Promise<void> => {
  await app.stop();
  await postgres.stop();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
