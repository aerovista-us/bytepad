# Quick Launch Guide - Electron App

## Problem: "Unable to find Electron app"

This usually means:
1. **Next.js dev server isn't running** (most common)
2. **Electron process crashed silently**
3. **Build artifacts missing**

## Solution 1: Use the Launcher Script (Easiest)

```powershell
cd C:\NeXuS\bytepad\apps\desktop
.\launch.ps1
```

This script will:
- Check if Next.js is running
- Offer to start it if not
- Launch Electron automatically

## Solution 2: Manual Launch (Two Terminals)

### Terminal 1 - Start Next.js:
```powershell
cd C:\NeXuS\bytepad\apps\web
npm run dev
```
**Wait for:** `✓ Ready in X.Xs` and `Local: http://localhost:3000`

### Terminal 2 - Start Electron:
```powershell
cd C:\NeXuS\bytepad\apps\desktop
npm run start
```

## Solution 3: Verify Electron is Installed

If you get "electron command not found":

```powershell
cd C:\NeXuS\bytepad\apps\desktop
npm install
```

## Troubleshooting

### Check if Electron Process is Running
```powershell
Get-Process -Name "electron" -ErrorAction SilentlyContinue
```

### Check if Next.js is Running
```powershell
netstat -ano | findstr ":3000"
```

### View Electron Console Output
The Electron window should open with DevTools automatically in dev mode. If not:
- Look for console output in the terminal where you ran `npm run start`
- Check for error messages about missing modules or connection failures

### Rebuild if Needed
```powershell
cd C:\NeXuS\bytepad\apps\desktop
rm -rf .vite node_modules
npm install
npm run start
```

## Expected Behavior

When Electron launches successfully:
1. A window should appear (may take 2-5 seconds)
2. DevTools should open automatically (in dev mode)
3. The window should load `http://localhost:3000`
4. You should see the BytePad interface

If the window doesn't appear:
- Check the terminal for error messages
- Verify Next.js is accessible at http://localhost:3000 in a browser
- Check Windows Task Manager for "electron" processes

