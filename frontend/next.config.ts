import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable server-side asset imports in API routes
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  
  // Extend webpack config to handle SQLite native module
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'sqlite3'];
    }
    
    return config;
  },
  
  // Add environment variables
  env: {
    DATABASE_PATH: process.env.DATABASE_PATH || '/projects/401401401/backend/data/401k_payments_LIVE.db',
  },
};

export default nextConfig;
