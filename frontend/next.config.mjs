/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add environment variables
  env: {
    // API URL with sane default for development
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },

  // Handle PDF previewing
  async rewrites() {
    return [
      {
        source: '/api/placeholder/:width/:height',
        destination: 'https://via.placeholder.com/:width/:height',
      },
    ];
  },
};

export default nextConfig;