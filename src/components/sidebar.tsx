"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"
import { profile } from "@/data/profile"
import { ProfileContactLink } from "@/components/profile-contact-link"

interface SidebarProps {
  categories: { id: string; name: string; count: number }[]
  tags: string[]
  activeCategory: string
  onCategoryChange: (category: string) => void
  activeTag: string | null
  onTagChange: (tag: string | null) => void
  categoryPreviewCount?: number
  categoriesExpanded?: boolean
  onCategoriesExpandedChange?: (expanded: boolean) => void
  extra?: ReactNode
}

export function Sidebar({
  categories,
  tags,
  activeCategory,
  onCategoryChange,
  activeTag,
  onTagChange,
  categoryPreviewCount = 3,
  categoriesExpanded,
  onCategoriesExpandedChange,
  extra,
}: SidebarProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = categoriesExpanded ?? internalExpanded
  const setExpanded = onCategoriesExpandedChange ?? setInternalExpanded
  const canCollapse = categories.length > categoryPreviewCount
  const visibleCategories = isExpanded ? categories : categories.slice(0, categoryPreviewCount)

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-8">
      {/* Author Card */}
      <div className="bg-card border border-border/50 rounded-xl p-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-2 border-primary/20">
          <img
            src={profile.avatar}
            alt={profile.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="font-serif text-xl font-bold text-foreground mb-1">{profile.name}</h3>
        <div className="w-8 h-0.5 bg-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{profile.bio}</p>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-3 mb-4">
          {profile.links.map((link) => {
            return (
              <ProfileContactLink
                key={link.name}
                link={link}
                className="p-2 rounded-full bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                iconClassName="w-4 h-4"
              />
            )
          })}
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            正在空降：超级地球
          </span>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h4 className="font-medium text-foreground">分类</h4>
        </div>
        <div className="space-y-1">
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                activeCategory === category.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>{category.name}</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  activeCategory === category.id ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}
              >
                {category.count}
              </span>
            </button>
          ))}
        </div>
        {canCollapse && !isExpanded && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full mt-3 text-sm text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-2"
          >
            <span className="tracking-widest text-primary/70">•••</span>
            更多
          </button>
        )}
      </div>

      {/* Tags */}
      <div className="bg-card border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 bg-primary rounded-full" />
          <h4 className="font-medium text-foreground">标签</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onTagChange(activeTag === tag ? null : tag)}
                className={cn(
                "px-3 py-1.5 rounded-lg text-xs transition-colors",
                activeTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {extra && <div>{extra}</div>}
    </aside>
  )
}
