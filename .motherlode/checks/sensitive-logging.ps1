[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$ConfigPath,
  [string]$ActivationProfilePath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ActivationProfilePath)) { return }
$activation = Get-Content -Path $ActivationProfilePath -Raw | ConvertFrom-Json -Depth 20
if (-not $activation.enabled_rules.sensitive_logging) { return }

$forbiddenPatterns = @($activation.repo_specific_overrides.forbidden_log_patterns)
$allowedPatterns = @($activation.repo_specific_overrides.allowed_log_exceptions)

$sourceRoots = @(
  (Join-Path $RepoRoot 'apps'),
  (Join-Path $RepoRoot 'packages'),
  (Join-Path $RepoRoot 'modules')
)

$sourceFiles = @(
  Get-ChildItem -Path $sourceRoots -Recurse -Include '*.ts', '*.vue', '*.js' -File -ErrorAction SilentlyContinue |
    Where-Object {
      $_.FullName -notmatch [regex]::Escape([IO.Path]::DirectorySeparatorChar + 'tests' + [IO.Path]::DirectorySeparatorChar) -and
      $_.FullName -notmatch [regex]::Escape([IO.Path]::DirectorySeparatorChar + 'examples' + [IO.Path]::DirectorySeparatorChar) -and
      $_.FullName -notmatch [regex]::Escape([IO.Path]::DirectorySeparatorChar + 'dist' + [IO.Path]::DirectorySeparatorChar) -and
      $_.FullName -notmatch [regex]::Escape([IO.Path]::DirectorySeparatorChar + 'apps' + [IO.Path]::DirectorySeparatorChar + 'demo' + [IO.Path]::DirectorySeparatorChar)
    }
)

$logMatches = @(
  $sourceFiles |
    Select-String -Pattern 'console\.(log|warn|error)|logger\.(debug|info|warn|error)' -AllMatches
)

$violations = New-Object System.Collections.Generic.List[string]
foreach ($match in $logMatches) {
  $line = $match.Line
  $isAllowed = $false
  foreach ($allowedPattern in $allowedPatterns) {
    if ($line -match $allowedPattern) {
      $isAllowed = $true
      break
    }
  }
  if ($isAllowed) { continue }

  foreach ($forbiddenPattern in $forbiddenPatterns) {
    if ($line -match $forbiddenPattern) {
      $relativePath = $match.Path.Replace($RepoRoot + [IO.Path]::DirectorySeparatorChar, '')
      $violations.Add("${relativePath}:$($match.LineNumber)") | Out-Null
      break
    }
  }
}

$passed = ($violations.Count -eq 0)
$evidence = if ($passed) {
  "0 forbidden log statements across $($sourceFiles.Count) source files"
}
else {
  "forbidden log statements: $($violations -join ', ')"
}

[pscustomobject]@{
  id = 'custom.sensitive_logging'
  category = 'security'
  weight = 2
  passed = $passed
  evidence = $evidence
  remediation = 'Avoid logging credentials, tokens, auth data, decrypted payloads, emails, attendance, or grades in app source files.'
}
