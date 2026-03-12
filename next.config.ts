import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strip console.log/warn from production bundles (keeps console.error)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error'] }
      : false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ydlzqpxjxzmmhksiovsr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
