# 偶得自动同步：Obsidian → COS → 博客

## 工作流总览

```
Obsidian 本地编辑
   │  Remotely Save（默认每隔几分钟同步一次）
   ▼
腾讯云 COS（obisidian-1302893975/1.偶得/）   ← 唯一真相源
   │  GitHub Action（每 10 分钟 / 手动触发）
   ▼
博客仓库 src/content/thoughts/
   │  push 自动触发
   ▼
Vercel 部署
```

Obsidian 端零侵入：换设备 / 装新插件 / 卸载插件都不影响发布链路，唯一前提是 Remotely Save 把 `1.偶得/` 推到 COS。

## 偶得文件格式约定

每个 `.md` 必须有 frontmatter：

```yaml
---
slug: 2026-04-25-a3f2k1   # 必填，URL 锚点的稳定标识，一旦生成不要改
published: 2026-04-25     # 必填，YAML 日期格式（不要加引号）
title: 可选标题            # 可选
tags: ["杂感"]             # 可选
---

正文…
```

- `slug` 允许 `a-zA-Z0-9._/-`，可以含 `/` 表示嵌套（例如历史文件 `2024/12-20-winter-solstice`）
- 文件名、所在目录都无所谓——同步脚本只看 frontmatter

## 在 Obsidian 中新建偶得（Templater）

1. 安装 Templater 插件
2. 设置 Templater 的 Template Folder 为 `模板/`（如果还没设）
3. 模板文件已生成在 `模板/偶得模板.md`：会自动塞入 `slug: <日期>-<6位随机>`、`published: <今日>`、空 tags
4. 新建笔记 → `Cmd+P` → "Templater: Open Insert Template modal" → 选 "偶得模板"
5. 把笔记保存在 `1.偶得/` 目录下任意位置（按年份子目录组织，或按主题，都行）

## 撤稿语义

把笔记从 `1.偶得/` 移出（或删除），下一次同步会**自动从博客删掉对应文章**。如果只是想把笔记归档但保留发布，挪到 `1.偶得/` 内部其他子目录即可——同步脚本递归扫描整个 `1.偶得/`，子目录结构无所谓。

## GitHub Secrets 配置（一次性）

到 https://github.com/Lapis0x0/VermilionVoid/settings/secrets/actions 添加以下 secrets：

| Name | Value |
| --- | --- |
| `COS_SECRET_ID` | 腾讯云 API 密钥 SecretId |
| `COS_SECRET_KEY` | 腾讯云 API 密钥 SecretKey |
| `COS_BUCKET` | `obisidian-1302893975` |
| `COS_REGION` | `ap-beijing` |
| `COS_PREFIX` | `1.偶得/` |

获取 SecretId/SecretKey：腾讯云控制台 → 访问管理 → API 密钥管理。建议新建一个**子用户** + 只授予该桶的读权限（`QcloudCOSReadOnly`），不要用主账号密钥。

## 触发同步

- **自动**：每 12 小时跑一次（兜底用，确保最终一致）
- **手动**（推荐日常用）：到 GitHub repo → Actions → "Sync Thoughts from COS" → Run workflow，秒级生效

## 本地调试

```bash
export COS_SECRET_ID=xxx COS_SECRET_KEY=xxx
export COS_BUCKET=obisidian-1302893975 COS_REGION=ap-beijing COS_PREFIX="1.偶得/"
pnpm sync-thoughts
```

## 故障排查

- **同步报错 "missing slug"**：某篇笔记 frontmatter 没写 slug，去 Obsidian 里补上
- **同步报错 "invalid slug"**：slug 含中文 / 空格 / 特殊字符，改成 `[a-zA-Z0-9._/-]+`
- **COS 返回 0 文件**：脚本会主动报错退出，避免误删全部线上文章。检查 Remotely Save 是否同步成功
- **同步不及时**：手动到 Actions 触发；或者 cron 间隔调短（注意 GitHub 免费版每月 2000 分钟限额）
