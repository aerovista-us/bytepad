# Electron App Launch Instructions

## Prerequisites

The Electron desktop app requires the Next.js web app to be running in development mode.

## Launch Steps

### Option 1: Two Terminal Windows (Recommended)

**Terminal 1 - Start Next.js Dev Server:**
```powershell
cd C:\NeXuS\bytepad\apps\web
npm run dev
```
Wait for: `✓ Ready in X.Xs` and `Local: http://localhost:3000`

**Terminal 2 - Start Electron App:**
```powershell
cd C:\NeXuS\bytepad\apps\desktop
npm run start
```

The Electron app will automatically connect to `http://localhost:3000`.

### Option 2: Single Terminal (Background Process)

```powershell
# Start Next.js in background
cd C:\NeXuS\bytepad\apps\web
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait a few seconds for Next.js to start, then launch Electron
cd C:\NeXuS\bytepad\apps\desktop
npm run start
```

## Troubleshooting

### "Unable to find electron app" Error

This usually means:
1. **Next.js dev server isn't running** - Start it first (see Terminal 1 above)
2. **Port 3000 is in use** - Check if another app is using port 3000
3. **Build artifacts missing** - Run `npm install` in `apps/desktop` first

### Electron Window Shows "Cannot connect" or Blank

- Verify Next.js is running: Open `http://localhost:3000` in a browser
- Check Electron console (DevTools should open automatically in dev mode)
- Wait a few seconds - Electron retries connection automatically

### Port Conflicts

If port 3000 is busy, change Next.js port:
```powershell
cd C:\NeXuS\bytepad\apps\web
$env:PORT=3001; npm run dev
```

Then update `apps/desktop/src/main/window.ts` line 51 to use `http://localhost:3001`

## Production Build

For production, build Next.js first, then package Electron:

```powershell
# Build Next.js
cd C:\NeXuS\bytepad\apps\web
npm run build

# Package Electron (includes Next.js build)
cd C:\NeXuS\bytepad\apps\desktop
npm run make
```

