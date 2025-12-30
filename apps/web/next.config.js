const path = require("path");
const { withContentlayer } = require("next-contentlayer2");
const createNextIntlPlugin = require("next-intl/plugin");

import("./env.mjs");

// Specify the path to the request.ts file
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../..'),
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  
  // Enable modern optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@supabase/supabase-js',
      'date-fns',
    ],
    webpackBuildWorker: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
  },

  // Optimized webpack configuration
  webpack: (config, { isServer, dev }) => {
    // Enable webpack cache for better performance
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Suppress only critical Supabase warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/@supabase\/supabase-js/ },
      /Critical dependency: the request of a dependency is an expression/,
    ];
    
    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },

  // Modern image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Enable compression and other optimizations
  compress: true,
  
  // Bundle analyzer for production builds
  ...(process.env.ANALYZE === 'true' && {
    experimental: {
      ...nextConfig.experimental,
      bundlePagesRouterDependencies: true,
    },
  }),
};

module.exports = withNextIntl(withContentlayer(nextConfig));
