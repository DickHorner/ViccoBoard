[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$ConfigPath,
  [string]$ActivationProfilePath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ActivationProfilePath)) { return }
$activation = Get-Content -Path $ActivationProfilePath -Raw | ConvertFrom-Json -Depth 20
if (-not $activation.enabled_rules.trust_boundary_validation) { return }

$requiredFiles = @(
  'packages/core/src/validators/student.validator.ts',
  'packages/core/src/validators/grade-category.validator.ts',
  'packages/core/src/validators/performance-entry.validator.ts',
  'packages/core/src/utils/safe-json.ts',
  'packages/storage/src/utils/safe-json.ts'
)

$missingFiles = @(
  $requiredFiles |
    Where-Object { -not (Test-Path (Join-Path $RepoRoot $_)) }
)

$supportTipFile = Join-Path $RepoRoot 'modules/exams/src/services/support-tip-management.service.ts'
$supportTipContent = if (Test-Path $supportTipFile) { Get-Content -Path $supportTipFile -Raw } else { '' }

$hasLinkSchemeValidation =
  $supportTipContent -match [regex]::Escape("startsWith('http://')") -and
  $supportTipContent -match [regex]::Escape("startsWith('https://')")

$hasLinkLimitValidation = $supportTipContent -match [regex]::Escape('Maximum 3 links per support tip')
$usesLocalQrRendering = $supportTipContent -match [regex]::Escape('QRCode.create') -and $supportTipContent -match [regex]::Escape('data:image/svg+xml')
$usesExternalQrService = $supportTipContent -match [regex]::Escape('api.qrserver.com')

$passed = ($missingFiles.Count -eq 0 -and $hasLinkSchemeValidation -and $hasLinkLimitValidation -and $usesLocalQrRendering -and -not $usesExternalQrService)

$evidenceParts = New-Object System.Collections.Generic.List[string]
if ($missingFiles.Count -eq 0) {
  $evidenceParts.Add('validator and safe-json files present') | Out-Null
}
else {
  $evidenceParts.Add("missing files: $($missingFiles -join ', ')") | Out-Null
}

if ($hasLinkSchemeValidation) {
  $evidenceParts.Add('support-tip URL scheme validation present') | Out-Null
}
else {
  $evidenceParts.Add('support-tip URL scheme validation missing') | Out-Null
}

if ($hasLinkLimitValidation) {
  $evidenceParts.Add('support-tip link-count validation present') | Out-Null
}
else {
  $evidenceParts.Add('support-tip link-count validation missing') | Out-Null
}

if ($usesLocalQrRendering) {
  $evidenceParts.Add('QR generation is local/offline-friendly') | Out-Null
}
else {
  $evidenceParts.Add('QR generation is not local/offline-friendly') | Out-Null
}

if (-not $usesExternalQrService) {
  $evidenceParts.Add('no external QR service dependency detected') | Out-Null
}
else {
  $evidenceParts.Add('external QR service dependency detected') | Out-Null
}

$evidence = $evidenceParts -join '; '

[pscustomobject]@{
  id = 'custom.trust_boundary_validation'
  category = 'security'
  weight = 3
  passed = $passed
  evidence = $evidence
  remediation = 'Keep validation at import/link/storage boundaries and ensure QR/export helpers remain local-first with no required network hop.'
}
