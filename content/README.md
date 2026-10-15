# 内容维护入口

网站内容现在直接从 Markdown 生成，无需修改 JavaScript 数组。本文件是维护说明，不会显示在网站上。

| 要修改的内容 | 文件 |
| --- | --- |
| 主页栏目顺序 | [home.md](home.md) |
| 姓名、联系方式 | [profile.md](profile.md) |
| 教育背景与课程 | [education.md](education.md) |
| 技能 | [skills.md](skills.md) |
| 荣誉与奖项 | [honors-and-awards.md](honors-and-awards.md) |
| 论文 | [publications.md](publications.md) |
| 项目 | `projects/` 中每个项目一份 `.md` |
| 工作经历 | `work-experience/` 中每段经历一份 `.md` |
| 课外活动 | `extracurricular-activities/` 中每项活动一份 `.md` |
| 笔记 | 项目根目录的 `notes/` 中每篇一份 `.md` |

要调整 SKILLS、PUBLICATIONS 等整个栏目的位置，请编辑 [home.md](home.md)，上下移动对应的 `- skills`、`- publications` 等完整行。八个英文标识必须各保留一次；重复、拼错或漏写会停止构建并报告文件名。当前顺序为教育、技能、项目、工作经历、荣誉奖项、论文、课外活动、笔记。栏目内条目排序仍由各篇文件的 `order` 控制。主页 NOTES 的打印隐藏规则不受栏目位置影响。

可以先试改 [导电混凝土项目](projects/conductive-concrete-example.md)：

1. `title` 是项目名称，`dates` 是右侧时间，`order` 越小越靠前。
2. `## Summary` 下的列表用于主页和 View all 分类列表。
3. 其他内容是详情页正文，可以自由增减章节、图片、公式和链接。
4. 保存后在项目根目录运行 `npm run build`，再刷新预览。通过 `npm run dev` 启动服务时，保存内容会自动构建。

新增项目可复制 `templates/project.md` 到 `content/projects/my-project.md`；工作经历和活动分别有 `templates/work-experience.md`、`templates/activity.md`。模板不会自动出现在网站中，复制到对应内容目录才会生成页面。

文件名就是页面地址中的 id，使用小写英文、数字和连字符。网站统一使用英文，文档中的字段名请保留，字段值与正文可替换。

图片都使用 `![Image description](assets/images/your-image.png)`。行内公式使用 `$...$`，独立公式使用 `$$...$$`。更多字段、完整格式及运行命令见根目录[中文说明](../README.zh-CN.md)或 [English README](../README.md)。
