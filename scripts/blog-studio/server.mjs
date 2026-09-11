import { execFile, spawn } from "node:child_process"
import { createHmac } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
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

function loadProjectEnvironment() {
  const envFile = path.join(repoRoot, ".env")
  if (!existsSync(envFile)) return
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envFile)
    return
  }

  for (const rawLine of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match || process.env[match[1]] !== undefined) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[match[1]] = value
  }
}

loadProjectEnvironment()

const host = "127.0.0.1"
const port = Number(process.env.BLOG_STUDIO_PORT || 4322)
const maxBodyBytes = 25 * 1024 * 1024
const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true })

function resolvePnpmScript() {
  const candidates = [
    process.env.npm_execpath,
    process.env.APPDATA && path.join(process.env.APPDATA, "npm", "node_modules", "pnpm", "bin", "pnpm.mjs"),
    process.env.PNPM_HOME && path.join(process.env.PNPM_HOME, "node_modules", "pnpm", "bin", "pnpm.mjs"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "pnpm", "node_modules", "pnpm", "bin", "pnpm.mjs"),
  ].filter(Boolean)

  for (const directory of String(process.env.PATH || "").split(path.delimiter)) {
    if (!directory) continue
    candidates.push(path.join(directory, "node_modules", "pnpm", "bin", "pnpm.mjs"))
    candidates.push(path.join(directory, "node_modules", "pnpm", "bin", "pnpm.cjs"))
  }

  return candidates.find((candidate) =>
    /pnpm\.(?:mjs|cjs|js)$/i.test(candidate) && existsSync(candidate),
  ) || ""
}

const pnpmScript = resolvePnpmScript()

function resolveCommand(command, args) {
  if (command !== "pnpm") return { command, args }
  if (pnpmScript) return { command: process.execPath, args: [pnpmScript, ...args] }

  return {
    command,
    args,
    error: "工作台没有找到 pnpm。请从“启动博客工作台.cmd”重新启动，或确认 pnpm 已正确安装。",
  }
}

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
      section: parsed.data.section || "",
      series: parsed.data.series || "",
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

function normalizeDate(value, fallback) {
  const date = value instanceof Date ? value : new Date(value || fallback)
  if (Number.isNaN(date.getTime())) throw new Error("发布日期格式不正确，请重新选择日期和时间。")
  return date
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
  const published = normalizeDate(input.published || existing.published, timestamp)
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
    updated: normalizeDate(timestamp),
    draft: input.draft !== false,
    description: String(input.description || ""),
    image: String(input.image || ""),
    tags: [...new Set(tags)],
    category: String(input.category || "学习"),
    section: ["article", "note", "life"].includes(input.section) ? input.section : (existing.section || "note"),
    series: String(input.series || "").trim(),
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
  const output = matter.stringify(String(payload.body || "").trim(), meta)
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
  const requestedStorage = ["cloud", "local"].includes(payload.storage) ? payload.storage : "auto"
  const cloud = cloudImageConfig()
  if (requestedStorage === "cloud" && !cloud.configured) {
    throw new Error("图床尚未配置。请在项目 .env 中填写 QINIU_ACCESS_KEY、QINIU_SECRET_KEY 和 QINIU_BUCKET，然后重启工作台。")
  }
  if (requestedStorage !== "local" && cloud.configured) {
    return uploadCloudImage({ payload, bytes, mimeType: match[1], extension, cloud })
  }

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
  return { path: `/${folder}/${finalName}`, storage: "local" }
}

function cloudImageConfig() {
  const region = process.env.QINIU_REGION || "z0"
  const accessKey = process.env.QINIU_ACCESS_KEY || ""
  const secretKey = process.env.QINIU_SECRET_KEY || ""
  const bucket = process.env.QINIU_BUCKET || ""
  const regionUploadUrls = {
    z0: "https://up-z0.qiniup.com",
    "cn-east-2": "https://up-cn-east-2.qiniup.com",
    z1: "https://up-z1.qiniup.com",
    z2: "https://up-z2.qiniup.com",
    na0: "https://up-na0.qiniup.com",
    as0: "https://up-as0.qiniup.com",
    "ap-southeast-2": "https://up-ap-southeast-2.qiniup.com",
    "ap-southeast-3": "https://up-ap-southeast-3.qiniup.com",
  }
  const uploadUrl = process.env.QINIU_UPLOAD_URL || regionUploadUrls[region] || ""
  const publicBaseUrl = String(process.env.IMAGE_CDN_BASE_URL || "https://dns.whalefall.top").replace(/\/+$/, "")
  const prefix = String(process.env.QINIU_PREFIX || "").replace(/^\/+|\/+$/g, "")
  return {
    accessKey,
    secretKey,
    bucket,
    region,
    uploadUrl,
    publicBaseUrl,
    prefix,
    configured: Boolean(accessKey && secretKey && bucket && uploadUrl),
  }
}

function cleanImageBase(value, fallback) {
  const base = String(value || "").normalize("NFKC")
    .replace(/[\\/:*?"<>|#%&{}$!'@+=`]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
  return base || fallback
}

function encodeObjectUrl(baseUrl, key) {
  return `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`
}

function qiniuBase64(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value)
  return bytes.toString("base64").replaceAll("+", "-").replaceAll("/", "_")
}

function qiniuUploadToken({ accessKey, secretKey, bucket }, key) {
  const policy = qiniuBase64(JSON.stringify({
    scope: `${bucket}:${key}`,
    deadline: Math.floor(Date.now() / 1000) + 3600,
    insertOnly: 1,
    returnBody: '{"key":"$(key)","hash":"$(etag)","size":$(fsize),"mimeType":"$(mimeType)"}',
  }))
  const signature = qiniuBase64(createHmac("sha1", secretKey).update(policy).digest())
  return `${accessKey}:${signature}:${policy}`
}

async function uploadCloudImage({ payload, bytes, mimeType, extension, cloud }) {
  const originalBase = path.basename(String(payload.name || "image"), path.extname(String(payload.name || "")))
  const articleBase = cleanSlug(payload.slug, "article")
  const genericName = /^(?:image|clipboard|pasted-image|screenshot|blob)$/i.test(originalBase.trim())
  const fallback = `${articleBase}-${Date.now()}`
  const base = cleanImageBase(genericName ? fallback : originalBase, fallback)
  let counter = 1
  while (counter <= 100) {
    const suffix = counter === 1 ? "" : `-${counter}`
    const fileName = `${base}${suffix}${extension}`
    const key = cloud.prefix ? `${cloud.prefix}/${fileName}` : fileName
    const form = new FormData()
    form.set("token", qiniuUploadToken(cloud, key))
    form.set("key", key)
    form.set("file", new Blob([bytes], { type: mimeType }), fileName)

    let response
    let result
    try {
      response = await fetch(cloud.uploadUrl, { method: "POST", body: form })
      result = await response.json().catch(() => ({}))
    } catch (error) {
      throw new Error(`连接七牛云失败：${error?.message || "请检查网络和上传域名"}`)
    }

    if (response.ok) {
      return { path: encodeObjectUrl(cloud.publicBaseUrl, key), storage: "cloud", key }
    }
    if (response.status === 614 || /file exists/i.test(result?.error || "")) {
      counter += 1
      continue
    }
    throw new Error(`上传七牛图床失败（${response.status}）：${result?.error || "请检查 AccessKey、SecretKey、空间名称和区域"}`)
  }
  throw new Error("同名图片过多，请修改图片文件名后重试。")
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const invocation = resolveCommand(command, args)
    if (invocation.error) {
      reject(new Error(invocation.error))
      return
    }
    execFile(invocation.command, invocation.args, {
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

async function collectDiagnostics(error) {
  const output = [error?.message, error?.output].filter(Boolean).join("\n")
  const lines = output.split(/\r?\n/)
  const typeError = output.match(/([\w-]+)\*{0,2}:\s*\*{0,2}\1:\s*Expected type `(?:\\?"?)([^`"\\]+)(?:\\?"?)`, received `(?:\\?"?)([^`"\\]+)(?:\\?"?)`/i)
  const detail = typeError
    ? `字段“${typeError[1]}”类型错误：需要 ${typeError[2]}，当前是 ${typeError[3]}。`
    : /new blank line at EOF/i.test(output)
      ? "文件末尾存在多余空白行。"
      : /trailing whitespace/i.test(output)
        ? "该行末尾存在多余空格。"
        : lines.map((line) => line.trim()).find((line) => /error ts\(|does not match collection schema/i.test(line))
          || "请查看完整检查信息。"
  const diagnostics = []
  const seen = new Set()
  const filePattern = /(src[\\/][^:\r\n]+?\.(?:md|mdx|astro|ts|tsx|js|jsx|css|mjs))(?::(\d+)(?::(\d+))?)?/i

  for (const line of lines) {
    const match = line.match(filePattern)
    if (!match) continue
    const file = match[1].replaceAll("\\", "/")
    const lineNumber = Number(match[2] || 0)
    const column = Number(match[3] || 0)
    const key = `${file}:${lineNumber}:${column}`
    if (seen.has(key)) continue
    seen.add(key)

    const contentRelative = file.startsWith("src/content/") ? file.slice("src/content/".length) : ""
    let title = path.basename(file, path.extname(file))
    if (contentRelative && /^(posts|thoughts)\//.test(contentRelative)) {
      try {
        const parsed = matter(await readFile(contentPath(contentRelative), "utf8"))
        title = parsed.data.title || (contentRelative.startsWith("thoughts/") ? parsed.content.trim().slice(0, 36) : title)
      } catch { /* 文件内容本身损坏时仍显示路径 */ }
    }

    diagnostics.push({
      file,
      contentPath: contentRelative,
      title,
      line: lineNumber,
      column,
      location: lineNumber > 0 ? `第 ${lineNumber} 行${column > 0 ? `，第 ${column} 列` : ""}` : contentRelative ? "文章头部信息" : "文件级问题",
      message: /does not match collection schema|Expected type/i.test(output)
        ? `文章属性格式不符合要求：${detail}`
        : detail,
    })
  }

  if (!diagnostics.length) {
    diagnostics.push({
      file: "",
      contentPath: "",
      title: "检查未通过",
      line: 0,
      column: 0,
      location: "项目级问题",
      message: detail,
    })
  }
  return diagnostics.slice(0, 12)
}

async function checkChangedMarkdownFormatting() {
  const [tracked, untracked] = await Promise.all([
    run("git", ["diff", "--name-only", "HEAD"]),
    run("git", ["ls-files", "--others", "--exclude-standard"]),
  ])
  const files = [...new Set(`${tracked}\n${untracked}`.split(/\r?\n/).map((file) => file.trim()).filter(Boolean))]
    .filter((file) => /^src[\\/]content[\\/].*\.mdx?$/i.test(file))
  const issues = []

  for (const file of files) {
    const source = (await readFile(resolveInside(repoRoot, file), "utf8")).replaceAll("\r\n", "\n")
    const lines = source.split("\n")
    lines.forEach((line, index) => {
      if (/[\t ]+$/.test(line)) issues.push(`${file}:${index + 1}: trailing whitespace.`)
    })
    if (/\n[\t ]*\n$/.test(source)) {
      issues.push(`${file}:${Math.max(1, lines.length - 1)}: new blank line at EOF.`)
    }
  }

  if (issues.length) {
    const error = new Error("发现 Markdown 空白格式问题。")
    error.output = issues.join("\n")
    throw error
  }
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
    await step("构建正式博客", "pnpm", ["build"], { timeout: 15 * 60 * 1000 })
    await step("暂存本次改动", "git", ["add", "-A"])
    await step("检查待提交内容", "git", ["diff", "--cached", "--check"])
    await step("保存版本", "git", ["commit", "-m", String(message || "content: update blog").trim()])
  } else {
    await step("构建正式博客", "pnpm", ["build"], { timeout: 15 * 60 * 1000 })
  }
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
  if (req.method === "GET" && url.pathname === "/api/upload/status") {
    const cloud = cloudImageConfig()
    return json(res, 200, {
      storage: cloud.configured ? "cloud" : "local",
      label: cloud.configured ? "七牛图床已连接" : "本地图片模式",
      publicBaseUrl: cloud.configured ? cloud.publicBaseUrl : "",
    })
  }
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
    try {
      const output = await run("pnpm", [task], { timeout: task === "build" ? 15 * 60 * 1000 : 10 * 60 * 1000 })
      if (task === "check") await checkChangedMarkdownFormatting()
      return json(res, 200, {
        output: [output, task === "check" ? "Markdown 空白格式检查通过。" : ""].filter(Boolean).join("\n\n") || `${task} 完成，没有发现问题。`,
        diagnostics: [],
      })
    } catch (error) {
      error.diagnostics = await collectDiagnostics(error)
      throw error
    }
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
    if (!error.diagnostics && error.output) error.diagnostics = await collectDiagnostics(error)
    json(res, 500, { error: error.message || "操作失败。", output: error.output || "", diagnostics: error.diagnostics || [] })
  }
})

function openWorkbench(url) {
  const [command, args] = process.platform === "darwin"
    ? ["open", [url]]
    : process.platform === "win32"
      ? [process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "start", "", url]]
      : ["xdg-open", [url]]
  spawn(command, args, { detached: true, stdio: "ignore" }).unref()
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    const url = `http://${host}:${port}`
    console.log(`\n鲸落博客工作台已经在运行：${url}`)
    if (!process.argv.includes("--no-open")) openWorkbench(url)
    process.exit(0)
  }
  console.error("博客工作台启动失败：", error)
  process.exit(1)
})

server.listen(port, host, () => {
  const url = `http://${host}:${port}`
  console.log(`\n鲸落博客工作台已启动：${url}`)
  console.log(`pnpm：${pnpmScript || "未找到"}`)
  console.log("关闭此窗口即可停止工作台。\n")
  if (!process.argv.includes("--no-open")) openWorkbench(url)
})

process.on("SIGINT", () => server.close(() => process.exit(0)))
