import { mkdir, readFile, writeFile, cp, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { profile, education, skills, projects, workExperience, honors, awards, publications } from '../src/content.mjs';
import { loadNotes, renderNote } from './notes.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const notes = await loadNotes(path.join(root, 'notes'));
const escape = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function safeUrl(url) {
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) throw new Error(`Unsupported external URL: ${url}`);
  return escape(url);
}

function validateRecords(records, category) {
  const ids = new Set();
  for (const record of records) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id) || ids.has(record.id)) {
      throw new Error(`Invalid or duplicate ${category} id: ${record.id}`);
    }
    if (!record.title) throw new Error(`Missing title for ${category}/${record.id}`);
    ids.add(record.id);
  }
}

validateRecords(projects, 'projects');
validateRecords(workExperience, 'work-experience');
validateRecords(publications, 'publications');

function relativeLink(page, target = '') {
  const directory = path.posix.dirname(page);
  return path.posix.relative(directory, target || 'index.html') || 'index.html';
}

function shell(page, title, active, body) {
  const link = (target) => escape(relativeLink(page, target));
  const contacts = [
    profile.phone ? (/^\+?[\d\s()-]+$/.test(profile.phone) ? `<a class="phone" href="tel:${escape(profile.phone.replace(/[^\d+]/g, ''))}">${escape(profile.phone)}</a>` : `<span class="phone">${escape(profile.phone)}</span>`) : '',
    profile.email ? `<a href="mailto:${escape(profile.email)}">${escape(profile.email)}</a>` : '',
    profile.website ? `<a href="${safeUrl(profile.website.url)}" target="_blank" rel="noopener noreferrer">${escape(profile.website.label)}</a>` : '',
    profile.github ? `<a href="${safeUrl(profile.github.url)}" target="_blank" rel="noopener noreferrer">${escape(profile.github.label)}</a>` : '',
  ].filter(Boolean);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escape(`${title} — ${profile.name}'s résumé, projects, and notes.`)}">
  <meta name="theme-color" content="#ffffff">
  <title>${escape(title)} | ${escape(profile.name)}</title>
  <link rel="icon" href="${link('assets/favicon.svg')}" type="image/svg+xml">
  <link rel="preload" href="${link('assets/fonts/charter-regular.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${link('assets/styles.css')}">
  ${active === 'notes' ? `<link rel="stylesheet" href="${link('assets/katex/katex.min.css')}">` : ''}
</head>
<body id="top">
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="paper">
    <header class="identity">
      <h1><a href="${link('index.html')}" aria-label="${escape(profile.name)}, back to résumé">${escape(profile.name)}</a></h1>
      <div class="contact" aria-label="Contact information">
        ${contacts.length ? contacts.join('<span class="separator" aria-hidden="true">-</span>') : `<span>${escape(profile.tagline || 'Personal information hidden')}</span>`}
      </div>
    </header>
    <main id="main" tabindex="-1">${body}</main>
    <footer class="footer"><span><a href="${link('index.html')}" class="footer-name">${escape(profile.name)}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en" rel="license noopener noreferrer" target="_blank">CC BY-SA 4.0</a></span><a href="#top" aria-label="Back to top">Back to top ↑</a></footer>
  </div>
</body>
</html>
`;
}

function heading(text, page, target, action = 'View all') {
  if (!target) return `<h2 class="section-heading">${escape(text)}</h2>`;
  const url = escape(relativeLink(page, target));
  const label = action === 'View all' ? `View all ${text.toLowerCase()}` : 'Back to résumé';
  const actionText = action === 'View all' ? 'View all <span aria-hidden="true">→</span>' : '<span aria-hidden="true">←</span> Back to résumé';
  return `<h2 class="section-heading linked"><span>${escape(text)}</span><a class="section-action" href="${url}" aria-label="${escape(label)}">${actionText}</a></h2>`;
}

function bullets(items = []) {
  return items.length ? `<ul class="resume-list">${items.map((item) => `<li>${escape(item)}</li>`).join('')}</ul>` : '';
}

function educationContent() {
  return education.map((item) => `<article class="entry">
    <div class="entry-top"><h3 class="entry-title">${escape(item.institution)}</h3><span class="location">${escape(item.location)}</span></div>
    <div class="entry-sub"><span>${escape(item.degree)}</span><span class="dates">${escape(item.dates)}</span></div>
    ${item.courses ? `<div class="courses"><p>Core Courses:</p>${item.courses.map(([label, courses]) => `<p>${escape(label)}: ${escape(courses)}</p>`).join('')}</div>` : ''}
  </article>`).join('');
}

function recordContent(item, page, category) {
  const url = escape(relativeLink(page, `${category}/${item.id}/index.html`));
  const subtitle = [item.subtitle || [item.role, item.organization].filter(Boolean).join(', '), item.location, item.funding].filter(Boolean).join(', ');
  return `<article class="entry">
    <h3 class="entry-title"><a href="${url}">${escape(item.title)}</a></h3>
    <div class="entry-sub"><span>${escape(subtitle)}</span><span class="dates">${escape(item.dates)}</span></div>
    ${bullets(item.summary)}
  </article>`;
}

function awardsContent(honorItems = honors, awardItems = awards) {
  if (!honorItems.length && !awardItems.length) return '<p class="empty">Personal details withheld.</p>';
  const list = (items) => `<ul class="resume-list award-list">${items.map(([name, date]) => `<li><div class="award-row"><span class="award-name">${escape(name)}</span><span class="dates">${escape(date)}</span></div></li>`).join('')}</ul>`;
  return `${honorItems.length ? `<h3 class="minor-heading">HONORS:</h3>${list(honorItems)}` : ''}${awardItems.length ? `<h3 class="minor-heading">AWARDS:</h3>${list(awardItems)}` : ''}`;
}

function publicationAuthors(item) {
  return Array.isArray(item.authors) ? item.authors.map(author => author.highlight ? `<strong>${escape(author.name)}</strong>` : escape(author.name)).join(', ') : escape(item.authors);
}

function publicationVenue(item) {
  return `<p class="publication-venue"><strong>${escape(item.journal)}</strong>, ${escape(item.year)}.</p>`;
}

function publicationContent(page) {
  if (!publications.length) return '<p class="empty">No publications listed.</p>';
  return publications.map(item => `<article class="entry publication-entry"><h3 class="entry-title"><a href="${item.url ? safeUrl(item.url) : escape(relativeLink(page, `publications/${item.id}/index.html`))}"${item.url ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(item.title)}</a></h3><p class="publication-authors">${publicationAuthors(item)}</p>${publicationVenue(item)}</article>`).join('');
}

function breadcrumb(page, label, category) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${escape(relativeLink(page, 'index.html'))}">Resume</a><span aria-hidden="true">/</span>${category ? `<a href="${escape(relativeLink(page, category.target))}">${escape(category.label)}</a><span aria-hidden="true">/</span>` : ''}${escape(label)}</nav>`;
}

function detailSections(sections = [], page) {
  return sections.map((section) => {
    let figure = '';
    if (section.image) {
      if (section.image.includes('..') || /^(\/|[a-z]+:|\\)/i.test(section.image)) throw new Error('Images must be paths relative to assets/');
      const image = escape(relativeLink(page, `assets/${section.image}`));
      figure = `<figure><img src="${image}" alt="${escape(section.alt || section.caption || section.heading)}" loading="lazy">${section.caption ? `<figcaption>${escape(section.caption)}</figcaption>` : ''}</figure>`;
    }
    return `<section>${heading(section.heading)}${(section.paragraphs || []).map((text) => `<p>${escape(text)}</p>`).join('')}${bullets(section.bullets)}${figure}</section>`;
  }).join('');
}

const pages = new Map();
function noteList(page, items = notes, compact = false) {
  return `<div class="note-list${compact ? ' note-list-compact' : ''}">${items.map(note => `<article class="note-entry${compact ? ' note-entry-compact' : ''}"><div class="entry-top"><h3 class="entry-title"><a href="${escape(relativeLink(page, `notes/${note.id}/index.html`))}">${escape(note.title)}</a></h3><time class="dates" datetime="${escape(note.date)}">${escape(note.date)}</time></div>${compact ? '' : `<p>${escape(note.summary)}</p><div class="note-tags">${note.tags.map(tag => `<span>${escape(tag)}</span>`).join('<span aria-hidden="true">·</span>')}</div>`}</article>`).join('')}</div>`;
}
const home = 'index.html';
pages.set(home, shell(home, 'Resume', 'resume', `
  <section>${heading('EDUCATION')}${educationContent()}</section>
  <section class="skills">${heading('TECHNICAL SKILLS')}${skills.map(([label, value]) => `<p><strong>${escape(label)}:</strong> ${escape(value).replace('LaTeX', '<span class="latex" aria-label="LaTeX">L<span class="a">A</span>T<span class="e">E</span>X</span>')}</p>`).join('')}</section>
  <section>${heading('ACADEMIC PROJECTS', home, 'projects/index.html')}${projects.map((item) => recordContent(item, home, 'projects')).join('') || '<p class="empty">Academic projects will be added here.</p>'}</section>
  <section>${heading('WORK EXPERIENCE', home, 'work-experience/index.html')}${workExperience.length ? workExperience.map((item) => recordContent(item, home, 'work-experience')).join('') : '<p class="empty">Work experience will be added here.</p>'}</section>
  <section>${heading('HONORS AND AWARDS', home, 'honors-and-awards/index.html')}${awardsContent(honors.slice(0, 2), awards.slice(0, 2))}</section>
  <section>${heading('PUBLICATIONS', home, 'publications/index.html')}${publicationContent(home)}</section>
  <section>${heading('NOTES', home, 'notes/index.html')}${noteList(home, notes.slice(0, 3), true)}</section>
`));

for (const [category, label, active, records, empty] of [
  ['projects', 'PROJECTS', 'projects', projects, 'Academic projects will be added here.'],
  ['work-experience', 'WORK EXPERIENCE', 'work', workExperience, 'Work experience will be added here.'],
]) {
  const page = `${category}/index.html`;
  pages.set(page, shell(page, label, active, `${breadcrumb(page, label)}<section>${heading(label, page, home, 'Back to résumé')}${records.length ? records.map((item) => recordContent(item, page, category)).join('') : `<p class="empty">${empty}</p>`}</section>`));
  for (const item of records) {
    const detailPage = `${category}/${item.id}/index.html`;
    const subtitle = item.subtitle || [item.role, item.organization].filter(Boolean).join(' · ');
    pages.set(detailPage, shell(detailPage, item.title, active, `${breadcrumb(detailPage, category === 'work-experience' ? 'Experience details' : 'Project notes', { label, target: page })}
      <article>
        <header><h2 class="detail-title">${escape(item.title)}</h2><p class="detail-subtitle">${escape(subtitle)}</p><div class="detail-meta">${[item.dates, item.location, item.funding].filter(Boolean).map((text) => `<span>${escape(text)}</span>`).join('')}</div></header>
        <div class="detail-body">${detailSections(item.sections, detailPage)}${item.links?.length ? `<section>${heading('LINKS')}<ul class="resume-list">${item.links.map((entry) => `<li><a href="${safeUrl(entry.url)}" target="_blank" rel="noopener noreferrer">${escape(entry.label)}</a></li>`).join('')}</ul></section>` : ''}</div>
      </article>
      <p class="return-link"><a href="${escape(relativeLink(detailPage, page))}">← Back to ${label.toLowerCase()}</a></p>`));
  }
}

const honorsPage = 'honors-and-awards/index.html';
pages.set(honorsPage, shell(honorsPage, 'HONORS AND AWARDS', 'honors', `${breadcrumb(honorsPage, 'Honors and Awards')}<section>${heading('HONORS AND AWARDS', honorsPage, home, 'Back to résumé')}${awardsContent()}</section>`));

const publicationPage = 'publications/index.html';
pages.set(publicationPage, shell(publicationPage, 'PUBLICATIONS', 'publications', `${breadcrumb(publicationPage, 'Publications')}<section>${heading('PUBLICATIONS', publicationPage, home, 'Back to résumé')}${publicationContent(publicationPage)}</section>`));
for (const item of publications) {
  const page = `publications/${item.id}/index.html`;
  pages.set(page, shell(page, item.title, 'publications', `${breadcrumb(page, 'Publication', { label: 'Publications', target: publicationPage })}<article class="publication-entry"><h2 class="detail-title">${item.url ? `<a href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">${escape(item.title)}</a>` : escape(item.title)}</h2><p class="publication-authors">${publicationAuthors(item)}</p>${publicationVenue(item)}</article><p class="return-link"><a href="${escape(relativeLink(page, publicationPage))}">← Back to publications</a></p>`));
}

const notesPage = 'notes/index.html';
pages.set(notesPage, shell(notesPage, 'Notes', 'notes', `<section>${heading('NOTES', notesPage, home, 'Back to résumé')}${notes.length ? noteList(notesPage, notes, true) : '<p class="empty">No notes yet.</p>'}</section>`));
for (const note of notes) {
  const page = `notes/${note.id}/index.html`;
  const rendered = renderNote(note, notes, page, relativeLink);
  pages.set(page, shell(page, note.title, 'notes', `${breadcrumb(page, note.title, { label: 'Notes', target: notesPage })}<article class="note-article"><header><h2 class="detail-title">${escape(note.title)}</h2><div class="note-meta"><time datetime="${escape(note.date)}">${escape(note.date)}</time><span>${escape(note.tags.join(' · '))}</span><a href="${escape(relativeLink(page, `notes/_sources/${note.id}.md`))}" download="${escape(note.id)}.md">Download Markdown</a></div><p class="note-summary">${escape(note.summary)}</p></header>${rendered.toc}<div class="markdown-body">${rendered.html}</div></article><p class="return-link"><a href="${escape(relativeLink(page, notesPage))}">← Back to notes</a></p>`));
}

await mkdir(output, { recursive: true });
let previousPages = [];
try { previousPages = JSON.parse(await readFile(path.join(output, 'pages.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
const katexDirectory = path.join(output, 'assets', 'katex');
await mkdir(katexDirectory, { recursive: true });
await cp(path.join(root, 'node_modules/katex/dist/katex.min.css'), path.join(katexDirectory, 'katex.min.css'));
await cp(path.join(root, 'node_modules/katex/dist/fonts'), path.join(katexDirectory, 'fonts'), { recursive: true });
await cp(path.join(root, 'node_modules/katex/LICENSE'), path.join(katexDirectory, 'LICENSE.txt'));
await writeFile(path.join(output, 'assets', 'styles.css'), await readFile(path.join(root, 'src', 'styles.css')));
for (const [filename, html] of pages) {
  const target = path.join(output, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
}
await mkdir(path.join(output, 'notes', '_sources'), { recursive: true });
for (const note of notes) await writeFile(path.join(output, 'notes', '_sources', `${note.id}.md`), note.source, 'utf8');
// 清理上次构建的失效页面，避免已匿名化的真实信息仍可通过旧链接访问。
for (const filename of previousPages) {
  if (pages.has(filename)) continue;
  const stale = path.resolve(output, filename);
  if (!stale.startsWith(path.resolve(output) + path.sep) || !filename.endsWith('.html')) throw new Error('Invalid previous output path');
  await unlink(stale).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
await writeFile(path.join(output, 'pages.json'), JSON.stringify([...pages.keys()], null, 2) + '\n');
console.log(`Built ${pages.size} pages in ${output}`);
