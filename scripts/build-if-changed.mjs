import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const cacheFile = join(root, 'node_modules', '.cache', 'viccoboard', 'build-manifest.json');
const expectedOutputs = [
  'packages/core/dist',
  'packages/plugins/dist',
  'packages/storage/dist',
  'modules/students/dist',
  'modules/exams/dist',
  'modules/sport/dist',
  'apps/teacher-ui/dist',
];

const inputRoots = [
  'package.json',
  'package-lock.json',
  'scripts/build-if-changed.mjs',
  'tsconfig.json',
  'packages',
  'modules',
  'apps',
];

const ignoredNames = new Set([
  '.git',
  '.cache',
  'coverage',
  'dist',
  'node_modules',
]);

const ignoredSuffixes = [
  '.tsbuildinfo',
];

function normalizePath(path) {
  return path.split('\\').join('/');
}

function isIgnoredFile(path) {
  return ignoredSuffixes.some((suffix) => path.endsWith(suffix));
}

async function collectFiles(path) {
  if (!existsSync(path)) {
    return [];
  }

  const info = await stat(path);
  if (info.isFile()) {
    return [path];
  }

  if (!info.isDirectory()) {
    return [];
  }

  const entries = await readdir(path, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredNames.has(entry.name)) {
      continue;
    }

    const childPath = join(path, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(childPath));
    } else if (entry.isFile() && !isIgnoredFile(childPath)) {
      files.push(childPath);
    }
  }

  return files;
}

async function inputHash() {
  const files = (
    await Promise.all(inputRoots.map((path) => collectFiles(join(root, path))))
  ).flat().sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)));

  const hash = createHash('sha256');

  for (const file of files) {
    const relativePath = normalizePath(relative(root, file));
    hash.update(relativePath);
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }

  return {
    hash: hash.digest('hex'),
    fileCount: files.length,
  };
}

async function hasExpectedOutputs() {
  for (const output of expectedOutputs) {
    const outputPath = join(root, output);

    if (!existsSync(outputPath)) {
      return false;
    }

    const entries = await readdir(outputPath);
    if (entries.length === 0) {
      return false;
    }
  }

  return true;
}

async function previousManifest() {
  if (!existsSync(cacheFile)) {
    return null;
  }

  try {
    return JSON.parse(await readFile(cacheFile, 'utf8'));
  } catch {
    return null;
  }
}

async function writeManifest(manifest) {
  await mkdir(dirname(cacheFile), { recursive: true });
  await writeFile(cacheFile, `${JSON.stringify(manifest, null, 2)}\n`);
}

const force = process.argv.includes('--force');
const current = await inputHash();
const previous = await previousManifest();
const outputsReady = await hasExpectedOutputs();

if (!force && outputsReady && previous?.hash === current.hash) {
  console.log(`Build inputs unchanged (${current.fileCount} files). Skipping build.`);
  process.exit(0);
}

if (force) {
  console.log('Forced build requested.');
} else if (!outputsReady) {
  console.log('Build outputs missing or empty. Running build.');
} else {
  console.log('Build inputs changed. Running build.');
}

const result = spawnSync('npm', ['run', 'build:all'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const built = await inputHash();

await writeManifest({
  hash: built.hash,
  fileCount: built.fileCount,
  builtAt: new Date().toISOString(),
});

console.log('Build manifest updated.');
