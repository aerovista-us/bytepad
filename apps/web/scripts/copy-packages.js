const fs = require('fs');
const path = require('path');

const packages = ['bytepad-core', 'bytepad-types', 'bytepad-storage', 'bytepad-plugins', 'bytepad-utils'];
const packagesDir = path.join(__dirname, '../../../packages');
const nodeModulesDir = path.join(__dirname, '../node_modules');

// Ensure node_modules exists
if (!fs.existsSync(nodeModulesDir)) {
  fs.mkdirSync(nodeModulesDir, { recursive: true });
}

packages.forEach(pkgName => {
  const sourceDir = path.join(packagesDir, pkgName);
  const targetDir = path.join(nodeModulesDir, pkgName);
  
  if (fs.existsSync(sourceDir)) {
    // Remove existing symlink or directory
    if (fs.existsSync(targetDir)) {
      try {
        fs.unlinkSync(targetDir);
      } catch (e) {
        // If it's a directory, remove it recursively
        if (fs.statSync(targetDir).isDirectory()) {
          fs.rmSync(targetDir, { recursive: true, force: true });
        }
      }
    }
    
    // Copy the entire package directory
    copyRecursiveSync(sourceDir, targetDir);
    console.log(`✓ Copied ${pkgName} to node_modules`);
  } else {
    console.warn(`⚠ Package ${pkgName} not found at ${sourceDir}`);
  }
});

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

