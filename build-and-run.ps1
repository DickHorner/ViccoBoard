#!/usr/bin/env pwsh
# ViccoBoard Build and Demo Script

Write-Host "🎓 ViccoBoard - Build and Demo" -ForegroundColor Cyan
Write-Host "=" * 60

# Install dependencies at root (handles all workspaces)
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
npm ci

# Build all packages using workspace command
Write-Host "`n🔨 Building packages..." -ForegroundColor Yellow
npm run build

# Run demo
Write-Host "`n🚀 Running demo..." -ForegroundColor Green
Write-Host "=" * 60 "`n"

Set-Location apps/demo
npm start

Write-Host "`n✨ Complete!" -ForegroundColor Green

