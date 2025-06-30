import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  
  // Build optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  // Turbopack configuration (replaces deprecated experimental.turbo)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Simplified webpack optimizations to reduce build time
  webpack: (config, { dev, isServer }) => {
    // Only apply optimizations in production builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image optimizations - simplified
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60,
    unoptimized: true, // Disable image optimization for faster builds
  },
  
  // Reduce build output
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Disable SWC minification for faster builds (use Terser instead)
  swcMinify: false,
};

export default withNextIntl(nextConfig);
