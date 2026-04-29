#!/usr/bin/env node
// Sync 专题 from Tencent COS (S3-compatible) into src/content/studies/.
//
// Source of truth: COS bucket prefix (default `1.专题/`).
// 同步规则：扫 `1.专题/<folder>/<file>.md`（最多 2 层深），凡 frontmatter 里
//   **同时**包含 `slug` 和 `title` 两个字段的视为正式专题，其他 .md 当作研究
//   散料忽略。文件夹名 / 文件名怎么起都行，唯一硬约束是 frontmatter 双信号。
//
// 落盘路径：`src/content/studies/<slug>.md`（slug 由 frontmatter 决定，与文件名解耦）。

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "..")
const STUDIES_DIR = path.join(REPO_ROOT, "src", "content", "studies")

const {
  COS_SECRET_ID,
  COS_SECRET_KEY,
  COS_BUCKET,
  COS_REGION = "ap-beijing",
  COS_ENDPOINT,
  COS_PREFIX = "1.专题/",
} = process.env

if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) {
  console.error("[sync-studies] Missing COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET env vars.")
  process.exit(1)
}

const endpoint = COS_ENDPOINT || `https://cos.${COS_REGION}.myqcloud.com`

const s3 = new S3Client({
  region: COS_REGION,
  endpoint,
  credentials: { accessKeyId: COS_SECRET_ID, secretAccessKey: COS_SECRET_KEY },
  forcePathStyle: false,
})

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/

async function listAllMarkdown() {
  const out = []
  let token
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: COS_BUCKET,
        Prefix: COS_PREFIX,
        ContinuationToken: token,
      }),
    )
    for (const obj of res.Contents || []) {
      if (obj.Key && obj.Key.toLowerCase().endsWith(".md")) out.push(obj.Key)
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return out
}

// 第一道筛：只看 `1.专题/<folder>/<file>.md` 这种 2 层深的 .md。
// 更深的（笔记套笔记）或扁平 .md 一律不当专题候选。
function isCandidateMarkdown(key) {
  const rel = key.startsWith(COS_PREFIX) ? key.slice(COS_PREFIX.length) : key
  const parts = rel.split("/").filter(Boolean)
  return parts.length === 2 && parts[1].toLowerCase().endsWith(".md")
}

// 第二道筛：frontmatter 必须同时有 `slug` 和 `title`。
// 这是"正式专题"的双信号——既防止草稿被误同步，又给用户文件命名自由。
function isStudyEntry(fm) {
  return fm && typeof fm.slug === "string" && fm.slug.trim() !== ""
    && typeof fm.title === "string" && fm.title.trim() !== ""
}

async function downloadText(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: COS_BUCKET, Key: key }))
  return await res.Body.transformToString("utf-8")
}

async function listLocalStudies() {
  const out = new Map() // slug -> abs path
  let entries
  try {
    entries = await fs.readdir(STUDIES_DIR, { withFileTypes: true })
  } catch (err) {
    if (err.code === "ENOENT") return out
    throw err
  }
  for (const ent of entries) {
    if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) {
      const slug = ent.name.replace(/\.md$/i, "")
      out.set(slug, path.join(STUDIES_DIR, ent.name))
    }
  }
  return out
}

function validateFrontmatter(fm, sourceKey) {
  const errors = []
  if (!fm.slug) errors.push("missing `slug`")
  else if (typeof fm.slug !== "string") errors.push("`slug` must be a string")
  else if (!SLUG_RE.test(fm.slug)) errors.push(`invalid slug "${fm.slug}"`)
  if (!fm.title) errors.push("missing `title`")
  if (!fm.status) errors.push("missing `status`")
  if (!fm.started) errors.push("missing `started`")
  if (errors.length) {
    throw new Error(`[${sourceKey}] ${errors.join("; ")}`)
  }
}

async function writeIfChanged(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  let existing = null
  try {
    existing = await fs.readFile(filePath, "utf-8")
  } catch (err) {
    if (err.code !== "ENOENT") throw err
  }
  if (existing === content) return false
  await fs.writeFile(filePath, content, "utf-8")
  return true
}

async function main() {
  console.log(`[sync-studies] listing cos://${COS_BUCKET}/${COS_PREFIX}`)
  const allKeys = await listAllMarkdown()
  const candidates = allKeys.filter(isCandidateMarkdown)
  console.log(
    `[sync-studies] found ${allKeys.length} markdown file(s) on COS, ${candidates.length} candidates (2-level depth)`,
  )

  if (candidates.length === 0) {
    console.error(
      "[sync-studies] aborting: no candidate .md files found (expected `1.专题/<folder>/<file>.md`).",
    )
    process.exit(2)
  }

  const remoteSlugs = new Map() // slug -> 第一次见到它的 cos key（用于 duplicate 报错）
  let written = 0
  let unchanged = 0
  let skipped = 0
  const errors = []

  for (const key of candidates) {
    try {
      const raw = await downloadText(key)
      const parsed = matter(raw)
      // 没 slug 或 title 的 = 草稿散料，静默跳过
      if (!isStudyEntry(parsed.data)) {
        skipped++
        continue
      }
      validateFrontmatter(parsed.data, key)
      const slug = parsed.data.slug

      if (remoteSlugs.has(slug)) {
        throw new Error(
          `duplicate slug "${slug}" in ${key} (first seen in ${remoteSlugs.get(slug)})`,
        )
      }
      remoteSlugs.set(slug, key)

      // 原样写入字节，保留 yaml 日期类型（unquoted）和 Templater 的格式选择
      const dest = path.join(STUDIES_DIR, `${slug}.md`)
      const changed = await writeIfChanged(dest, raw)
      if (changed) {
        written++
        console.log(`[sync-studies] wrote ${path.relative(REPO_ROOT, dest)}`)
      } else {
        unchanged++
      }
    } catch (err) {
      errors.push(err.message || String(err))
    }
  }
  console.log(
    `[sync-studies] ${remoteSlugs.size} valid stud${remoteSlugs.size === 1 ? "y" : "ies"}, ${skipped} skipped (no slug/title — treated as research scraps)`,
  )

  // 删除本地 slug 已不在远端的文件
  const local = await listLocalStudies()
  let deleted = 0
  for (const [slug, abs] of local) {
    if (!remoteSlugs.has(slug)) {
      await fs.rm(abs)
      deleted++
      console.log(`[sync-studies] removed ${path.relative(REPO_ROOT, abs)}`)
    }
  }

  console.log(
    `[sync-studies] done: ${written} written, ${unchanged} unchanged, ${deleted} deleted, ${errors.length} error(s)`,
  )
  if (errors.length) {
    for (const e of errors) console.error(`  - ${e}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
