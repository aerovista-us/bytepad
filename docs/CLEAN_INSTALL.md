# BytePad Clean Install Guide

This document describes the standard clean installation process for BytePad on both Windows and Linux.

## Prerequisites

- **Node.js 20.x** (check with `node --version`)
- **Yarn 1.22.22+** (check with `yarn --version`)
- **Local disk drive** (not network/mapped drive)

## Important: Repository Location

⚠️ **BytePad must be installed on a local disk drive.**

Do NOT install on:
- Network shares (UNC paths like `\\server\share`)
- Mapped network drives (Z:, Y:, X:)
- Tailscale mounts
- WSL mount points (`/mnt/c`, `/mnt/d`)
- External USB drives

These can cause file system issues, build failures, and environment drift.

## Clean Install Steps

### Windows

1. **Verify environment:**
   ```powershell
   node --version  # Should be v20.x.x
   yarn --version  # Should be 1.22.22+
   ```

2. **Clone repository to local drive:**
   ```powershell
   # Good: Local drive
   cd C:\Projects\bytepad
   git clone <repository-url> .
   
   # Bad: Network drive
   # cd Z:\Projects\bytepad  # DON'T DO THIS
   ```

3. **Clean install:**
   ```powershell
   # Remove existing dependencies
   Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force apps\*\node_modules -ErrorAction SilentlyContinue
   Remove-Item -Recurse -Force packages\*\node_modules -ErrorAction SilentlyContinue
   Remove-Item yarn.lock -ErrorAction SilentlyContinue
   
   # Install dependencies
   yarn install
   ```

4. **Verify installation:**
   ```powershell
   yarn cli:doctor
   ```

### Linux

1. **Verify environment:**
   ```bash
   node --version  # Should be v20.x.x
   yarn --version  # Should be 1.22.22+
   ```

2. **Clone repository to local filesystem:**
   ```bash
   # Good: Local filesystem
   cd ~/projects/bytepad
   git clone <repository-url> .
   
   # Bad: WSL mount
   # cd /mnt/c/Projects/bytepad  # DON'T DO THIS
   ```

3. **Clean install:**
   ```bash
   # Remove existing dependencies
   rm -rf node_modules
   rm -rf apps/*/node_modules
   rm -rf packages/*/node_modules
   rm -f yarn.lock
   
   # Install dependencies
   yarn install
   ```

4. **Verify installation:**
   ```bash
   yarn cli:doctor
   ```

## Using nvm (Node Version Manager)

If you use `nvm` to manage Node.js versions:

```bash
# Install and use Node 20
nvm install 20
nvm use 20

# Verify
node --version  # Should be v20.x.x
```

The `.nvmrc` file in the repository root will automatically use Node 20 when you run `nvm use` in the project directory.

## Troubleshooting

### "Repository is on a network share" Error

Move the repository to a local drive:
- Windows: `C:\Projects\bytepad` or `D:\Projects\bytepad`
- Linux: `~/projects/bytepad` or `/home/user/projects/bytepad`

### "Node.js version mismatch" Error

Install the correct Node.js version:
- Use `nvm` if available: `nvm install 20 && nvm use 20`
- Or download Node.js 20.x from [nodejs.org](https://nodejs.org/)

### "Yarn is not installed" Error

Install Yarn:
```bash
npm install -g yarn
```

Or use Corepack (Node 16.10+):
```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

### Build Failures After Clean Install

1. Run `yarn cli:doctor` to check for issues
2. Verify repository is on local drive
3. Clear caches:
   ```bash
   yarn cache clean
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   yarn install
   ```

## Verification

After installation, run the doctor command to verify everything is set up correctly:

```bash
yarn cli:doctor
```

All checks should pass (✓). Warnings (⚠) are acceptable but should be reviewed. Failures (✗) must be fixed before proceeding.

## Next Steps

After a successful clean install:

1. **Build the CLI:**
   ```bash
   yarn cli:build
   ```

2. **Start development:**
   ```bash
   # Terminal 1: Web app
   yarn dev
   
   # Terminal 2: Electron app (after web is running)
   yarn desktop:dev
   ```

3. **Run tests:**
   ```bash
   # E2E tests
   cd apps/web
   yarn test
   ```

