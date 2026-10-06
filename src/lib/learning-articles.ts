import type { PostEntry } from "@/lib/posts"
import { getPostSection, getPostSeries, toSeriesSlug } from "@/lib/content-sections"
import { toPostMeta } from "@/lib/posts"
import type { LearningArticles } from "@/lib/learning-progress"
import { learningTrackIds, type LearningTrackId } from "@/data/learning-plan"

const trackMatchers: Record<LearningTrackId, RegExp> = {
  nowcoder: /牛客|nowcoder|ac\.nowcoder\.com/i,
  hdu: /杭电|\bhdu\b|acm\.hdu\.edu\.cn/i,
  "ai-infra": /ai\s*infra|aiinfra/i,
  "regional-vp": /区域赛|\bicpc\b|\bccpc\b|virtual participation/i,
  agent: /\b(?:ai|llm)[ -]?agents?\b|agentic|智能体|langgraph|langchain|工具调用/i,
}

function getPostHref(post: PostEntry) {
  const section = getPostSection(post)
  if (section === "life") return `/life/${post.slug}/`
  if (section === "note") return `/notes/${toSeriesSlug(getPostSeries(post))}/${post.slug}/`
  return `/posts/${post.slug}/`
}

export function buildLearningArticles(posts: PostEntry[]): LearningArticles {
  const articles = Object.fromEntries(learningTrackIds.map((id) => [id, []])) as unknown as LearningArticles

  posts.forEach((post) => {
    const explicitTrack = post.data.learningTrack as LearningTrackId | undefined
    const metadata = [
      post.data.title,
      post.data.description,
      ...(post.data.tags ?? []),
    ].join(" ")
    const searchable = `${metadata} ${typeof post.body === "string" ? post.body : ""}`
    const matchedTracks = explicitTrack
      ? [explicitTrack]
      : (Object.entries(trackMatchers) as [LearningTrackId, RegExp][])
        .filter(([trackId, matcher]) => matcher.test(searchable) || (trackId === "agent" && /\bagents?\b/i.test(metadata)))
        .map(([trackId]) => trackId)

    const meta = toPostMeta(post)
    matchedTracks.forEach((trackId) => {
      if (articles[trackId].some((article) => article.href === getPostHref(post))) return
      articles[trackId].push({ title: post.data.title, href: getPostHref(post), updated: meta.updated })
    })
  })

  return articles
}
