import { cn } from "@/lib/utils"

export function AccentToggle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "accent-style-toggle inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/45 p-1",
        className,
      )}
      role="group"
      aria-label="配色风格"
    >
      <button
        type="button"
        data-accent-option="orange"
        className="accent-style-option flex h-7 w-7 items-center justify-center rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        aria-label="使用噜噜橙色主题"
        aria-pressed="false"
        title="噜噜橙色"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-[#ff8a00] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)]" />
      </button>
      <button
        type="button"
        data-accent-option="red"
        className="accent-style-option flex h-7 w-7 items-center justify-center rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
        aria-label="使用原版红色主题"
        aria-pressed="false"
        title="原版红色"
      >
        <span className="h-3.5 w-3.5 rounded-full bg-[#cf2634] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.10)]" />
      </button>
    </div>
  )
}
