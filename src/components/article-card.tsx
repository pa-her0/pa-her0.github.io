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
        <div className="absolute top-4 right-4 text-primary">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      )}

      <div className="flex gap-4 sm:gap-5">
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary dark:group-hover:text-foreground transition-colors duration-75 flex items-start gap-2">
            <span className="w-1 h-6 shrink-0 bg-primary rounded-full mt-0.5" />
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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
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
          <p className="text-muted-foreground text-sm leading-relaxed mb-3 line-clamp-2">{article.excerpt}</p>

          {/* Footer stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        <div className="hidden sm:flex items-center shrink-0 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </article>
  )
}
