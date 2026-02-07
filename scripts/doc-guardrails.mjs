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

const appLevelRepoPattern = new RegExp(
  [
    '(app[-\\s]?level|app\\s+layer|app\\s+code|frontend|client|ui)\\s*(repository|repositories|repo)\\b',
    '\\b(repository|repositories|repo)\\b\\s*(in|inside|within)\\s*(the\\s+)?(app|ui|frontend|client)\\b',
    'apps[\\\\/].*(repository|repositories|repo)\\b'
  ].join('|'),
  'i'
);
const moduleAllowlist = /(module|modules\/|modules\\|domain|bounded context)/i;
const negationAllowlist = /(no|not|never|avoid|must not|should not|do not|don't|shouldn't|mustn't|forbid|forbidden|ban|prohibit|kein|keine|nicht|ohne)/i;
const appContext = /\b(app|ui|frontend|client)\b/i;

const accessVerb = /\b(access|read|write|use|touch|query|hit|call|talk to|reach)\b/i;
const storageTarget = /\b(storage|database|db|indexeddb|sqlite)\b/i;
const noDirectStorageAllowlist = /(module bridge|module bridges|module-bridge|use-?cases?|use‑cases|adapter|facade|via\s+module|through\s+module)/i;

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
  if (filePath.includes(`${path.sep}docs${path.sep}sessions${path.sep}`)) {
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const normalizedLine = line
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\u00A0/g, ' ');
    for (const term of forbiddenPlatforms) {
      if (normalizedLine.includes(term) && !platformAllowlist.test(normalizedLine)) {
        issues.push({
          filePath,
          line: index + 1,
          message: `Forbidden platform mention "${term}" without a hard-constraint qualifier.`
        });
      }
    }

    if (normalizedLine.includes('StudentRepository') && normalizedLine.includes('@viccoboard/storage')) {
      issues.push({
        filePath,
        line: index + 1,
        message: 'StudentRepository must not be imported from @viccoboard/storage (centralized in modules/sport).'
      });
    }

    if (/student (store|repository)/i.test(normalizedLine) && appContext.test(normalizedLine)) {
      if (!/modules\/students|students module|centralized/i.test(normalizedLine)) {
        issues.push({
          filePath,
          line: index + 1,
          message: 'Student management must stay centralized in modules/students; avoid app-level stores/repos.'
        });
      }
    }

    if (appLevelRepoPattern.test(normalizedLine) && !moduleAllowlist.test(normalizedLine) && !negationAllowlist.test(normalizedLine)) {
      issues.push({
        filePath,
        line: index + 1,
        message: 'Repositories/stores must live in modules/* (domain). Avoid app-level repositories or stores.'
      });
    }

    const directStoragePattern =
      (appContext.test(normalizedLine) && accessVerb.test(normalizedLine) && storageTarget.test(normalizedLine)) ||
      (storageTarget.test(normalizedLine) && accessVerb.test(normalizedLine) && appContext.test(normalizedLine));

    if (directStoragePattern && !negationAllowlist.test(normalizedLine) && !noDirectStorageAllowlist.test(normalizedLine)) {
      issues.push({
        filePath,
        line: index + 1,
        message: 'UI should not access storage/DB directly; use module bridges/use-cases.'
      });
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
