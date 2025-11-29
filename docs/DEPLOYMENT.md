# Deployment Guide

This guide covers deploying BytePad to different surfaces: Web/PWA and Electron Desktop.

## Web/PWA Deployment

### Prerequisites

- **Node.js 20.x** (see `.nvmrc`)
- **Yarn 1.22.22+** (see `package.json` packageManager field)
- **Local disk drive** (not network/mapped drive - see [ENVIRONMENT_SAFETY.md](./ENVIRONMENT_SAFETY.md))
- Build environment (local or CI/CD)

### Build Process

```bash
# Install dependencies
yarn install

# Build Next.js app
cd apps/web
yarn build
```

### Deployment Options

#### GitHub Pages (Free & Simple)

GitHub Pages is a great alternative to Vercel - it's free, simple, and works well for static Next.js apps.

**Prerequisites:**
- GitHub repository
- GitHub Actions enabled

**Setup:**

1. **Enable GitHub Pages:**
   - Go to your repository → Settings → Pages
   - Source: "GitHub Actions"

2. **Deploy automatically:**
   - The included `.github/workflows/deploy-gh-pages.yml` will automatically build and deploy on push to `main` or `develop`
   - Or manually trigger: Actions → "Deploy to GitHub Pages" → Run workflow

3. **Build locally (optional):**
   ```bash
   cd apps/web
   yarn build:static
   # Output will be in apps/web/out/
   ```

4. **Access your site:**
   - URL: `https://aerovista-us.github.io/bytepad/`
   - Or custom domain (configure in repository Settings → Pages)
   
   **Note:** The basePath is set to `/bytepad` to match the repository name. If you change the repository name, update `BASE_PATH` in the workflow file.

**Configuration:**
- Static export is automatically enabled via `next.config.js`
- Base path is configurable via `BASE_PATH` environment variable
- Build output goes to `apps/web/out/` directory

**Advantages:**
- ✅ Free
- ✅ Simple setup
- ✅ Automatic deployments via GitHub Actions
- ✅ Custom domain support
- ✅ No external service dependencies

**Limitations:**
- ⚠️ Static export only (no API routes, no server-side rendering)
- ⚠️ Build time can be longer than Vercel
- ⚠️ No preview deployments (only production)

#### Vercel (Recommended for Full Next.js Features)

BytePad includes a `vercel.json` configuration file for automatic setup.

1. **Connect repository** to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and use `vercel.json` settings

2. **Verify build settings** (should auto-configure):
   - Framework Preset: **Next.js**
   - Root Directory: **`apps/web`** (important for monorepo)
   - Build Command: **`cd apps/web && yarn build`** or `yarn build` (if root is apps/web)
   - Output Directory: **`.next`** (Next.js default)
   - Install Command: **`yarn install`** (runs from repo root)

3. **Important for Monorepo:**
   - **Root Directory must be `apps/web`** - This tells Vercel where the Next.js app is located
   - If Root Directory is set to `apps/web`, Build Command can be just `yarn build`
   - If Root Directory is repo root, Build Command must be `cd apps/web && yarn build`

4. **Environment variables** (optional):
   - `NEXT_PUBLIC_DEBUG`: Set to `true` to enable debug routes in production (not recommended)
   - Leave unset for production (debug routes are dev-only by default)

5. **Deploy:**
   - Push to your connected branch (usually `main` or `develop`)
   - Vercel will automatically deploy on push
   - Or manually trigger deployment from Vercel dashboard

**Note:** The `vercel.json` file in the repo root automatically configures these settings. If you see a warning about differences between production and project settings, you can either:
- Use the Production Overrides to match your current settings
- Or update your project settings to match production (recommended)

### How Git → Vercel Deployment Works

Once your repository is connected to Vercel, deployments happen automatically:

1. **Automatic Deployments:**
   ```bash
   # Make changes to your code
   git add .
   git commit -m "Your changes"
   git push origin develop  # or main/master
   ```
   - Vercel detects the push via webhook
   - Automatically triggers a new build
   - Deploys to preview URL (for non-production branches) or production (for main branch)

2. **Branch-Based Deployments:**
   - **Production Branch** (usually `main` or `master`):
     - Deploys to your production domain
     - URL: `your-project.vercel.app`
   - **Other Branches** (e.g., `develop`, feature branches):
     - Deploys to preview URLs
     - URL: `your-branch-your-project.vercel.app`
     - Each branch gets its own preview deployment

3. **Manual Deployment:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click "Redeploy" on any previous deployment
   - Or use Vercel CLI: `vercel --prod`

4. **Verify Connection:**
   - Go to Vercel Dashboard → Your Project → Settings → Git
   - Should show: "Connected to GitHub" with your repository
   - Check that the correct branch is set as Production Branch

5. **Troubleshooting Git → Vercel:**
   - **No automatic deployments?**
     - Check Vercel Dashboard → Settings → Git → ensure repository is connected
     - Verify webhook is active in GitHub repository settings
   - **Build fails?**
     - Check build logs in Vercel Dashboard
     - Verify Root Directory is set to `apps/web`
     - Ensure `yarn install` completes successfully
   - **Wrong branch deploying?**
     - Check Production Branch setting in Vercel Dashboard → Settings → Git
   - **404 NOT_FOUND error?**
     - **Project not connected:** Go to Vercel Dashboard → Add New Project → Import your GitHub repository
     - **Build configuration:** Verify Root Directory is `apps/web` in Vercel Dashboard → Settings → General
     - **First deployment:** If this is your first deployment, ensure the project is properly imported and connected
     - **Check deployment status:** Go to Vercel Dashboard → Deployments → check if any deployments exist
     - **Manual trigger:** Try manually triggering a deployment from Vercel Dashboard → Deployments → "Deploy" button
     - **Verify vercel.json:** Ensure `vercel.json` is in the repository root (not in `apps/web`)
     - **Check build logs:** Even if deployment shows 404, check the build logs for actual errors
   - **"No Next.js version detected" error?**
     - **Root Directory mismatch:** This is the most common cause. Go to Vercel Dashboard → Your Project → Settings → General → Root Directory
     - **Must be set to:** `apps/web` (exactly, no trailing slash)
     - **Verify package.json location:** Ensure `apps/web/package.json` contains `"next"` in dependencies (it does)
     - **Project settings override:** Vercel Dashboard settings override `vercel.json` - update both
     - **After fixing:** Go to Deployments → Redeploy the latest deployment
     - **If still failing:** Delete the project in Vercel and re-import, ensuring Root Directory is set during import
   - **"The specified Root Directory 'apps/web' does not exist" error?**
     - **Branch mismatch:** Vercel is deploying from a branch that doesn't have `apps/web` directory or `package.json`
     - **Check which branch:** Go to Vercel Dashboard → Deployments → check which branch is being deployed (usually `main`)
     - **Solution 1 - Merge to main:** Merge your `develop` branch into `main`:
       ```bash
       git checkout main
       git merge develop
       git push origin main
       ```
     - **Solution 2 - Change Vercel branch:** Go to Vercel Dashboard → Settings → Git → change Production Branch to `develop`
     - **Solution 3 - Push to main:** Push your current changes to `main`:
       ```bash
       git checkout main
       git merge develop
       git push origin main
       ```
     - **Verify:** After merging/pushing, check that `apps/web/package.json` exists in the branch Vercel is using
   - **Build completes in <1 second with "no files prepared"?**
     - **Root Directory not set:** Vercel can't find your Next.js app because Root Directory is wrong
     - **Fix:** Go to Vercel Dashboard → Settings → General → Root Directory → set to `apps/web` (exactly, no trailing slash)
     - **Wrong repository:** Check that Vercel is connected to the correct GitHub repository
     - **Build command not running:** If Root Directory is wrong, the build command won't execute
     - **After fixing Root Directory:** Go to Deployments → Redeploy the latest deployment
     - **Verify:** Build should take 30+ seconds (not 22ms) and show Next.js build output

#### Netlify

1. **Connect repository** to Netlify
2. **Configure build settings:**
   - Base directory: `apps/web`
   - Build command: `yarn build`
   - Publish directory: `apps/web/.next`

3. **Deploy**

#### Self-Hosted

1. **Build the app:**
   ```bash
   cd apps/web
   yarn build
   ```

2. **Start production server:**
   ```bash
   yarn start
   ```

3. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name bytepad.example.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### PWA Configuration

The PWA is automatically configured via `apps/web/public/manifest.json`.

**Features:**
- Install prompt
- Offline support (service worker)
- App icons

**Testing:**
- Use Chrome DevTools > Application > Manifest
- Test install prompt
- Verify offline functionality

## Electron Desktop Deployment

### Prerequisites

- Node.js 20.x
- Yarn 1.22.22+
- Electron Builder dependencies (platform-specific)

### Build Process

1. **Build Next.js app:**
   ```bash
   cd apps/web
   yarn build
   ```

2. **Package Electron app:**
   ```bash
   cd apps/desktop
   yarn package
   ```

3. **Create installer:**
   ```bash
   yarn make
   ```

### Platform-Specific Builds

#### Windows

```bash
# Build Windows installer
cd apps/desktop
yarn make --win
```

**Output:** `apps/desktop/out/make/squirrel.windows/x64/BytePad Studio Setup.exe`

#### macOS

```bash
# Build macOS app
cd apps/desktop
yarn make --mac
```

**Output:** `apps/desktop/out/make/BytePad Studio.dmg`

#### Linux

```bash
# Build Linux app
cd apps/desktop
yarn make --linux
```

**Output:** `apps/desktop/out/make/bytepad-studio_*.deb` (or `.AppImage`, `.rpm`)

### Code Signing

#### Windows

1. **Obtain code signing certificate**
2. **Configure in `apps/desktop/package.json`:**
   ```json
   {
     "build": {
       "win": {
         "certificateFile": "path/to/certificate.pfx",
         "certificatePassword": "password"
       }
     }
   }
   ```

#### macOS

1. **Obtain Apple Developer certificate**
2. **Configure in `apps/desktop/package.json`:**
   ```json
   {
     "build": {
       "mac": {
         "identity": "Developer ID Application: Your Name"
       }
     }
   }
   ```

### Auto-Updater

Electron apps can use auto-updater services:

- **Electron Updater**: Built-in auto-update support
- **Squirrel.Windows**: Windows auto-updater
- **Sparkle**: macOS auto-updater

Configure in `apps/desktop/src/main/` with update server URL.

## Environment Variables

### Web App

- `NEXT_PUBLIC_DEBUG`: Enable debug routes (development only)
- `NODE_ENV`: `production` for production builds

### Electron

- `NODE_ENV`: `production` for production builds
- Update server URL (if using auto-updater)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: yarn install
      - run: cd apps/web && yarn build
      - run: cd apps/web && yarn start &
      - run: yarn test

  build-electron:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: yarn install
      - run: cd apps/web && yarn build
      - run: cd apps/desktop && yarn package
      - run: cd apps/desktop && yarn make
      - uses: actions/upload-artifact@v3
        with:
          name: electron-${{ matrix.os }}
          path: apps/desktop/out/make/**
```

## Pre-Deployment Checklist

### Web/PWA

- [ ] Run `yarn cli:doctor` to verify environment
- [ ] Build succeeds without errors
- [ ] PWA manifest is valid
- [ ] Service worker registers correctly
- [ ] Offline functionality works
- [ ] All routes are accessible
- [ ] Environment variables are set

### Electron

- [ ] Run `yarn cli:doctor` to verify environment
- [ ] Next.js build succeeds
- [ ] Electron app packages successfully
- [ ] Installer creates without errors
- [ ] App launches on target platform
- [ ] IPC bridge works correctly
- [ ] Storage driver functions properly
- [ ] Code signing configured (if applicable)

## Troubleshooting

### Build Failures

1. **Check environment:**
   ```bash
   yarn cli:doctor
   ```

2. **Clean install:**
   ```bash
   rm -rf node_modules apps/*/node_modules packages/*/node_modules
   yarn install
   ```

3. **Verify Node.js version:**
   ```bash
   node --version  # Should be 20.x
   ```

### Electron Packaging Issues

1. **Check Electron dependencies:**
   ```bash
   cd apps/desktop
   yarn doctor electron
   ```

2. **Verify Next.js build:**
   ```bash
   cd apps/web
   yarn build
   ```

3. **Check platform-specific requirements:**
   - Windows: Visual Studio Build Tools
   - macOS: Xcode Command Line Tools
   - Linux: Build essentials

## Related Documentation

- [CLEAN_INSTALL.md](./CLEAN_INSTALL.md) - Clean installation
- [ENVIRONMENT_SAFETY.md](./ENVIRONMENT_SAFETY.md) - Environment requirements
- [ELECTRON_LAUNCH_INSTRUCTIONS.md](../ELECTRON_LAUNCH_INSTRUCTIONS.md) - Electron setup

