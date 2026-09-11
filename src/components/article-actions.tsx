import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { ArrowUp, FileDown, House, Music2, Newspaper, Pause, Play, UserRound, type LucideIcon } from "lucide-react"
import { homeDashboard, type HomeTrack } from "@/data/home-dashboard"
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
const isMobileViewport = () => window.innerWidth <= 600
const positionStorageKey = () => `${STORAGE_KEY}:${isMobileViewport() ? "mobile" : "desktop"}`
const clampPosition = (point: Point): Point => {
  const mobile = isMobileViewport()
  const width = mobile ? 76 : PET_WIDTH
  const height = mobile ? 82 : PET_HEIGHT
  const horizontalGap = mobile ? 8 : HORIZONTAL_GAP
  return {
    x: Math.min(Math.max(horizontalGap, point.x), Math.max(horizontalGap, window.innerWidth - width - horizontalGap)),
    y: Math.min(Math.max(TOP_GAP, point.y), Math.max(TOP_GAP, window.innerHeight - height - BOTTOM_GAP)),
  }
}

export function ArticleActions({ articleMode = false, latestPostHref = "/articles/" }: ArticleActionsProps) {
  const [open, setOpen] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [pose, setPose] = useState<PetPose>("idle")
  const [position, setPosition] = useState<Point | null>(null)
  const [labelsRight, setLabelsRight] = useState(false)
  const [musicStatus, setMusicStatus] = useState<"idle" | "loading" | "playing" | "paused" | "error">("idle")
  const [trackIndex, setTrackIndex] = useState<number | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null)
  const poseTimer = useRef<number | null>(null)

  const updateDirections = (point: Point) => {
    setLabelsRight(point.x < window.innerWidth / 2)
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMotion = () => setReducedMotion(media.matches)
    let mobileViewport = isMobileViewport()
    const restorePosition = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(positionStorageKey()) || "null") as Point | null
        if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          const next = clampPosition(saved)
          setPosition(next)
          updateDirections(next)
        } else {
          setPosition(null)
          setLabelsRight(false)
        }
      } catch { localStorage.removeItem(positionStorageKey()) }
    }
    const keepOnScreen = () => {
      const nextMobileViewport = isMobileViewport()
      if (nextMobileViewport !== mobileViewport) {
        mobileViewport = nextMobileViewport
        restorePosition()
        return
      }
      setPosition((current) => {
        if (!current) return current
        const next = clampPosition(current)
        updateDirections(next)
        return next
      })
    }
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

  useEffect(() => {
    const audio = audioRef.current
    const stopForAnotherPlayer = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === audio) return
      audio?.pause()
      setMusicStatus((current) => current === "playing" || current === "loading" ? "paused" : current)
    }
    const halt = () => audio?.pause()
    window.addEventListener("jiely:audio-play", stopForAnotherPlayer)
    document.addEventListener("astro:before-swap", halt)
    window.addEventListener("pagehide", halt)
    return () => {
      audio?.pause()
      window.removeEventListener("jiely:audio-play", stopForAnotherPlayer)
      document.removeEventListener("astro:before-swap", halt)
      window.removeEventListener("pagehide", halt)
    }
  }, [])

  const flashPose = (nextPose: PetPose, duration = 650) => {
    if (poseTimer.current) window.clearTimeout(poseTimer.current)
    setPose(reducedMotion ? "idle" : nextPose)
    poseTimer.current = window.setTimeout(() => setPose("idle"), duration)
  }
  const closeWithJump = () => { setOpen(false); flashPose("jumping") }
  const playRandomTrack = async () => {
    const audio = audioRef.current
    if (!audio || homeDashboard.tracks.length === 0) return
    const available = homeDashboard.tracks.length
    let nextIndex = Math.floor(Math.random() * available)
    if (available > 1 && nextIndex === trackIndex) nextIndex = (nextIndex + 1) % available
    const nextTrack: HomeTrack = homeDashboard.tracks[nextIndex]
    setTrackIndex(nextIndex)
    setOpen(false)
    flashPose("waving", 900)
    document.querySelectorAll("audio").forEach((item) => { if (item !== audio) item.pause() })
    window.dispatchEvent(new CustomEvent("jiely:audio-play", { detail: audio }))
    setMusicStatus("loading")
    try {
      audio.src = nextTrack.src
      audio.load()
      await audio.play()
      setMusicStatus("playing")
    } catch {
      setMusicStatus("error")
      flashPose("failed", 1100)
    }
  }
  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (musicStatus === "playing" || musicStatus === "loading") {
      audio.pause()
      setMusicStatus("paused")
      return
    }
    document.querySelectorAll("audio").forEach((item) => { if (item !== audio) item.pause() })
    window.dispatchEvent(new CustomEvent("jiely:audio-play", { detail: audio }))
    setMusicStatus("loading")
    try {
      await audio.play()
      setMusicStatus("playing")
      flashPose("waving", 700)
    } catch {
      setMusicStatus("error")
      flashPose("failed", 1100)
    }
  }
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
    if (current.moved) { const next = position || { x: current.originX, y: current.originY }; localStorage.setItem(positionStorageKey(), JSON.stringify(next)); setPose("idle") }
  }
  const onToggleClick = () => {
    if (drag.current?.moved) { drag.current = null; return }
    drag.current = null
    setOpen((value) => { const next = !value; setPose(reducedMotion ? "idle" : next ? "waving" : "idle"); return next })
  }

  const articleActions: PetAction[] = [
    { name: "随机播放", icon: Music2, action: playRandomTrack },
    { name: "导出 PDF", icon: FileDown, action: printPage },
    { name: "回到顶部", icon: ArrowUp, action: () => { window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }); closeWithJump(); toggle.current?.focus() } },
    { name: "返回首页", icon: House, href: "/#home-main" },
  ]
  const siteActions: PetAction[] = [
    { name: "随机播放", icon: Music2, action: playRandomTrack },
    { name: "返回首页", icon: House, href: "/#home-main" },
    { name: "最新文章", icon: Newspaper, href: latestPostHref },
    { name: "关于我", icon: UserRound, href: "/about/" },
  ]
  const actions = articleMode ? articleActions : siteActions
  const currentTrack: HomeTrack | null = trackIndex === null ? null : homeDashboard.tracks[trackIndex]

  return (
    <div ref={root} className={`article-actions ${open ? "is-open" : ""} ${currentTrack ? "has-music" : ""} ${musicStatus === "playing" ? "is-playing" : ""} ${position ? "is-positioned" : ""} ${labelsRight ? "labels-right" : "labels-left"}`}
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
      {currentTrack ? (
        <div className="article-actions__music" aria-live="polite">
          <a className="article-actions__music-copy" href={currentTrack.href} target="_blank" rel="noreferrer" title="在网易云音乐打开">
            <span className="article-actions__music-title"><Music2 aria-hidden="true" />{currentTrack.title}</span>
            <span className="article-actions__music-artist">{musicStatus === "error" ? "暂时无法播放 · 去网易云" : currentTrack.artist}</span>
          </a>
          <button className="article-actions__music-toggle" type="button" onClick={() => void toggleMusic()}
            aria-label={musicStatus === "playing" || musicStatus === "loading" ? "暂停音乐" : "继续播放"}>
            {musicStatus === "playing" || musicStatus === "loading" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
        </div>
      ) : null}
      <audio ref={audioRef} preload="none" playsInline crossOrigin="anonymous"
        onEnded={() => setMusicStatus("idle")}
        onError={() => { if (audioRef.current?.getAttribute("src")) setMusicStatus("error") }} />
      <span className="sr-only" role="status">{printing ? "正在打开打印窗口，请选择另存为 PDF" : ""}</span>
    </div>
  )
}
