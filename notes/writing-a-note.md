---
title: Writing a New Note
date: 2026-10-14
summary: Create a Markdown note, add a title and date, insert images, and generate a web page.
tags: Guide, Markdown
---

Notes live in `notes`. Each note is a separate Markdown file.

Résumé content is also maintained in Markdown: projects live in `content/projects`, work experience in `content/work-experience`, and activities in `content/extracurricular-activities`. Copy the matching template from `templates` to add an entry. A record's `## Summary` section appears in résumé lists, while the remaining sections appear on its detail page.

## 1. Create a Note

Copy `templates/note.md` into `notes`, for example as `my-first-note.md`. Use lowercase letters, numbers, and hyphens in the filename. Each note needs only one English file.

Start the note with this metadata:

```yaml
---
title: My First Note
date: 2026-10-14
summary: A short description of what this note covers.
tags: Learning, Journal
---
```

Keep each metadata field on a single line. The title appears on the note page and in note lists. The date controls sorting. Both the homepage and the Notes index show only titles and dates; summaries and tags appear on the note detail page.

## 2. Write the Body

Use `##` for section headings and regular paragraphs for the body. Lists, blockquotes, code blocks, and tables are supported.

Use `$...$` for inline math and `$$...$$` for display equations:

```markdown
The stress–strain relation is $\sigma = E\varepsilon$.

$$
E = \frac{\sigma}{\varepsilon}
$$
```

## 3. Add Images

Copy an image into `assets/images`, then add it to the note:

```markdown
![Image description](assets/images/your-image.png)

*Figure 1. A caption below the image.*
```

PNG, JPG, WebP, SVG, and other browser-supported image formats work. For local images, use filenames containing letters and numbers.

## 4. Preview the Result

Run this command in the project folder:

```powershell
npm run dev
```

Open the local website. Saving a note regenerates the pages automatically; refresh your browser to see the changes.

If you open the local HTML files directly, first run:

```powershell
npm run build
npm run check
```

Then open `dist/notes/index.html`. Images, math styles, and fonts are all included in the generated website folder.

## 5. Test Images and Math

Open [Images and Math Test](note:media-math-test) to see images, equations, matrices, and tables in action, then use the same syntax in your own notes.
