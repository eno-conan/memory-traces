import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Only ignore build errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      // Cloudflare R2 Public URL（CDN直配信）
      {
        protocol: 'https',
        hostname: 'pub-c3361d3f8f93409999efc10073a7c864.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;