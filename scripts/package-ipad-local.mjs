import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'apps', 'teacher-ui', 'dist');
const indexFile = join(distDir, 'index.html');
const artifactDir = join(root, 'release-artifacts');
const artifactFile = join(artifactDir, 'viccoboard.html');

function attributeValue(attributes, name) {
  const match = attributes.match(new RegExp(`${name}=["']([^"']+)["']`));
  return match?.[1] ?? null;
}

function resolveDistPath(assetPath) {
  const normalizedPath = assetPath.replace(/^\.\//, '').replace(/^\//, '');
  const absolutePath = resolve(distDir, normalizedPath);
  const relativePath = relative(distDir, absolutePath);

  if (relativePath.startsWith('..')) {
    throw new Error(`Refusing to inline asset outside dist: ${assetPath}`);
  }

  return absolutePath;
}

async function replaceAsync(input, pattern, replacer) {
  const pieces = [];
  let lastIndex = 0;

  for (const match of input.matchAll(pattern)) {
    pieces.push(input.slice(lastIndex, match.index));
    pieces.push(await replacer(match));
    lastIndex = match.index + match[0].length;
  }

  pieces.push(input.slice(lastIndex));
  return pieces.join('');
}

async function inlineStyles(html) {
  return replaceAsync(
    html,
    /<link\s+([^>]*rel=["']stylesheet["'][^>]*)>/g,
    async ([original, attributes]) => {
      const href = attributeValue(attributes, 'href');
      if (!href) {
        return original;
      }

      const css = await readFile(resolveDistPath(href), 'utf8');
      return `<style>\n${css}\n</style>`;
    }
  );
}

async function inlineScripts(html) {
  return replaceAsync(
    html,
    /<script\s+([^>]*src=["'][^"']+["'][^>]*)><\/script>/g,
    async ([original, attributes]) => {
      const src = attributeValue(attributes, 'src');
      if (!src) {
        return original;
      }

      const type = attributeValue(attributes, 'type') ?? 'module';
      const js = await readFile(resolveDistPath(src), 'utf8');
      return `<script type="${type}">\n${js}\n</script>`;
    }
  );
}

if (!existsSync(indexFile)) {
  throw new Error('Teacher UI build output is missing. Run the iPad local build first.');
}

let html = await readFile(indexFile, 'utf8');

html = html.replace(/\s*<link\s+rel=["']modulepreload["'][^>]*>\n?/g, '\n');
html = html.replace(/\s*<link\s+rel=["']icon["'][^>]*>\n?/g, '\n');
html = await inlineStyles(html);
html = await inlineScripts(html);

await rm(artifactDir, { force: true, recursive: true });
await mkdir(artifactDir, { recursive: true });
await writeFile(artifactFile, html);

console.log(`Created ${artifactFile}`);
