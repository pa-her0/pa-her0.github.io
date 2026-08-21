import { execFile, spawn } from "node:child_process"
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import katex from "katex"
import MarkdownIt from "markdown-it"
import sanitizeHtml from "sanitize-html"

const studioDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(studioDir, "../..")
const publicDir = path.join(studioDir, "public")
const katexDistDir = path.join(repoRoot, "node_modules", "katex", "dist")
const contentRoot = path.join(repoRoot, "src", "content")
const postsRoot = path.join(contentRoot, "posts")
const thoughtsRoot = path.join(contentRoot, "thoughts")
const host = "127.0.0.1"
const port = Number(process.env.BLOG_STUDIO_PORT || 4322)
const maxBodyBytes = 25 * 1024 * 1024
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true })

function installMathRenderer(md) {
  md.inline.ruler.after("escape", "math_inline", (state, silent) => {
    const start = state.pos
    if (state.src[start] !== "$" || state.src[start + 1] === "$") return false

    let end = start + 1
    while ((end = state.src.indexOf("$", end)) !== -1) {
      let backslashes = 0
      for (let index = end - 1; index >= 0 && state.src[index] === "\\"; index -= 1) backslashes += 1
      if (backslashes % 2 === 0) break
      end += 1
    }
    if (end === -1 || end === start + 1) return false

    const content = state.src.slice(start + 1, end)
    if (/^\s|\s$/.test(content)) return false
    if (!silent) {
      const token = state.push("math_inline", "math", 0)
      token.content = content
    }
    state.pos = end + 1
    return true
  })

  md.block.ruler.after("blockquote", "math_block", (state, startLine, endLine, silent) => {
    const lineStart = state.bMarks[startLine] + state.tShift[startLine]
    const lineEnd = state.eMarks[startLine]
    const openingLine = state.src.slice(lineStart, lineEnd).trim()
    if (!openingLine.startsWith("$$")) return false
    if (silent) return true

    const contentLines = []
    const firstLine = openingLine.slice(2)
    if (firstLine.endsWith("$$")) {
      contentLines.push(firstLine.slice(0, -2))
      state.line = startLine + 1
    } else {
      if (firstLine) contentLines.push(firstLine)
      let nextLine = startLine + 1
      let closed = false
      while (nextLine < endLine) {
        const start = state.bMarks[nextLine] + state.tShift[nextLine]
        const end = state.eMarks[nextLine]
        const line = state.src.slice(start, end)
        const trimmed = line.trim()
        if (trimmed.endsWith("$$")) {
          contentLines.push(trimmed.slice(0, -2))
          closed = true
          nextLine += 1
          break
        }
        contentLines.push(line)
        nextLine += 1
      }
      if (!closed) return false
      state.line = nextLine
    }

    const token = state.push("math_block", "math", 0)
    token.block = true
    token.map = [startLine, state.line]
    token.content = contentLines.join("\n").trim()
    return true
  }, { alt: ["paragraph", "reference", "blockquote", "list"] })

  const renderMath = (content, displayMode) => katex.renderToString(content, {
    displayMode,
    throwOnError: false,
    strict: "ignore",
    output: "htmlAndMathml",
  })
  md.renderer.rules.math_inline = (tokens, index) => renderMath(tokens[index].content, false)
  md.renderer.rules.math_block = (tokens, index) => `${renderMath(tokens[index].content, true)}\n`
}

installMathRenderer(markdown)

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

function json(res, status, value) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  })
  res.end(JSON.stringify(value))
}

function text(res, status, value, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  })
  res.end(value)
}

async function readJson(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > maxBodyBytes) throw new Error("请求内容过大，单次最多上传 25 MB。")
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString("utf8")
  return raw ? JSON.parse(raw) : {}
}

function normalizeRelative(input) {
  return String(input || "").replaceAll("\\", "/").replace(/^\/+/, "")
}

function resolveInside(root, relative) {
  const safeRelative = normalizeRelative(relative)
  const resolved = path.resolve(root, safeRelative)
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("文件路径超出了允许的目录。")
  }
  return resolved
}

function contentPath(relative) {
  const normalized = normalizeRelative(relative)
  if (!/^(posts|thoughts)\/.*\.mdx?$/i.test(normalized)) {
    throw new Error("只能读写文章或碎碎念 Markdown 文件。")
  }
  return resolveInside(contentRoot, normalized)
}

function toJsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_, item) => item instanceof Date ? item.toISOString() : item))
}

async function walkMarkdown(directory, prefix) {
  const found = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    const relative = `${prefix}/${entry.name}`
    if (entry.isDirectory()) found.push(...await walkMarkdown(absolute, relative))
    else if (/\.mdx?$/i.test(entry.name)) found.push({ absolute, relative })
  }
  return found
}

async function listEntries() {
  const files = [
    ...await walkMarkdown(postsRoot, "posts"),
    ...await walkMarkdown(thoughtsRoot, "thoughts"),
  ]
  const entries = await Promise.all(files.map(async ({ absolute, relative }) => {
    const source = await readFile(absolute, "utf8")
    const parsed = matter(source)
    const info = await stat(absolute)
    const type = relative.startsWith("posts/") ? "post" : "thought"
    return {
      path: relative,
      type,
      title: parsed.data.title || (type === "thought" ? parsed.content.trim().slice(0, 42) : path.basename(relative, path.extname(relative))),
      slug: parsed.data.slug || "",
      published: toJsonSafe(parsed.data.published || ""),
      draft: Boolean(parsed.data.draft),
      tags: Array.isArray(parsed.data.tags) ? parsed.data.tags : [],
      modified: info.mtime.toISOString(),
    }
  }))
  return entries.sort((a, b) => String(b.published).localeCompare(String(a.published)))
}

function shanghaiNow() {
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
    timestamp: `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}+08:00`,
  }
}

function cleanSlug(value, fallback = "new-post") {
  const slug = String(value || "").trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || fallback
}

async function exists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function nextThoughtSequence() {
  const files = await walkMarkdown(thoughtsRoot, "thoughts")
  const values = files.map(({ relative }) => Number(relative.match(/-(\d+)\.mdx?$/i)?.[1] || 0))
  return Math.max(0, ...values) + 1
}

function normalizeMeta(type, input, existing = {}) {
  const { date, timestamp } = shanghaiNow()
  const tags = Array.isArray(input.tags)
    ? input.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(input.tags || "").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean)
  const published = input.published || existing.published || timestamp
  if (type === "thought") {
    const result = {
      ...existing,
      slug: input.slug || existing.slug,
      published,
      tags: [...new Set(tags.length ? tags : ["日常"])],
    }
    if (input.title?.trim()) result.title = input.title.trim()
    else delete result.title
    return result
  }
  const slug = input.slug || existing.slug || `${date}-${cleanSlug(input.title)}`
  return {
    ...existing,
    slug,
    title: String(input.title || existing.title || "未命名文章").trim(),
    commentSlug: input.commentSlug || existing.commentSlug || slug,
    published,
    updated: timestamp,
    draft: input.draft !== false,
    description: String(input.description || ""),
    image: String(input.image || ""),
    tags: [...new Set(tags)],
    category: String(input.category || "学习"),
    lang: String(input.lang || "zh-CN"),
    pinned: Boolean(input.pinned),
  }
}

async function saveEntry(payload) {
  const type = payload.type === "thought" ? "thought" : "post"
  const originalPath = payload.originalPath ? normalizeRelative(payload.originalPath) : ""
  let existing = {}
  let targetRelative = originalPath
  if (originalPath) {
    const current = matter(await readFile(contentPath(originalPath), "utf8"))
    existing = current.data
  } else {
    const { date } = shanghaiNow()
    const [year, month] = date.split("-")
    if (type === "thought") {
      targetRelative = `thoughts/${year}/${month}/${date}-${await nextThoughtSequence()}.md`
    } else {
      const slug = cleanSlug(payload.meta?.slug || payload.meta?.title, `post-${Date.now()}`)
      targetRelative = `posts/${year}/${month}/${date}-${slug}.md`
    }
    if (await exists(contentPath(targetRelative))) throw new Error("目标文章已经存在，请更换 slug。")
  }
  const meta = normalizeMeta(type, payload.meta || {}, existing)
  if (type === "thought" && !meta.slug) meta.slug = path.basename(targetRelative, path.extname(targetRelative))
  const output = matter.stringify(String(payload.body || "").trimStart(), meta)
  const target = contentPath(targetRelative)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, output, "utf8")
  return { path: targetRelative, meta: toJsonSafe(meta) }
}

async function uploadImage(payload) {
  const match = String(payload.data || "").match(/^data:(image\/(?:png|jpeg|webp|gif));base64,(.+)$/)
  if (!match) throw new Error("只支持 PNG、JPEG、WebP 或 GIF 图片。")
  const bytes = Buffer.from(match[2], "base64")
  if (bytes.length > 20 * 1024 * 1024) throw new Error("单张图片不能超过 20 MB。")
  const extension = { "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif" }[match[1]]
  const base = cleanSlug(path.basename(String(payload.name || "image"), path.extname(String(payload.name || ""))), "image")
  const fileName = `${base}${extension}`
  const isCover = payload.kind === "cover"
  const folder = isCover ? "post-covers" : `img/${cleanSlug(payload.slug, "article")}`
  const directory = resolveInside(path.join(repoRoot, "public"), folder)
  await mkdir(directory, { recursive: true })
  let finalName = fileName
  let counter = 2
  while (await exists(path.join(directory, finalName))) {
    finalName = `${base}-${counter}${extension}`
    counter += 1
  }
  await writeFile(path.join(directory, finalName), bytes, { flag: "wx" })
  return { path: `/${folder}/${finalName}` }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      cwd: repoRoot,
      encoding: "utf8",
      timeout: options.timeout || 5 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
    }, (error, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join("\n").trim()
      if (error) {
        error.output = output
        reject(error)
      } else resolve(output)
    })
  })
}

async function gitStatus() {
  const [branch, changes, head] = await Promise.all([
    run("git", ["branch", "--show-current"]),
    run("git", ["status", "--short"]),
    run("git", ["log", "-1", "--pretty=%h %s"]),
  ])
  return { branch, changes, head }
}

async function isAncestor(remoteRef) {
  try {
    await run("git", ["merge-base", "--is-ancestor", remoteRef, "HEAD"])
    return true
  } catch {
    return false
  }
}

async function publish(message) {
  const logs = []
  const step = async (label, command, args, options) => {
    logs.push(`\n› ${label}`)
    const output = await run(command, args, options)
    if (output) logs.push(output)
  }
  const branch = await run("git", ["branch", "--show-current"])
  if (branch !== "main") throw new Error(`当前分支是 ${branch}，为避免误发布，只允许从 main 发布。`)
  const origin = await run("git", ["remote", "get-url", "origin"])
  const blog = await run("git", ["remote", "get-url", "blog"])
  if (!origin.includes("pa-her0/whalefall-blog-source.git") || !blog.includes("pa-her0/pa-her0.github.io.git")) {
    throw new Error("GitHub 仓库地址与博客配置不一致，已停止发布。")
  }
  await step("获取 GitHub 最新状态", "git", ["fetch", "origin", "main"])
  await step("获取博客仓库最新状态", "git", ["fetch", "blog", "main"])
  if (!await isAncestor("origin/main") || !await isAncestor("blog/main")) {
    throw new Error("GitHub 上有本地尚未包含的更新，请先同步并解决差异后再发布。")
  }
  const changes = await run("git", ["status", "--porcelain"])
  if (changes) {
    await step("检查内容和代码", "pnpm", ["check"], { timeout: 10 * 60 * 1000 })
    await step("暂存本次改动", "git", ["add", "-A"])
    await step("检查待提交内容", "git", ["diff", "--cached", "--check"])
    await step("保存版本", "git", ["commit", "-m", String(message || "content: update blog").trim()])
  }
  await step("构建正式博客", "pnpm", ["build"], { timeout: 15 * 60 * 1000 })
  await step("发布源码", "git", ["push", "origin", "HEAD:main"], { timeout: 10 * 60 * 1000 })
  await step("发布博客", "git", ["push", "blog", "HEAD:main"], { timeout: 10 * 60 * 1000 })
  const commit = await run("git", ["rev-parse", "--short", "HEAD"])
  logs.push(`\n发布完成：${commit}`)
  return { commit, log: logs.join("\n").trim() }
}

function previewMarkdown(source) {
  return sanitizeHtml(markdown.render(String(source || "")), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2", "math", "semantics", "mrow", "mi", "mo", "mn", "msup", "msub",
      "mfrac", "mover", "munder", "munderover", "msqrt", "mroot", "mtext", "mspace", "mtable",
      "mtr", "mtd", "annotation",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      "*": ["class", "style", "aria-hidden"],
      img: ["src", "alt", "title", "loading"],
      math: ["xmlns", "display"],
      annotation: ["encoding"],
    },
    allowedSchemes: ["http", "https", "data"],
  })
}

async function api(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/entries") return json(res, 200, { entries: await listEntries() })
  if (req.method === "GET" && url.pathname === "/api/content") {
    const relative = normalizeRelative(url.searchParams.get("path"))
    const source = await readFile(contentPath(relative), "utf8")
    const parsed = matter(source)
    return json(res, 200, { path: relative, type: relative.startsWith("thoughts/") ? "thought" : "post", meta: toJsonSafe(parsed.data), body: parsed.content })
  }
  if (req.method === "POST" && url.pathname === "/api/content") return json(res, 200, await saveEntry(await readJson(req)))
  if (req.method === "POST" && url.pathname === "/api/upload") return json(res, 200, await uploadImage(await readJson(req)))
  if (req.method === "POST" && url.pathname === "/api/preview") return json(res, 200, { html: previewMarkdown((await readJson(req)).body) })
  if (req.method === "GET" && url.pathname === "/api/git/status") return json(res, 200, await gitStatus())
  if (req.method === "POST" && url.pathname === "/api/check") {
    const body = await readJson(req)
    const task = body.task === "build" ? "build" : "check"
    const output = await run("pnpm", [task], { timeout: task === "build" ? 15 * 60 * 1000 : 10 * 60 * 1000 })
    return json(res, 200, { output: output || `${task} 完成，没有发现问题。` })
  }
  if (req.method === "POST" && url.pathname === "/api/publish") return json(res, 200, await publish((await readJson(req)).message))
  return json(res, 404, { error: "接口不存在。" })
}

async function serveStatic(res, url) {
  const relative = url.pathname === "/" ? "index.html" : normalizeRelative(url.pathname)
  if (relative.startsWith("vendor/katex/")) {
    try {
      const katexAsset = resolveInside(katexDistDir, relative.slice("vendor/katex/".length))
      const body = await readFile(katexAsset)
      return text(res, 200, body, mimeTypes[path.extname(katexAsset).toLowerCase()] || "application/octet-stream")
    } catch {
      return text(res, 404, "Not found")
    }
  }
  const filePath = resolveInside(publicDir, relative)
  try {
    const body = await readFile(filePath)
    return text(res, 200, body, mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream")
  } catch {
    try {
      const blogAsset = resolveInside(path.join(repoRoot, "public"), relative)
      const body = await readFile(blogAsset)
      return text(res, 200, body, mimeTypes[path.extname(blogAsset).toLowerCase()] || "application/octet-stream")
    } catch {
      return text(res, 404, "Not found")
    }
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${host}:${port}`)
    if (url.pathname.startsWith("/api/")) await api(req, res, url)
    else await serveStatic(res, url)
  } catch (error) {
    console.error(error)
    json(res, 500, { error: error.message || "操作失败。", output: error.output || "" })
  }
})

server.listen(port, host, () => {
  const url = `http://${host}:${port}`
  console.log(`\n鲸落博客工作台已启动：${url}`)
  console.log("关闭此窗口即可停止工作台。\n")
  if (!process.argv.includes("--no-open")) {
    const [command, args] = process.platform === "darwin"
      ? ["open", [url]]
      : process.platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]]
    spawn(command, args, { detached: true, stdio: "ignore" }).unref()
  }
})

process.on("SIGINT", () => server.close(() => process.exit(0)))
