#!/usr/bin/env node
// Sync 偶得 from Tencent COS (S3-compatible) into src/content/thoughts/.
//
// Source of truth: COS bucket prefix (default `1.偶得/`).
// Each .md must have frontmatter with `published` and `slug`.
// Target file path: src/content/thoughts/<slug>.md (slug may contain `/`).
// Files in src/content/thoughts/ whose slug is no longer present in COS are deleted.

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3"
import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "..")
const THOUGHTS_DIR = path.join(REPO_ROOT, "src", "content", "thoughts")

const {
  COS_SECRET_ID,
  COS_SECRET_KEY,
  COS_BUCKET,
  COS_REGION = "ap-beijing",
  COS_ENDPOINT,
  COS_PREFIX = "1.偶得/",
} = process.env

if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) {
  console.error("[sync-thoughts] Missing COS_SECRET_ID / COS_SECRET_KEY / COS_BUCKET env vars.")
  process.exit(1)
}

const endpoint = COS_ENDPOINT || `https://cos.${COS_REGION}.myqcloud.com`

const s3 = new S3Client({
  region: COS_REGION,
  endpoint,
  credentials: { accessKeyId: COS_SECRET_ID, secretAccessKey: COS_SECRET_KEY },
  forcePathStyle: false,
})

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/

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

async function downloadText(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket: COS_BUCKET, Key: key }))
  return await res.Body.transformToString("utf-8")
}

async function listLocalThoughts() {
  const out = new Map() // slug -> abs path
  async function walk(dir) {
    let entries
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch (err) {
      if (err.code === "ENOENT") return
      throw err
    }
    for (const ent of entries) {
      const p = path.join(dir, ent.name)
      if (ent.isDirectory()) await walk(p)
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) {
        const rel = path.relative(THOUGHTS_DIR, p).replace(/\\/g, "/")
        const slug = rel.replace(/\.md$/i, "")
        out.set(slug, p)
      }
    }
  }
  await walk(THOUGHTS_DIR)
  return out
}

function validateFrontmatter(fm, sourceKey) {
  const errors = []
  if (!fm.slug) errors.push("missing `slug`")
  else if (typeof fm.slug !== "string") errors.push("`slug` must be a string")
  else if (!SLUG_RE.test(fm.slug)) errors.push(`invalid slug "${fm.slug}"`)
  if (!fm.published) errors.push("missing `published`")
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

async function removeEmptyDirs(dir) {
  let entries
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const ent of entries) {
    if (ent.isDirectory()) await removeEmptyDirs(path.join(dir, ent.name))
  }
  try {
    const after = await fs.readdir(dir)
    if (after.length === 0 && dir !== THOUGHTS_DIR) await fs.rmdir(dir)
  } catch {
    // ignore
  }
}

async function main() {
  console.log(`[sync-thoughts] listing cos://${COS_BUCKET}/${COS_PREFIX}`)
  const keys = await listAllMarkdown()
  console.log(`[sync-thoughts] found ${keys.length} markdown file(s) on COS`)

  if (keys.length === 0) {
    console.error("[sync-thoughts] aborting: COS returned 0 markdown files (sanity check).")
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

      // Write the source bytes verbatim — preserves YAML date types (unquoted) and
      // any other formatting choices the author/Templater made.
      const dest = path.join(THOUGHTS_DIR, `${slug}.md`)
      const changed = await writeIfChanged(dest, raw)
      if (changed) {
        written++
        console.log(`[sync-thoughts] wrote ${path.relative(REPO_ROOT, dest)}`)
      } else {
        unchanged++
      }
    } catch (err) {
      errors.push(err.message || String(err))
    }
  }

  // Delete local files whose slug is no longer in remote.
  const local = await listLocalThoughts()
  let deleted = 0
  for (const [slug, abs] of local) {
    if (!remoteSlugs.has(slug)) {
      await fs.rm(abs)
      deleted++
      console.log(`[sync-thoughts] removed ${path.relative(REPO_ROOT, abs)}`)
    }
  }
  if (deleted) await removeEmptyDirs(THOUGHTS_DIR)

  console.log(
    `[sync-thoughts] done: ${written} written, ${unchanged} unchanged, ${deleted} deleted, ${errors.length} error(s)`,
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
