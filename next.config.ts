import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Disable ESLint during production builds (warnings won't block build)
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Enable experimental features if needed
  experimental: {
    // optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Webpack configuration for compatibility
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    return config;
  },
};

export default nextConfig;
