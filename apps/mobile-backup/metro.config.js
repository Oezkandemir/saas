// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Find the project root and get the monorepo packages
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

// Add better node modules resolution
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

config.watchFolders = [monorepoRoot];

// Add Node.js polyfills for crypto/stream modules (needed for Supabase)
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: require.resolve('react-native-crypto'),
  stream: require.resolve('stream-browserify'),
  vm: require.resolve('vm-browserify'),
  _stream_transform: require.resolve('readable-stream/lib/_stream_transform'),
  _stream_readable: require.resolve('readable-stream/lib/_stream_readable'),
  _stream_writable: require.resolve('readable-stream/lib/_stream_writable'),
  _stream_duplex: require.resolve('readable-stream/lib/_stream_duplex'),
  _stream_passthrough: require.resolve('readable-stream/lib/_stream_passthrough'),
  events: require.resolve('events'),
  buffer: require.resolve('buffer'),
  process: require.resolve('process/browser.js'),
};

// Add support for svg files
config.resolver.assetExts.push('svg');

module.exports = config;
