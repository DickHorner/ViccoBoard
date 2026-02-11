param(
  [string]$TrackerPath = "docs/planning/ISSUES_TRACKER.md",
  [string]$OutputDir = "docs/agents/issue-prompts"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $TrackerPath)) {
  throw "Tracker file not found: $TrackerPath"
}

$lines = Get-Content $TrackerPath
$sections = @{}

for ($i = 0; $i -lt $lines.Length; $i++) {
  if ($lines[$i] -match '^### Issue (P\d-\d+):\s*(.+)$') {
    $id = $Matches[1]
    $name = $Matches[2].Trim()

    $j = $i + 1
    while ($j -lt $lines.Length -and -not ($lines[$j] -match '^### Issue ')) {
      $j++
    }

    $section = @()
    if ($j -gt ($i + 1)) {
      $section = $lines[($i + 1)..($j - 1)]
    }

    $priority = ($section | Where-Object { $_ -match '^\*\*Priority:\*\*' } | Select-Object -First 1)
    if ($priority) {
      $priority = ($priority -replace '^\*\*Priority:\*\*\s*', '').Trim()
    }

    $description = ""
    $descIdx = [Array]::IndexOf($section, '**Description:**')
    if ($descIdx -ge 0) {
      $descLines = @()
      for ($k = $descIdx + 1; $k -lt $section.Length; $k++) {
        $ln = $section[$k]
        if ($ln -match '^\*\*' -and $ln -ne '**Description:**') { break }
        if ([string]::IsNullOrWhiteSpace($ln)) {
          if ($descLines.Count -gt 0) { break } else { continue }
        }
        $descLines += $ln.Trim()
      }
      $description = ($descLines -join ' ')
    }

    $tasks = @()
    $tasksIdx = [Array]::IndexOf($section, '**Tasks:**')
    if ($tasksIdx -ge 0) {
      for ($k = $tasksIdx + 1; $k -lt $section.Length; $k++) {
        $ln = $section[$k]
        if ($ln -match '^\*\*' -and $ln -ne '**Tasks:**') { break }
        if ($ln -match '^- \[[ xX]\] (.+)$') {
          $tasks += $Matches[1].Trim()
        }
      }
    }

    $accept = @()
    $accIdx = [Array]::IndexOf($section, '**Acceptance Criteria:**')
    if ($accIdx -ge 0) {
      for ($k = $accIdx + 1; $k -lt $section.Length; $k++) {
        $ln = $section[$k]
        if ($ln -match '^\*\*' -and $ln -ne '**Acceptance Criteria:**') { break }
        if ($ln -match '^- (.+)$') {
          $accept += $Matches[1].Trim()
        }
      }
    }

    $relates = ($section | Where-Object { $_ -match '^\*\*Relates to:\*\*' } | Select-Object -First 1)
    if ($relates) {
      $relates = ($relates -replace '^\*\*Relates to:\*\*\s*', '').Trim()
    }

    $sections[$id] = [PSCustomObject]@{
      Id          = $id
      Name        = $name
      Priority    = $priority
      Description = $description
      Tasks       = $tasks
      Acceptance  = $accept
      RelatesTo   = $relates
    }
  }
}

$openIssues = gh issue list --state open --limit 200 --json number,title |
  ConvertFrom-Json |
  Where-Object { $_.title -match '^\[(P\d-\d+)\]' } |
  ForEach-Object {
    [PSCustomObject]@{
      Number = $_.number
      Id     = ([regex]::Match($_.title, '^\[(P\d-\d+)\]')).Groups[1].Value
      Title  = $_.title
    }
  } |
  Sort-Object Id

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
Get-ChildItem $OutputDir -File | Remove-Item -Force

$index = @(
  '# Issue Prompt Pack',
  '',
  'Per-issue Copilot prompts for currently open GitHub parity issues.',
  '',
  '## Usage',
  '1. Open the issue-specific file below.',
  '2. Paste the prompt into Copilot chat for that issue.',
  '3. Require strict evidence output, including `docs/evidence/_template.md` artifacts and gate results.',
  '',
  '## Generated Prompts'
)

foreach ($issue in $openIssues) {
  if (-not $sections.ContainsKey($issue.Id)) { continue }
  $s = $sections[$issue.Id]

  $slug = ($s.Name.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', '')
  if ([string]::IsNullOrWhiteSpace($slug)) { $slug = 'issue' }

  $fileName = "$($s.Id)-$slug.md"
  $filePath = Join-Path $OutputDir $fileName

  $content = @()
  $content += "# Copilot Prompt - [$($s.Id)] $($s.Name)"
  $content += ''
  $content += 'You are in STRICT COMPLIANCE mode for ViccoBoard.'
  $content += ''
  $content += '## Mandatory Reading (before any action)'
  $content += '- `.github/copilot-instructions.md`'
  $content += '- `agents.md`'
  $content += '- `Plan.md` (especially section 6 and section 9)'
  $content += '- `docs/agents/SPORTZENS_PARITY_v2.md`'
  $content += '- `docs/planning/ISSUES_TRACKER.md`'
  $content += '- `docs/status/STATUS.md`'
  $content += '- `docs/evidence/_template.md`'
  $content += ''
  $content += '## Execution Mode'
  $content += '- Declare mode at start: `AUDIT` or `IMPLEMENTATION`.'
  $content += '- For this run, use `IMPLEMENTATION`.'
  $content += '- Keep verification language strict: use `VERIFIED`, `GAP`, `NOT VERIFIED` only with evidence.'
  $content += ''
  $content += '## Scope Lock'
  $content += ('- Primary issue: `' + $s.Id + '`')
  $content += '- Max secondary issues: 0 unless explicitly required by dependency.'
  $content += '- Do not implement unrelated issue IDs.'
  if ($s.Priority) {
    $content += ''
    $content += '## Priority'
    $content += "- $($s.Priority)"
  }
  $content += ''
  $content += '## Issue Description'
  $content += "- $($s.Description)"
  $content += ''
  $content += '## Required Tasks (from tracker)'
  foreach ($t in $s.Tasks) { $content += "- [ ] $t" }
  $content += ''
  $content += '## Acceptance Criteria (must be evidenced)'
  foreach ($a in $s.Acceptance) { $content += "- $a" }
  if ($s.RelatesTo) {
    $content += ''
    $content += '## Traceability'
    $content += "- Relates to: $($s.RelatesTo)"
  }
  $content += ''
  $content += '## Evidence Artifacts (Required)'
  $content += "- Create a folder: `docs/evidence/$($s.Id.ToLower())/`"
  $content += '- Create at least these files from the template:'
  $content += '  - `workflow-checklist.md`'
  $content += '  - `verification-matrix.md`'
  $content += '  - `gates-and-audit.md`'
  $content += ''
  $content += '## Non-Negotiable Constraints'
  $content += '- No app-layer direct DB path usage (`../db`, Dexie tables, storage adapters in UI/composables).'
  $content += '- No architecture drift: use module bridges/use-cases only.'
  $content += '- Criteria/status options must remain configurable where applicable.'
  $content += '- Do not claim done/compliant without file+line evidence.'
  $content += ''
  $content += '## Mandatory Output Structure'
  $content += '1. Pre-edit declaration:'
  $content += '   - mode'
  $content += '   - exact files to touch'
  $content += '   - risks/dependencies'
  $content += '2. Implementation summary with file references.'
  $content += '3. Verification matrix (VERIFIED/GAP/NOT VERIFIED) for each acceptance criterion.'
  $content += '4. Command results:'
  $content += '   - `npm run lint:docs`'
  $content += '   - `npm run build:packages`'
  $content += '   - `npm run build:ipad`'
  $content += '   - `npm test`'
  $content += '5. Architecture audit output:'
  $content += '   - `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "../db" -SimpleMatch`'
  $content += '   - `Get-ChildItem apps/teacher-ui/src -Recurse -File | Select-String -Pattern "useDatabase(" -SimpleMatch`'
  $content += '6. Explicit list of remaining blockers and next smallest step.'

  Set-Content -Path $filePath -Value ($content -join "`n") -Encoding UTF8
  $index += "- [$($s.Id) $($s.Name)]($fileName)"
}

Set-Content -Path (Join-Path $OutputDir 'README.md') -Value ($index -join "`n") -Encoding UTF8

Write-Host "Regenerated prompt pack in $OutputDir"
