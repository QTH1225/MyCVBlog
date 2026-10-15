# MyCVBlog

[English](README.md) | **简体中文**

<!-- 项目徽章 -->
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-CC%20BY--SA%204.0-blue.svg)](LICENSE.zh-CN.md)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.12.0-green.svg)
![Markdown](https://img.shields.io/badge/Markdown-Content-orange.svg)
[![GitHub Downloads](https://img.shields.io/github/downloads/QTH1225/MyCVBlog/total?style=flat&color=blue&label=Downloads)](https://github.com/QTH1225/MyCVBlog/releases)
[![GitHub Stars](https://img.shields.io/github/stars/QTH1225/MyCVBlog?style=flat&color=red&label=Stars)](https://github.com/QTH1225/MyCVBlog/stargazers)


以简历为主页的静态博客，提供项目、工作经历、荣誉奖项、论文、课外活动和笔记。主页保持紧凑的简历排版，通过 **View all →** 查看分类列表，再进入详情页。网站统一使用英文，项目说明文档提供中英双语。

本项目改编自 **Vaishanth R** 的 [Resume Professional Template - Software Engineer](https://www.overleaf.com/latex/templates/resume-professional-template-software-engineer/ttwtyxskrcsz)。原模板的 Overleaf 页面标注为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，本项目的新增及改编贡献采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)。原作和第三方许可继续适用，详见文末及[中文许可说明](LICENSE.zh-CN.md)（[英文主文件](LICENSE.md)）。

## 项目特点

- **直接编辑 Markdown**：履历、项目、经历、活动和论文从文档读取，不用修改 JavaScript 数组，也不需要脚本改写代码。
- **简历式布局**：Charter 衬线字体、蓝灰色标题、细横线、标题加粗及日期右对齐，没有顶部标签栏。分类及详情页保留统一个人信息页眉，返回入口统一位于标题右侧；详情页返回所属分类，分类页返回简历主页。
- **摘要与正文分开**：项目文档的 `## Summary` 自动用于主页，其余章节进入详情页。课外活动主页仅显示角色、社团和右侧日期。
- **图片和公式**：项目正文与笔记都支持 Markdown 图片、KaTeX 公式、代码、表格和引用。公式在构建时生成，字体随网站打包。
- **静态部署**：生成普通 HTML/CSS 和资源文件，阅读无需前端框架或在线 CDN，支持手机布局、离线查看和打印。
- **自动检查**：检查字段、文件名、资源链接、字体、英文页面和示例公式；附有内容解析测试。

当前身份信息已使用匿名名称、掩码电话和示例链接。部分项目、经历、论文与活动是排版示例，使用时请替换为自己的公开内容。

## 快速开始

使用 **Node.js 22.12.0 或更新版本**和 npm，与项目声明及锁定依赖的版本要求一致。日常运行不需要 LaTeX 或 Python。

```powershell
npm ci
npm run dev
```

打开 [网站主页](http://127.0.0.1:4173/index.html)。修改内容文件后自动构建，手动刷新浏览器查看。

| 命令 | 用途 |
| --- | --- |
| `npm ci` | 按锁定版本安装依赖 |
| `npm run dev` / `npm start` | 构建并启动本地预览，默认端口 4173 |
| `npm run build` | 生成 `dist/`，不启动服务 |
| `npm run check` | 检查已生成的页面和资源 |
| `npm test` | 测试内容解析、新增、修改、排序及删除流程 |

端口被占用时，在 PowerShell 中执行 `$env:PORT = '4174'` 后再运行 `npm run dev`。服务只监听 `127.0.0.1`。修改服务脚本后需重启服务。

## 从哪里修改内容

先打开 [内容维护入口](content/README.md)，或直接编辑下表中的文件。`content/` 和模板不会原样复制到网站；笔记原文会提供公开下载。

| 内容 | 维护文件 |
| --- | --- |
| 姓名、电话、邮箱和网站链接 | [content/profile.md](content/profile.md) |
| 教育背景、课程 | [content/education.md](content/education.md) |
| 技能 | [content/skills.md](content/skills.md) |
| 荣誉与竞赛奖项 | [content/honors-and-awards.md](content/honors-and-awards.md) |
| 论文 | [content/publications.md](content/publications.md) |
| 项目 | `content/projects/`，每个项目一份 Markdown |
| 工作经历 | `content/work-experience/`，每段经历一份 Markdown |
| 课外活动 | `content/extracurricular-activities/`，每项活动一份 Markdown |
| 笔记 | `notes/`，每篇一份 Markdown |

**不要直接修改 `dist/`**，每次构建都会替换整个生成目录，清理旧页面、笔记原文和资源。请将内容及附件保存在对应的源目录中。

## 项目、经历和活动

可以先修改 [现有项目示例](content/projects/conductive-concrete-example.md)，或者复制模板：

```powershell
Copy-Item templates/project.md content/projects/my-project.md
Copy-Item templates/work-experience.md content/work-experience/my-role.md
Copy-Item templates/activity.md content/extracurricular-activities/my-activity.md
```

文件名决定页面地址中的 id，只使用小写英文、数字和连字符。例如 `my-project.md` 自动生成 `projects/my-project/index.html`。其他栏目同理。重命名文件会改变地址，删除文件会在下次构建时移除对应页面；已有引用也应同步更新。保留栏目目录，清空栏目时删除其中的文件即可。

项目格式如下：

```markdown
---
title: My Project
order: 1
subtitle: Research project
dates: 2025 - 2026
---

## Summary

- A short overview for the homepage.
- Another key point.

## PROJECT OVERVIEW

Write the full introduction here.

## RESULTS

![Result illustration](assets/images/note-demo.svg)

Inline math: $\sigma = E\varepsilon$.
```

- `title` 必填；`subtitle`、`dates`、`location`、`funding` 可选。
- `order` 是排序数字，越小越靠前；省略时为 999，相同数字按文件名排序。
- `## Summary` 可选，只能出现一次，用于主页及 View all 列表，不重复出现在详情页。建议写简短的项目要点。
- 其他章节是详情正文，可自由增加 Markdown 内容。章节使用 `##`，子章节使用 `###`。
- 开头 `---` 中只支持单行字段，不是完整 YAML。每个字段只能写一次，字段名拼错会显示文件名及错误提示。

工作经历格式相同。课外活动另外要求 `role`、`organization`、`dates`，主页左侧显示**角色与社团**，日期在右侧斜体显示。`subtitle` 用于分类及详情页，不影响主页简表。

## 个人信息、教育、技能、奖项与论文

### 个人信息

编辑 `content/profile.md`，保留首尾的 `---`：

```text
---
name: Anonymous
phone: +86 1XX-XXXX-XXXX
email: hello@example.com
website: https://example.com/
websiteLabel: example.com
github: https://github.com/
githubLabel: GitHub
---
```

仅 `name` 必填，不需要的联系方式可删除整行。姓名同时用于页眉、浏览器标题和页脚；掩码电话仅显示文字，完整数字电话生成拨号链接。若更改公开署名，请同时更新许可文档中的改编者名称。

### 教育背景与技能

教育背景每所学校用一个 `##` 标题，按文档中的顺序显示：

```markdown
## University

location: City
degree: Bachelor of Engineering
dates: 09 2021 - 06 2025

### Courses

- Mechanics: Statics, Dynamics
- Professional: Structural Design
```

`degree`、`dates` 必填；`location` 和 `### Courses` 可省略。课程每行采用 `- 类别: 课程`。不要把字段写到课程列表下面。

技能在 `content/skills.md` 中每行写一个列表项：

```markdown
- **Programming Languages:** Python, MATLAB, LaTeX
- **Professional Interests:** Engineering and simulation
```

### 荣誉与奖项

在 `content/honors-and-awards.md` 的两个章节中填写表格：

```markdown
## Honors

| Name | Date |
| --- | --- |
| First-class Scholarship | Nov. 2024 |

## Awards

| Name | Date |
| --- | --- |
| Competition Award | May 2024 |
```

保留 `Name` 和 `Date` 两列表头，按行增删。名称中的竖线写作 `\|`。主页默认每类最多显示前五条，不足五条则全部显示，View all 展示完整列表。

### 论文

在 `content/publications.md` 中，每篇论文用一个二级标题：

```markdown
## My Paper Title

id: my-paper
authors: **Author A**, Author B, Author C
journal: Journal Name
year: 2026
url: https://example.com/paper
```

`id`、`authors`、`journal`、`year` 必填。`id` 需唯一且使用小写英文、数字和连字符。作者直接用 Markdown `**姓名**` 加粗，无需填写对象。`url` 可省略，省略后标题指向本站详情页；填写后指向外部论文。页面继续采用标题、作者、期刊与年份三行格式，没有贡献要点。

## 笔记、图片与公式

复制 `templates/note.md` 到 `notes/my-note.md`，填写 `title`、有效的 `YYYY-MM-DD` 日期 `date`、`summary`，以及可选的 `tags`。笔记按日期从新到旧排列，主页最多展示最新五篇，View all 列表展示全部。主页和笔记列表只显示标题与日期，详情页保留简介与标签，并提供 Markdown 下载。

图片放入 `assets/images/`。项目和笔记现在采用同样的路径写法：

```markdown
![Image description](assets/images/your-image.png)

*Figure 1. Image caption.*

Inline math: $\sigma = E\varepsilon$.

$$
\int_0^1 x^2\,\mathrm{d}x = \frac{1}{3}
$$

[Supporting note](note:media-math-test)
```

支持 PNG、JPG、WebP、SVG 等浏览器可显示的图片格式；推荐本地图片以便离线查看。公式支持 KaTeX 的上下标、分式、积分、矩阵及 `aligned` 等语法。长公式、代码和表格可在自身区域内滚动。代码中的 `$` 保持原文，正文中的普通美元符号写作 `\$`。原始 HTML 不会执行。

链接支持完整 HTTP(S) 地址、`assets/...`、`#锚点` 和 `note:笔记文件名`，后者省略 `.md`。指向不存在的笔记会使构建报错。裸网址不会自动变成链接，任意相对页面链接目前不支持。

## 样式、构建与部署

| 调整项 | 文件 |
| --- | --- |
| 颜色、字体、字号、宽度、留白、手机和打印布局 | `src/styles.css` |
| 栏目标题、View all 和返回文字 | `src/labels.mjs` |
| 栏目顺序、主页预览数量、页眉和页脚结构 | `scripts/build.mjs` |
| 网站图标 | `assets/favicon.svg` |

日常内容修改不涉及以上代码。若需要改变主页预览数量，奖项在 `honors.slice(0, 5)`、`awards.slice(0, 5)` 中调整，笔记在 `notes.slice(0, 5)` 中调整。

开发服务监听 `content/`、三个条目目录、`notes/`、`src/`、`assets/` 和 `assets/images/` 的直接文件变化。新增更深的资源目录后可手动构建；保存后需手动刷新浏览器。若服务是在本次迁移前启动的，请重启一次以启用 Markdown 内容监听。

发布前运行：

```powershell
npm test
npm run build
npm run check
```

将 **`dist/` 内全部文件**部署至静态托管目录，保留 `assets/`、栏目和笔记目录的层级。使用 GitHub Pages 时也要包含生成的 `.nojekyll` 文件，使 `notes/_sources/` 等目录正常提供访问。站内使用相对链接，可部署到域名根目录或子目录。线上不需要 Node.js。也可直接打开 `dist/index.html` 离线阅读，浏览器打印可另存为 PDF。

Charter 字体本地加载，楷体作为系统字体回退，未随项目分发。KaTeX 字体及许可随输出打包。网站为文件维护的静态博客，没有在线编辑器、登录、数据库或评论功能。发布前请确认内容和附件适合公开，尤其是可下载的笔记原文。

### 常见问题

- **保存后页面没变**：确认文件放在 `content/` 或 `notes/`，不是模板目录；重新构建并刷新，旧服务需重启以加载新监听目录。
- **字段报错**：使用模板中已有的英文键名，冒号后填写单行内容；保留 `---`，不要粘贴 JavaScript 数组。
- **条目不显示**：确认扩展名为 `.md`、文件位于正确目录，学校及论文等集合使用 `##` 标题。
- **图片找不到**：检查文件路径及大小写，统一使用 `assets/images/...`。
- **公式失败**：检查分隔符及 KaTeX 语法，KaTeX 不等同于完整 LaTeX。

## 来源、改动与署名

| 项目 | 说明 |
| --- | --- |
| 原作品 | Resume Professional Template - Software Engineer |
| 原作者 | **Vaishanth R** |
| 原作品地址 | [Overleaf 模板页](https://www.overleaf.com/latex/templates/resume-professional-template-software-engineer/ttwtyxskrcsz) |
| 原许可 | 模板页标注为 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| 本改编项目 | MyCVBlog · 英文简历式博客 |
| 改编者署名 | Anonymous / 匿名作者 |
| 新增及改编贡献 | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

改动包括将 LaTeX 简历排版重新实现为 HTML/CSS，增加分类与详情页、Markdown 内容维护、笔记、图片与公式渲染、静态构建与校验，并替换展示内容。原作者未参与这些改动，署名不表示其为本项目背书。

核对日期：2026-10-15。Overleaf 模板页许可栏标注 CC BY 4.0，同页展示的 LaTeX 源码头部另写 `License : MIT`，两处不一致。此处据模板页记录原许可，同时保留该差异，不推定为已确认的双重授权。

复用时可保留以下署名，并补充自己的改动：

> MyCVBlog，由 Anonymous 改编自 Vaishanth R 的 Resume Professional Template - Software Engineer（[原作品](https://www.overleaf.com/latex/templates/resume-professional-template-software-engineer/ttwtyxskrcsz)，模板页标注 CC BY 4.0）。本改编增加英文网页、项目详情、Markdown 内容维护和笔记功能；新增及改编贡献采用 CC BY-SA 4.0。原有及第三方许可继续适用。

## 许可证

本项目中由改编者拥有权利的新增及改编贡献，包括原创网页实现、样式、文档和示例内容，采用 **CC BY-SA 4.0（知识共享署名—相同方式共享 4.0 国际）**。使用时保留适当署名、来源和许可链接，注明改动；分享基于这些贡献的改编作品时遵守相同方式共享条款。允许商业使用，具体以[完整法律文本](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)为准。

原作仍适用原许可，本声明不改变原作品的 CC BY 4.0，也不限制直接依该许可使用原作。参见 [Creative Commons 官方改编说明](https://creativecommons.org/faq/#if-i-derive-or-adapt-material-offered-under-a-creative-commons-license-which-cc-license-can-i-apply-to-the-resulting-work)。

- Charter Web 字体保留 [Bitstream 原始许可及转换说明](assets/fonts/LICENSE.txt)。
- KaTeX 保留随包许可，输出位于 `dist/assets/katex/LICENSE.txt`。
- markdown-it、markdown-it-texmath 及其他依赖按各包随附许可使用。
- 单独标注的第三方图片、引用和附件遵循其各自授权，不自动纳入本项目许可。

许可声明提供[英文主文件](LICENSE.md)和[中文版](LICENSE.zh-CN.md)，标题下可互相切换。来源及署名说明也提供[中文版](assets/ATTRIBUTION.zh-CN.md)和[英文版](assets/ATTRIBUTION.md)，两份文件均随网站复制到 `dist/assets/`；分发源码时请保留 README、两份许可及署名说明和第三方许可。

## Star History

如果您觉得本项目对您有帮助，欢迎给我一个 star ⭐，谢谢！

<a href="https://star-history.com/#QTH1225/MyCVBlog&amp;Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=QTH1225/MyCVBlog&amp;type=Date&amp;theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=QTH1225/MyCVBlog&amp;type=Date" />
    <img alt="MyCVBlog Star History" src="https://api.star-history.com/svg?repos=QTH1225/MyCVBlog&amp;type=Date" />
  </picture>
</a>
