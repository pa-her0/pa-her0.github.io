// 专题数据访问层
// 从 Astro content collection 读 markdown，解析 body 里的资源/笔记行，
// 输出供前端组件消费的结构化数据。
//
// body 语法（详见 ~/Documents/Obsidian/YOLO/skills/专题-keeper.md）：
//
//   - 论文：Constitutional AI by Bai et al. (2022) 2026-04-25 【已读】
//   - 书：正义论 by 约翰·罗尔斯 (1971) 2026-04-22 【在读·第4章】
//
//   > 2026-04-25: 重新读第 3 节。这个隐喻把价值表达为一组明文条款……
//
// - 资源行：可选 `- ` 列表前缀 + <类型>:<title> + 日期 + 可选 【status】
//   类型用自然词，不预设枚举。Obsidian 渲染成 bullet 列表
// - 笔记行：可选 `> ` 引用前缀 + <YYYY-MM-DD>:<body>
//   多行 body：blank line 之前都算同一条笔记。Obsidian 渲染成 blockquote
// - 不带前缀（裸 `论文：...` / 裸 `2026-04-25: ...`）也兼容；前缀只为 Obsidian 视觉区分
// - 渲染顺序 = 写入顺序（Trail 视图就是"按你记录的顺序"）

import { getCollection, type CollectionEntry } from "astro:content"

export type StudyEntry = CollectionEntry<"studies">

export type StudyStatus = "在读" | "沉淀中" | "暂搁" | "已结"

export type ParsedResource = {
  id: string
  type: string
  title: string
  date: string // ISO "YYYY-MM-DD"
  status?: string
  description?: string // 资源下方的内嵌读后感（多行 Markdown 列表续行）
}

export type ParsedNote = {
  id: string
  date: string // ISO "YYYY-MM-DD"
  body: string
}

export type ParsedTrailItem =
  | ({ kind: "resource" } & ParsedResource)
  | ({ kind: "note" } & ParsedNote)

export type StudyData = {
  id: string // = slug
  slug: string
  no: string // 自动编号 "01" "02" ...
  title: string
  subtitle?: string
  epigraph?: string
  field?: string
  started: string // "YYYY · MM" 已格式化
  startedRaw: string // 原始 "YYYY-MM" 用于排序
  updated?: string // 自动派生 "YYYY · MM · DD"
  status: StudyStatus
  resources: ParsedResource[]
  notes: ParsedNote[]
  trail: ParsedTrailItem[] // 资源 + 笔记按 body 顺序混排
  counts: Record<string, number> // 按 type 分组计数
}

// ────────────────────────── parser ──────────────────────────

const RESOURCE_RE =
  /^([^\s:：]+)\s*[:：]\s*(.+?)\s+(\d{4}-?\d{2}-?\d{2})(?:\s*【([^】]+)】)?\s*$/
const NOTE_RE = /^(\d{4}-?\d{2}-?\d{2})\s*[:：]\s*([\s\S]+)$/

function normalizeDate(s: string): string {
  if (s.includes("-")) return s
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

// 剥掉 Markdown 列表/引用前缀，便于做模式匹配
const LIST_PREFIX_RE = /^[-*•]\s+/
const QUOTE_PREFIX_RE = /^>\s*/

function stripMarkdownPrefix(line: string): string {
  return line.replace(LIST_PREFIX_RE, "").replace(QUOTE_PREFIX_RE, "")
}

function isEntryStart(line: string): boolean {
  const s = stripMarkdownPrefix(line.trim())
  return RESOURCE_RE.test(s) || NOTE_RE.test(s)
}

export function parseStudyBody(body: string): ParsedTrailItem[] {
  const lines = body.split(/\n/)
  const out: ParsedTrailItem[] = []
  let rIdx = 0
  let nIdx = 0

  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    const trimmed = raw.trim()
    if (!trimmed) {
      i++
      continue
    }

    const stripped = stripMarkdownPrefix(trimmed)

    // resource：bullet 行 + 可选的缩进续行（Markdown 列表续行 = 资源描述）
    const resMatch = stripped.match(RESOURCE_RE)
    if (resMatch) {
      // 收集紧随其后的"描述"续行：直到空行 / 下一条 entry
      const descLines: string[] = []
      let j = i + 1
      while (j < lines.length) {
        const next = lines[j]
        if (!next.trim()) break // 空行结束描述
        if (isEntryStart(next.trim())) break // 下一条 entry
        descLines.push(next.trim().replace(/^>\s*/, ""))
        j++
      }
      out.push({
        kind: "resource",
        id: `r-${rIdx++}`,
        type: resMatch[1],
        title: resMatch[2].trim(),
        date: normalizeDate(resMatch[3]),
        status: resMatch[4],
        description: descLines.length ? descLines.join(" ").trim() : undefined,
      })
      i = j
      continue
    }

    // note：可跨多行，blank line 或下一条 entry 开始时终止
    const noteMatch = stripped.match(NOTE_RE)
    if (noteMatch) {
      const bodyLines: string[] = [noteMatch[2]]
      let j = i + 1
      while (j < lines.length) {
        const nextRaw = lines[j]
        const nextTrim = nextRaw.trim()
        if (!nextTrim) break // 空行结束
        if (isEntryStart(nextTrim)) break // 下一条 entry 起头
        bodyLines.push(stripMarkdownPrefix(nextTrim))
        j++
      }
      out.push({
        kind: "note",
        id: `n-${nIdx++}`,
        date: normalizeDate(noteMatch[1]),
        body: bodyLines.join("\n").trim(),
      })
      i = j
      continue
    }

    // 不识别的行静默跳过（用户可在 body 里写自由 markdown，目前不渲染）
    i++
  }
  return out
}

// ────────────────────────── date helpers ──────────────────────────

function parseISO(s: string): { y: number; m: number; d: number } | null {
  // 支持 "YYYY-MM" / "YYYY-MM-DD"
  const m = s.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/)
  if (!m) return null
  return { y: +m[1], m: m[2] ? +m[2] : 0, d: m[3] ? +m[3] : 0 }
}

function formatYM(s: string): string {
  const p = parseISO(s)
  if (!p) return s
  return p.m ? `${p.y} · ${String(p.m).padStart(2, "0")}` : String(p.y)
}

function formatYMD(s: string): string {
  const p = parseISO(s)
  if (!p) return s
  const segs: string[] = [String(p.y)]
  if (p.m) segs.push(String(p.m).padStart(2, "0"))
  if (p.d) segs.push(String(p.d).padStart(2, "0"))
  return segs.join(" · ")
}

function maxDate(items: { date: string }[]): string | undefined {
  let best: { y: number; m: number; d: number; raw: string } | null = null
  for (const it of items) {
    const p = parseISO(it.date)
    if (!p) continue
    if (
      !best ||
      p.y > best.y ||
      (p.y === best.y && (p.m > best.m || (p.m === best.m && p.d > best.d)))
    ) {
      best = { ...p, raw: it.date }
    }
  }
  return best?.raw
}

// ────────────────────────── shaping ──────────────────────────

function shape(entry: StudyEntry, idx: number): StudyData {
  const body = typeof entry.body === "string" ? entry.body : ""
  const trail = parseStudyBody(body)
  const resources = trail.filter(
    (t): t is { kind: "resource" } & ParsedResource => t.kind === "resource",
  )
  const notes = trail.filter(
    (t): t is { kind: "note" } & ParsedNote => t.kind === "note",
  )

  const counts: Record<string, number> = {}
  for (const r of resources) counts[r.type] = (counts[r.type] ?? 0) + 1

  const latestRaw = maxDate(trail)

  // 编号：按 started 升序排列后的位置（最早 = 01）
  // shape() 在已排序的 entries 上调用，idx 直接用
  const no = String(idx + 1).padStart(2, "0")

  return {
    id: entry.slug,
    slug: entry.slug,
    no,
    title: entry.data.title,
    subtitle: entry.data.subtitle,
    epigraph: entry.data.epigraph,
    field: entry.data.field,
    started: formatYM(entry.data.started),
    startedRaw: entry.data.started,
    updated: latestRaw ? formatYMD(latestRaw) : undefined,
    status: entry.data.status,
    resources,
    notes,
    trail,
    counts,
  }
}

// ────────────────────────── public API ──────────────────────────

export async function getAllStudies(): Promise<StudyData[]> {
  const all = (await getCollection("studies")) as StudyEntry[]
  // 按 started 升序（最早的开题排前 = No.01）
  const sorted = all.slice().sort((a: StudyEntry, b: StudyEntry) => {
    const pa = parseISO(a.data.started)
    const pb = parseISO(b.data.started)
    if (!pa || !pb) return 0
    if (pa.y !== pb.y) return pa.y - pb.y
    if (pa.m !== pb.m) return pa.m - pb.m
    if (pa.d !== pb.d) return pa.d - pb.d
    return a.slug.localeCompare(b.slug)
  })
  return sorted.map((entry: StudyEntry, idx: number) => shape(entry, idx))
}

export async function getStudyBySlug(
  slug: string,
): Promise<StudyData | null> {
  const all = await getAllStudies()
  return all.find((s) => s.slug === slug) ?? null
}
