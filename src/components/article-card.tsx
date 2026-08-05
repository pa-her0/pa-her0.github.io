"use client"

import type { CSSProperties, KeyboardEvent, MouseEvent } from "react"
import { Calendar, Folder, Hash, ChevronRight } from "lucide-react"
import type { ArticleMeta } from "./article-list"
import { cn } from "@/lib/utils"
import { navigate } from "astro:transitions/client"

export function ArticleCard({
  article,
  className,
  style,
}: {
  article: ArticleMeta
  className?: string
  style?: CSSProperties
}) {
  const primaryTag = article.tags?.[0]
  const wordCount = article.wordCount ? `${article.wordCount} 字` : "——"
  const readTime = article.readTime ?? "——"
  const categoryHref = `/?category=${encodeURIComponent(article.category)}#home-main`
  const tagHref = primaryTag ? `/?tag=${encodeURIComponent(primaryTag)}#home-main` : undefined
  const postHref = `/posts/${article.slug}/`

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    if (target.closest("a, button")) return
    void navigate(postHref)
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    void navigate(postHref)
  }

  return (
    <article
      className={cn(
        "group relative bg-card border border-border/50 rounded-xl p-5",
        className,
      )}
      style={style}
      role="link"
      tabIndex={0}
      aria-label={`阅读：${article.title}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      {/* Pinned indicator */}
      {article.pinned && (
        <span className="absolute top-4 right-4 text-[11px] font-medium tracking-wide text-muted-foreground/80">
          置顶
        </span>
      )}

      <div className="flex gap-4 sm:gap-5">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display-sans text-[19px] font-semibold text-foreground mb-3 leading-[1.4] group-hover:text-primary dark:group-hover:text-foreground transition-colors duration-75 flex items-start gap-2">
            <span className="w-1 h-6 shrink-0 bg-primary rounded-full" />
            <a href={postHref} className="flex-1 min-w-0 hover:text-primary transition-colors duration-75">
              {article.title}
            </a>
            {article.image ? (
              <div className="sm:hidden block w-20 h-14 shrink-0 rounded-lg overflow-hidden">
                <img
                  src={article.image}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
          </h3>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {article.date}
            </span>
            <a href={categoryHref} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
              <Folder className="w-3.5 h-3.5" />
              {article.categoryLabel}
            </a>
            {tagHref ? (
              <a href={tagHref} className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
                <Hash className="w-3.5 h-3.5" />
                {primaryTag}
              </a>
            ) : (
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                未标签
              </span>
            )}
          </div>

          {/* Excerpt */}
          <p className="text-content-secondary text-base leading-6 mb-3 line-clamp-2">{article.excerpt}</p>

          {/* Footer stats */}
          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span>{wordCount}</span>
            <span className="text-border">|</span>
            <span>{readTime}</span>
          </div>
        </div>

        {/* Thumbnail (optional) */}
        {article.image ? (
          <div className="hidden sm:block w-28 h-20 shrink-0 rounded-lg overflow-hidden">
            <img
              src={article.image}
              alt=""
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : null}

        {/* Arrow */}
        <div className="hidden sm:flex items-center shrink-0 text-muted-foreground opacity-0 group-hover:text-primary group-hover:opacity-100 transition-[color,opacity] duration-200">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </article>
  )
}
