<#
.SYNOPSIS
  Clean build artifacts created by `npm run build` in the ViccoBoard monorepo.

.USAGE
  # Dry-run
  .\scripts\clean-build.ps1 -WhatIf

  # Actually delete
  .\scripts\clean-build.ps1

  # Deep clean (also teacher-ui vite cache)
  .\scripts\clean-build.ps1 -Deep
#>

[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
  [Parameter(Mandatory = $false)]
  [string] $RepoRoot,

  [Parameter(Mandatory = $false)]
  [switch] $Deep
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Find-RepoRoot([string] $StartPath) {
  $p = (Resolve-Path -LiteralPath $StartPath).Path
  while ($true) {
    $candidate = Join-Path $p "package.json"
    if (Test-Path -LiteralPath $candidate) { return $p }

    $parent = Split-Path -Parent $p
    if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $p) { break }
    $p = $parent
  }
  return $null
}

function Is-UnderNodeModules([string] $FullPath) {
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

# --- Determine RepoRoot automatically if not provided ---
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
  # Prefer script location (so it works even if called from elsewhere)
  $start = if ($PSScriptRoot) { $PSScriptRoot } else { "." }
  $RepoRoot = Find-RepoRoot $start
} else {
  $RepoRoot = (Resolve-Path -LiteralPath $RepoRoot).Path
}

if (-not $RepoRoot) {
  throw "RepoRoot konnte nicht gefunden werden. Bitte -RepoRoot angeben oder das Skript im Repo ausführen."
}

$packageJson = Join-Path $RepoRoot "package.json"
if (-not (Test-Path -LiteralPath $packageJson)) {
  throw "Kein package.json im RepoRoot gefunden: $RepoRoot"
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

# --- 3) Teacher-UI generated TS build info in node_modules/.tmp ---
$teacherUiTmp = Join-Path $RepoRoot "apps\teacher-ui\node_modules\.tmp"
if (Test-Path -LiteralPath $teacherUiTmp) {
  Get-ChildItem -LiteralPath $teacherUiTmp -Force -File -Filter "*.tsbuildinfo" | ForEach-Object {
    $ok = Remove-Target $_.FullName
    if ($ok) { $deleted.Add($_.FullName) } else { $failed.Add($_.FullName) }
  }

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
