import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = process.cwd();
const distDir = join(root, 'apps', 'teacher-ui', 'dist');
const assetsDir = join(distDir, 'assets');
const artifactDir = join(root, 'release-artifacts');
const artifactFile = join(artifactDir, 'viccoboard.html');

function escapeRawTextEndTag(content, tagName) {
  const lowerContent = content.toLowerCase();
  const needle = `</${tagName}`;
  const pieces = [];
  let start = 0;
  let index = lowerContent.indexOf(needle);

  while (index !== -1) {
    pieces.push(content.slice(start, index));
    pieces.push(`<\\/${content.slice(index + 2, index + needle.length)}`);
    start = index + needle.length;
    index = lowerContent.indexOf(needle, start);
  }

  pieces.push(content.slice(start));
  return pieces.join('');
}

if (!existsSync(assetsDir)) {
  throw new Error('Teacher UI build assets are missing. Run the iPad local build first.');
}

const entries = await readdir(assetsDir, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
const jsFiles = files.filter((name) => extname(name) === '.js');
const cssFiles = files.filter((name) => extname(name) === '.css');
const svgFiles = files.filter((name) => extname(name) === '.svg');
const unsupportedEntries = entries.filter(
  (entry) => entry.isDirectory() || !['.js', '.css', '.svg'].includes(extname(entry.name))
);

if (jsFiles.length !== 1) {
  throw new Error(`Expected exactly one JavaScript bundle, found ${jsFiles.length}.`);
}

if (cssFiles.length > 1) {
  throw new Error(`Expected at most one CSS bundle, found ${cssFiles.length}.`);
}

if (unsupportedEntries.length > 0) {
  throw new Error(
    `Local iPad build still has external assets: ${unsupportedEntries.map((entry) => entry.name).join(', ')}`
  );
}

const js = escapeRawTextEndTag(await readFile(join(assetsDir, jsFiles[0]), 'utf8'), 'script');
let css = cssFiles[0] ? await readFile(join(assetsDir, cssFiles[0]), 'utf8') : '';

for (const svgFile of svgFiles) {
  const reference = `./${svgFile}`;
  if (!css.includes(reference)) {
    throw new Error(`Local iPad SVG asset is not referenced by the CSS bundle: ${svgFile}`);
  }

  const svg = await readFile(join(assetsDir, svgFile));
  const dataUrl = `data:image/svg+xml;base64,${svg.toString('base64')}`;
  css = css.replaceAll(`${reference}?#`, `${dataUrl}#`).replaceAll(reference, dataUrl);
}

css = escapeRawTextEndTag(css, 'style');

const styleTag = css ? `    <style>\n${css}\n    </style>\n` : '';
const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ViccoBoard</title>
${styleTag}  </head>
  <body>
    <div id="app"></div>
    <script type="module">
${js}
    </script>
  </body>
</html>
`;

await rm(artifactDir, { force: true, recursive: true });
await mkdir(artifactDir, { recursive: true });
await writeFile(artifactFile, html);

console.log(`Created ${artifactFile}`);
