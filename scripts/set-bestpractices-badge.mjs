import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const projectId = process.argv[2] || process.env.BESTPRACTICES_PROJECT_ID;

if (!projectId || !/^\d+$/.test(projectId)) {
  console.error('[set-bestpractices-badge] Provide a numeric project ID.');
  console.error('[set-bestpractices-badge] Usage: npm run badge:bestpractices -- <PROJECT_ID>');
  process.exit(1);
}

const badgeUrl = `https://www.bestpractices.dev/projects/${projectId}/badge`;
const projectUrl = `https://www.bestpractices.dev/projects/${projectId}`;

const files = ['README.md', 'README.en.md'];

function upsertReference(text, key, value) {
  const pattern = new RegExp(`^\\[${key}\\]:\\s+.*$`, 'm');
  const line = `[${key}]: ${value}`;
  if (pattern.test(text)) {
    return text.replace(pattern, line);
  }

  if (/<!-- Badges -->/.test(text) && key.startsWith('badge-')) {
    return text.replace(/(<!-- Badges -->\r?\n)/, `$1${line}\n`);
  }

  if (/<!-- Links -->/.test(text) && !key.startsWith('badge-')) {
    return text.replace(/(<!-- Links -->\r?\n)/, `$1${line}\n`);
  }

  return `${text.trimEnd()}\n${line}\n`;
}

function ensureTopBadge(text) {
  const badgeLine = '[![OpenSSF Best Practices][badge-bestpractices]][bestpractices]';
  if (text.includes(badgeLine)) {
    return text;
  }

  const anchor = '[![OpenSSF Scorecard][badge-scorecard]][scorecard]';
  if (!text.includes(anchor)) {
    throw new Error('Could not find scorecard badge anchor in README');
  }

  return text.replace(anchor, `${anchor}\n${badgeLine}`);
}

for (const file of files) {
  const full = path.join(ROOT, file);
  let text = fs.readFileSync(full, 'utf8');

  text = ensureTopBadge(text);
  text = upsertReference(text, 'badge-bestpractices', badgeUrl);
  text = upsertReference(text, 'bestpractices', projectUrl);

  fs.writeFileSync(full, text, 'utf8');
  console.log(`[set-bestpractices-badge] Updated ${file}`);
}

console.log(`[set-bestpractices-badge] Badge and project links now target project ID ${projectId}.`);
