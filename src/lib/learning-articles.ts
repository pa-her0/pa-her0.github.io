import type { PostEntry } from "@/lib/posts"
import { getPostSection, getPostSeries, toSeriesSlug } from "@/lib/content-sections"
import { toPostMeta } from "@/lib/posts"
import type { LearningArticles } from "@/lib/learning-progress"
import type { LearningTrackId } from "@/data/learning-plan"

const trackMatchers: Record<LearningTrackId, RegExp> = {
  nowcoder: /牛客|nowcoder|ac\.nowcoder\.com/i,
  hdu: /杭电|\bhdu\b|acm\.hdu\.edu\.cn/i,
  "ai-infra": /ai\s*infra|aiinfra/i,
}

function getPostHref(post: PostEntry) {
  const section = getPostSection(post)
  if (section === "life") return `/life/${post.slug}/`
  if (section === "note") return `/notes/${toSeriesSlug(getPostSeries(post))}/${post.slug}/`
  return `/posts/${post.slug}/`
}

export function buildLearningArticles(posts: PostEntry[]): LearningArticles {
  const articles: LearningArticles = { nowcoder: [], hdu: [], "ai-infra": [] }

  posts.forEach((post) => {
    const explicitTrack = post.data.learningTrack as LearningTrackId | undefined
    const searchable = [
      post.data.title,
      post.data.description,
      ...(post.data.tags ?? []),
      typeof post.body === "string" ? post.body : "",
    ].join(" ")
    const matchedTracks = explicitTrack
      ? [explicitTrack]
      : (Object.entries(trackMatchers) as [LearningTrackId, RegExp][])
        .filter(([, matcher]) => matcher.test(searchable))
        .map(([trackId]) => trackId)

    const meta = toPostMeta(post)
    matchedTracks.forEach((trackId) => {
      if (articles[trackId].some((article) => article.href === getPostHref(post))) return
      articles[trackId].push({ title: post.data.title, href: getPostHref(post), updated: meta.updated })
    })
  })

  return articles
}
