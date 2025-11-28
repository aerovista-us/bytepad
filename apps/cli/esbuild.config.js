const esbuild = require('esbuild');
const path = require('path');

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.js',
  external: ['commander'],
  resolveExtensions: ['.ts', '.js'],
  alias: {
    'bytepad-core': path.resolve(__dirname, '../../packages/bytepad-core/src/index.ts'),
    'bytepad-storage': path.resolve(__dirname, '../../packages/bytepad-storage/src/index.ts'),
    'bytepad-types': path.resolve(__dirname, '../../packages/bytepad-types/src/index.ts'),
    'bytepad-utils': path.resolve(__dirname, '../../packages/bytepad-utils/src/index.ts'),
  },
}).catch(() => process.exit(1));

