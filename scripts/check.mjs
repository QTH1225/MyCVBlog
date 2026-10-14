import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = JSON.parse(await readFile(path.join(root, 'pages.json'), 'utf8'));
let references = 0;
for (const page of pages) {
  const file = path.join(root, page);
  const html = await readFile(file, 'utf8');
  if (!html.includes('<header class="identity">') || !html.includes('id="main"')) throw new Error(`Missing shared page layout: ${page}`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(reference)) continue;
    const target = path.resolve(path.dirname(file), reference.split('#')[0]);
    if (!target.startsWith(root)) throw new Error(`Link escapes output: ${reference}`);
    await stat(target).catch(() => { throw new Error(`Broken link in ${page}: ${reference}`); });
    references++;
  }
}
let fontReferences = 0;
for (const stylesheet of ['assets/styles.css', 'assets/katex/katex.min.css']) {
  const css = await readFile(path.join(root, stylesheet), 'utf8');
  for (const match of css.matchAll(/url\(["']?([^\)"']+)["']?\)/g)) {
    await stat(path.resolve(root, path.dirname(stylesheet), match[1]));
    fontReferences++;
  }
}
const demo = await readFile(path.join(root, 'notes/media-math-test/index.html'), 'utf8');
if (!demo.includes('katex-mathml') || !demo.includes('katex-display') || !demo.includes('note-demo.png') || !demo.includes('note-demo.svg') || demo.includes('katex-error')) throw new Error('Note media/math rendering failed');
console.log(`Checked ${pages.length} pages, ${references} local references, ${fontReferences} font references, and note media/math rendering.`);
