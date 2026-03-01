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

function hasBadgePursuitMention(text) {
  return (
    /bestpractices\.dev/i.test(text) ||
    /openssf\s+best\s+practices\s+badge/i.test(text) ||
    /(open\s*ssf|ossf)[\s\S]{0,120}best\s*practices[\s\S]{0,60}badge/i.test(text) ||
    /cii[-\s]*best[-\s]*practices/i.test(text)
  );
}

const readmeFiles = ['README.md', 'README.en.md'].filter((file) =>
  fs.existsSync(path.join(ROOT, file))
);

const readmeContents = readmeFiles.map((file) => ({
  file,
  content: read(file)
}));

if (readmeContents.length > 0) {
  const hasAnyBadgeMention = readmeContents.some(({ content }) =>
    hasBadgePursuitMention(content)
  );

  if (!hasAnyBadgeMention) {
    issues.push('README.md or README.en.md should mention OpenSSF Best Practices badge pursuit.');
  }

  const hasPlaybookLink = readmeContents.some(({ content }) =>
    /docs\/ossf-badge\/PLAYBOOK\.md/i.test(content)
  );

  if (!hasPlaybookLink) {
    issues.push('README.md or README.en.md should link to docs/ossf-badge/PLAYBOOK.md.');
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
