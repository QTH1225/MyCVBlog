import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSiteContent } from './content.mjs';
import { labels } from '../src/labels.mjs';
import { loadNotes, renderMarkdown } from './notes.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const allPages = new Map();
const notes = await loadNotes(path.join(root, 'notes'));
const content = await loadSiteContent(path.join(root, 'content'));
const escape = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function safeUrl(url) {
  if (!/^(https?:\/\/|mailto:|tel:)/i.test(url)) throw new Error(`Unsupported external URL: ${url}`);
  return escape(url);
}

function validateRecords(records, category) {
  const ids = new Set();
  for (const record of records) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id) || ids.has(record.id)) throw new Error(`Invalid or duplicate ${category} id: ${record.id}`);
    if (!record.title) throw new Error(`Missing title for ${category}/${record.id}`);
    ids.add(record.id);
  }
}

function buildSite(content, notes) {
  const { profile, homeOrder, education, skills, projects, workExperience, activities, honors, awards, publications } = content;
  const t = labels;
  const addPage = (route, html) => allPages.set(route, html);
  for (const [category, records] of Object.entries({ projects, workExperience, activities, publications })) validateRecords(records, category);

  function relativeLink(page, target = 'index.html') {
    return path.posix.relative(path.posix.dirname(page), target) || 'index.html';
  }
  function shell(page, title, active, body) {
    const link = target => escape(relativeLink(page, target));
    const contacts = [
      profile.phone ? (/^\+?[\d\s()-]+$/.test(profile.phone) ? `<a class="phone" href="tel:${escape(profile.phone.replace(/[^\d+]/g, ''))}">${escape(profile.phone)}</a>` : `<span class="phone">${escape(profile.phone)}</span>`) : '',
      profile.email ? `<a href="mailto:${escape(profile.email)}">${escape(profile.email)}</a>` : '',
      profile.website ? `<a href="${safeUrl(profile.website.url)}" target="_blank" rel="noopener noreferrer">${escape(profile.website.label)}</a>` : '',
      profile.github ? `<a href="${safeUrl(profile.github.url)}" target="_blank" rel="noopener noreferrer">${escape(profile.github.label)}</a>` : '',
    ].filter(Boolean);
    return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="description" content="${escape(`${title} — ${profile.name} · ${t.siteDescription}`)}">
  <meta name="theme-color" content="#ffffff">
  <title>${escape(title)} | ${escape(profile.name)}</title>
  <link rel="icon" href="${link('assets/favicon.svg')}" type="image/svg+xml">
  <link rel="preload" href="${link('assets/fonts/charter-regular.woff2')}" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="${link('assets/styles.css')}">
  ${active === 'notes' || body.includes('katex-mathml') ? `<link rel="stylesheet" href="${link('assets/katex/katex.min.css')}">` : ''}
</head>
<body id="top">
  <a class="skip-link" href="#main">${escape(t.skipContent)}</a>
  <div class="paper">
    <header class="identity">
      <h1><a href="${link('index.html')}" aria-label="${escape(profile.name)}, ${escape(t.backResume.toLowerCase())}">${escape(profile.name)}</a></h1>
      <div class="contact" aria-label="${escape(t.contactInformation)}">${contacts.length ? contacts.join('<span class="separator" aria-hidden="true">-</span>') : `<span>${escape(t.hiddenDetails)}</span>`}</div>
    </header>
    <main id="main" tabindex="-1">${body}</main>
    <footer class="footer"><span><a href="${link('index.html')}" class="footer-name">${escape(profile.name)}</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/${t.licenseDeed}" rel="license noopener noreferrer" target="_blank">CC BY-SA 4.0</a></span><a href="#top" aria-label="${escape(t.backTop)}">${escape(t.backTop)} ↑</a></footer>
  </div>
</body>
</html>\n`;
  }
  function heading(text, page, target, action = 'View all') {
    if (!target) return `<h2 class="section-heading">${escape(text)}</h2>`;
    const all = action === 'View all';
    const label = all ? `${t.viewAll} ${text.toLowerCase()}` : t.backResume;
    return `<h2 class="section-heading linked"><span>${escape(text)}</span><a class="section-action" href="${escape(relativeLink(page, target))}" aria-label="${escape(label)}">${all ? `${escape(t.viewAll)} <span aria-hidden="true">→</span>` : `<span aria-hidden="true">←</span> ${escape(t.backResume)}`}</a></h2>`;
  }
  function detailHeading(page, title, category, url) {
    const titleContent = url ? `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${escape(title)}</a>` : escape(title);
    return `<div class="detail-heading"><h2 class="detail-title">${titleContent}</h2><a class="section-action" href="${escape(relativeLink(page, category.target))}" aria-label="${escape(t.backTo(category.label))}"><span aria-hidden="true">←</span> ${escape(t.backTo(category.label))}</a></div>`;
  }
  const markdown = (body, page, id) => renderMarkdown({ body, id }, notes, page, relativeLink).html;
  function educationContent() {
    return education.map(item => `<article class="entry"><div class="entry-top"><h3 class="entry-title">${escape(item.institution)}</h3><span class="location">${escape(item.location)}</span></div><div class="entry-sub"><span>${escape(item.degree)}</span><span class="dates">${escape(item.dates)}</span></div>${item.courses ? `<div class="courses"><p>${escape(t.coreCourses)}</p>${item.courses.map(([label, courses]) => `<p>${escape(label)}: ${escape(courses)}</p>`).join('')}</div>` : ''}</article>`).join('');
  }
  function recordContent(item, page, category) {
    const subtitle = [item.subtitle || [item.role, item.organization].filter(Boolean).join(', '), item.location, item.funding].filter(Boolean).join(', ');
    const summary = markdown(item.summaryMarkdown, page, `${category}/${item.id}`).replace('<ul>', '<ul class="resume-list">');
    return `<article class="entry"><h3 class="entry-title"><a href="${escape(relativeLink(page, `${category}/${item.id}/index.html`))}">${escape(item.title)}</a></h3><div class="entry-sub"><span>${escape(subtitle)}</span><span class="dates">${escape(item.dates)}</span></div>${summary}</article>`;
  }
  function activityPreview() {
    if (!activities.length) return `<p class="empty">${escape(t.emptyActivities)}</p>`;
    return `<ul class="resume-list activities-preview">${activities.map(item => `<li><div class="activity-row"><span class="activity-description"><strong>${escape(item.role)}</strong> in ${escape(item.organization)}</span><span class="dates">${escape(item.dates)}</span></div></li>`).join('')}</ul>`;
  }
  function awardsContent(honorItems = honors, awardItems = awards) {
    if (!honorItems.length && !awardItems.length) return `<p class="empty">${escape(t.hiddenDetails)}</p>`;
    const list = items => `<ul class="resume-list award-list">${items.map(([name, date]) => `<li><div class="award-row"><span class="award-name">${escape(name)}</span><span class="dates">${escape(date)}</span></div></li>`).join('')}</ul>`;
    return `${honorItems.length ? `<h3 class="minor-heading">${escape(t.honorsLabel)}</h3>${list(honorItems)}` : ''}${awardItems.length ? `<h3 class="minor-heading">${escape(t.awardsLabel)}</h3>${list(awardItems)}` : ''}`;
  }
  const publicationAuthors = item => item.authorsHtml;
  const publicationVenue = item => `<p class="publication-venue"><strong>${escape(item.journal)}</strong>, ${escape(item.year)}.</p>`;
  function publicationContent(page) {
    if (!publications.length) return `<p class="empty">${escape(t.emptyPublications)}</p>`;
    return publications.map(item => `<article class="entry publication-entry"><h3 class="entry-title"><a href="${item.url ? safeUrl(item.url) : escape(relativeLink(page, `publications/${item.id}/index.html`))}"${item.url ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(item.title)}</a></h3><p class="publication-authors">${publicationAuthors(item)}</p>${publicationVenue(item)}</article>`).join('');
  }
  function breadcrumb(page, label, category) {
    return `<nav class="breadcrumb" aria-label="${escape(t.breadcrumb)}"><a href="${escape(relativeLink(page, 'index.html'))}">${escape(t.resume)}</a><span aria-hidden="true">/</span>${category ? `<a href="${escape(relativeLink(page, category.target))}">${escape(category.label)}</a><span aria-hidden="true">/</span>` : ''}${escape(label)}</nav>`;
  }
  function noteList(page, items = notes) {
    return `<div class="note-list note-list-compact">${items.map(note => `<article class="note-entry note-entry-compact"><div class="entry-top"><h3 class="entry-title"><a href="${escape(relativeLink(page, `notes/${note.id}/index.html`))}">${escape(note.title)}</a></h3><time class="dates" datetime="${escape(note.date)}">${escape(note.date)}</time></div></article>`).join('')}</div>`;
  }

  const home = 'index.html';
  const homeContent = {
    education: `<section data-home-section="education">${heading(t.education)}${educationContent()}</section>`,
    skills: `<section data-home-section="skills" class="skills">${heading(t.skills)}${skills.map(([label, value]) => `<p><strong>${escape(label)}:</strong> ${escape(value).replace('LaTeX', '<span class="latex" aria-label="LaTeX">L<span class="a">A</span>T<span class="e">E</span>X</span>')}</p>`).join('')}</section>`,
    projects: `<section data-home-section="projects">${heading(t.projects, home, 'projects/index.html')}${projects.map(item => recordContent(item, home, 'projects')).join('') || `<p class="empty">${escape(t.emptyProjects)}</p>`}</section>`,
    'work-experience': `<section data-home-section="work-experience">${heading(t.work, home, 'work-experience/index.html')}${workExperience.map(item => recordContent(item, home, 'work-experience')).join('') || `<p class="empty">${escape(t.emptyWork)}</p>`}</section>`,
    'honors-and-awards': `<section data-home-section="honors-and-awards">${heading(t.awards, home, 'honors-and-awards/index.html')}${awardsContent(honors.slice(0, 5), awards.slice(0, 5))}</section>`,
    publications: `<section data-home-section="publications">${heading(t.publications, home, 'publications/index.html')}${publicationContent(home)}</section>`,
    'extracurricular-activities': `<section data-home-section="extracurricular-activities">${heading(t.activities, home, 'extracurricular-activities/index.html')}${activityPreview()}</section>`,
    notes: `<section data-home-section="notes" class="resume-notes">${heading(t.notes, home, 'notes/index.html')}${noteList(home, notes.slice(0, 5))}</section>`,
  };
  addPage(home, shell(home, t.resume, 'resume', `\n    ${homeOrder.map(id => homeContent[id]).join('\n    ')}`));

  for (const [category, label, active, records, empty, detailLabel] of [
    ['projects', t.projectList, 'projects', projects, t.emptyProjects, t.projectNotes],
    ['work-experience', t.work, 'work', workExperience, t.emptyWork, t.experienceDetails],
    ['extracurricular-activities', t.activities, 'activities', activities, t.emptyActivities, t.activityDetails],
  ]) {
    const page = `${category}/index.html`;
    addPage(page, shell(page, label, active, `${breadcrumb(page, label)}<section>${heading(label, page, home, 'back')}${records.map(item => recordContent(item, page, category)).join('') || `<p class="empty">${escape(empty)}</p>`}</section>`));
    for (const item of records) {
      const detailPage = `${category}/${item.id}/index.html`;
      const subtitle = item.subtitle || [item.role, item.organization].filter(Boolean).join(' · ');
      addPage(detailPage, shell(detailPage, item.title, active, `${breadcrumb(detailPage, detailLabel, { label, target: page })}<article><header>${detailHeading(detailPage, item.title, { label, target: page })}<p class="detail-subtitle">${escape(subtitle)}</p><div class="detail-meta">${[item.dates, item.location, item.funding].filter(Boolean).map(text => `<span>${escape(text)}</span>`).join('')}</div></header><div class="detail-body markdown-body record-markdown">${markdown(item.body, detailPage, `${category}/${item.id}`)}</div></article>`));
    }
  }
  const honorsPage = 'honors-and-awards/index.html';
  addPage(honorsPage, shell(honorsPage, t.awards, 'honors', `${breadcrumb(honorsPage, t.awardsBreadcrumb)}<section>${heading(t.awards, honorsPage, home, 'back')}${awardsContent()}</section>`));
  const publicationPage = 'publications/index.html';
  addPage(publicationPage, shell(publicationPage, t.publications, 'publications', `${breadcrumb(publicationPage, t.publicationsBreadcrumb)}<section>${heading(t.publications, publicationPage, home, 'back')}${publicationContent(publicationPage)}</section>`));
  for (const item of publications) {
    const page = `publications/${item.id}/index.html`;
    addPage(page, shell(page, item.title, 'publications', `${breadcrumb(page, t.publication, { label: t.publicationsBreadcrumb, target: publicationPage })}<article class="publication-entry">${detailHeading(page, item.title, { label: t.publicationsBreadcrumb, target: publicationPage }, item.url)}<p class="publication-authors">${publicationAuthors(item)}</p>${publicationVenue(item)}</article>`));
  }
  const notesPage = 'notes/index.html';
  addPage(notesPage, shell(notesPage, t.notesTitle, 'notes', `<section>${heading(t.notes, notesPage, home, 'back')}${notes.length ? noteList(notesPage) : `<p class="empty">${escape(t.emptyNotes)}</p>`}</section>`));
  for (const note of notes) {
    const page = `notes/${note.id}/index.html`;
    const rendered = renderMarkdown(note, notes, page, relativeLink, { contentsLabel: t.contents });
    addPage(page, shell(page, note.title, 'notes', `${breadcrumb(page, note.title, { label: t.notesTitle, target: notesPage })}<article class="note-article"><header>${detailHeading(page, note.title, { label: t.notesTitle, target: notesPage })}<div class="note-meta"><time datetime="${escape(note.date)}">${escape(note.date)}</time><span>${escape(note.tags.join(' · '))}</span><a href="${escape(relativeLink(page, `notes/_sources/${note.id}.md`))}" download="${escape(note.id)}.md">${escape(t.download)}</a></div><p class="note-summary">${escape(note.summary)}</p></header>${rendered.toc}<div class="markdown-body">${rendered.html}</div></article>`));
  }
}

buildSite(content, notes);
// Render and validate content before replacing the generated directory.
// A fresh output also removes deleted note sources, images, and old routes.
if (path.resolve(output) !== path.join(path.resolve(root), 'dist') || path.dirname(path.resolve(output)) !== path.resolve(root)) throw new Error('Output must be the project dist directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await writeFile(path.join(output, '.nojekyll'), '');
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
const katexDirectory = path.join(output, 'assets', 'katex');
await mkdir(katexDirectory, { recursive: true });
await cp(path.join(root, 'node_modules/katex/dist/katex.min.css'), path.join(katexDirectory, 'katex.min.css'));
await cp(path.join(root, 'node_modules/katex/dist/fonts'), path.join(katexDirectory, 'fonts'), { recursive: true });
await cp(path.join(root, 'node_modules/katex/LICENSE'), path.join(katexDirectory, 'LICENSE.txt'));
await writeFile(path.join(output, 'assets', 'styles.css'), await readFile(path.join(root, 'src', 'styles.css')));
for (const [filename, html] of allPages) {
  const target = path.join(output, filename);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
}
const sourceDirectory = path.join(output, 'notes', '_sources');
await mkdir(sourceDirectory, { recursive: true });
for (const note of notes) await writeFile(path.join(sourceDirectory, `${note.id}.md`), note.source, 'utf8');
await writeFile(path.join(output, 'pages.json'), JSON.stringify([...allPages.keys()], null, 2) + '\n');
console.log(`Built ${allPages.size} English pages in ${output}`);
