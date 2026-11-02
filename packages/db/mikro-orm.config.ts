import { fileURLToPath } from 'node:url';
import { createOrmConfig, readDatabaseUrl } from './src';

export default createOrmConfig({
  databaseUrl: readDatabaseUrl(process.env),
  migrationsPath: fileURLToPath(new URL('./migrations', import.meta.url)),
});
