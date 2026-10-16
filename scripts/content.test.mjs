import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm, cp } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument, parseRecord, parseEducation, parseSkills, parseAwards, parsePublications, parseHomeOrder, parseProfile, loadSiteContent } from './content.mjs';
import { renderMarkdown } from './notes.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const relativeLink = (page, target) => path.posix.relative(path.posix.dirname(page), target);
const run = promisify(execFile);

test('profile keeps existing fields and accepts additional Markdown contact links', () => {
  const header = '---\nname: Anonymous\nphone: +86 12345678900\nemail: hello@example.com\nwebsite: https://example.com/\ngithub: https://github.com/\n---\n';
  assert.deepEqual(parseProfile(header).contacts, []);
  const profile = parseProfile(header + '\n## Contacts\n\n- [LinkedIn](https://www.linkedin.com/)\n- [Another email](mailto:other@example.com)\n- [Office](tel:+8612345678900)');
  assert.equal(profile.phone, '+86 12345678900');
  assert.equal(profile.github.label, 'GitHub');
  assert.deepEqual(profile.contacts, [
    { label: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { label: 'Another email', url: 'mailto:other@example.com' },
    { label: 'Office', url: 'tel:+8612345678900' },
  ]);
  assert.throws(() => parseProfile(header + '\n## Contacts\n- [Unsafe](javascript:alert)'), /contact as/);
  assert.throws(() => parseProfile(header + '\n## Contacts\n- [Relative](somewhere.html)'), /Contact links must/);
  assert.throws(() => parseProfile(header + '\n## Contacts\n- Plain text'), /contact as/);
  assert.throws(() => parseProfile(header + '\n## Other\n- [Example](https://example.com/)'), /## Contacts/);
});

test('homepage section order accepts moving complete Markdown list lines', async () => {
  const source = await readFile(path.join(root, 'content/home.md'), 'utf8');
  const current = parseHomeOrder(source);
  const reordered = ['publications', ...current.filter(id => id !== 'publications')];
  assert.deepEqual(parseHomeOrder('\uFEFF' + reordered.map(id => `- ${id}`).join('\r\n\r\n')), reordered);
  assert.throws(() => parseHomeOrder(source + '\n- skills'), /content\/home.md: Duplicate homepage section "skills"/);
  assert.throws(() => parseHomeOrder(source.replace('- skills', '- skill')), /content\/home.md: Unknown homepage section "skill"/);
  assert.throws(() => parseHomeOrder(source.replace('- skills', '')), /content\/home.md: Missing homepage sections: skills/);
  assert.throws(() => parseHomeOrder(''), /Missing homepage sections/);
  assert.throws(() => parseHomeOrder(source.replace('- skills', '  - skills')), /Line \d+: use one section per line/);
});

test('record summary is separated without treating fenced headings as sections', () => {
  const record = parseRecord('---\r\ntitle: "Test: Project"\r\norder: 2\r\n---\r\n\r\n## Summary\r\n\r\n- A **bold** point.\r\n\r\n```markdown\r\n## Not a section\r\n```\r\n\r\n## RESULTS\r\n\r\nDetails.', 'test-project.md', 'projects');
  assert.equal(record.id, 'test-project');
  assert.equal(record.title, 'Test: Project');
  assert.equal(record.order, 2);
  assert.match(record.summaryMarkdown, /## Not a section/);
  assert.equal(record.body, '## RESULTS\n\nDetails.');
  const quoted = parseRecord('---\ntitle: Example\n---\n## Summary\n- Overview\n## DETAILS\n> ## Summary\n> Quoted heading.', 'example.md', 'projects');
  assert.match(quoted.body, /> ## Summary/);
});

test('metadata mistakes fail with the filename instead of hiding content', () => {
  assert.throws(() => parseDocument('---\ntitel: Oops\n---', ['title'], ['title'], 'oops.md'), /oops.md: Expected fields/);
  assert.throws(() => parseDocument('---\ntitle: One\ntitle: Two\n---', ['title'], ['title'], 'oops.md'), /Duplicate field/);
  assert.throws(() => parseRecord('---\ntitle: Test\norder: first\n---', 'test.md', 'projects'), /order/);
  assert.throws(() => parseRecord('---\ntitle: Test\n---', 'test.md', 'extracurricular-activities'), /role/);
  assert.throws(() => parseRecord('---\ntitle: Test\n---\n## Summary\n- A\n## Summary\n- B', 'test.md', 'projects'), /Summary only once/);
  assert.throws(() => parseEducation('degree: Lost heading'), /Use ## headings/);
});

test('education and skills preserve the résumé fields and course groups', () => {
  const entries = parseEducation('## University\n\nlocation: City\ndegree: Engineering\ndates: 2021 - 2025\n\n### Courses\n\n- **Mechanics:** Statics, Dynamics');
  assert.deepEqual(entries[0], { institution: 'University', location: 'City', degree: 'Engineering', dates: '2021 - 2025', courses: [['Mechanics', 'Statics, Dynamics']] });
  assert.deepEqual(parseSkills('- **Languages:** Python, MATLAB'), [['Languages', 'Python, MATLAB']]);
});

test('award tables accept escaped pipes and reject missing dates', () => {
  assert.deepEqual(parseAwards('## Honors\n\n| Name | Date |\n| --- | --- |\n| Research \\| Engineering Award | 2026 |'), { honors: [['Research | Engineering Award', '2026']], awards: [] });
  assert.throws(() => parseAwards('## Awards\n\n| Name | Date |\n| --- | --- |\n| Award | |'), /name and a date/);
  assert.throws(() => parseAwards('## Other\n\nText'), /Honors and/);
});

test('publication authors support bold Markdown while escaping HTML', () => {
  const [paper] = parsePublications('## Paper Title\n\nid: sample-paper\nauthors: **Author A**, <script>test</script>\njournal: Example Journal\nyear: 2026');
  assert.equal(paper.id, 'sample-paper');
  assert.match(paper.authorsHtml, /<strong>Author A<\/strong>/);
  assert.doesNotMatch(paper.authorsHtml, /<script>/);
  assert.throws(() => parsePublications('## Paper\nid: paper\nauthors: Author\njournal: Journal\nyear: next'), /four digits/);
});

test('project template renders images, formulas and note links in a detail route', async () => {
  const record = parseRecord(await readFile(path.join(root, 'templates/project.md'), 'utf8'), 'my-project.md', 'projects');
  const rendered = renderMarkdown(record, [{ id: 'media-math-test' }], 'projects/my-project/index.html', relativeLink);
  assert.match(rendered.html, /katex-mathml/);
  assert.match(rendered.html, /src="\.\.\/\.\.\/assets\/images\/note-demo.svg"/);
  assert.match(rendered.html, /href="\.\.\/\.\.\/notes\/media-math-test\/index.html"/);
  assert.doesNotMatch(rendered.html, /<h2[^>]*>Summary</);
  assert.throws(() => renderMarkdown({ id: 'unsafe', body: '![Image](assets/../private.png)' }, [], 'index.html', relativeLink), /Invalid image path/);
  assert.throws(() => renderMarkdown({ id: 'broken', body: '[Missing](note:missing)' }, [], 'index.html', relativeLink), /Unknown note link/);
});

test('code blocks show their language, escape source and fold only beyond twenty lines', () => {
  const render = body => renderMarkdown({ id: 'code-test', body }, [], 'notes/code-test/index.html', relativeLink).html;
  const short = render('```py\nprint("<script>& test")\n```');
  assert.match(short, /class="code-language">Python<\/span>/);
  assert.match(short, /class="language-py"/);
  assert.match(short, /&lt;script&gt;&amp; test/);
  assert.match(short, /class="code-copy"[^>]* hidden>Copy/);
  assert.doesNotMatch(short, /data-collapsible|<script>/);
  const twenty = Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n');
  assert.doesNotMatch(render('```text\n' + twenty + '\n```'), /data-collapsible/);
  const long = render('```python\n' + twenty + '\nlast line\n```');
  assert.match(long, /data-code-lines="21" data-collapsible="true" data-expanded="false"/);
  assert.match(long, /last line\n<\/code>/);
  assert.match(long, /aria-expanded="false" hidden>Show all 21 lines/);
  assert.match(render('```\nplain\n```'), /class="code-language">Plain text/);
  assert.match(render('    indented code'), /class="code-language">Plain text/);
  assert.match(render('```constructor\nvalue\n```'), /class="code-language">constructor/);
});

test('PDF attachment links work from nested note and project pages without replacing the source page', () => {
  for (const page of ['notes/test/index.html', 'projects/test/index.html']) {
    const result = renderMarkdown({ id: 'pdf-test', body: '[Local PDF](assets/documents/pdf-link-test.pdf#page=1)\n\n[External PDF](https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf)\n\n[Other asset](assets/images/note-demo.svg)' }, [], page, relativeLink).html;
    assert.match(result, /href="\.\.\/\.\.\/assets\/documents\/pdf-link-test.pdf#page=1" target="_blank" rel="noopener noreferrer"/);
    assert.match(result, /href="https:\/\/www.w3.org\/WAI\/ER\/tests\/xhtml\/testfiles\/resources\/pdf\/dummy.pdf" target="_blank" rel="noopener noreferrer"/);
    assert.match(result, /href="\.\.\/\.\.\/assets\/images\/note-demo.svg">Other asset/);
  }
});

test('adding, editing, ordering and removing Markdown records needs no code changes', async () => {
  const base = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(base, 'cvblog-content-'));
  try {
    for (const category of ['projects', 'work-experience', 'extracurricular-activities']) await mkdir(path.join(directory, category));
    for (const file of ['education.md', 'skills.md', 'honors-and-awards.md', 'publications.md']) await writeFile(path.join(directory, file), '');
    await writeFile(path.join(directory, 'profile.md'), '---\nname: Anonymous\n---');
    await cp(path.join(root, 'content/home.md'), path.join(directory, 'home.md'));
    const make = (title, order) => `---\ntitle: ${title}\norder: ${order}\n---\n## Summary\n- A summary.\n## DETAILS\nA detail paragraph.`;
    const first = path.join(directory, 'projects/first.md');
    const second = path.join(directory, 'projects/second.md');
    await writeFile(first, make('First', 20));
    await writeFile(second, make('Second', 10));
    assert.deepEqual((await loadSiteContent(directory)).projects.map(item => item.id), ['second', 'first']);
    await writeFile(first, make('Updated title', 1));
    assert.equal((await loadSiteContent(directory)).projects[0].title, 'Updated title');
    await rm(second);
    assert.equal((await loadSiteContent(directory)).projects.length, 1);
  } finally {
    if (!directory.startsWith(base + path.sep) || !path.basename(directory).startsWith('cvblog-content-')) throw new Error('Unsafe test cleanup path');
    await rm(directory, { recursive: true, force: true });
  }
});

test('real builds follow home.md order and reject errors without replacing the last working output', async () => {
  const base = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(base, 'cvblog-home-'));
  try {
    for (const entry of ['scripts', 'src', 'content', 'notes', 'assets', 'package.json']) {
      await cp(path.join(root, entry), path.join(directory, entry), { recursive: true });
    }
    await cp(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), { recursive: true });
    const homeFile = path.join(directory, 'content/home.md');
    const original = await readFile(homeFile, 'utf8');
    const build = () => run(process.execPath, [path.join(directory, 'scripts/build.mjs')], { cwd: directory });
    const check = () => run(process.execPath, [path.join(directory, 'scripts/check.mjs')], { cwd: directory });
    const readHome = () => readFile(path.join(directory, 'dist/index.html'), 'utf8');
    const sectionOrder = html => [...html.matchAll(/<section data-home-section="([^"]+)"/g)].map(match => match[1]);
    await build();
    await check();
    assert.deepEqual(sectionOrder(await readHome()), parseHomeOrder(original));
    const category = await readFile(path.join(directory, 'dist/projects/index.html'), 'utf8');
    const profileFile = path.join(directory, 'content/profile.md');
    await writeFile(profileFile, (await readFile(profileFile, 'utf8')) + '\n## Contacts\n\n- [LinkedIn](https://www.linkedin.com/)\n');
    const reordered = ['notes', 'publications', 'skills', ...parseHomeOrder(original).filter(id => !['notes', 'publications', 'skills'].includes(id))];
    await writeFile(homeFile, reordered.map(id => `- ${id}`).join('\n') + '\n');
    await build();
    await check();
    const workingHome = await readHome();
    assert.deepEqual(sectionOrder(workingHome), reordered);
    assert.match(workingHome, /data-home-section="notes" class="resume-notes"/);
    assert.match(workingHome, /<a href="https:\/\/www.linkedin.com\/" target="_blank" rel="noopener noreferrer">LinkedIn<\/a>/);
    assert.match(workingHome, /<script src="assets\/contacts.js" defer><\/script>/);
    assert.equal((await readFile(path.join(directory, 'dist/projects/index.html'), 'utf8')).replace(/<div class="contact"[\s\S]*?<\/div>/, ''), category.replace(/<div class="contact"[\s\S]*?<\/div>/, ''));
    for (const [source, error] of [
      [original + '\n- skills', /Duplicate homepage section/],
      [original.replace('- skills', '- skill'), /Unknown homepage section/],
      [original.replace('- skills', ''), /Missing homepage sections/],
    ]) {
      await writeFile(homeFile, source);
      await assert.rejects(build(), error);
      assert.equal(await readHome(), workingHome);
    }
  } finally {
    if (!directory.startsWith(base + path.sep) || !path.basename(directory).startsWith('cvblog-home-')) throw new Error('Unsafe test cleanup path');
    await rm(directory, { recursive: true, force: true });
  }
});
