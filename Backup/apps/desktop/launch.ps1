# BytePad Electron App Launcher
# This script ensures Next.js is running before launching Electron

Write-Host "BytePad Electron Launcher" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Check if Next.js is running on port 3000
Write-Host "Checking if Next.js dev server is running..." -ForegroundColor Yellow
$nextjsRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $nextjsRunning = $true
        Write-Host "✓ Next.js is running on http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Next.js is NOT running on http://localhost:3000" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Next.js first:" -ForegroundColor Yellow
    Write-Host "  cd ..\web" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    $startNext = Read-Host "Would you like to start Next.js now? (y/n)"
    if ($startNext -eq "y" -or $startNext -eq "Y") {
        Write-Host "Starting Next.js..." -ForegroundColor Yellow
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\web'; npm run dev"
        Write-Host "Waiting 10 seconds for Next.js to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        $nextjsRunning = $true
    } else {
        Write-Host "Exiting. Please start Next.js manually and try again." -ForegroundColor Red
        exit 1
    }
}

if ($nextjsRunning) {
    Write-Host ""
    Write-Host "Launching Electron app..." -ForegroundColor Yellow
    Write-Host ""
    npm run start
}

