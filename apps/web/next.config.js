/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  transpilePackages: ['bytepad-core', 'bytepad-types', 'bytepad-storage', 'bytepad-plugins', 'bytepad-utils'],
  // Disable SWC completely - use Babel instead
  swcMinify: false,
  // Enable static export for GitHub Pages
  ...(process.env.GITHUB_PAGES === 'true' ? {
    output: 'export',
    // GitHub Pages requires basePath and assetPrefix for subdirectory deployment
    basePath: process.env.BASE_PATH || '',
    assetPrefix: process.env.BASE_PATH || '',
    // GitHub Pages works better with trailing slashes
    trailingSlash: true,
    // Disable image optimization for static export
    images: {
      unoptimized: true,
    },
  } : {}),
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
    
    // Resolve dependencies from packages and web app node_modules
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      'node_modules',
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname, '../../packages'),
    ];
    
    // Exclude Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        canvas: false,
        'utf-8-validate': false,
        'bufferutil': false,
        'supports-color': false,
      };
      
      // Exclude jsdom and its dependencies from client bundle
      const webpackLib = require('webpack');
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpackLib.IgnorePlugin({
          resourceRegExp: /^(canvas|utf-8-validate|bufferutil|ws|supports-color)$/,
        })
      );
      
      // Replace fs.ts with empty module in client bundle (it's Node.js only)
      config.plugins.push(
        new webpackLib.NormalModuleReplacementPlugin(
          /bytepad-storage\/src\/fs$/,
          path.resolve(__dirname, '../../packages/bytepad-storage/src/fs.browser.ts')
        )
      );
      
      // Replace isomorphic-dompurify with dompurify in client bundle (avoid jsdom)
      // This prevents jsdom from being bundled in the browser
      config.plugins.push(
        new webpackLib.NormalModuleReplacementPlugin(
          /^isomorphic-dompurify$/,
          'dompurify'
        )
      );
    }
    
    return config;
  },
}

module.exports = nextConfig

