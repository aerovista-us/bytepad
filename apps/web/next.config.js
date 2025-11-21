/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['bytepad-core', 'bytepad-types', 'bytepad-storage', 'bytepad-plugins', 'bytepad-utils'],
  // Disable SWC completely - use Babel instead
  swcMinify: false,
  // Force webpack to use Babel
  webpack: (config, { isServer }) => {
    // Ensure Babel is used for all JS/TS files
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
        },
      },
    });
    return config;
  },
}

module.exports = nextConfig

