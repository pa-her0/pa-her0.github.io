"use client"

import { useState, type CSSProperties } from "react"
import type { ArticleMeta } from "./article-list"
import { profile } from "@/data/profile"
import { cn } from "@/lib/utils"
import { articleDisplayDate } from "@/lib/post-updated"
import "@/styles/article-card.css"

export function ArticleCard({ article, className, style }: {
  article: ArticleMeta
  className?: string
  style?: CSSProperties
}) {
  const [failedImage, setFailedImage] = useState<string>()
  const postHref = `/posts/${article.slug}/`
  const hasImage = article.image && article.image !== failedImage
  const tags = [...new Set(article.tags ?? [])]
  const displayDate = articleDisplayDate(article)

  return (
    <article className={cn("article-preview", className)} style={style}>
      <a href={postHref} data-astro-prefetch="hover" className="article-preview__cover" tabIndex={-1} aria-hidden="true">
        {hasImage ? (
          <img src={article.image} alt="" loading="lazy" decoding="async"
            onError={() => setFailedImage(article.image)} />
        ) : (
          <div className="article-preview__placeholder">
            <span>{article.categoryLabel} / NOTES</span>
            <strong>{article.title}</strong>
            <span>WHALEFALL · {displayDate.slice(0, 4)}</span>
          </div>
        )}
      </a>

      <div className="article-preview__body">
        <h3 className="article-preview__title">
          <a href={postHref} data-astro-prefetch="hover">{article.title}</a>
          {article.pinned && <span className="article-preview__pinned">置顶</span>}
        </h3>
        {article.excerpt && <p className="article-preview__excerpt">{article.excerpt}</p>}

        <div className="article-preview__meta">
          <a href="/about/" className="article-preview__author">
            <img src={profile.avatar} alt="" width={24} height={24} loading="lazy" />
            {profile.name}
          </a>
          <time dateTime={displayDate} aria-label={`更新于 ${displayDate}`}
            title={`最后更新：${displayDate} · 创建于：${article.date}`}>{displayDate}</time>
          <span title={article.wordCount != null ? `${article.wordCount} 字` : undefined}>{article.readTime ?? "阅读文章"}</span>
        </div>

        <div className="article-preview__tags" aria-label="文章分类与标签">
          <a href={`/articles/?category=${encodeURIComponent(article.category)}`} className="article-preview__category">{article.categoryLabel}</a>
          {tags.filter((tag) => tag !== article.categoryLabel).map((tag) => (
            <a key={tag} href={`/articles/?tag=${encodeURIComponent(tag)}`}># {tag}</a>
          ))}
        </div>
      </div>
    </article>
  )
}
