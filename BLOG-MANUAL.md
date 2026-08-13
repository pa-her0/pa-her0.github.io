# Jiely 博客更新与部署手册

这份手册适用于当前的新博客项目：

```text
C:\Users\jiely\Desktop\Blog\VermilionVoid
```

博客基于 Astro，文章使用 Markdown，构建后的静态文件位于 `dist/`。

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

文章目录：

```text
src/content/posts/
```

在该目录中新建一个 `.md` 文件，例如：

```text
src/content/posts/2026-08-13-my-new-post.md
```

推荐模板：

```markdown
---
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

碎碎念目录：

```text
src/content/thoughts/
```

示例文件：

```text
src/content/thoughts/2026-08-13-1.md
```

示例内容：

```markdown
---
title: "今天的记录"
published: 2026-08-13T21:30:00+08:00
tags:
  - 日常
---

这里填写碎碎念内容。
```

保存后，首页的“最新碎碎念”和碎碎念时间线会自动更新。

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

### 日常提交

```powershell
git status
git add -A
git commit -m "content: update blog"
git push origin main
```

这一步会把源代码、文章、图片和配置保存到源码仓库。

### 部署网站

本项目包含 `vercel.json`，如果 Vercel 已连接源码仓库，推送 `origin/main` 后会自动执行：

```text
pnpm install --frozen-lockfile
pnpm build
```

并发布 `dist/`。

如果继续沿用旧博客的 GitHub Pages 双仓库方式，并且公开博客仓库中的 Actions 已配置为从源码构建，则在确认两个分支没有分叉后执行：

```powershell
git fetch blog main
git merge-base --is-ancestor blog/main HEAD
git push blog HEAD:main
```

第二条命令返回成功后才执行第三条。不要使用 `--force`。

部署通常需要几分钟，可在 GitHub Actions 或 Vercel 的部署页面查看进度。

## 10. 最常用的完整流程

```powershell
cd C:\Users\jiely\Desktop\Blog\VermilionVoid
git pull --rebase --autostash origin main
pnpm install
pnpm dev
```

完成文章编辑后，停止开发服务器，再执行：

```powershell
pnpm check
pnpm build
git status
git add -A
git commit -m "content: publish new post"
git push origin main
```

如果仍使用独立的公开博客仓库，再执行：

```powershell
git fetch blog main
git merge-base --is-ancestor blog/main HEAD
git push blog HEAD:main
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
