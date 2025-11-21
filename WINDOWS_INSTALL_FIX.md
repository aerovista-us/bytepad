# Windows Installation Fix - Symlink Issues

## Problem
Windows requires admin rights or Developer Mode to create symlinks. npm's `file:` protocol tries to create symlinks by default.

## Solutions (Try in Order)

### Solution 1: Enable Windows Developer Mode (Recommended)

1. Open **Settings** → **Privacy & Security** → **For developers**
2. Enable **Developer Mode**
3. Restart your terminal
4. Run: `cd apps/web && npm install`

This allows symlinks without admin rights.

### Solution 2: Use npm with --no-bin-links flag

```powershell
cd apps/web
npm install --no-bin-links
```

This prevents npm from creating symlinks for binaries.

### Solution 3: Use pnpm (Better Windows Support)

pnpm handles Windows symlinks better:

```powershell
# Install pnpm globally
npm install -g pnpm

# Install dependencies
cd apps/web
pnpm install
```

### Solution 4: Use Yarn (Alternative)

Yarn also handles Windows better:

```powershell
# Install yarn globally
npm install -g yarn

# Install dependencies
cd apps/web
yarn install
```

### Solution 5: Manual Copy (Last Resort)

If all else fails, we can create a script to copy packages instead of linking.

## Recommended: Enable Developer Mode

This is the cleanest solution and will work for all future npm installs.

1. Press `Win + I` to open Settings
2. Go to **Privacy & Security** → **For developers**
3. Toggle **Developer Mode** ON
4. Restart PowerShell
5. Run: `cd apps/web && npm install`

## After Installation

Once installed successfully:
```powershell
npm run dev
```

Then open http://localhost:3000

