import type { NextConfig } from 'next';

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

export default nextConfig;
