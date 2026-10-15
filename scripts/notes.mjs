import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import texmath from 'markdown-it-texmath';
import katex from 'katex';

const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// 只解析单行元数据，避免引入完整 YAML 配置规则。正文按标准 Markdown 处理。
export async function loadNotes(directory) {
  const filenames = (await readdir(directory)).filter(filename => filename.endsWith('.md'));
  const notes = [];
  for (const filename of filenames) {
    const id = filename.slice(0, -3);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid note filename: ${filename}`);
    const source = (await readFile(path.join(directory, filename), 'utf8')).replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    if (!match) throw new Error(`Missing front matter in ${filename}`);
    const metadata = {};
    for (const line of match[1].split('\n')) {
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      const field = line.match(/^(title|date|summary|tags):\s*(.*)$/);
      if (!field) throw new Error(`Unsupported front matter in ${filename}: ${line}`);
      if (Object.hasOwn(metadata, field[1])) throw new Error(`Duplicate ${field[1]} in ${filename}`);
      metadata[field[1]] = field[2].trim().replace(/^(["'])(.*)\1$/, '$2');
    }
    if (!metadata.title || !metadata.summary || !/^\d{4}-\d{2}-\d{2}$/.test(metadata.date || '') || new Date(metadata.date).toISOString().slice(0, 10) !== metadata.date) {
      throw new Error(`Note ${filename} needs title, valid YYYY-MM-DD date, and summary`);
    }
    notes.push({ id, ...metadata, tags: (metadata.tags || '').split(/[,，]/).map(tag => tag.trim()).filter(Boolean), body: source.slice(match[0].length), source });
  }
  return notes.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

export function renderMarkdown(note, notes, page, relativeLink, { contentsLabel = 'Contents' } = {}) {
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false }).use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: true, trust: false, strict: 'ignore', output: 'htmlAndMathml' },
  });
  const imageRenderer = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const src = token.attrGet('src');
    if (/^assets\//.test(src)) {
      if (src.includes('..') || src.includes('\\') || src.includes('?') || src.includes('#')) throw new Error(`Invalid image path in ${note.id}: ${src}`);
      token.attrSet('src', relativeLink(page, src));
    } else if (!/^https?:\/\//.test(src)) {
      throw new Error(`Images in ${note.id} must use assets/... or https:// URLs`);
    }
    token.attrSet('loading', 'lazy');
    token.attrSet('decoding', 'async');
    return imageRenderer(tokens, index, options, env, renderer);
  };
  const linkRenderer = md.renderer.rules.link_open || ((tokens, index, options, env, renderer) => renderer.renderToken(tokens, index, options));
  md.renderer.rules.link_open = (tokens, index, options, env, renderer) => {
    const token = tokens[index];
    const href = token.attrGet('href');
    if (href.startsWith('note:')) {
      const target = href.slice(5);
      if (!notes.some(item => item.id === target)) throw new Error(`Unknown note link in ${note.id}: ${target}`);
      token.attrSet('href', relativeLink(page, `notes/${target}/index.html`));
    } else if (/^https?:\/\//.test(href)) {
      token.attrSet('target', '_blank');
      token.attrSet('rel', 'noopener noreferrer');
    } else if (href.startsWith('assets/')) {
      if (href.includes('..') || href.includes('\\')) throw new Error(`Invalid asset link in ${note.id}`);
      token.attrSet('href', relativeLink(page, href));
    } else if (!href.startsWith('#')) {
      throw new Error(`Links in ${note.id} must use note:slug, assets/..., #anchor, or https://`);
    }
    return linkRenderer(tokens, index, options, env, renderer);
  };
  const headings = [];
  const ids = new Set();
  md.renderer.rules.heading_open = (tokens, index) => {
    const token = tokens[index];
    const text = tokens[index + 1].content;
    const base = text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    let id = base;
    let suffix = 2;
    while (ids.has(id)) id = `${base}-${suffix++}`;
    ids.add(id);
    // 笔记正文的一级标题降为二级，页面标题已占据主要层级。
    const tag = token.tag === 'h1' ? 'h2' : token.tag;
    if (tag === 'h2') headings.push({ id, text });
    return `<${tag} id="${escape(id)}"${tag === 'h2' ? ' class="section-heading"' : ''}>`;
  };
  md.renderer.rules.heading_close = (tokens, index) => `</${tokens[index].tag === 'h1' ? 'h2' : tokens[index].tag}>\n`;
  md.renderer.rules.table_open = () => '<div class="table-scroll"><table>\n';
  md.renderer.rules.table_close = () => '</table></div>\n';
  const html = md.render(note.body);
  if (html.includes('katex-error') || html.includes('KaTeX parse error')) throw new Error(`Invalid mathematical formula in ${note.id}`);
  const toc = headings.length > 1 ? `<details class="note-toc"><summary>${escape(contentsLabel)}</summary><ol>${headings.map(item => `<li><a href="#${escape(item.id)}">${escape(item.text)}</a></li>`).join('')}</ol></details>` : '';
  return { html, toc };
}
