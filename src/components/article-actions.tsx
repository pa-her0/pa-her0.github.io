import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ArrowUp, FileDown, House, Newspaper, UserRound, type LucideIcon } from "lucide-react"
import "@/styles/article-actions.css"

type PetPose = "idle" | "waving" | "jumping" | "running-left" | "running-right" | "review" | "failed"
type Point = { x: number; y: number }
interface ArticleActionsProps { articleMode?: boolean; latestPostHref?: string }
interface PetAction { name: string; icon: LucideIcon; action?: () => void | Promise<void>; href?: string }

const STORAGE_KEY = "jiely-pet-tools-position-v2"
const PET_WIDTH = 88
const PET_HEIGHT = 94
const HORIZONTAL_GAP = 66
const TOP_GAP = 64
const BOTTOM_GAP = 8
const petSource = (pose: PetPose) => `/pet-tools/savage-codex-hacker-${pose}.gif`
const clampPosition = (point: Point): Point => ({
  x: Math.min(Math.max(HORIZONTAL_GAP, point.x), Math.max(HORIZONTAL_GAP, window.innerWidth - PET_WIDTH - HORIZONTAL_GAP)),
  y: Math.min(Math.max(TOP_GAP, point.y), Math.max(TOP_GAP, window.innerHeight - PET_HEIGHT - BOTTOM_GAP)),
})

export function ArticleActions({ articleMode = false, latestPostHref = "/articles/" }: ArticleActionsProps) {
  const [open, setOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [pose, setPose] = useState<PetPose>("idle")
  const [position, setPosition] = useState<Point | null>(null)
  const [labelsRight, setLabelsRight] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null)
  const poseTimer = useRef<number | null>(null)

  const updateDirections = (point: Point) => {
    setLabelsRight(point.x < window.innerWidth / 2)
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReducedMotion(media.matches)
    const restorePosition = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") as Point | null
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          const next = clampPosition(saved)
          setPosition(next)
          updateDirections(next)
        }
      } catch { localStorage.removeItem(STORAGE_KEY) }
    }
    const keepOnScreen = () => setPosition((current) => {
      if (!current) return current
      const next = clampPosition(current)
      updateDirections(next)
      return next
    })
    syncMotion()
    restorePosition()
    media.addEventListener("change", syncMotion)
    window.addEventListener("resize", keepOnScreen)
    return () => {
      media.removeEventListener("change", syncMotion)
      window.removeEventListener("resize", keepOnScreen)
      if (poseTimer.current) window.clearTimeout(poseTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) { setOpen(false); setPose("idle") }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); setPose("idle"); toggle.current?.focus() }
    }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("keydown", escape)
    return () => { document.removeEventListener("pointerdown", closeOutside); document.removeEventListener("keydown", escape) }
  }, [open])

  const flashPose = (nextPose: PetPose, duration = 650) => {
    if (poseTimer.current) window.clearTimeout(poseTimer.current)
    setPose(reducedMotion ? "idle" : nextPose)
    poseTimer.current = window.setTimeout(() => setPose("idle"), duration)
  }
  const closeWithJump = () => { setOpen(false); flashPose("jumping") }
  const printPage = async () => {
    if (printing) return
    setPrinting(true); setOpen(false); flashPose("review", 900); toggle.current?.focus()
    try {
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))])
      window.print()
    } catch { flashPose("failed", 1100) } finally { setPrinting(false) }
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return
    const rect = root.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top, moved: false }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 5) return
    current.moved = true; setOpen(false); setPose(reducedMotion ? "idle" : dx < 0 ? "running-left" : "running-right")
    const next = clampPosition({ x: current.originX + dx, y: current.originY + dy })
    setPosition(next); updateDirections(next)
  }
  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (current.moved) { const next = position || { x: current.originX, y: current.originY }; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setPose("idle") }
  }
  const onToggleClick = () => {
    if (drag.current?.moved) { drag.current = null; return }
    drag.current = null
    setOpen((value) => { const next = !value; setPose(reducedMotion ? "idle" : next ? "waving" : "idle"); return next })
  }

  const articleActions: PetAction[] = [
    { name: "导出 PDF", icon: FileDown, action: printPage },
    { name: "回到顶部", icon: ArrowUp, action: () => { window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }); closeWithJump(); toggle.current?.focus() } },
    { name: "返回首页", icon: House, href: "/#home-main" },
  ]
  const siteActions: PetAction[] = [
    { name: "返回首页", icon: House, href: "/#home-main" },
    { name: "最新文章", icon: Newspaper, href: latestPostHref },
    { name: "关于我", icon: UserRound, href: "/about/" },
  ]
  const actions = articleMode ? articleActions : siteActions

  return (
    <div ref={root} className={`article-actions ${open ? "is-open" : ""} ${position ? "is-positioned" : ""} ${labelsRight ? "labels-right" : "labels-left"}`}
      style={position ? { left: position.x, top: position.y } : undefined} role="group" aria-label={articleMode ? "文章快捷操作" : "网站快捷导航"}
      onBlur={(event) => { if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setPose("idle") } }}>
      <div className="article-actions__menu">
        {actions.map(({ name, icon: Icon, action, href }) => (
          <div className="article-actions__satellite" key={name} aria-hidden={!open} inert={!open ? true : undefined}>
            {href ? (
              <a href={href} className="article-actions__button" aria-label={name} tabIndex={open ? 0 : -1} onClick={closeWithJump}>
                <Icon aria-hidden="true" /><span className="article-actions__label">{name}</span>
              </a>
            ) : (
              <button type="button" className="article-actions__button" aria-label={name} onClick={action} tabIndex={open ? 0 : -1} disabled={!open || (name === "导出 PDF" && printing)}>
                <Icon aria-hidden="true" /><span className="article-actions__label">{name}</span>
              </button>
            )}
          </div>
        ))}
      </div>
      <button ref={toggle} type="button" className="article-actions__pet" aria-expanded={open} aria-label={open ? "收起宠物工具" : "展开宠物工具；也可以拖动它"}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; setPose("idle") }} onClick={onToggleClick}>
        <img src={petSource(pose)} alt="" draggable="false" width="88" height="94" />
      </button>
      <span className="sr-only" role="status">{printing ? "正在打开打印窗口，请选择另存为 PDF" : ""}</span>
    </div>
  )
}
