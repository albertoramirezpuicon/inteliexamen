import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  
  // Build optimizations for faster builds
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    // Disable some features for faster builds
    typedRoutes: false,
    serverComponentsExternalPackages: [],
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
  
  // Optimized webpack configuration for faster builds
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
        // Reduce bundle analysis for faster builds
        minimize: true,
        minimizer: config.optimization.minimizer,
      };
      
      // Disable some webpack features for faster builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
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
  
  // TypeScript optimizations
  typescript: {
    // Ignore TypeScript errors during build for faster builds
    ignoreBuildErrors: false,
  },
  
  // ESLint optimizations
  eslint: {
    // Ignore ESLint errors during build for faster builds
    ignoreDuringBuilds: false,
  },
};

export default withNextIntl(nextConfig);
