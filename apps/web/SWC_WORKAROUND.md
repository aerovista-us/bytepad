# SWC Permission Issue - Workaround

## The Problem
Next.js SWC binary fails to load on Windows with "Access is denied" error. This is a Windows file permission issue.

## Solutions

### Option 1: Run PowerShell as Administrator (Recommended)
1. Right-click PowerShell
2. Select "Run as Administrator"
3. Navigate to the project:
   ```powershell
   cd Y:\Apps\bytepad3.0\bytepad\apps\web
   npm run dev
   ```

### Option 2: Fix File Permissions
Run this in PowerShell as Administrator:
```powershell
cd Y:\Apps\bytepad3.0\bytepad\apps\web
$file = "node_modules\next\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node"
icacls $file /grant Everyone:F
```

### Option 3: Check Antivirus
Your antivirus might be blocking the `.node` file. Add an exception for:
- `Y:\Apps\bytepad3.0\bytepad\apps\web\node_modules\@next\`

### Option 4: Use Alternative Port
Sometimes the issue resolves if you use a different port:
```powershell
npm run dev -- -p 3001
```

### Option 5: Clear Everything and Reinstall
```powershell
cd Y:\Apps\bytepad3.0\bytepad\apps\web
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
npm install
npm run dev
```

## Note
The app should still work even with the SWC warning - Next.js will fall back to Babel. However, if it's completely failing, try the solutions above.

