import { access, mkdir, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const postsDir = path.join(repoRoot, "src", "content", "posts")
const thoughtsDir = path.join(repoRoot, "src", "content", "thoughts")

const helpText = `
创建博客内容

文章：
  pnpm new:post -- "文章标题" english-slug
  pnpm new:post -- --title "文章标题" --slug english-slug --category "学习" --tags "人工智能,多智能体"

碎碎念：
  pnpm new:thought -- "今天完成了一件值得记录的事"
  pnpm new:thought -- "内容" --tags "日常,学习" --title "可选标题"

常用选项：
  --description "摘要"   文章摘要
  --image "/path.jpg"    文章封面
  --publish               新文章直接设为公开；默认创建为草稿
  --dry-run               只预览，不创建文件
  --help                   显示帮助
`

function parseArgs(args) {
  const options = {
    positional: [],
    tags: "",
    category: "学习",
    description: "",
    image: "",
    title: "",
    slug: "",
    content: "",
    publish: false,
    dryRun: false,
    help: false,
  }

  const valueOptions = new Set([
    "title",
    "slug",
    "category",
    "tags",
    "description",
    "image",
    "content",
  ])

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === "--") {
      continue
    }
    if (!arg.startsWith("--")) {
      options.positional.push(arg)
      continue
    }

    const key = arg.slice(2)
    if (key === "publish") {
      options.publish = true
      continue
    }
    if (key === "dry-run") {
      options.dryRun = true
      continue
    }
    if (key === "help") {
      options.help = true
      continue
    }
    if (!valueOptions.has(key)) {
      throw new Error(`未知选项：--${key}`)
    }

    const value = args[index + 1]
    if (!value || value.startsWith("--")) {
      throw new Error(`选项 --${key} 缺少值`)
    }
    options[key] = value
    index += 1
  }

  return options
}

function shanghaiDateParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date())

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`,
    compactTime: `${values.hour}${values.minute}${values.second}`,
  }
}

function normalizeSlug(value, fallback) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return slug || fallback
}

function parseTags(value, fallback = []) {
  const tags = value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags.length > 0 ? [...new Set(tags)] : fallback
}

function yamlString(value) {
  return JSON.stringify(String(value))
}

function yamlTags(tags) {
  if (tags.length === 0) return "tags: []"
  return `tags:\n${tags.map((tag) => `  - ${yamlString(tag)}`).join("\n")}`
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function nextThoughtSequence() {
  await mkdir(thoughtsDir, { recursive: true })
  const collectSequences = async (directory) => {
    const sequences = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        sequences.push(...(await collectSequences(path.join(directory, entry.name))))
        continue
      }
      const match = entry.name.match(/-(\d+)\.mdx?$/i)
      if (match) sequences.push(Number(match[1]))
    }
    return sequences
  }
  const sequences = await collectSequences(thoughtsDir)
  return Math.max(0, ...sequences) + 1
}

async function createPost(options) {
  const { date, time, compactTime } = shanghaiDateParts()
  const title = options.title || options.positional[0]
  if (!title) {
    throw new Error("缺少文章标题。示例：pnpm new:post -- \"文章标题\" english-slug")
  }

  const requestedSlug = options.slug || options.positional[1] || title
  const slug = normalizeSlug(requestedSlug, `post-${compactTime}`)
  const fileSlug = `${date}-${slug}`
  const [year, month] = date.split("-")
  const filePath = path.join(postsDir, year, month, `${fileSlug}.md`)
  if (await fileExists(filePath)) {
    throw new Error(`文件已经存在，不会覆盖：${path.relative(repoRoot, filePath)}`)
  }

  const tags = parseTags(options.tags, [options.category])
  const published = `${date}T${time}+08:00`
  const content = `---
slug: ${yamlString(fileSlug)}
title: ${yamlString(title)}
commentSlug: ${yamlString(fileSlug)}
published: ${published}
updated: ${published}
draft: ${options.publish ? "false" : "true"}
description: ${yamlString(options.description)}
image: ${yamlString(options.image)}
${yamlTags(tags)}
category: ${yamlString(options.category)}
lang: zh-CN
pinned: false
---

在这里开始写正文。

## 小标题

正文内容。
`

  if (!options.dryRun) {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, content, { encoding: "utf8", flag: "wx" })
  }

  return { filePath, content, draft: !options.publish }
}

async function createThought(options) {
  const { date, time } = shanghaiDateParts()
  const body = options.content || options.positional[0]
  if (!body) {
    throw new Error("缺少碎碎念内容。示例：pnpm new:thought -- \"今天值得记录的事情\"")
  }

  const sequence = await nextThoughtSequence()
  const [year, month] = date.split("-")
  const fileSlug = `${date}-${sequence}`
  const filePath = path.join(thoughtsDir, year, month, `${fileSlug}.md`)
  if (await fileExists(filePath)) {
    throw new Error(`文件已经存在，不会覆盖：${path.relative(repoRoot, filePath)}`)
  }

  const tags = parseTags(options.tags, ["日常"])
  const titleLine = options.title ? `title: ${yamlString(options.title)}\n` : ""
  const content = `---
slug: ${yamlString(fileSlug)}
${titleLine}published: ${date}T${time}+08:00
${yamlTags(tags)}
---

${body.trim()}
`

  if (!options.dryRun) {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, content, { encoding: "utf8", flag: "wx" })
  }

  return { filePath, content }
}

async function main() {
  const [type, ...args] = process.argv.slice(2)
  const options = parseArgs(args)

  if (!type || options.help || type === "help") {
    console.log(helpText.trim())
    return
  }

  if (!new Set(["post", "thought"]).has(type)) {
    throw new Error(`未知内容类型：${type}。只能使用 post 或 thought。`)
  }

  const result = type === "post"
    ? await createPost(options)
    : await createThought(options)

  const relativePath = path.relative(repoRoot, result.filePath)
  console.log(options.dryRun ? `[预览] ${relativePath}` : `已创建：${relativePath}`)
  if (type === "post" && result.draft) {
    console.log("文章默认为草稿。完成编辑后，将 frontmatter 中的 draft 改为 false。")
  }
  if (options.dryRun) {
    console.log("\n" + result.content)
  }
}

main().catch((error) => {
  console.error(`创建失败：${error.message}`)
  process.exitCode = 1
})
