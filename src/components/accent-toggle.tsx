import { cn } from "@/lib/utils"
import "@/styles/palette-menu.css"

const colors = [
  { id: "blue", name: "晴空蓝", color: "#2196ed" },
  { id: "orange", name: "噜噜橙", color: "#ff8a00" },
  { id: "red", name: "朱砂红", color: "#cf2634" },
]

export function AccentToggle({ className }: { className?: string }) {
  return (
    <details className={cn("palette-menu", className)} data-palette-menu>
      <summary aria-label="选择配色" title="选择配色">
        <svg className="palette-menu__icon" width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M16 3C8.8 3 3 8.4 3 15.4 3 22.6 8.5 28 15.4 28h1.2c2.4 0 3.8-2.6 2.5-4.5-.9-1.4.1-3.3 1.9-3.3h2.5c4.1 0 6.2-2.8 5.5-6.6C28 7.7 22.6 3 16 3Z" fill="var(--card)" stroke="currentColor" strokeWidth="1.6"/>
          <circle className="palette-dot palette-dot--blue" cx="10" cy="11" r="2.7" fill="#2196ed"/>
          <circle className="palette-dot palette-dot--orange" cx="18" cy="8.5" r="2.5" fill="#ff8a00"/>
          <circle className="palette-dot palette-dot--red" cx="24" cy="13.5" r="2.4" fill="#cf2634"/>
          <circle cx="10" cy="21" r="2.6" fill="var(--background)" stroke="currentColor" strokeWidth="1.2"/>
        </svg>
      </summary>
      <div className="palette-menu__panel" role="group" aria-label="配色风格">
        <span className="palette-menu__caption">一点色彩</span>
        {colors.map(({ id, name, color }) => (
          <button key={id} type="button" data-accent-option={id} aria-label={`使用${name}主题`} aria-pressed="false">
            <span className="palette-menu__swatch" style={{ background: color }} />
            <span>{name}</span><span className="palette-menu__check" aria-hidden="true">✓</span>
          </button>
        ))}
      </div>
    </details>
  )
}
