const { withContentlayer } = require("next-contentlayer2");
const createNextIntlPlugin = require("next-intl/plugin");

import("./env.mjs");

// Specify the path to the request.ts file
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Make sure static files are properly served regardless of locale
  assetPrefix: '/_static',
  images: {
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
        hostname: "eboaupdriwdsixnmslxz.supabase.co",
      },
      // Allow all Supabase storage URLs - useful for different environments
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
  // No longer needed as we're not using Prisma anymore
  // serverExternalPackages: ["@prisma/client"],
};

module.exports = withNextIntl(withContentlayer(nextConfig));
