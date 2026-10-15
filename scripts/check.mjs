import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHomeOrder } from './content.mjs';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const pages = JSON.parse(await readFile(path.join(root, 'pages.json'), 'utf8'));
let references = 0;
let anchors = 0;
for (const page of pages) {
  const file = path.join(root, page);
  const html = await readFile(file, 'utf8');
  if (!html.includes('<header class="identity">') || !html.includes('id="main"')) throw new Error(`Missing shared page layout: ${page}`);
  if (!html.includes('<meta name="color-scheme" content="light">') || !html.includes('<style>html{color-scheme:light;background:')) throw new Error(`Missing early light background: ${page}`);
  if (!html.includes('<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">')) throw new Error(`Missing mobile auto-link detection settings: ${page}`);
  if (page.startsWith('zh/') || !html.includes('<html lang="en">')) throw new Error(`Incorrect page language: ${page}`);
  if (html.includes('hreflang=') || html.includes('language-switch') || /\p{Script=Han}/u.test(html)) throw new Error(`Non-English content or language controls remain: ${page}`);
  if (page.split('/').length === 3) {
    const backHref = html.match(/<div class="detail-heading">[\s\S]*?<a class="section-action" href="([^"]+)"/u)?.[1];
    const categoryPage = path.resolve(root, page.split('/')[0], 'index.html');
    if (!backHref || path.resolve(path.dirname(file), backHref) !== categoryPage) throw new Error(`Detail heading must link back to its category: ${page}`);
    if (html.includes('class="return-link"')) throw new Error(`Duplicate bottom return link: ${page}`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1];
    if (/^(https?:|mailto:|tel:)/i.test(reference)) continue;
    const [pathname, fragment] = reference.split('#');
    const target = pathname ? path.resolve(path.dirname(file), decodeURIComponent(pathname.split('?')[0])) : file;
    const relative = path.relative(root, target);
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Link escapes output: ${reference}`);
    await stat(target).catch(() => { throw new Error(`Broken link in ${page}: ${reference}`); });
    if (fragment && target.endsWith('.html')) {
      const destination = target === file ? html : await readFile(target, 'utf8');
      const ids = [...destination.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
      if (!ids.includes(decodeURIComponent(fragment))) throw new Error(`Missing anchor in ${page}: ${reference}`);
      anchors++;
    }
    if (pathname) references++;
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
const legacyDirectory = await stat(path.join(root, 'zh')).catch(error => { if (error.code !== 'ENOENT') throw error; });
if (legacyDirectory) throw new Error('Remove the legacy dist/zh output before publishing.');
await stat(path.join(root, '.nojekyll'));
async function checkOutput(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await checkOutput(file);
    else if (entry.name.endsWith('.html') && !pages.includes(path.relative(root, file).split(path.sep).join('/'))) throw new Error(`Unlisted HTML page in output: ${file}`);
  }
}
await checkOutput(root);
const noteSources = (await readdir(path.join(root, 'notes/_sources'))).filter(file => file.endsWith('.md'));
const expectedSources = pages.filter(page => /^notes\/[^/]+\/index\.html$/.test(page)).map(page => `${page.split('/')[1]}.md`);
if (noteSources.sort().join('|') !== expectedSources.sort().join('|')) throw new Error('Note sources do not match the published note pages');
const demo = await readFile(path.join(root, 'notes/media-math-test/index.html'), 'utf8');
if (!demo.includes('katex-mathml') || !demo.includes('katex-display') || !demo.includes('note-demo.png') || !demo.includes('note-demo.svg') || demo.includes('katex-error')) throw new Error('Note media/math rendering failed');
const home = await readFile(path.join(root, 'index.html'), 'utf8');
const expectedOrder = parseHomeOrder(await readFile(new URL('../content/home.md', import.meta.url), 'utf8'));
const actualOrder = [...home.matchAll(/<section data-home-section="([^"]+)"/g)].map(match => match[1]);
if (actualOrder.join('|') !== expectedOrder.join('|')) throw new Error('Homepage sections must match the order in content/home.md; rebuild the website');
if (!home.includes('data-home-section="notes" class="resume-notes"')) throw new Error('Homepage notes must retain their print-hidden class');
const notesIndex = await readFile(path.join(root, 'notes/index.html'), 'utf8');
const noteCount = html => [...html.matchAll(/<article class="note-entry note-entry-compact">/g)].length;
if (noteCount(home) !== Math.min(5, noteCount(notesIndex))) throw new Error('Homepage notes must preview at most five entries');
console.log(`Checked ${pages.length} English pages, ${references} local references, ${anchors} anchors, ${fontReferences} font references, configured homepage order, category return links, five-note preview, clean output, English-only content, and note rendering.`);
