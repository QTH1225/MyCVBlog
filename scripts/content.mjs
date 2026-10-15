import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: false, linkify: false });
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const normalize = text => text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
const fail = (file, message) => { throw new Error(`${file}: ${message}`); };
const plain = text => (md.parseInline(text, {})[0]?.children || []).map(token => token.type === 'softbreak' ? ' ' : token.content).join('');

// Intentionally supports single-line key/value fields, not arbitrary YAML.
export function parseFields(text, allowed, required, file) {
  const values = {};
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!match || !allowed.includes(match[1])) fail(file, `Expected fields: ${allowed.join(', ')}; received ${line}`);
    const [, key, raw] = match;
    if (Object.hasOwn(values, key)) fail(file, `Duplicate field "${key}"`);
    values[key] = raw.trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  for (const key of required) if (!values[key]) fail(file, `Missing required field "${key}"`);
  return values;
}

export function parseDocument(text, allowed, required, file) {
  const source = normalize(text);
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!match) fail(file, 'Start the file with --- metadata ---; copy a template from templates/');
  return { metadata: parseFields(match[1], allowed, required, file), body: source.slice(match[0].length) };
}

// Token positions keep headings inside code fences from splitting a document.
export function splitSections(body, level = 2) {
  const lines = normalize(body).split('\n');
  const tokens = md.parse(normalize(body), {});
  const headings = [];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open' && token.level === 0 && token.tag === `h${level}`) headings.push({ title: plain(tokens[index + 1].content), start: token.map[0], bodyStart: token.map[1] });
  }
  return headings.map((heading, index) => ({ ...heading, body: lines.slice(heading.bodyStart, headings[index + 1]?.start ?? lines.length).join('\n').trim() }));
}

function documentSections(body, file) {
  const sections = splitSections(body);
  if (body.trim() && !sections.length) fail(file, 'Use ## headings to separate entries');
  if (sections.length && body.split('\n').slice(0, sections[0].start).join('\n').trim()) fail(file, 'Put entry content below its ## heading');
  return sections;
}

function listItems(body, file) {
  const tokens = md.parse(body, {});
  const allowed = ['bullet_list_open', 'bullet_list_close', 'list_item_open', 'list_item_close', 'paragraph_open', 'paragraph_close', 'inline'];
  if (tokens.some(token => !allowed.includes(token.type)) || (tokens.length && tokens[0].type !== 'bullet_list_open')) fail(file, 'Use a Markdown bullet list (- Label: value)');
  return tokens.filter(token => token.type === 'inline').map(token => plain(token.content));
}

export function parseEducation(body, file = 'education.md') {
  return documentSections(body, file).map(section => {
    const courses = splitSections(section.body, 3);
    if (courses.length > 1 || (courses.length && courses[0].title.toLowerCase() !== 'courses')) fail(file, 'The only supported subsection is ### Courses');
    const fields = parseFields(section.body.split('\n').slice(0, courses[0]?.start).join('\n'), ['location', 'degree', 'dates'], ['degree', 'dates'], file);
    return { institution: section.title, ...fields, courses: courses.length ? listItems(courses[0].body, file).map(line => {
      const colon = line.indexOf(':');
      if (colon < 1 || !line.slice(colon + 1).trim()) fail(file, 'Write each course group as - Label: courses');
      return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
    }) : undefined };
  });
}

export function parseSkills(body, file = 'skills.md') {
  return listItems(body, file).map(line => {
    const colon = line.indexOf(':');
    if (colon < 1 || !line.slice(colon + 1).trim()) fail(file, 'Write each skill as - Label: description');
    return [line.slice(0, colon).trim(), line.slice(colon + 1).trim()];
  });
}

function awardTable(body, file) {
  if (!body.trim()) return [];
  const tokens = md.parse(body, {});
  if (tokens[0]?.type !== 'table_open' || tokens.at(-1)?.type !== 'table_close' || tokens.filter(token => token.type === 'table_open').length !== 1) fail(file, 'Use one table with Name and Date columns');
  if (tokens.filter(token => token.type === 'th_open').length !== 2) fail(file, 'The award table needs exactly two columns: Name and Date');
  const cells = tokens.filter(token => token.type === 'inline').map(token => plain(token.content));
  if (cells[0]?.toLowerCase() !== 'name' || cells[1]?.toLowerCase() !== 'date') fail(file, 'The award table headers must be Name and Date');
  const rows = [];
  for (let index = 2; index < cells.length; index += 2) {
    if (!cells[index] || !cells[index + 1]) fail(file, 'Each award needs a name and a date');
    rows.push([cells[index], cells[index + 1]]);
  }
  return rows;
}

export function parseAwards(body, file = 'honors-and-awards.md') {
  const result = { honors: [], awards: [] };
  const seen = new Set();
  for (const section of documentSections(body, file)) {
    const key = section.title.toLowerCase();
    if (!['honors', 'awards'].includes(key) || seen.has(key)) fail(file, 'Use each heading once: ## Honors and ## Awards');
    seen.add(key);
    result[key] = awardTable(section.body, file);
  }
  return result;
}

export function parsePublications(body, file = 'publications.md') {
  return documentSections(body, file).map(section => {
    const fields = parseFields(section.body, ['id', 'authors', 'journal', 'year', 'url'], ['id', 'authors', 'journal', 'year'], file);
    if (!slug.test(fields.id)) fail(file, 'Publication id must use lowercase letters, numbers, and hyphens');
    if (!/^\d{4}$/.test(fields.year)) fail(file, 'Publication year must contain four digits');
    return { ...fields, title: section.title, authorsHtml: md.renderInline(fields.authors) };
  });
}

export function parseRecord(source, filename, category) {
  const id = path.basename(filename, '.md');
  if (!slug.test(id)) fail(filename, 'Filename must use lowercase letters, numbers, and hyphens');
  const required = category === 'extracurricular-activities' ? ['title', 'role', 'organization', 'dates'] : ['title'];
  const { metadata, body } = parseDocument(source, ['title', 'order', 'subtitle', 'dates', 'role', 'organization', 'location', 'funding'], required, filename);
  if (metadata.order !== undefined && (!/^\d+$/.test(metadata.order) || !Number.isSafeInteger(Number(metadata.order)))) fail(filename, 'order must be a nonnegative whole number');
  const sections = splitSections(body);
  const summaries = sections.filter(section => section.title.toLowerCase() === 'summary');
  if (summaries.length > 1) fail(filename, 'Use ## Summary only once');
  const summary = summaries[0];
  const lines = body.split('\n');
  const nextSection = summary && sections[sections.indexOf(summary) + 1];
  const detailBody = summary ? [...lines.slice(0, summary.start), ...lines.slice(nextSection?.start ?? lines.length)].join('\n').trim() : body.trim();
  return { ...metadata, id, order: Number(metadata.order ?? 999), summaryMarkdown: summary?.body || '', body: detailBody };
}

export async function loadSiteContent(directory) {
  const read = name => readFile(path.join(directory, name), 'utf8').then(normalize);
  const profileDocument = parseDocument(await read('profile.md'), ['name', 'phone', 'email', 'website', 'websiteLabel', 'github', 'githubLabel'], ['name'], 'content/profile.md');
  if (profileDocument.body.trim()) fail('content/profile.md', 'Profile uses metadata fields only');
  const fields = profileDocument.metadata;
  const profile = { name: fields.name, phone: fields.phone, email: fields.email,
    website: fields.website ? { label: fields.websiteLabel || fields.website, url: fields.website } : undefined,
    github: fields.github ? { label: fields.githubLabel || 'GitHub', url: fields.github } : undefined };
  const records = async category => {
    const filenames = (await readdir(path.join(directory, category))).filter(name => name.endsWith('.md'));
    const items = await Promise.all(filenames.map(async filename => parseRecord(await read(`${category}/${filename}`), filename, category)));
    return items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  };
  return { profile,
    education: parseEducation(await read('education.md')),
    skills: parseSkills(await read('skills.md')),
    ...parseAwards(await read('honors-and-awards.md')),
    publications: parsePublications(await read('publications.md')),
    projects: await records('projects'), workExperience: await records('work-experience'), activities: await records('extracurricular-activities') };
}
