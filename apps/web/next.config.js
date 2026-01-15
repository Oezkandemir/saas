const path = require("path");
const createNextIntlPlugin = require("next-intl/plugin");

import("./env.mjs");

// ⚡ CRITICAL: Specify the path to the request.ts file BEFORE config
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,

  // Security headers + Performance headers
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";

    // SECURITY: CSP directives - removed unsafe-eval for security
    // Note: unsafe-inline for scripts is required for Next.js hydration
    const baseCspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://ipapi.co",
      "frame-src 'self' https://vercel.live",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    // Only add upgrade-insecure-requests in production
    if (isProduction) {
      baseCspDirectives.push("upgrade-insecure-requests");
    }

    const commonHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "geolocation=(self), microphone=(), camera=()",
      },
    ];

    return [
      // Note: CSP headers are handled by proxy.ts middleware
      {
        source: "/:path*",
        headers: [
          ...commonHeaders,
          {
            key: "Content-Security-Policy",
            value: baseCspDirectives.join("; "),
          },
        ],
      },
      // Performance: Cache static assets aggressively
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/site.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },

  // ⚡ ULTRA-FAST BUILD OPTIMIZATIONS
  experimental: {
    // Tree-shake unused imports from heavy packages
    optimizePackageImports: [
      "@radix-ui/react-icons",
      "lucide-react",
      "@supabase/supabase-js",
      "date-fns",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-label",
      "@radix-ui/react-radio-group",
      "@radix-ui/react-separator",
      "@radix-ui/react-slider",
      "@radix-ui/react-switch",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-context-menu",
      "@radix-ui/react-menubar",
      "@radix-ui/react-navigation-menu",
      "@tanstack/react-query",
      "@tanstack/react-table",
      "recharts",
      "chart.js",
      "react-chartjs-2",
      "react-day-picker",
      "react-hook-form",
      "zod",
      "cmdk",
      "sonner",
    ],
    // Enable concurrent features
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Faster page compilation
    optimisticClientCache: true,
  },

  // External packages for server-side (not bundled) - reduces bundle size
  serverExternalPackages: [
    "puppeteer",
    "sharp",
    "@node-rs/argon2",
    "@node-rs/bcrypt",
  ],

  // ⚡ WEBPACK OPTIMIZATIONS FOR LIGHTNING SPEED
  webpack: (config, { isServer, dev }) => {
    // Enable persistent caching (only in production, not in Turbopack mode)
    if (!dev && !process.env.TURBOPACK) {
      config.cache = {
        type: "filesystem",
        buildDependencies: {
          config: [__filename],
        },
        // Increase cache efficiency
        compression: "gzip",
        hashAlgorithm: "md4",
      };
    }

    // ⚡ Production optimizations - Enhanced chunk splitting for better performance
    if (!dev && !isServer) {
      // Split chunks for better caching and reduced initial bundle size
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        runtimeChunk: "single",
        splitChunks: {
          chunks: "all",
          maxInitialRequests: 25,
          minSize: 20000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunk (React, Next.js)
            framework: {
              name: "framework",
              chunks: "all",
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Vendor chunk (other node_modules)
            vendor: {
              name: "vendor",
              chunks: "all",
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              minChunks: 1,
            },
            // UI libraries chunk (Radix UI, Lucide)
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
              name: "ui",
              priority: 30,
              chunks: "all",
            },
            // Supabase chunk
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              name: "supabase",
              priority: 25,
              chunks: "all",
            },
            // Common chunk (shared code)
            common: {
              name: "common",
              minChunks: 2,
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    // Suppress warnings to speed up build
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/@supabase\/supabase-js/ },
      { module: /node_modules\/puppeteer/ },
      /Critical dependency: the request of a dependency is an expression/,
      /Can't resolve 'canvas'/,
    ];

    // Client-side optimizations
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Externalize heavy packages for server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("puppeteer", "sharp", "canvas");
    }

    return config;
  },

  // ⚡ MODERN IMAGE OPTIMIZATION
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      {
        protocol: "https",
        hostname: "fonts.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "fonts.gstatic.com",
      },
    ],
    // Disable image optimization in development for faster builds
    unoptimized: process.env.NODE_ENV === "development",
    // ⚡ PERFORMANCE: Enable image optimization for better LCP
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ⚡ COMPRESSION & OPTIMIZATIONS
  compress: true, // Gzip compression enabled by default in Next.js
  // Brotli compression is handled by Vercel/CDN automatically

  // Disable source maps in production for faster builds
  productionBrowserSourceMaps: false,

  // ⚡ TYPESCRIPT OPTIMIZATIONS
  typescript: {
    // Skip type checking during build (use CI for that)
    ignoreBuildErrors: false,
    // Faster type checking
    tsconfigPath: "./tsconfig.json",
  },

  // Exclude unnecessary files from build
  excludeDefaultMomentLocales: true,

  // Bundle analyzer for production builds
  ...(process.env.ANALYZE === "true" && {
    experimental: {
      ...nextConfig.experimental,
      bundlePagesRouterDependencies: true,
    },
  }),
};

// Apply bundle analyzer wrapper conditionally
let config = withNextIntl(nextConfig);

if (process.env.ANALYZE === "true") {
  const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: true,
  });
  config = withBundleAnalyzer(config);
}

module.exports = config;
