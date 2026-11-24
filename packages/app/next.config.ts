import { fileURLToPath } from 'node:url';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';

const REPOSITORY_ROOT = fileURLToPath(new URL('../..', import.meta.url));
const FORCE_ENV_RELOAD = true;

const nextConfig: NextConfig = {
  transpilePackages: ['@aitl/core', '@aitl/db', '@aitl/ui'],
  serverExternalPackages: [
    '@mikro-orm/core',
    '@mikro-orm/postgresql',
    '@mikro-orm/migrations',
    'pino',
    '@node-rs/argon2',
  ],
};

export default function config(phase: string): NextConfig {
  loadEnvConfig(REPOSITORY_ROOT, phase === PHASE_DEVELOPMENT_SERVER, console, FORCE_ENV_RELOAD);

  return nextConfig;
}
