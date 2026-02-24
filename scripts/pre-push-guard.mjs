import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const NPM_CMD = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const LEGACY_LABEL_A = `sport${'zens'}`;
const LEGACY_LABEL_B = `k${'urt'}`;
const LEGACY_NAME_PATTERN = `${LEGACY_LABEL_A}|\\b${LEGACY_LABEL_B}\\b`;
const LEGACY_PATH_PATTERNS = [
  new RegExp(LEGACY_LABEL_A, 'i'),
  new RegExp(`(^|[/_-])${LEGACY_LABEL_B}([/_\\-.]|$)`, 'i')
];
const README_TAB_MARKERS = ['Tab 1 · Product Overview', 'Tab 2 · AI / Reviewer / Maintainer Info'];
const ZEN_ANCHOR_FILES = [
  'README.md',
  'DEVELOPMENT.md',
  'docs/reviews/AI_CODE_REVIEW_INSTRUCTIONS.md'
];

const BANNED_ROOT_ARTIFACTS = new Set([
  '$filePath',
  'exams-forcexit-test.txt',
  'exams-test-output.txt',
  'final-exams-test-forcexit.txt',
  'final-test.txt',
  'full-test-forcexit.txt',
  'ipad-build.txt',
  'root-test-output.txt',
  'test-output.txt'
]);

const ROOT_DOC_ALLOWLIST = new Set([
  'README.md',
  'Plan.md',
  'DEVELOPMENT.md',
  'ARCHITECTURE_DECISIONS.md',
  'INDEX.md',
  'agents.md',
  'AGENTS.md'
]);

const ROOT_DOC_EXTENSIONS = new Set(['.md', '.txt', '.csv']);

function runCapture(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(stderr || `${command} ${args.join(' ')} failed`);
  }

  return (result.stdout || '').trim();
}

function runCaptureAllowNoMatch(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status === 1) {
    return '';
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    throw new Error(stderr || `${command} ${args.join(' ')} failed`);
  }

  return (result.stdout || '').trim();
}

function runGate(command, args, label) {
  console.log(`\n[pre-push] ${label}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`[pre-push] Gate failed: ${label}`);
  }
}

function runNpmGate(scriptName, label) {
  if (process.platform === 'win32') {
    // Running through cmd avoids spawn EINVAL with npm.cmd on some Windows setups.
    runGate('cmd.exe', ['/d', '/s', '/c', `${NPM_CMD} run ${scriptName}`], label);
    return;
  }
  runGate(NPM_CMD, ['run', scriptName], label);
}

function failWithList(title, items) {
  console.error(`\n[pre-push] ${title}`);
  for (const item of items) {
    console.error(` - ${item}`);
  }
  process.exit(1);
}

function checkTrackedStructure(files) {
  const fileSet = new Set(files);

  const sidecarConflicts = [];
  for (const file of files) {
    if (file.endsWith('.bak')) {
      sidecarConflicts.push(`${file} (backup files are forbidden)`);
      continue;
    }
    if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      const base = file.slice(0, -3);
      const jsSidecar = `${base}.js`;
      const dtsSidecar = `${base}.d.ts`;
      if (fileSet.has(jsSidecar)) {
        sidecarConflicts.push(`${jsSidecar} duplicates ${file}`);
      }
      if (fileSet.has(dtsSidecar)) {
        sidecarConflicts.push(`${dtsSidecar} duplicates ${file}`);
      }
    }
  }
  if (sidecarConflicts.length > 0) {
    failWithList('Generated sidecar files are tracked. Remove them before push.', sidecarConflicts);
  }

  const bannedRoots = files.filter((file) => !file.includes('/') && BANNED_ROOT_ARTIFACTS.has(file));
  if (bannedRoots.length > 0) {
    failWithList('Banned root artifacts are tracked.', bannedRoots);
  }

  const rootDocViolations = files.filter((file) => {
    if (file.includes('/')) return false;
    const ext = path.extname(file);
    if (!ROOT_DOC_EXTENSIONS.has(ext)) return false;
    return !ROOT_DOC_ALLOWLIST.has(file);
  });
  if (rootDocViolations.length > 0) {
    failWithList(
      'Unexpected root-level docs detected. Move these files into docs/* or update guardrails intentionally.',
      rootDocViolations
    );
  }
}

function checkLegacyNaming(files) {
  const filenameViolations = files.filter((file) => LEGACY_PATH_PATTERNS.some((pattern) => pattern.test(file)));

  if (filenameViolations.length > 0) {
    failWithList('Legacy naming detected in file paths. Use release names only.', filenameViolations);
  }

  const contentMatches = runCaptureAllowNoMatch('git', [
    'grep',
    '-n',
    '-I',
    '-i',
    '-E',
    LEGACY_NAME_PATTERN,
    '--',
    '.',
    ':(exclude)scripts/pre-push-guard.mjs'
  ]);

  if (contentMatches) {
    failWithList(
      'Legacy naming detected in tracked file content. Replace with release names.',
      contentMatches.split(/\r?\n/).filter(Boolean)
    );
  }
}

function checkZenAnchors(files) {
  const missingFiles = ZEN_ANCHOR_FILES.filter((file) => !files.includes(file));
  if (missingFiles.length > 0) {
    failWithList('Zen anchor files are missing.', missingFiles);
  }

  const missingMentions = [];
  for (const file of ZEN_ANCHOR_FILES) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    if (!/zen of python/i.test(text)) {
      missingMentions.push(`${file} (missing "Zen of Python" reference)`);
    }
  }

  if (missingMentions.length > 0) {
    failWithList('Zen of Python must remain explicit in repository governance docs.', missingMentions);
  }
}

function checkReadmeTabs() {
  const text = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const missingMarkers = README_TAB_MARKERS.filter((marker) => !text.includes(marker));
  if (missingMarkers.length > 0) {
    failWithList('README tab layout markers are missing.', missingMarkers);
  }
}

function main() {
  console.log('[pre-push] Running ViccoBoard quality gate...');
  const trackedOutput = runCapture('git', ['ls-files']);
  const trackedFiles = trackedOutput ? trackedOutput.split(/\r?\n/).filter(Boolean) : [];

  checkTrackedStructure(trackedFiles);
  checkLegacyNaming(trackedFiles);
  checkZenAnchors(trackedFiles);
  checkReadmeTabs();

  runNpmGate('lint:docs', 'Documentation guardrails');
  runNpmGate('build:packages', 'Package compilation');
  runNpmGate('test', 'Workspace tests');
  runNpmGate('build', 'Full production build');

  console.log('\n[pre-push] All checks passed.');
}

try {
  main();
} catch (error) {
  console.error(`\n[pre-push] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
