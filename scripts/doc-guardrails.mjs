import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOC_EXTENSIONS = new Set(['.md', '.txt']);
const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.git',
  '.next',
  '.turbo'
]);

const forbiddenPlatforms = ['React Native', 'Flutter', 'Electron'];
const platformAllowlist = /no\s+electron|no\s+react\s+native|no\s+flutter|not\s+allowed|not\s+part|out\s+of\s+scope|non-options|web-only|static web|constraints|forbidden platform drift|kein|keine|nicht|ohne/i;

const issues = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        walk(fullPath);
      }
      continue;
    }
    if (!DOC_EXTENSIONS.has(path.extname(entry.name))) continue;
    checkFile(fullPath);
  }
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const term of forbiddenPlatforms) {
      if (line.includes(term) && !platformAllowlist.test(line)) {
        issues.push({
          filePath,
          line: index + 1,
          message: `Forbidden platform mention "${term}" without a hard-constraint qualifier.`
        });
      }
    }

    if (line.includes('StudentRepository') && line.includes('@viccoboard/storage')) {
      issues.push({
        filePath,
        line: index + 1,
        message: 'StudentRepository must not be imported from @viccoboard/storage (centralized in modules/sport).'
      });
    }

    if (/student (store|repository)/i.test(line) && /(app|ui|frontend|client)/i.test(line)) {
      if (!/modules\/sport|sport module|centralized/i.test(line)) {
        issues.push({
          filePath,
          line: index + 1,
          message: 'Student management must stay centralized in modules/sport; avoid app-level stores/repos.'
        });
      }
    }
  });
}

walk(ROOT);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`${issue.filePath}:${issue.line} ${issue.message}`);
  }
  console.error(`\nDoc guardrails failed with ${issues.length} issue(s).`);
  process.exitCode = 1;
} else {
  console.log('Doc guardrails passed with no issues.');
}
