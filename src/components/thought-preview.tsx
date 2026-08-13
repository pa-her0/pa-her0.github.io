export type ThoughtPreviewItem = {
  slug: string
  title?: string
  date: string
  excerpt: string
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}.${month}.${day}`
}

export function ThoughtPreview({
  thoughts,
  maxItems = 4,
}: {
  thoughts: ThoughtPreviewItem[]
  maxItems?: number
}) {
  const items = thoughts.slice(0, Math.max(0, maxItems))

  return (
    <div className="bg-card border border-border/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 bg-primary rounded-full" />
        <div>
          <h4 className="font-medium text-foreground">碎碎念</h4>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="relative space-y-4">
          {items.map((thought) => (
            <a
              key={thought.slug}
              href={`/thoughts/#thought-${thought.slug}`}
              className="group grid grid-cols-[20px_1fr] gap-1 rounded-xl py-3 pr-2 transition-colors hover:bg-muted/60 sm:py-4 sm:pr-3"
            >
              <div className="relative">
                <div className="absolute left-1/2 top-[8px] bottom-0 w-px bg-border/60 -translate-x-1/2" />
                <div className="relative z-10 flex items-center justify-center min-h-[16px]">
                  <span className="w-3 h-3 rounded-full border-2 border-primary bg-background" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 min-h-[16px] text-xs text-muted-foreground mb-1 font-medium tracking-wide leading-none">
                  <span>{formatDate(thought.date)}</span>
                  {thought.title && (
                    <span className="min-w-0 flex-1 text-xs font-normal text-muted-foreground line-clamp-1">
                      {thought.title}
                    </span>
                  )}
                </div>
                <div className="text-xs text-content-secondary leading-relaxed line-clamp-3 whitespace-pre-line">
                  {thought.excerpt}
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">暂无碎碎念</div>
      )}

      <div className="pt-4 flex justify-end">
        <a
          href="/thoughts/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors group mr-5"
        >
          <span>查看更多</span>
          <svg
            className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </div>
  )
}
