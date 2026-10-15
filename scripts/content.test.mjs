import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument, parseRecord, parseEducation, parseSkills, parseAwards, parsePublications, loadSiteContent } from './content.mjs';
import { renderMarkdown } from './notes.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const relativeLink = (page, target) => path.posix.relative(path.posix.dirname(page), target);

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

test('adding, editing, ordering and removing Markdown records needs no code changes', async () => {
  const base = path.resolve(tmpdir());
  const directory = await mkdtemp(path.join(base, 'cvblog-content-'));
  try {
    for (const category of ['projects', 'work-experience', 'extracurricular-activities']) await mkdir(path.join(directory, category));
    for (const file of ['education.md', 'skills.md', 'honors-and-awards.md', 'publications.md']) await writeFile(path.join(directory, file), '');
    await writeFile(path.join(directory, 'profile.md'), '---\nname: Anonymous\n---');
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
