# Installation Fix

## Problem
- npm workspaces were trying to create symlinks on Windows (fails without admin/Developer Mode)
- Local packages couldn't be found when installing in `apps/web`

## Solution
Changed all package references to use `file:` protocol instead of workspaces.

## Installation Steps

### Option 1: Install from apps/web (Recommended)

```bash
cd apps/web
npm install
```

This will:
- Install Next.js, React, and all dependencies
- Link local packages using `file:` protocol (no symlinks needed)
- Set up everything needed to run the app

### Option 2: Install from root (if needed)

```bash
npm install
```

This only installs TypeScript for the root workspace.

## What Changed

1. **apps/web/package.json**: Changed `bytepad-*` from `"*"` to `"file:../../packages/bytepad-*"`
2. **packages/*/package.json**: Changed internal `bytepad-types` references to use `file:` protocol
3. **Root package.json**: Removed `apps/*` from workspaces to avoid symlink issues

## Why This Works

- `file:` protocol creates actual copies/links without requiring symlink permissions
- Works on Windows without admin rights or Developer Mode
- Next.js can still transpile the packages via `transpilePackages` in `next.config.js`
- TypeScript path mapping still works for development

## Next Steps

After installation:
```bash
cd apps/web
npm run dev
```

Then open http://localhost:3000

