// Manual build script for main process
// This is a workaround until Electron Forge Vite plugin builds automatically
const { build } = require('vite');
const path = require('path');
const fs = require('fs');

async function buildMain() {
  try {
    console.log('Building main process...');
    
    const configPath = path.join(__dirname, '..', 'vite.main.config.ts');
    const result = await build({
      configFile: configPath,
    });
    
    console.log('Main process built successfully');
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildMain();

