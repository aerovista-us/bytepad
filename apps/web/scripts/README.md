# Copy Packages Script

This script copies local BytePad packages to `node_modules` instead of creating symlinks.

This avoids Windows symlink permission issues.

The script runs automatically after `npm install` via the `postinstall` hook.

