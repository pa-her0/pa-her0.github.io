import { access, cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const sourceRoot = path.resolve(process.argv[2] || path.join(repoRoot, "..", "whalefall-blog-source-main"))

const sourcePosts = path.join(sourceRoot, "src", "content", "posts")
const sourceThoughts = path.join(sourceRoot, "src", "content", "thoughts")
const targetPosts = path.join(repoRoot, "src", "content", "posts")
const targetThoughts = path.join(repoRoot, "src", "content", "thoughts")

const assetDirectories = ["brand", "covers", "img", "learning", "post-covers", "report-assets"]
const rootAssets = ["avatar.jpg", "avatar.png", "favicon.ico", "favicon-orange.png"]

async function collectFiles(directory) {
  const result = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await collectFiles(absolute)))
    else if (/\.mdx?$/i.test(entry.name)) result.push(absolute)
  }
  return result
}

function dateValue(value) {
  if (value instanceof Date) return value
  if (typeof value === "string" && value.trim()) return new Date(value.trim())
  return new Date()
}

function safeSlug(value) {
  return String(value)
    .trim()
    .replace(/\\/g, "-")
    .replace(/\//g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

async function resetDirectory(directory) {
  await rm(directory, { recursive: true, force: true })
  await mkdir(directory, { recursive: true })
}

async function imageValue(value) {
  const image = String(value || "")
  if (!image.startsWith("/")) return image
  try {
    await access(path.join(sourceRoot, "public", image.slice(1)))
    return image
  } catch {
    return ""
  }
}

async function migratePosts() {
  const files = await collectFiles(sourcePosts)
  const used = new Set()

  for (const file of files) {
    const parsed = matter(await readFile(file, "utf8"))
    const fallback = path.basename(file, path.extname(file))
    let slug = safeSlug(parsed.data.slug || fallback) || fallback
    if (used.has(slug.toLowerCase())) slug = `${slug}-${used.size + 1}`
    used.add(slug.toLowerCase())

    const tags = Array.isArray(parsed.data.tags)
      ? parsed.data.tags.map(String)
      : parsed.data.tags
        ? [String(parsed.data.tags)]
        : []
    const outputData = {
      title: String(parsed.data.title || fallback),
      commentSlug: String(parsed.data.slug || fallback),
      published: dateValue(parsed.data.published || parsed.data.publishDate || parsed.data.date),
      draft: Boolean(parsed.data.draft),
      description: String(parsed.data.description || ""),
      image: await imageValue(parsed.data.image || parsed.data.heroImage?.src || parsed.data.cover),
      tags,
      category: String(parsed.data.category || parsed.data.categories?.[0] || "未分类"),
      lang: String(parsed.data.lang || parsed.data.language || "zh-CN"),
    }

    const output = matter.stringify(parsed.content.trimStart(), outputData)
    await writeFile(path.join(targetPosts, `${slug}.md`), output, "utf8")
  }

  return files.length
}

async function migrateThoughts() {
  const files = await collectFiles(sourceThoughts)
  for (const [index, file] of files.entries()) {
    const parsed = matter(await readFile(file, "utf8"))
    const published = dateValue(parsed.data.published || parsed.data.date)
    const dateSlug = published.toISOString().slice(0, 10)
    const tags = Array.isArray(parsed.data.tags) ? parsed.data.tags.map(String) : []
    const outputData = {
      ...(parsed.data.title ? { title: String(parsed.data.title) } : {}),
      published,
      tags,
    }
    const output = matter.stringify(parsed.content.trimStart(), outputData)
    await writeFile(path.join(targetThoughts, `${dateSlug}-${index + 1}.md`), output, "utf8")
  }
  return files.length
}

async function copyAssets() {
  for (const name of assetDirectories) {
    const source = path.join(sourceRoot, "public", name)
    const target = path.join(repoRoot, "public", name)
    await cp(source, target, { recursive: true, force: true })
  }
  for (const name of rootAssets) {
    await cp(path.join(sourceRoot, "public", name), path.join(repoRoot, "public", name), { force: true })
  }
}

if (sourceRoot === repoRoot || !sourceRoot.startsWith(path.dirname(repoRoot))) {
  throw new Error(`Refusing unexpected source path: ${sourceRoot}`)
}

await resetDirectory(targetPosts)
await resetDirectory(targetThoughts)
const postCount = await migratePosts()
const thoughtCount = await migrateThoughts()
await copyAssets()

console.log(`Migrated ${postCount} posts and ${thoughtCount} thoughts from ${sourceRoot}`)
