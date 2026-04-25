#!/usr/bin/env node
// One-off migration:
//   1. For each existing thought in src/content/thoughts/, derive its current
//      Astro slug from the file path and inject it as `slug:` in frontmatter.
//   2. Copy each file into the Obsidian vault at <VAULT>/1.偶得/<year>/<basename>.md
//      so Remotely Save will push them to COS.
//
// Idempotent: re-running adds nothing if `slug:` already present.

import matter from "gray-matter"
import fs from "node:fs/promises"
import path from "node:path"
import os from "node:os"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "..")
const THOUGHTS_DIR = path.join(REPO_ROOT, "src", "content", "thoughts")
const OBSIDIAN_TARGET =
  process.env.OBSIDIAN_THOUGHTS_DIR ||
  path.join(os.homedir(), "Documents", "Obsidian", "1.偶得")

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...(await walk(p)))
    else if (ent.isFile() && ent.name.toLowerCase().endsWith(".md")) out.push(p)
  }
  return out
}

function deriveYear(slug, published) {
  const slugYear = slug.match(/^(\d{4})/)?.[1]
  if (slugYear) return slugYear
  if (published instanceof Date) return String(published.getUTCFullYear())
  if (typeof published === "string") return published.slice(0, 4)
  return "unsorted"
}

async function main() {
  const files = await walk(THOUGHTS_DIR)
  console.log(`[migrate] processing ${files.length} thought file(s)`)

  await fs.mkdir(OBSIDIAN_TARGET, { recursive: true })

  let updated = 0
  let copied = 0

  for (const abs of files) {
    const rel = path.relative(THOUGHTS_DIR, abs).replace(/\\/g, "/")
    const slug = rel.replace(/\.md$/i, "")
    const raw = await fs.readFile(abs, "utf-8")
    const parsed = matter(raw)

    let outBlogContent = raw
    if (!parsed.data.slug) {
      // Inject `slug:` as the first frontmatter line, leaving the rest of the file untouched
      // so YAML date types (unquoted) and original formatting are preserved.
      const fmStart = raw.indexOf("---")
      if (fmStart === -1) {
        console.warn(`[migrate] skip ${rel}: no frontmatter`)
        continue
      }
      const afterFirst = raw.indexOf("\n", fmStart) + 1
      outBlogContent = raw.slice(0, afterFirst) + `slug: ${slug}\n` + raw.slice(afterFirst)
      await fs.writeFile(abs, outBlogContent, "utf-8")
      updated++
      console.log(`[migrate] +slug ${rel} -> ${slug}`)
    }

    const year = deriveYear(slug, parsed.data.published)
    const baseName = path.basename(rel)
    const obsidianYearDir = path.join(OBSIDIAN_TARGET, year)
    await fs.mkdir(obsidianYearDir, { recursive: true })
    const obsidianPath = path.join(obsidianYearDir, baseName)

    let existing = null
    try {
      existing = await fs.readFile(obsidianPath, "utf-8")
    } catch (err) {
      if (err.code !== "ENOENT") throw err
    }
    if (existing !== outBlogContent) {
      await fs.writeFile(obsidianPath, outBlogContent, "utf-8")
      copied++
      console.log(`[migrate] copied -> ${obsidianPath}`)
    }
  }

  console.log(`[migrate] done: ${updated} frontmatter updated, ${copied} files copied to vault`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
