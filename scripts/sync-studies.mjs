#!/usr/bin/env node
// Sync 专题 from Tencent COS (S3-compatible) into src/content/studies/.
//
// Source of truth: COS bucket prefix (default `1.专题/`).
// 同步规则：只拉「与父文件夹同名的 .md」——
//   COS 里 `1.专题/<folder>/<folder>.md`  →  repo 里 `src/content/studies/<slug>.md`
// 其他 md / pdf / 图片等散料一律忽略，留作 vault 内部研究空间。
//
// 文件名不直接复用文件夹名（中文文件夹会变成 %-encoded URL），而是读取
// frontmatter 里的 `slug` 字段作为最终落盘文件名。

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

// 只保留「与父文件夹同名」的 md。这是约定：每个专题文件夹里的同名 md 是元数据入口，
// 文件夹里其他 md / pdf / 图片都是用户的研究散料，不参与同步。
function isStudyEntryFile(key) {
  // 期望 key 形如 "1.专题/对齐问题/对齐问题.md"
  const rel = key.startsWith(COS_PREFIX) ? key.slice(COS_PREFIX.length) : key
  const parts = rel.split("/").filter(Boolean)
  if (parts.length !== 2) return false
  const [folder, file] = parts
  if (!file.toLowerCase().endsWith(".md")) return false
  const stem = file.replace(/\.md$/i, "")
  return stem === folder
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
  const keys = allKeys.filter(isStudyEntryFile)
  console.log(
    `[sync-studies] found ${allKeys.length} markdown file(s) on COS, ${keys.length} match study-entry pattern`,
  )

  if (keys.length === 0) {
    console.error(
      "[sync-studies] aborting: no study entry .md files found (expected `1.专题/<folder>/<folder>.md`).",
    )
    process.exit(2)
  }

  const remoteSlugs = new Set()
  let written = 0
  let unchanged = 0
  const errors = []

  for (const key of keys) {
    try {
      const raw = await downloadText(key)
      const parsed = matter(raw)
      validateFrontmatter(parsed.data, key)
      const slug = parsed.data.slug
      remoteSlugs.add(slug)

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
