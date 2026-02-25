import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const requiredFiles = [
  'README.md',
  'README.en.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  '.github/CODEOWNERS',
  '.github/dependabot.yml',
  '.github/workflows/ci.yml',
  '.github/workflows/codeql.yml',
  '.github/workflows/scorecard.yml',
  'docs/ossf-badge/PLAYBOOK.md'
];

const issues = [];

for (const file of requiredFiles) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    issues.push(`Missing required file: ${file}`);
  }
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

if (fs.existsSync(path.join(ROOT, 'README.md'))) {
  const readme = read('README.md');
  if (!/bestpractices\.dev/i.test(readme) && !/ossf badge/i.test(readme)) {
    issues.push('README.md should mention OpenSSF Best Practices badge pursuit.');
  }
  if (!/docs\/ossf-badge\/PLAYBOOK\.md/i.test(readme)) {
    issues.push('README.md should link to docs/ossf-badge/PLAYBOOK.md.');
  }
}

if (fs.existsSync(path.join(ROOT, 'SECURITY.md'))) {
  const security = read('SECURITY.md');
  if (!/14\s*days?/i.test(security)) {
    issues.push('SECURITY.md should include an explicit 14-day vulnerability response target.');
  }
  if (!/60\s*days?/i.test(security)) {
    issues.push('SECURITY.md should include an explicit 60-day public-fix target when feasible.');
  }
}

if (fs.existsSync(path.join(ROOT, 'CONTRIBUTING.md'))) {
  const contributing = read('CONTRIBUTING.md');
  if (!/tests?/i.test(contributing) || !/behavior changes?/i.test(contributing)) {
    issues.push('CONTRIBUTING.md should clearly require tests for behavior changes.');
  }
}

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[openssf-readiness] ${issue}`);
  }
  process.exit(1);
}

console.log('[openssf-readiness] OpenSSF badge readiness baseline looks good.');
