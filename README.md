# Anonymous · 简历式博客与笔记

公开内容已匿名化：页面、源码、链接和元数据不保存真实姓名、联系方式、学校、奖项赞助方或论文信息。教育背景和部分奖项恢复原简历的日期与排版，并使用匿名名称。项目页使用明确标注的演示内容。所有页面保留同一套匿名页眉、Charter 衬线字体、蓝灰色标题与细横线。

主页采用极简简历排版，没有顶部标签栏；栏目标题保持普通文字，通过右侧的 View all 进入分类页，点击具体项目或笔记标题进入详情页。教育背景为学校与所在地一行、专业与日期一行，奖项按名称与日期左右对齐。主页和笔记分类页都仅显示笔记标题与日期，不显示简介、标签或介绍段落；笔记元数据保留在详情页中。各分类页的 Back to résumé 位于章节标题右侧，与 View all 使用相同样式；列表下方不再重复显示返回链接。

当前网站为纯英文版本：页面标题、笔记、图片说明、提示文字和笔记模板均使用英文，页面语言标记为 `en`。尚未添加中文页面或语言切换按钮。本文档仅作为本地维护说明，不会生成到网站中。

所有页面页脚显示当前匿名名称、CC BY-SA 4.0 许可证链接和返回顶部入口。网站原创内容采用 CC BY-SA 4.0；第三方字体继续遵循各自随附的许可证。

顶部按原简历排版显示匿名联系方式：掩码电话、示例邮箱、示例个人网站和 GitHub 链接。电话包含掩码时仅显示文字，不生成拨号链接；邮箱与个人网站使用 `example.com`，GitHub 链接指向平台首页。

HONORS AND AWARDS 在主页仅预览前两条荣誉和前两条竞赛奖项，View all 进入 `honors-and-awards/index.html` 查看完整列表。继续在 `src/content.mjs` 的 `honors` 与 `awards` 数组中添加条目即可。

已提供导电混凝土学术项目、材料测试和结构仿真工作经历示例，参考原简历中的研究主题与工具。示例均标为 Illustrative；工作经历原模板没有真实任职信息，所以这些条目不代表已核实的就业经历。

PUBLICATIONS 使用独立编写的示例，不参考原简历论文。每项按三行展示：标题链接、作者列表、加粗期刊名称与年份，不显示工作或贡献要点。对应 `publications` 数组中的 `title`、`authors`、`journal`、`year` 字段；`authors` 可写成 `{ name: '作者名', highlight: true }` 对象数组，`highlight` 用于加粗指定作者。可选的 `url` 指向真实论文页面，省略时标题链接到本站详情页。当前标题、作者和期刊均明确为示例，主页、分类页和详情页同步使用此格式。

## 查看网站

生成后的主页是 `dist/index.html`，笔记列表是 `dist/notes/index.html`。可以直接双击 HTML 文件离线查看，图片和公式字体均在网站目录内。

开发和重新构建需要 Node.js 18 或更新版本。首次在新机器使用时运行：

```powershell
npm ci
npm run dev
```

打开 http://127.0.0.1:4173 。修改 `src`、`notes/*.md` 或 `assets/images` 中的文件会自动重新生成，刷新浏览器即可查看。当前机器已安装依赖。

只生成文件、不启动服务：

```powershell
npm run build
npm run check
```

## 写笔记

将 `templates/note.md` 复制到 `notes` 文件夹，修改文件名与内容。文件名使用小写英文、数字和连字符，例如 `my-first-note.md`，对应网页地址 `notes/my-first-note/index.html`。

笔记开头使用这些单行字段，不支持多行 YAML：

```yaml
---
title: 我的第一篇笔记
date: 2026-10-14
summary: 一句话说明这篇笔记的内容。
tags: 学习, 随笔
---
```

`title`、`date`、`summary` 必填，`tags` 可省略。日期使用有效的 `YYYY-MM-DD`，列表按日期从新到旧排列。正文支持标准 Markdown 标题、段落、列表、引用、代码块和表格。正文标题建议从 `##` 开始。

这是通过文件维护的静态博客；目前没有网页编辑器或在线保存功能。

## 图片与公式

图片复制到 `assets/images`，路径按网站根目录填写，生成时会自动转换为各详情页对应的相对路径：

```markdown
![图片说明](assets/images/your-image.png)

*图 1：图片下方的说明。*

行内公式：$\sigma = E\varepsilon$。

$$
\int_0^1 x^2\,\mathrm{d}x = \frac{1}{3}
$$
```

图片支持 PNG、JPG、WebP、SVG 等浏览器可显示的格式。公式使用 KaTeX，支持分式、上下标、矩阵、积分及 `aligned` 等环境。公式在构建时生成 HTML 与 MathML，不依赖浏览器脚本或在线 CDN；较长公式和代码块在各自区域内滚动。代码块和反引号内的 `$` 保持原文；普通美元符号请写作 `\$`。

关联另一篇笔记可用 `[链接文字](note:另一篇笔记的文件名)`，不带 `.md`。此外支持 `assets/...`、`#页面锚点` 和完整 HTTP(S) 链接。

## 已提供的笔记

- `notes/media-math-test.md`：SVG / PNG 图片、行内公式、独立公式、多行推导、矩阵、含公式的表格、引用和代码块的实际测试。
- `notes/writing-a-note.md`：新建笔记的操作说明。
- `templates/note.md`：可复制的笔记模板，不会自动发布。

## 文件结构

- `src/content.mjs`：公开展示的匿名简历与演示项目。
- `src/styles.css`：主页、项目页和笔记页的公共样式。
- `notes/*.md`：已发布的笔记源文件。
- `assets/images/`：笔记与项目图片。
- `assets/fonts/`：Charter 字体及许可。
- `scripts/notes.mjs`：Markdown、笔记元数据和公式渲染。
- `scripts/build.mjs`：生成静态网页，并清理上次构建中已失效的页面。
- `dist/`：可以整体上传到静态托管服务的输出；请修改源文件，不要直接编辑生成文件。

笔记详情页提供“下载 Markdown”链接。生成的笔记原文也属于公开网站内容，写入笔记的内容会随网站一起发布。

## 字体与打印

英文正文沿用模板中的 Bitstream Charter 字形，字体本地加载。中文使用系统楷体（Windows 优先 KaiTi，macOS 回退 Kaiti SC / STKaiti），代码块中的中文也使用楷体。公式使用随网站打包的 KaTeX 字体，公式中的中文使用楷体回退。楷体由访客系统提供，未随网站分发。字体许可分别位于 `assets/fonts/LICENSE.txt` 和生成后的 `dist/assets/katex/LICENSE.txt`。

使用浏览器“打印 → 另存为 PDF”可导出页面；打印时隐藏导航与辅助链接。浏览器排版与 LaTeX 的逐行布局会有差异。
