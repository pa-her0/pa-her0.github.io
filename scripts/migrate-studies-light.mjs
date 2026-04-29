#!/usr/bin/env node
// 一次性迁移：把现有专题 .md 升级到 Light 格式
//   - 资源标题加粗：`- 影：xxx 2026-03-02 【已看】` → `- 影：**xxx** 2026-03-02 【已看】`
//   - 笔记改 callout：`> 2026-03-12: body` → `> [!note] 2026-03-12\n> body`
//
// 用法：
//   node scripts/migrate-studies-light.mjs <文件或目录路径...>
//
// 例：
//   node scripts/migrate-studies-light.mjs src/content/studies/
//   node scripts/migrate-studies-light.mjs ~/Documents/Obsidian/1.专题/

import { readFileSync, writeFileSync, statSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"

// 资源行：- <类型>：<title 内容> <DATE> 【<status>】
// 注意：title 部分可能本身就含 **，要避免重复加粗
const RESOURCE_LINE_RE = /^(\s*-\s+[^：:]+[：:]\s*)(.+?)(\s+\d{4}-\d{2}-\d{2}(?:\s*【[^】]+】)?\s*)$/
// 老笔记行：> DATE: body  (可能多行；后续以 > 开头或不带 > 的续行都算 body)
const OLD_NOTE_RE = /^>\s*(\d{4}-\d{2}-\d{2})\s*[:：]\s*(.+)$/

function migrate(content) {
  const lines = content.split(/\n/)
  const out = []
  let changed = false
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 检查是否是资源行（加粗 title）
    const resMatch = line.match(RESOURCE_LINE_RE)
    if (resMatch) {
      const [, prefix, title, suffix] = resMatch
      // 如果 title 已经被 ** 包裹，跳过
      if (/^\*\*.+\*\*$/.test(title.trim())) {
        out.push(line)
      } else {
        out.push(`${prefix}**${title.trim()}**${suffix}`)
        changed = true
      }
      i++
      continue
    }

    // 检查是否是老笔记行（转 callout）
    const noteMatch = line.match(OLD_NOTE_RE)
    if (noteMatch) {
      const [, date, body] = noteMatch
      // 收集后续 body 行（直到空行或下一条 entry）
      const bodyLines = [body]
      let j = i + 1
      while (j < lines.length) {
        const next = lines[j]
        if (!next.trim()) break // 空行结束
        // 下一条 entry 起头：另一个 > DATE: 或 - 类型：
        if (OLD_NOTE_RE.test(next)) break
        if (/^\s*-\s+[^：:]+[：:]/.test(next)) break
        // body 续行：可能带 > 前缀也可能不带
        bodyLines.push(next.replace(/^>\s?/, "").trim())
        j++
      }
      out.push(`> [!note] ${date}`)
      bodyLines.forEach((l) => out.push(`> ${l}`))
      changed = true
      i = j
      continue
    }

    out.push(line)
    i++
  }

  return { content: out.join("\n"), changed }
}

function processFile(path) {
  const content = readFileSync(path, "utf8")
  const { content: migrated, changed } = migrate(content)
  if (changed) {
    writeFileSync(path, migrated)
    console.log(`✓ migrated: ${path}`)
  } else {
    console.log(`  unchanged: ${path}`)
  }
}

function walk(p) {
  const stat = statSync(p)
  if (stat.isFile()) {
    if (p.endsWith(".md")) processFile(p)
  } else if (stat.isDirectory()) {
    for (const entry of readdirSync(p)) {
      walk(join(p, entry))
    }
  }
}

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error("用法: node scripts/migrate-studies-light.mjs <path...>")
  process.exit(1)
}

for (const arg of args) {
  walk(resolve(arg.replace(/^~/, process.env.HOME)))
}
