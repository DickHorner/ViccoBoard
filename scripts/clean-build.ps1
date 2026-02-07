<#
.SYNOPSIS
  Clean build artifacts created by `npm run build` in the ViccoBoard monorepo.

.DESCRIPTION
  Removes:
   - dist/ folders in workspaces: packages/*, modules/*, apps/*
   - TypeScript incremental build info (*.tsbuildinfo) outside node_modules
   - teacher-ui TS build info in apps/teacher-ui/node_modules/.tmp (and optionally Vite cache)

  Safe by default: does NOT delete node_modules (except generated caches inside teacher-ui when -Deep is used).

.USAGE
  # Dry-run (recommended first)
  .\scripts\clean-build.ps1 -WhatIf

  # Actually delete
  .\scripts\clean-build.ps1

  # Include teacher-ui caches (node_modules/.vite) too
  .\scripts\clean-build.ps1 -Deep

  # Ask confirmation for every delete
  .\scripts\clean-build.ps1 -Confirm
#>

[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [Parameter(Mandatory = $false)]
  [string] $RepoRoot = (Resolve-Path ".").Path,

  [Parameter(Mandatory = $false)]
  [switch] $Deep
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-AbsPath([string] $Path) {
  return (Resolve-Path -LiteralPath $Path).Path
}

function Is-UnderNodeModules([string] $FullPath) {
  # Normalize slashes for simple contains checks
  $p = $FullPath -replace '/', '\'
  return $p -match '\\node_modules\\'
}

function Remove-Target([string] $TargetPath) {
  if (-not (Test-Path -LiteralPath $TargetPath)) { return $false }

  $item = Get-Item -LiteralPath $TargetPath -Force
  $kind = if ($item.PSIsContainer) { "Directory" } else { "File" }

  if ($PSCmdlet.ShouldProcess($TargetPath, "Remove $kind")) {
    try {
      Remove-Item -LiteralPath $TargetPath -Recurse -Force -ErrorAction Stop
      return $true
    } catch {
      Write-Warning "Konnte nicht löschen: $TargetPath`n$($_.Exception.Message)"
      return $false
    }
  }
  return $false
}

# --- Validate repo root ---
$RepoRoot = Resolve-AbsPath $RepoRoot

$packageJson = Join-Path $RepoRoot "package.json"
if (-not (Test-Path -LiteralPath $packageJson)) {
  throw "Kein package.json im RepoRoot gefunden: $RepoRoot (Bitte im ViccoBoard-Root ausführen.)"
}

Write-Host "RepoRoot: $RepoRoot"
Write-Host "Deep clean: $Deep"
Write-Host ""

$deleted = New-Object System.Collections.Generic.List[string]
$failed  = New-Object System.Collections.Generic.List[string]

# --- 1) Remove workspace dist folders (packages/*, modules/*, apps/*) ---
$workspaceBases = @("packages", "modules", "apps")

foreach ($base in $workspaceBases) {
  $basePath = Join-Path $RepoRoot $base
  if (-not (Test-Path -LiteralPath $basePath)) { continue }

  Get-ChildItem -LiteralPath $basePath -Directory -Force | ForEach-Object {
    $dist = Join-Path $_.FullName "dist"
    if (Test-Path -LiteralPath $dist) {
      $ok = Remove-Target $dist
      if ($ok) { $deleted.Add($dist) } else { $failed.Add($dist) }
    }
  }
}

# --- 2) Remove TS incremental build info outside node_modules (*.tsbuildinfo) ---
Get-ChildItem -LiteralPath $RepoRoot -Recurse -Force -File -Filter "*.tsbuildinfo" | ForEach-Object {
  if (Is-UnderNodeModules $_.FullName) { return }
  $ok = Remove-Target $_.FullName
  if ($ok) { $deleted.Add($_.FullName) } else { $failed.Add($_.FullName) }
}

# --- 3) Teacher-UI generated TS build info in node_modules/.tmp (configured tsBuildInfoFile) ---
$teacherUiTmp = Join-Path $RepoRoot "apps\teacher-ui\node_modules\.tmp"
if (Test-Path -LiteralPath $teacherUiTmp) {
  Get-ChildItem -LiteralPath $teacherUiTmp -Force -File -Filter "*.tsbuildinfo" | ForEach-Object {
    $ok = Remove-Target $_.FullName
    if ($ok) { $deleted.Add($_.FullName) } else { $failed.Add($_.FullName) }
  }

  # Remove the folder if it became empty (nice-to-have)
  $remaining = Get-ChildItem -LiteralPath $teacherUiTmp -Force -ErrorAction SilentlyContinue
  if (-not $remaining) {
    $ok = Remove-Target $teacherUiTmp
    if ($ok) { $deleted.Add($teacherUiTmp) } else { $failed.Add($teacherUiTmp) }
  }
}

# --- 4) Optional deep clean: Vite cache (teacher-ui/node_modules/.vite) ---
if ($Deep) {
  $teacherUiViteCache = Join-Path $RepoRoot "apps\teacher-ui\node_modules\.vite"
  if (Test-Path -LiteralPath $teacherUiViteCache) {
    $ok = Remove-Target $teacherUiViteCache
    if ($ok) { $deleted.Add($teacherUiViteCache) } else { $failed.Add($teacherUiViteCache) }
  }
}

# --- Summary ---
Write-Host ""
Write-Host "════════════════════════════════════════════════════"
Write-Host "Clean Summary"
Write-Host "Deleted: $($deleted.Count)"
Write-Host "Failed : $($failed.Count)"
Write-Host "════════════════════════════════════════════════════"

if ($deleted.Count -gt 0) {
  Write-Host ""
  Write-Host "Deleted targets:"
  $deleted | Sort-Object | ForEach-Object { Write-Host "  - $_" }
}

if ($failed.Count -gt 0) {
  Write-Host ""
  Write-Host "Failed targets (bitte prüfen):"
  $failed | Sort-Object | ForEach-Object { Write-Host "  - $_" }
  exit 1
}

exit 0
