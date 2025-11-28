// Script to ensure build files exist before Electron starts
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', '.vite', 'build', 'main');
const buildFile = path.join(buildDir, 'index.js');

// Check if build file exists
if (!fs.existsSync(buildFile)) {
  console.log('Build file not found. Electron Forge Vite plugin should build this automatically.');
  console.log('If you see this message, the Vite plugin may not be building correctly.');
  console.log('Build file expected at:', buildFile);
  process.exit(1);
}

console.log('Build file exists:', buildFile);
process.exit(0);

