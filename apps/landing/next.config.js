const createNextIntlPlugin = require("next-intl/plugin");

// Specify the path to the request.ts file
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cenety/ui"],
}

module.exports = withNextIntl(nextConfig) 