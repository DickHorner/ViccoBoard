#!/usr/bin/env pwsh
# ViccoBoard Build and Demo Script

Write-Host "🎓 ViccoBoard - Build and Demo" -ForegroundColor Cyan
Write-Host "=" * 60

# Function to run npm command in a directory
function Invoke-NpmInDir {
    param($Dir, $Command)
    Push-Location $Dir
    npm $Command
    Pop-Location
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

Write-Host "  - Installing packages/core..."
Invoke-NpmInDir "packages/core" "install"

Write-Host "  - Installing packages/plugins..."
Invoke-NpmInDir "packages/plugins" "install"

Write-Host "  - Installing packages/storage..."
Invoke-NpmInDir "packages/storage" "install"

Write-Host "  - Installing modules/sport..."
Invoke-NpmInDir "modules/sport" "install"

Write-Host "  - Installing apps/demo..."
Invoke-NpmInDir "apps/demo" "install"

# Build packages
Write-Host "`n🔨 Building packages..." -ForegroundColor Yellow

Write-Host "  - Building packages/core..."
Invoke-NpmInDir "packages/core" "run build"

Write-Host "  - Building packages/plugins..."
Invoke-NpmInDir "packages/plugins" "run build"

Write-Host "  - Building packages/storage..."
Invoke-NpmInDir "packages/storage" "run build"

Write-Host "  - Building modules/sport..."
Invoke-NpmInDir "modules/sport" "run build"

Write-Host "  - Building apps/demo..."
Invoke-NpmInDir "apps/demo" "run build"

# Run demo
Write-Host "`n🚀 Running demo..." -ForegroundColor Green
Write-Host "=" * 60 "`n"

Invoke-NpmInDir "apps/demo" "start"

Write-Host "`n✨ Complete!" -ForegroundColor Green
