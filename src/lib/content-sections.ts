import type { PostEntry } from "./posts"

export type ContentSection = "article" | "note" | "life"

export type NoteGroup = {
  name: string
  slug: string
  description: string
  posts: PostEntry[]
}

const LIFE_CATEGORIES = new Set(["生活", "日常", "思考", "随笔", "阅读", "记忆", "旅行"])

const SERIES_DESCRIPTIONS: Record<string, string> = {
  LLM: "大语言模型、推理机制与多模态可靠性。",
  开发: "工程实践、部署与开发工具。",
  学习: "课程、工具与计算机基础的系统学习记录。",
  科研: "研究过程、论文阅读与实验总结。",
  算法: "算法竞赛、数据结构与解题方法。",
  计划: "阶段目标、学习安排与行动记录。",
  杂项: "工具、随想与零散学习记录。",
  未分类: "尚未归入专题的零散笔记。",
}

const SERIES_SLUGS: Record<string, string> = {
  LLM: "llm",
  开发: "development",
  学习: "study",
  科研: "research",
  算法: "algorithm",
  计划: "plans",
  杂项: "misc",
  未分类: "uncategorized",
}

const PRIMARY_SERIES_ORDER = ["LLM", "开发", "学习", "科研", "算法", "计划", "杂项"]
const PRIMARY_SERIES_RANK = new Map(PRIMARY_SERIES_ORDER.map((name, index) => [name, index]))

const cleanLabel = (value: unknown) => String(value ?? "").trim()

export function getPostSection(post: PostEntry): ContentSection {
  if (post.data.section) return post.data.section
  const category = cleanLabel(post.data.category)
  return LIFE_CATEGORIES.has(category) ? "life" : "note"
}

export function getPostSeries(post: PostEntry) {
  return cleanLabel(post.data.series) || cleanLabel(post.data.category) || "未分类"
}

export function toSeriesSlug(name: string) {
  const known = SERIES_SLUGS[name]
  if (known) return known

  const normalized = name
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\\/?#]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")

  return normalized || "notes"
}

export function buildNoteGroups(posts: PostEntry[]): NoteGroup[] {
  const groups = new Map<string, PostEntry[]>()

  posts.filter((post) => getPostSection(post) === "note").forEach((post) => {
    const series = getPostSeries(post)
    const current = groups.get(series) ?? []
    current.push(post)
    groups.set(series, current)
  })

  return Array.from(groups, ([name, groupedPosts]) => ({
    name,
    slug: toSeriesSlug(name),
    description: SERIES_DESCRIPTIONS[name] ?? `关于「${name}」的连续学习记录。`,
    posts: groupedPosts.sort((a, b) => {
      const orderA = a.data.seriesOrder ?? 0
      const orderB = b.data.seriesOrder ?? 0
      if (orderA > 0 && orderB > 0) return orderA - orderB
      if (orderA > 0) return -1
      if (orderB > 0) return 1
      return 0
    }),
  })).sort((a, b) => {
    const rankA = PRIMARY_SERIES_RANK.get(a.name)
    const rankB = PRIMARY_SERIES_RANK.get(b.name)
    if (rankA !== undefined || rankB !== undefined) {
      if (rankA === undefined) return 1
      if (rankB === undefined) return -1
      if (rankA !== rankB) return rankA - rankB
    }

    const aTime = a.posts[0]?.data.updated?.getTime() ?? a.posts[0]?.data.published.getTime() ?? 0
    const bTime = b.posts[0]?.data.updated?.getTime() ?? b.posts[0]?.data.published.getTime() ?? 0
    return bTime - aTime
  })
}

export function getLifePosts(posts: PostEntry[]) {
  return posts.filter((post) => getPostSection(post) === "life")
}

export function notePostHref(group: NoteGroup, post: PostEntry) {
  return `/notes/${group.slug}/${post.slug}/`
}

export function lifePostHref(post: PostEntry) {
  return `/life/${post.slug}/`
}
