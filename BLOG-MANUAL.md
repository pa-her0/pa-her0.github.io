# Jiely 博客更新与部署手册

这份手册适用于当前的新博客项目：

```text
C:\Users\jiely\Desktop\Blog\VermilionVoid
```

博客基于 Astro，文章使用 Markdown，构建后的静态文件位于 `dist/`。

## 常用指令速查表

以下指令默认在项目根目录 `C:\Users\jiely\Desktop\Blog\VermilionVoid` 中执行。

| 使用场景 | 指令 | 作用 |
| --- | --- | --- |
| 进入博客目录 | `cd C:\Users\jiely\Desktop\Blog\VermilionVoid` | 切换到博客项目根目录，其他 `pnpm` 和 Git 指令都应在这里执行 |
| 安装项目依赖 | `pnpm install` | 首次使用或依赖发生变化时，安装项目需要的软件包 |
| 启动本地博客 | `pnpm dev` | 启动开发服务器；根据终端显示的地址打开博客 |
| 停止本地博客 | `Ctrl + C` | 在运行开发服务器的终端中停止服务 |
| 创建文章草稿 | `pnpm new:post -- "文章标题" my-new-post` | 按当前年、月创建 Markdown 文章，默认设置为草稿 |
| 创建并立即公开文章 | `pnpm new:post -- "文章标题" my-new-post --publish` | 创建文章并将 `draft` 设置为 `false` |
| 查看文章创建帮助 | `pnpm new:post -- --help` | 查看分类、标签、摘要、封面等完整参数 |
| 创建碎碎念 | `pnpm new:thought -- "碎碎念内容"` | 按当前年、月创建一条带精确发布时间的碎碎念 |
| 创建带标签的碎碎念 | `pnpm new:thought -- "碎碎念内容" --tags "日常,学习"` | 创建碎碎念并添加一个或多个标签 |
| 查看碎碎念创建帮助 | `pnpm new:thought -- --help` | 查看标题、标签等完整参数 |
| 预览旧内容整理结果 | `pnpm organize:content` | 检查旧文章、碎碎念将被移动到哪些年/月目录，不修改文件 |
| 执行旧内容整理 | `pnpm organize:content -- --write` | 将旧内容实际整理到 `YYYY/MM/` 目录并补充固定 `slug` |
| 检查代码和内容 | `pnpm check` | 检查 Astro、TypeScript 和内容结构是否存在错误 |
| 构建正式博客 | `pnpm build` | 生成 `dist/` 正式网站文件，并建立 Pagefind 搜索索引 |
| 预览正式构建 | `pnpm preview` | 在本地预览构建后的正式网站效果 |
| 查看 Git 状态 | `git status` | 查看已修改、新增、删除和待提交的文件 |
| 拉取源码仓库更新 | `git pull --rebase --autostash origin main` | 拉取 GitHub 最新源码，并临时保留未提交的本地修改 |
| 检查双仓库发布 | `pnpm publish:blog -- -DryRun` | 检查分支、远程仓库和待提交文件，不提交也不推送 |
| 发布博客和保存源码 | `pnpm publish:blog -- "content: update blog"` | 检查并构建博客，然后同时推送源码仓库和博客部署仓库 |
| 使用 Windows 发布脚本 | `.\publish-blog.cmd "content: update blog"` | 与 `pnpm publish:blog` 作用相同，适合直接在 Windows 中执行 |

> 日常最常使用的三条指令是：`pnpm dev`、`pnpm new:post` / `pnpm new:thought`、`pnpm publish:blog`。发布前建议先执行 `pnpm check` 和 `pnpm build`。

## 1. 首次准备

需要安装：

- Git
- Node.js 20 或更高版本
- pnpm 9

检查环境：

```powershell
node --version
pnpm --version
git --version
```

首次安装依赖：

```powershell
cd C:\Users\jiely\Desktop\Blog\VermilionVoid
pnpm install
```

> Bun 不是这个新博客的必需依赖。本文档中的命令统一使用 pnpm。

## 2. 启动本地博客

进入项目并启动开发服务器：

```powershell
cd C:\Users\jiely\Desktop\Blog\VermilionVoid
pnpm dev
```

默认访问地址：

```text
http://127.0.0.1:4321/
```

如果 4321 已被占用，Astro 会自动使用 4322、4323 等端口，以终端显示的地址为准。

停止服务器：在运行服务器的终端中按 `Ctrl + C`。

## 3. 发布一篇文章

### 推荐：使用 pnpm 自动创建

在项目根目录执行：

```powershell
pnpm new:post -- "文章标题" my-new-post
```

这条命令会按照上海时区自动生成日期，并按“年 → 月”创建类似下面的文件：

```text
src/content/posts/2026/08/2026-08-14-my-new-post.md
```

新文章默认为草稿，即 `draft: true`，避免未完成的内容被意外发布。编辑完成后，将它改成 `draft: false`。如果确定需要立即公开，也可以执行：

```powershell
pnpm new:post -- "文章标题" my-new-post --publish
```

需要同时设置分类、标签、摘要和封面时：

```powershell
pnpm new:post -- --title "文章标题" --slug my-new-post --category "学习" --tags "人工智能,多智能体" --description "文章摘要" --image "/post-covers/2026-08-14-my-new-post.jpg"
```

- `slug` 只使用小写英文、数字和短横线。
- 多个标签使用英文逗号或中文逗号分隔。
- 脚本会自动生成 `published`、`updated`、稳定的页面 `slug` 和 `commentSlug`。
- 如果目标文件已经存在，脚本会停止，不会覆盖旧文章。
- 使用 `--dry-run` 可以只预览将要生成的内容，不写入文件。

查看完整帮助：

```powershell
pnpm new:post -- --help
```

### 手动创建

文章目录按“年 → 月”组织：

```text
src/content/posts/YYYY/MM/
```

在该目录中新建一个 `.md` 文件，例如：

```text
src/content/posts/2026/08/2026-08-13-my-new-post.md
```

推荐模板：

```markdown
---
slug: 2026-08-13-my-new-post
title: "文章标题"
published: 2026-08-13
updated: 2026-08-13
draft: false
description: "显示在文章列表中的简短摘要。"
image: /post-covers/2026-08-13-my-new-post.jpg
tags:
  - 学习
  - 人工智能
category: 学习
lang: zh-CN
pinned: false
commentSlug: 2026-08-13-my-new-post
---

这里开始写正文。

## 二级标题

支持 **Markdown**、代码块和 LaTeX：

行内公式：$E = mc^2$

块级公式：

$$
f(x) = \sum_{i=1}^{n} x_i
$$
```

字段说明：

| 字段 | 用途 |
| --- | --- |
| `slug` | 固定页面地址；使用年/月目录时必填，发布后不要修改 |
| `title` | 文章标题，必填 |
| `published` | 发布时间，必填，使用 `YYYY-MM-DD` |
| `updated` | 最后更新时间，可选 |
| `draft` | `true` 为草稿，`false` 为公开 |
| `description` | 首页和文章列表摘要 |
| `image` | 文章封面路径 |
| `tags` | 标签列表 |
| `category` | 文章分类 |
| `lang` | 推荐填写 `zh-CN` |
| `pinned` | 是否置顶 |
| `commentSlug` | 评论区唯一标识；发布后不要随意修改，否则旧评论可能无法对应 |

文件名建议只使用英文、数字和短横线，不要使用空格。

## 4. 添加文章图片

### 文章封面

封面放入：

```text
public/post-covers/
```

例如文件位置：

```text
public/post-covers/2026-08-13-my-new-post.jpg
```

文章头部写：

```yaml
image: /post-covers/2026-08-13-my-new-post.jpg
```

### 正文图片

普通文章图片可以按文章建立单独文件夹：

```text
public/img/2026-08-13-my-new-post/example.png
```

在 Markdown 中引用：

```markdown
![图片说明](/img/2026-08-13-my-new-post/example.png)
```

报告类图片目前也可以放入：

```text
public/report-assets/报告名称/
```

注意：Markdown 中使用的是以 `/` 开头的网站路径，不要写本机的 `C:\Users\...` 路径。

## 5. 更新碎碎念

### 推荐：使用 pnpm 自动创建

直接把碎碎念内容写在命令中：

```powershell
pnpm new:thought -- "今天完成了一件值得记录的事情。"
```

指定多个标签：

```powershell
pnpm new:thought -- "今天完成了一件值得记录的事情。" --tags "日常,学习"
```

需要可选标题时：

```powershell
pnpm new:thought -- "碎碎念正文" --title "今天的记录" --tags "日常"
```

脚本会自动：

- 使用上海时区填写精确发布时间。
- 根据现有碎碎念计算下一个序号。
- 创建 `src/content/thoughts/YYYY/MM/YYYY-MM-DD-序号.md`。
- 写入固定 `slug`，因此整理目录不会改变页面锚点。
- 检查目标文件，绝不覆盖已有内容。

查看完整帮助：

```powershell
pnpm new:thought -- --help
```

### 手动创建

碎碎念目录按“年 → 月”组织：

```text
src/content/thoughts/YYYY/MM/
```

示例文件：

```text
src/content/thoughts/2026/08/2026-08-13-1.md
```

示例内容：

```markdown
---
slug: 2026-08-13-1
title: "今天的记录"
published: 2026-08-13T21:30:00+08:00
tags:
  - 日常
---

这里填写碎碎念内容。
```

保存后，首页的“最新碎碎念”和碎碎念时间线会自动更新。

### 整理旧的扁平目录

如果旧文章或碎碎念仍直接放在 `posts/`、`thoughts/` 根目录，可以先预览整理结果：

```powershell
pnpm organize:content
```

确认输出无误后再执行实际整理：

```powershell
pnpm organize:content -- --write
```

脚本会根据 `published` 自动移动到 `YYYY/MM/`，并补充固定 `slug`。因此文章访问地址、碎碎念锚点和已有评论标识不会因为目录变化而改变。已位于年/月目录中的内容不会重复处理。

## 6. 更新其他页面

常用数据位置：

| 内容 | 文件或目录 |
| --- | --- |
| 个人资料、头像和联系方式 | `src/data/profile.ts` |
| 项目列表 | `src/data/projects.ts` |
| 友情链接 | `src/data/friends.json` |
| 关于页面 | `src/components/pages/AboutPage.tsx` |
| 博客头像 | `public/avatar.jpg`、`public/avatar.png` |
| 品牌图标 | `public/brand/` |
| 评论前端 | `src/components/TwikooComments.astro` |
| 评论后端地址 | `.env` 中的 `PUBLIC_TWIKOO_ENV_ID` |

编辑 JSON 文件时，最后一项后面不要多写逗号。

## 7. 发布前检查

每次发布前执行：

```powershell
pnpm check
pnpm build
```

- `pnpm check` 检查 Astro 和 TypeScript。
- `pnpm build` 生成正式网站并建立 Pagefind 搜索索引。
- 构建结果在 `dist/`，不需要手动修改 `dist/` 中的文件。

也可以检查生产构建效果：

```powershell
pnpm preview
```

## 8. 从 GitHub 拉取最新内容

先确认自己位于正确目录：

```powershell
cd C:\Users\jiely\Desktop\Blog\VermilionVoid
git status
git remote -v
```

有本地修改时，推荐使用：

```powershell
git pull --rebase --autostash origin main
```

如果出现冲突，不要使用 `git reset --hard`。先运行：

```powershell
git status
```

根据 Git 列出的冲突文件手动保留正确内容，之后执行：

```powershell
git add 冲突文件路径
git rebase --continue
```

## 9. 保存并部署

### 推荐：一个命令同步两个 GitHub 仓库

完成文章或网站修改后，在项目根目录执行：

```powershell
pnpm publish:blog -- "content: publish new post"
```

也可以双击项目根目录的 `publish-blog.cmd`，或者在终端执行：

```powershell
.\publish-blog.cmd "content: update blog"
```

发布脚本会依次执行：

1. 确认当前位于 `main` 分支。
2. 核对 `origin` 和 `blog` 的 GitHub 地址，避免推错仓库。
3. 拉取两个远程分支的信息，发现远程存在本地没有的提交时立即停止。
4. 显示将要提交的文件，并要求确认。
5. 执行 `pnpm check` 和 `pnpm build`。
6. 提交当前项目修改。
7. 推送到源码仓库 `origin/main`。
8. 推送到博客部署仓库 `blog/main`，触发 GitHub Pages。

脚本不会使用 `--force`，构建失败、远程分叉或仓库地址不正确时都不会继续推送。

如果只是同步已经提交的本地 commit，即使没有未提交文件，也可以运行相同命令。

只检查分支、远程地址和待提交文件，不提交也不推送：

```powershell
pnpm publish:blog -- -DryRun
```

### 重要：先检查远程仓库

当前博客使用两个自己的仓库，并保留主题作者仓库作为上游参考：

```text
源码和全部数据：https://github.com/pa-her0/whalefall-blog-source.git
公开博客部署：https://github.com/pa-her0/pa-her0.github.io.git
```

当前远程配置：

```text
origin   -> https://github.com/pa-her0/whalefall-blog-source.git
blog     -> https://github.com/pa-her0/pa-her0.github.io.git
upstream -> https://github.com/Lapis0x0/VermilionVoid.git
```

新博客已经完成首次迁移，不需要再次强制推送。日常更新请使用下面的普通提交和推送流程；不要使用 `--force`。

### 手动发布（脚本不可用时）

```powershell
pnpm check
pnpm build
git status
git add -A
git commit -m "content: update blog"
git push origin main
git fetch blog main
git merge-base --is-ancestor blog/main HEAD
git push blog HEAD:main
```

推送 `blog/main` 后，`.github/workflows/deploy.yml` 会安装依赖、构建 `dist/` 并部署 GitHub Pages。部署通常需要一到数分钟，可在 `pa-her0/pa-her0.github.io` 仓库的 Actions 页面查看进度。

## 10. 最常用的完整流程

```powershell
cd C:\Users\jiely\Desktop\Blog\VermilionVoid
git pull --rebase --autostash origin main
pnpm install
pnpm dev
```

完成文章编辑后，停止开发服务器，再执行：

```powershell
pnpm publish:blog -- "content: publish new post"
```

## 11. 常见问题

### 页面没有显示新文章

检查：

1. 文件是否位于 `src/content/posts/`。
2. 文件扩展名是否为 `.md` 或 `.mdx`。
3. `draft` 是否为 `false`。
4. `published` 是否为合法日期。
5. 终端是否有 frontmatter 校验错误。

### 图片显示不出来

检查：

1. 图片是否放在 `public/` 下。
2. Markdown 路径是否以 `/` 开头。
3. 文件名大小写是否完全一致。
4. 是否错误地写入了 Windows 本机绝对路径。

### LaTeX 显示异常

行内公式使用 `$...$`，块级公式使用 `$$...$$`。不要把公式放进普通代码块。

### 评论没有加载

检查 `.env` 中是否存在：

```env
PUBLIC_TWIKOO_ENV_ID=https://你的-Twikoo-后端地址
```

修改环境变量后需要重新启动开发服务器并重新部署。

### `git push` 被拒绝

先检查远程地址和分支：

```powershell
git remote -v
git branch --show-current
git status
```

通常应先执行：

```powershell
git pull --rebase --autostash origin main
```

不要为了跳过冲突直接使用强制推送。
