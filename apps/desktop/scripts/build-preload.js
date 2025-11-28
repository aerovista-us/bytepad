// Manual build script for preload process
// This ensures preload is built before Electron starts
const { build } = require('vite');
const path = require('path');

async function buildPreload() {
  try {
    console.log('Building preload process...');
    
    const result = await build({
      configFile: path.join(__dirname, '..', 'vite.preload.config.ts'),
      build: {
        outDir: '.vite/build/preload',
        lib: {
          entry: path.join(__dirname, '..', 'src', 'preload', 'index.ts'),
          formats: ['cjs'],
          fileName: () => 'index.js',
        },
        rollupOptions: {
          external: [
            'electron',
            'path',
            'fs',
            'crypto',
            'os',
            'util',
            'events',
          ],
        },
      },
    });
    
    console.log('Preload process built successfully');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildPreload();

