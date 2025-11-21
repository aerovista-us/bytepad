# Fix SWC Binary Permissions Script
# Run this script as Administrator

Write-Host "Fixing SWC binary permissions..." -ForegroundColor Yellow

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$webDir = $scriptDir
$swcPath = Join-Path $webDir "node_modules\next\node_modules\@next\swc-win32-x64-msvc\next-swc.win32-x64-msvc.node"

if (Test-Path $swcPath) {
    Write-Host "Found SWC binary at: $swcPath" -ForegroundColor Green
    
    # Grant full control to Everyone
    try {
        icacls $swcPath /grant Everyone:F
        Write-Host "✓ Permissions fixed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run: npm run dev" -ForegroundColor Cyan
    } catch {
        Write-Host "✗ Error fixing permissions: $_" -ForegroundColor Red
        Write-Host "Make sure you're running as Administrator" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ SWC binary not found at: $swcPath" -ForegroundColor Red
    Write-Host "Make sure you've run 'npm install' first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

