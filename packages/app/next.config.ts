import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@aitl/core', '@aitl/db', '@aitl/ui'],
};

export default nextConfig;
