# Running as Administrator - Instructions

## Problem
When you run PowerShell as Administrator, mapped drives (like `Y:`) are not available.

## Solution Options

### Option 1: Use Full UNC Path (Easiest)

1. **Find your actual network path:**
   - Open regular PowerShell (not admin)
   - Run: `Get-PSDrive Y | Select-Object Root`
   - This shows the actual network path (e.g., `\\server\share\...`)

2. **In Admin PowerShell, use that path:**
   ```powershell
   cd "\\server\share\Apps\bytepad3.0\bytepad\apps\web"
   npm run dev
   ```

### Option 2: Map Drive in Admin Session

1. Open PowerShell as Administrator
2. Map the drive:
   ```powershell
   # Replace with your actual network path
   net use Y: \\server\share
   cd Y:\Apps\bytepad3.0\bytepad\apps\web
   npm run dev
   ```

### Option 3: Use the Fix Script

1. Right-click `FIX_SWC_PERMISSIONS.ps1` in File Explorer
2. Select "Run with PowerShell" (as Administrator)
3. The script will fix permissions automatically

### Option 4: Fix Permissions Without Admin (Alternative)

If you can't use admin mode, try this workaround:

1. **Delete the problematic SWC package:**
   ```powershell
   cd Y:\Apps\bytepad3.0\bytepad\apps\web
   Remove-Item -Recurse -Force "node_modules\next\node_modules\@next\swc-win32-x64-msvc"
   ```

2. **Reinstall it:**
   ```powershell
   npm install @next/swc-win32-x64-msvc --force
   ```

3. **Try running again:**
   ```powershell
   npm run dev
   ```

### Option 5: Use Regular PowerShell (May Work)

Sometimes the permission issue resolves itself. Try:
```powershell
cd Y:\Apps\bytepad3.0\bytepad\apps\web
npm run dev
```

If you see the SWC warning but the server still starts, you can ignore it - Next.js will use Babel as fallback.

## Finding Your Network Path

To find the actual path of your Y: drive:
```powershell
# In regular PowerShell
Get-PSDrive Y
# Or
(Get-Item Y:\).Target
```

Then use that path in Admin PowerShell.

