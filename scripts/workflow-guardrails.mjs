import fs from 'node:fs';
import path from 'node:path';

const filePath = path.join(process.cwd(), '.github', 'workflows', 'scorecards.yml');

function fail(errors) {
  for (const error of errors) {
    console.error(`[workflow-guardrails] ${error}`);
  }
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  fail([`Missing workflow file: ${filePath}`]);
}

const text = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
const lines = text.split('\n');
const errors = [];

if (!/^permissions:\s*read-all\s*$/m.test(text)) {
  errors.push('Scorecards workflow must set top-level `permissions: read-all`.');
}

const topLevelPermissionsBlock = text.match(/^permissions:\s*\n((?: {2}[^\n]*\n?)*)/m);
if (topLevelPermissionsBlock && /:\s*write\b/.test(topLevelPermissionsBlock[1])) {
  errors.push('Top-level workflow permissions must not contain any `write` scopes.');
}

const analysisIndex = lines.findIndex((line) => /^  analysis:\s*$/.test(line));
if (analysisIndex === -1) {
  errors.push('Missing `jobs.analysis` block in scorecards workflow.');
} else {
  const analysisLines = [];
  for (let i = analysisIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^  [a-zA-Z0-9_-]+:\s*$/.test(line)) {
      break;
    }
    analysisLines.push(line);
  }

  const hasJobPermissions = analysisLines.some((line) => /^    permissions:\s*$/.test(line));
  const hasSecurityEventsWrite = analysisLines.some((line) => /^      security-events:\s*write\s*$/.test(line));
  const hasIdTokenWrite = analysisLines.some((line) => /^      id-token:\s*write\s*$/.test(line));

  if (!hasJobPermissions) {
    errors.push('`jobs.analysis.permissions` is required.');
  }
  if (!hasSecurityEventsWrite) {
    errors.push('`jobs.analysis.permissions.security-events: write` is required.');
  }
  if (!hasIdTokenWrite) {
    errors.push('`jobs.analysis.permissions.id-token: write` is required.');
  }
}

if (!/publish_results:\s*true\s*$/m.test(text)) {
  errors.push('Scorecards must keep `publish_results: true` to publish public Scorecard results.');
}

if (errors.length > 0) {
  fail(errors);
}

console.log('[workflow-guardrails] Scorecards workflow permissions are valid.');
