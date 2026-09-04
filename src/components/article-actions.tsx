import { useEffect, useRef, useState } from "react"
import { ArrowUp, FileDown, House, Plus } from "lucide-react"
import { Liquid } from "liquid-gooey"
import "@/styles/article-actions.css"

export function ArticleActions() {
  const [open, setOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [printing, setPrinting] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        toggle.current?.focus()
      }
    }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("keydown", escape)
    }
  }, [open])

  const printPage = async () => {
    if (printing) return
    setPrinting(true)
    setOpen(false)
    toggle.current?.focus()
    try {
      // Give fonts a bounded chance to settle before the browser paginates text.
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))])
      window.print()
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div ref={root} className={`article-actions ${open ? "is-open" : ""}`} role="group" aria-label="文章快捷操作"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}>
      <Liquid className="article-actions__liquid" blur={6} contrast={18} fill="var(--primary)"
        shadow="0 4px 12px rgba(22, 66, 108, .18)" filterPadding={220}>
        {[
          { name: "导出 PDF", icon: FileDown, action: printPage },
          { name: "回到顶部", icon: ArrowUp, action: () => {
            window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" })
            setOpen(false)
            toggle.current?.focus()
          } },
          { name: "返回首页", icon: House, href: "/#home-main" },
        ].map(({ name, icon: Icon, action, href }, index) => (
          <Liquid.Item key={name} className="article-actions__slot" y={open ? -(index + 1) * 62 : 0}
            transition={reducedMotion ? { duration: 0 } : "bouncy"} delay={reducedMotion ? 0 : index * 35} radius={24}>
            <div className="article-actions__satellite" aria-hidden={!open} inert={!open}>
              {href ? (
                <a href={href} className="article-actions__button" aria-label={name} tabIndex={open ? 0 : -1}>
                  <Icon size={20} /><span className="article-actions__label">{name}</span>
                </a>
              ) : (
                <button type="button" className="article-actions__button" aria-label={name} onClick={action}
                  tabIndex={open ? 0 : -1} disabled={!open || (name === "导出 PDF" && printing)}>
                  <Icon size={20} /><span className="article-actions__label">{name}</span>
                </button>
              )}
            </div>
          </Liquid.Item>
        ))}
        <Liquid.Item className="article-actions__slot article-actions__main" radius={24}>
          <button ref={toggle} type="button" className="article-actions__button" aria-expanded={open}
            aria-label={open ? "收起文章工具" : "展开文章工具"} onClick={() => setOpen((value) => !value)}>
            <Plus size={23} className="article-actions__plus" />
          </button>
        </Liquid.Item>
      </Liquid>
      <span className="sr-only" role="status">{printing ? "正在打开打印窗口，请选择另存为 PDF" : ""}</span>
    </div>
  )
}
