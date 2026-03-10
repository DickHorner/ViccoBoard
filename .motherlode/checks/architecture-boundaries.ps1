[CmdletBinding()]
param(
  [string]$RepoRoot,
  [string]$ConfigPath,
  [string]$ActivationProfilePath
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ActivationProfilePath)) { return }
$activation = Get-Content -Path $ActivationProfilePath -Raw | ConvertFrom-Json -Depth 20
if (-not $activation.enabled_rules.architecture_boundaries) { return }

$allowedStudentsImportFile = Join-Path $RepoRoot 'apps/teacher-ui/src/composables/useStudentsBridge.ts'
$uiSourceRoot = Join-Path $RepoRoot 'apps/teacher-ui/src'
$allUiFiles = Get-ChildItem -Path $uiSourceRoot -Recurse -Include '*.ts', '*.vue' -File -ErrorAction SilentlyContinue
$studentImportMatches = @($allUiFiles | Select-String -Pattern '@viccoboard/students' -List)
$directUiImports = @(
  $studentImportMatches |
    Where-Object { $_.Path -ne $allowedStudentsImportFile } |
    ForEach-Object { $_.Path.Replace($RepoRoot + [IO.Path]::DirectorySeparatorChar, '') }
)

$allSourceFiles = @(
  Get-ChildItem -Path (Join-Path $RepoRoot 'apps'), (Join-Path $RepoRoot 'packages'), (Join-Path $RepoRoot 'modules') -Recurse -Include '*.ts' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch [regex]::Escape([IO.Path]::DirectorySeparatorChar + 'dist' + [IO.Path]::DirectorySeparatorChar) }
)
$centralStudentRepository = Join-Path $RepoRoot 'modules/students/src/repositories/student.repository.ts'
$duplicateStudentRepositories = @(
  $allSourceFiles |
    Where-Object { $_.FullName -ne $centralStudentRepository } |
    Select-String -Pattern 'class\s+StudentRepository\b' -List |
    ForEach-Object { $_.Path.Replace($RepoRoot + [IO.Path]::DirectorySeparatorChar, '') }
)

$passed = ($directUiImports.Count -eq 0 -and $duplicateStudentRepositories.Count -eq 0)
$evidenceParts = @()
if ($directUiImports.Count -eq 0) {
  $evidenceParts += 'UI student imports contained to bridge'
}
else {
  $evidenceParts += "unexpected UI student imports: $($directUiImports -join ', ')"
}

if ($duplicateStudentRepositories.Count -eq 0) {
  $evidenceParts += 'central StudentRepository remains unique'
}
else {
  $evidenceParts += "duplicate StudentRepository definitions: $($duplicateStudentRepositories -join ', ')"
}

[pscustomobject]@{
  id = 'custom.architecture_boundaries'
  category = 'maintainability'
  weight = 3
  passed = $passed
  evidence = ($evidenceParts -join '; ')
  remediation = 'Route UI student access through useStudentsBridge and keep StudentRepository centralized in modules/students.'
}
