import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import {
  ArrowLeft, ArrowUp, ChevronDown, Disc3, ExternalLink, FileDown, House, ListMusic, LoaderCircle,
  Music2, Newspaper, Pause, Play, Shuffle, SkipBack, SkipForward, UserRound, X,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { homeDashboard, type HomeTrack } from "@/data/home-dashboard"
import "@/styles/article-actions.css"

gsap.registerPlugin(useGSAP)

type PetPose = "idle" | "waving" | "jumping" | "running-left" | "running-right" | "review" | "failed"
type MusicStatus = "idle" | "loading" | "playing" | "paused" | "error"
type Point = { x: number; y: number }
type PetPromptKind = "music" | "link"
interface ArticleActionsProps { articleMode?: boolean; latestPostHref?: string; pagePath?: string }
interface PetAction { id: string; name: string; icon: LucideIcon; action?: () => void | Promise<void>; href?: string }
interface PetPrompt { id: string; question: string; detail: string; icon: LucideIcon; kind: PetPromptKind; href?: string }

const STORAGE_KEY = "jiely-pet-tools-position-v2"
const PET_WIDTH = 88
const PET_HEIGHT = 94
const HORIZONTAL_GAP = 66
const TOP_GAP = 64
const BOTTOM_GAP = 8
const fallbackCover = "/home-gallery/hero-avatar.webp"
const isMobileViewport = () => window.innerWidth <= 600
const positionStorageKey = () => `${STORAGE_KEY}:${isMobileViewport() ? "mobile" : "desktop"}`
const musicStatusText: Record<MusicStatus, string> = {
  idle: "准备播放", loading: "正在加载", playing: "正在播放", paused: "已暂停", error: "播放失败",
}

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

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${rest}`
}

export function ArticleActions({ articleMode = false, latestPostHref = "/articles/", pagePath = "/" }: ArticleActionsProps) {
  const instanceId = useId()
  const menuId = `pet-tools-${instanceId}`
  const playerId = `pet-player-${instanceId}`
  const playlistId = `pet-playlist-${instanceId}`
  const [open, setOpen] = useState(false)
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playlistOpen, setPlaylistOpen] = useState(false)
  const [panelBelow, setPanelBelow] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [pose, setPose] = useState<PetPose>("idle")
  const [position, setPosition] = useState<Point | null>(null)
  const [labelsRight, setLabelsRight] = useState(false)
  const [musicStatus, setMusicStatus] = useState<MusicStatus>("idle")
  const [trackIndex, setTrackIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [promptIndex, setPromptIndex] = useState(0)
  const [promptVisible, setPromptVisible] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)
  const playlistRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const drag = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null)
  const poseTimer = useRef<number | null>(null)
  const feedbackTimer = useRef<number | null>(null)
  const playbackRequest = useRef(0)
  const dragPosition = useRef<Point | null>(null)
  const promptShowTimer = useRef<number | null>(null)
  const promptHideTimer = useRef<number | null>(null)
  const promptStopped = useRef(false)
  const currentTrack: HomeTrack = homeDashboard.tracks[trackIndex]

  const updateDirections = (point: Point) => {
    setLabelsRight(point.x < window.innerWidth / 2)
    setPanelBelow(point.y < Math.min(window.innerHeight * 0.42, 340))
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
          setPanelBelow(false)
        }
      } catch { /* Position persistence is optional when browser storage is unavailable. */ }
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
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open && !playerOpen) return
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        setOpen(false); setPlayerOpen(false); setPlaylistOpen(false); setPose("idle")
      }
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false); setPlayerOpen(false); setPlaylistOpen(false); setPose("idle"); toggle.current?.focus()
    }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("keydown", escape)
    }
  }, [open, playerOpen])

  useEffect(() => {
    const audio = audioRef.current
    const stopForAnotherPlayer = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === audio) return
      playbackRequest.current += 1
      audio?.pause()
      setMusicStatus((current) => current === "playing" || current === "loading" ? "paused" : current)
    }
    const halt = () => { playbackRequest.current += 1; audio?.pause() }
    window.addEventListener("jiely:audio-play", stopForAnotherPlayer)
    document.addEventListener("astro:before-swap", halt)
    window.addEventListener("pagehide", halt)
    return () => {
      halt()
      window.removeEventListener("jiely:audio-play", stopForAnotherPlayer)
      document.removeEventListener("astro:before-swap", halt)
      window.removeEventListener("pagehide", halt)
    }
  }, [])

  useLayoutEffect(() => {
    const container = root.current
    if (!container) return
    const panels = container.querySelectorAll<HTMLElement>("[data-pet-panel]")
    const header = document.querySelector<HTMLElement>(".site-header")
    const placePanels = () => {
      const anchor = container.getBoundingClientRect()
      const edge = 16
      const topEdge = Math.max(edge, (header?.getBoundingClientRect().bottom ?? 0) + 12)
      container.style.setProperty("--pet-panel-max-height", `${Math.max(0, window.innerHeight - topEdge - edge)}px`)
      panels.forEach((panel) => {
        const width = panel.offsetWidth
        const height = panel.offsetHeight
        const desiredLeft = anchor.left < window.innerWidth / 2 ? anchor.left : anchor.right - width
        const left = Math.max(edge, Math.min(desiredLeft, window.innerWidth - width - edge))
        const spaceAbove = anchor.top - topEdge - 12
        const spaceBelow = window.innerHeight - anchor.bottom - edge - 12
        const below = spaceAbove < height && spaceBelow > spaceAbove
        const desiredTop = below ? anchor.bottom + 12 : anchor.top - height - 12
        const top = Math.max(topEdge, Math.min(desiredTop, window.innerHeight - height - edge))
        panel.style.setProperty("--panel-left", `${left - anchor.left}px`)
        panel.style.setProperty("--panel-top", `${top - anchor.top}px`)
        panel.style.setProperty("--panel-origin", `${Math.max(0, Math.min(width, anchor.left + anchor.width / 2 - left))}px ${below ? "0%" : "100%"}`)
      })
    }
    placePanels()
    const observer = new ResizeObserver(placePanels)
    panels.forEach((panel) => observer.observe(panel))
    if (header) observer.observe(header)
    window.addEventListener("resize", placePanels)
    return () => { observer.disconnect(); window.removeEventListener("resize", placePanels) }
  }, [open, playerOpen, playlistOpen, position, musicStatus, promptVisible, feedback])

  useGSAP(() => {
    const menu = menuRef.current
    if (!menu) return
    const cards = menu.querySelectorAll(".article-actions__satellite")
    gsap.killTweensOf([menu, ...cards])
    if (open) gsap.set(menu, { visibility: "visible" })
    if (reducedMotion) {
      gsap.set(menu, { autoAlpha: open ? 1 : 0, scale: 1, y: 0 })
      gsap.set(cards, { opacity: 1, y: 0, scale: 1, rotate: 0 })
      return
    }
    gsap.to(menu, { autoAlpha: open ? 1 : 0, y: open ? 0 : 8, scale: open ? 1 : .96, duration: open ? .24 : .16, ease: "power2.out" })
    gsap.to(cards, { opacity: open ? 1 : 0, y: open ? 0 : 8, scale: open ? 1 : .94, rotate: 0,
      duration: open ? .32 : .14, stagger: open ? .03 : .015, ease: open ? "back.out(1.25)" : "power2.in" })
  }, { scope: root, dependencies: [open, reducedMotion] })

  useGSAP(() => {
    const panel = playerRef.current
    if (!panel) return
    gsap.killTweensOf(panel)
    if (playerOpen) gsap.set(panel, { visibility: "visible" })
    if (reducedMotion) {
      gsap.set(panel, { autoAlpha: playerOpen ? 1 : 0, y: 0, scale: 1 })
      return
    }
    gsap.to(panel, {
      autoAlpha: playerOpen ? 1 : 0,
      y: playerOpen ? 0 : panelBelow ? -10 : 10,
      scale: playerOpen ? 1 : 0.965,
      duration: playerOpen ? 0.34 : 0.2,
      ease: playerOpen ? "back.out(1.35)" : "power2.in",
      overwrite: "auto",
    })
  }, { scope: root, dependencies: [playerOpen, panelBelow, reducedMotion] })

  useLayoutEffect(() => {
    if (open) menuRef.current?.focus({ preventScroll: true })
    if (playerOpen) playerRef.current?.focus({ preventScroll: true })
  }, [open, playerOpen])

  useGSAP(() => {
    const list = playlistRef.current
    if (!playlistOpen || !list || reducedMotion) return
    const items = list.querySelectorAll(".article-actions__track")
    gsap.fromTo(list, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out" })
    gsap.fromTo(items, { autoAlpha: 0, x: 8 }, { autoAlpha: 1, x: 0, duration: 0.24, stagger: 0.025, ease: "power2.out" })
  }, { scope: root, dependencies: [playlistOpen, reducedMotion], revertOnUpdate: true })

  useGSAP(() => {
    if (!playerOpen || reducedMotion) return
    gsap.fromTo(".article-actions__artwork", { scale: 0.96, rotation: -1 }, { scale: 1, rotation: 0, duration: 0.36, ease: "back.out(1.5)" })
    gsap.fromTo(".article-actions__track-copy", { opacity: 0, y: 7 }, { opacity: 1, y: 0, duration: .3, ease: "power2.out" })
  }, { scope: root, dependencies: [trackIndex, playerOpen, reducedMotion], revertOnUpdate: true })

  const flashPose = (nextPose: PetPose, timeout = 650) => {
    if (poseTimer.current) window.clearTimeout(poseTimer.current)
    setPose(reducedMotion ? "idle" : nextPose)
    poseTimer.current = window.setTimeout(() => setPose("idle"), timeout)
  }

  const announce = (message: string) => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current)
    setFeedback(message)
    feedbackTimer.current = window.setTimeout(() => setFeedback(""), 2600)
  }

  const onToolKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-pet-action]"))
    const current = items.indexOf(document.activeElement as HTMLElement)
    if (!items.length) return
    event.preventDefault()
    const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : current < 0 ? (event.key === "ArrowRight" ? 0 : items.length - 1) : (current + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length
    items[next]?.focus()
  }

  const isHomePage = pagePath === "/"
  const prompts: PetPrompt[] = isHomePage ? [
    { id: "music", question: "要不要听首歌？", detail: "点一下，我来选一首。", icon: Music2, kind: "music" },
    { id: "latest", question: "要不要看一下最新文章？", detail: "刚更新的内容在这里。", icon: Newspaper, kind: "link", href: latestPostHref },
    { id: "projects", question: "要不要看看最近的项目？", detail: "看看我最近在做什么。", icon: ExternalLink, kind: "link", href: "/projects/" },
    { id: "about", question: "要不要认识一下我？", detail: "去我的小世界里转转。", icon: UserRound, kind: "link", href: "/about/" },
  ] : articleMode ? [
    { id: "music", question: "要不要听首歌？", detail: "边读边听，也很不错。", icon: Music2, kind: "music" },
    { id: "articles", question: "要不要看看更多文章？", detail: "去文章目录继续逛逛。", icon: Newspaper, kind: "link", href: "/articles/" },
    { id: "home", question: "要不要回首页走走？", detail: "回到最开始的地方。", icon: House, kind: "link", href: "/#home-main" },
  ] : [
    { id: "music", question: "要不要听首歌？", detail: "点一下，我来选一首。", icon: Music2, kind: "music" },
    { id: "latest", question: "要不要看一下最新文章？", detail: "刚更新的内容在这里。", icon: Newspaper, kind: "link", href: latestPostHref },
    { id: "home", question: "要不要回首页走走？", detail: "回到最开始的地方。", icon: House, kind: "link", href: "/#home-main" },
  ]

  const clearPromptTimers = () => {
    if (promptShowTimer.current) window.clearTimeout(promptShowTimer.current)
    if (promptHideTimer.current) window.clearTimeout(promptHideTimer.current)
    promptShowTimer.current = null
    promptHideTimer.current = null
  }

  const dismissPromptSequence = () => {
    promptStopped.current = true
    clearPromptTimers()
    setPromptVisible(false)
  }

  useEffect(() => {
    promptStopped.current = false
    setPromptIndex(0)
    setPromptVisible(false)

    const showPrompt = (index: number, delay: number) => {
      promptShowTimer.current = window.setTimeout(() => {
        if (promptStopped.current) return
        setPromptIndex(index)
        setPromptVisible(true)
        flashPose("waving", 900)
        promptHideTimer.current = window.setTimeout(() => {
          if (promptStopped.current) return
          setPromptVisible(false)
          const nextIndex = index + 1
          if (nextIndex < prompts.length) showPrompt(nextIndex, 2200)
        }, 6200)
      }, delay)
    }

    showPrompt(0, isHomePage ? 1900 : 2300)
    return () => {
      promptStopped.current = true
      clearPromptTimers()
    }
  }, [articleMode, latestPostHref, pagePath])

  const openMusicPlayer = () => {
    dismissPromptSequence()
    const rect = root.current?.getBoundingClientRect()
    if (rect) setPanelBelow(rect.top < Math.min(window.innerHeight * 0.42, 340))
    setOpen(false); setPlayerOpen(true); flashPose("waving", 780)
  }

  const playTrack = async (index: number) => {
    const audio = audioRef.current
    if (!audio || homeDashboard.tracks.length === 0) return
    const nextIndex = (index + homeDashboard.tracks.length) % homeDashboard.tracks.length
    const nextTrack: HomeTrack = homeDashboard.tracks[nextIndex]
    const request = ++playbackRequest.current
    setTrackIndex(nextIndex); setPlayerOpen(true); setOpen(false); setPlaylistOpen(false)
    document.querySelectorAll("audio").forEach((item) => { if (item !== audio) item.pause() })
    window.dispatchEvent(new CustomEvent("jiely:audio-play", { detail: audio }))
    setMusicStatus("loading")
    if (audio.getAttribute("src") !== nextTrack.src) {
      audio.src = nextTrack.src; audio.load(); setProgress(0); setDuration(0)
    }
    try {
      await audio.play()
      if (request !== playbackRequest.current) return
      setMusicStatus("playing"); flashPose("waving", 720)
    } catch {
      if (request !== playbackRequest.current) return
      setMusicStatus("error"); flashPose("failed", 1100)
    }
  }

  const shuffleTrack = async () => {
    const total = homeDashboard.tracks.length
    let nextIndex = Math.floor(Math.random() * total)
    if (total > 1 && nextIndex === trackIndex) nextIndex = (nextIndex + 1) % total
    await playTrack(nextIndex)
  }

  const changeTrack = async (direction: number) => playTrack(trackIndex + direction)

  const toggleMusic = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (musicStatus === "playing" || musicStatus === "loading") {
      playbackRequest.current += 1
      audio.pause(); setMusicStatus("paused"); return
    }
    const request = ++playbackRequest.current
    document.querySelectorAll("audio").forEach((item) => { if (item !== audio) item.pause() })
    window.dispatchEvent(new CustomEvent("jiely:audio-play", { detail: audio }))
    setMusicStatus("loading")
    if (audio.getAttribute("src") !== currentTrack.src || musicStatus === "error") {
      audio.src = currentTrack.src; audio.load()
    }
    try {
      await audio.play()
      if (request !== playbackRequest.current) return
      setMusicStatus("playing"); flashPose("waving", 700)
    } catch {
      if (request !== playbackRequest.current) return
      setMusicStatus("error"); flashPose("failed", 1100)
    }
  }

  const printPage = async () => {
    if (printing) return
    announce("正在准备文章，随后可另存为 PDF")
    setPrinting(true); setOpen(false); flashPose("review", 900); toggle.current?.focus()
    try {
      await Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1500))])
      window.print()
    } catch { announce("打印窗口未能打开，请重试"); flashPose("failed", 1100) } finally { setPrinting(false) }
  }

  const closeWithJump = () => { setOpen(false); flashPose("jumping") }

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return
    dismissPromptSequence()
    if (poseTimer.current) window.clearTimeout(poseTimer.current)
    const rect = root.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top, moved: false }
    dragPosition.current = { x: rect.left, y: rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 5) return
    current.moved = true
    setOpen(false); setPlayerOpen(false); setPlaylistOpen(false)
    setPose(reducedMotion ? "idle" : dx < 0 ? "running-left" : "running-right")
    const next = clampPosition({ x: current.originX + dx, y: current.originY + dy })
    dragPosition.current = next
    setPosition(next); updateDirections(next)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    if (current.moved) {
      const next = dragPosition.current || { x: current.originX, y: current.originY }
      try { localStorage.setItem(positionStorageKey(), JSON.stringify(next)) } catch { /* Dragging still works without storage. */ }
      setPose("idle")
    }
  }

  const onToggleClick = () => {
    if (drag.current?.moved) { drag.current = null; return }
    drag.current = null
    dismissPromptSequence()
    if (playerOpen) { setPlayerOpen(false); setPlaylistOpen(false); setPose("idle"); return }
    setOpen(!open)
    setActiveTool(null)
    if (!open) flashPose("waving", 850)
    else setPose("idle")
  }

  const articleActions: PetAction[] = [
    { id: "music", name: "音乐", icon: Music2, action: openMusicPlayer },
    { id: "pdf", name: "导出 PDF", icon: FileDown, action: printPage },
    { id: "top", name: "回到顶部", icon: ArrowUp, action: () => { window.scrollTo({ top: 0, behavior: reducedMotion ? "instant" : "smooth" }); closeWithJump(); announce("回到文章开头"); toggle.current?.focus({ preventScroll: true }) } },
    { id: "home", name: "返回首页", icon: House, href: "/#home-main" },
  ]
  const siteActions: PetAction[] = [
    { id: "music", name: "音乐", icon: Music2, action: openMusicPlayer },
    { id: "home", name: "返回首页", icon: House, href: "/#home-main" },
    { id: "latest", name: "最新文章", icon: Newspaper, href: latestPostHref },
    { id: "about", name: "关于我", icon: UserRound, href: "/about/" },
  ]
  const actions = articleMode ? articleActions : siteActions
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, progress / duration * 100)) : 0
  const hasCollapsedPlayer = musicStatus !== "idle" && !playerOpen
  const showPrompt = promptVisible && !open && !playerOpen && !hasCollapsedPlayer
  const currentPrompt = prompts[promptIndex % prompts.length]
  const PromptIcon = currentPrompt.icon

  return (
    <div
      ref={root}
      className={`article-actions ${open ? "is-open" : ""} ${playerOpen ? "is-player-open" : ""} ${playlistOpen ? "is-playlist-open" : ""} ${showPrompt ? "has-prompt" : ""} ${hasCollapsedPlayer ? "has-now-playing" : ""} ${panelBelow ? "panel-below" : "panel-above"} ${musicStatus === "playing" ? "is-playing" : ""} ${position ? "is-positioned" : ""} ${labelsRight ? "labels-right" : "labels-left"}`}
      style={position ? { left: position.x, top: position.y } : undefined}
      role="group"
      aria-label={articleMode ? "文章快捷操作" : "网站快捷导航"}
      onBlur={(event) => { if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) setOpen(false) }}
    >
      <div ref={menuRef} id={menuId} className="article-actions__menu" data-pet-panel tabIndex={-1} role="group" aria-label="宠物快捷工具" aria-hidden={!open} inert={!open ? true : undefined} onKeyDown={onToolKeyDown}>
        <div className="article-actions__deck" onPointerLeave={() => setActiveTool(null)}>
          {actions.map(({ id, name, icon: Icon, action, href }) => {
            const contents = <><span className="article-actions__tile-icon" aria-hidden="true"><Icon data-icon="inline-start" />{id === "music" ? <span className="article-actions__tile-bars"><i /><i /><i /></span> : null}</span><span className="article-actions__label">{id === "pdf" && printing ? "准备中…" : name}</span></>
            return (
              <div className={cn("article-actions__satellite", activeTool === id && "is-active")} key={id} data-tool={id}
                onPointerEnter={(event) => { if (event.pointerType !== "touch") setActiveTool(id) }} onFocus={() => setActiveTool(id)} onBlur={() => setActiveTool(null)}>
                {href ? (
                  <Button asChild variant="petCard" size="petCard"><a href={href} data-pet-action data-astro-prefetch="hover" aria-label={name} tabIndex={open ? 0 : -1} onClick={closeWithJump}>{contents}</a></Button>
                ) : (
                  <Button type="button" variant="petCard" size="petCard" data-pet-action aria-label={name} aria-expanded={id === "music" ? playerOpen : undefined} aria-controls={id === "music" ? playerId : undefined} onClick={action} tabIndex={open ? 0 : -1} disabled={!open || (id === "pdf" && printing)}>{contents}</Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button ref={toggle} type="button" className="article-actions__pet" aria-expanded={open || playerOpen}
        aria-controls={playerOpen ? playerId : menuId}
        aria-label={playerOpen ? "收起音乐播放器" : open ? "收起宠物工具" : "展开宠物工具，也可以拖动它"}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; setPose("idle") }} onClick={onToggleClick}>
        <span className={`article-actions__pet-sprite is-${pose}`} aria-hidden="true" />
      </button>

      {showPrompt ? (
        <div className="article-actions__prompt" role="status" data-pet-panel>
          {currentPrompt.kind === "music" ? (
            <button type="button" onClick={() => { dismissPromptSequence(); void shuffleTrack() }} aria-label={`同意，${currentPrompt.question}`}>
              <span className="article-actions__prompt-icon" aria-hidden="true"><PromptIcon /></span>
              <span className="article-actions__prompt-copy"><strong>{currentPrompt.question}</strong><small>{currentPrompt.detail}</small></span>
            </button>
          ) : (
            <a href={currentPrompt.href} data-astro-prefetch="hover" onClick={dismissPromptSequence} aria-label={`同意，${currentPrompt.question}`}>
              <span className="article-actions__prompt-icon" aria-hidden="true"><PromptIcon /></span>
              <span className="article-actions__prompt-copy"><strong>{currentPrompt.question}</strong><small>{currentPrompt.detail}</small></span>
            </a>
          )}
        </div>
      ) : null}

      {hasCollapsedPlayer && !open ? (
        <div className="article-actions__now-playing" data-pet-panel>
          <button type="button" className="article-actions__now-copy" onClick={openMusicPlayer} aria-label={`打开播放器，当前歌曲 ${currentTrack.title}`}>
            <span className="article-actions__mini-bars" aria-hidden="true"><i /><i /><i /></span>
            <span><strong>{currentTrack.title}</strong><small>{currentTrack.artist}</small></span>
          </button>
          <button type="button" className="article-actions__now-toggle" onClick={() => void toggleMusic()} aria-label={musicStatus === "playing" || musicStatus === "loading" ? "暂停音乐" : "继续播放"}>
            {musicStatus === "loading" ? <LoaderCircle className="is-loading" aria-hidden="true" /> : musicStatus === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
        </div>
      ) : null}

      <div ref={playerRef} id={playerId} className="article-actions__player" data-pet-panel tabIndex={-1} role="region" aria-label="音乐播放器" aria-hidden={!playerOpen} inert={!playerOpen ? true : undefined}>
        <div className="article-actions__player-head">
          <button type="button" className="article-actions__icon-button" aria-label="返回快捷工具" onClick={() => { setPlayerOpen(false); setPlaylistOpen(false); setActiveTool(null); setOpen(true) }}><ArrowLeft aria-hidden="true" /></button>
          <span className="article-actions__player-state" aria-live="polite"><Disc3 aria-hidden="true" />{musicStatus === "idle" ? "音乐" : musicStatusText[musicStatus]}</span>
          <button type="button" className="article-actions__icon-button" onClick={() => { setPlayerOpen(false); setPlaylistOpen(false); toggle.current?.focus() }} aria-label="收起播放器"><X aria-hidden="true" /></button>
        </div>

        <div className="article-actions__current">
          <div className="article-actions__artwork">
            <img src={currentTrack.cover} alt={currentTrack.album} width="88" height="88" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = fallbackCover }} />
            <span className="article-actions__equalizer" aria-hidden="true"><i /><i /><i /></span>
          </div>
          <div className="article-actions__track-copy"><h2>{currentTrack.title}</h2><p>{currentTrack.artist}</p><span title={currentTrack.album}>{currentTrack.album}</span></div>
        </div>

        <div className="article-actions__timeline">
          <input type="range" min={0} max={Math.max(duration, 1)} step={0.1} value={Math.min(progress, Math.max(duration, 1))}
            aria-label="播放进度" disabled={duration <= 0} style={{ "--pet-player-progress": `${progressPercent}%` } as CSSProperties}
            onChange={(event) => {
              const audio = audioRef.current
              if (!audio || !Number.isFinite(audio.duration)) return
              const value = Number(event.target.value); audio.currentTime = value; setProgress(value)
            }} />
          <div><span>{formatTime(progress)}</span><span>{formatTime(duration)}</span></div>
        </div>

        <div className="article-actions__controls" aria-label="播放控制">
          <button type="button" onClick={() => void shuffleTrack()} aria-label="随机播放"><Shuffle aria-hidden="true" /></button>
          <button type="button" onClick={() => void changeTrack(-1)} aria-label="上一首"><SkipBack aria-hidden="true" /></button>
          <button type="button" className="article-actions__play" onClick={() => void toggleMusic()} aria-label={musicStatus === "playing" || musicStatus === "loading" ? "暂停" : "播放"}>
            {musicStatus === "loading" ? <LoaderCircle className="is-loading" aria-hidden="true" /> : musicStatus === "playing" ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => void changeTrack(1)} aria-label="下一首"><SkipForward aria-hidden="true" /></button>
        </div>

        <div className="article-actions__player-nav">
          <button type="button" className={playlistOpen ? "is-active" : ""} aria-expanded={playlistOpen} aria-controls={playlistId} onClick={() => setPlaylistOpen((value) => !value)}>
            <ListMusic aria-hidden="true" /><span>歌单</span><small>{homeDashboard.tracks.length} 首</small><ChevronDown aria-hidden="true" />
          </button>
          <a href={homeDashboard.playlist.href} target="_blank" rel="noreferrer" aria-label="在网易云音乐打开完整歌单">网易云 <ExternalLink aria-hidden="true" /></a>
        </div>

        {playlistOpen ? (
          <div ref={playlistRef} id={playlistId} className="article-actions__playlist" aria-label="歌曲列表">
            {homeDashboard.tracks.map((track, index) => (
              <button type="button" key={`${track.title}-${track.artist}`} className={`article-actions__track ${index === trackIndex ? "is-current" : ""}`}
                aria-current={index === trackIndex ? "true" : undefined} onClick={() => void playTrack(index)}>
                <img src={track.cover} alt="" width="42" height="42" loading="lazy" onError={(event) => { event.currentTarget.src = fallbackCover }} />
                <span><strong>{track.title}</strong><small>{track.artist}</small></span>
                {index === trackIndex && musicStatus === "playing" ? <span className="article-actions__track-bars" aria-label="正在播放"><i /><i /><i /></span> : <Play aria-hidden="true" />}
              </button>
            ))}
          </div>
        ) : null}

        {musicStatus === "error" ? <div className="article-actions__error" role="status"><span>暂时无法播放</span><button type="button" onClick={() => void toggleMusic()}>重新播放</button><button type="button" onClick={() => void changeTrack(1)}>换一首</button></div> : null}
      </div>

      {feedback ? <div className="article-actions__feedback" data-pet-panel role="status">{feedback}</div> : null}

      <audio ref={audioRef} preload="metadata" playsInline crossOrigin="anonymous"
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(Number.isFinite(audioRef.current?.duration) ? audioRef.current?.duration || 0 : 0)}
        onEnded={() => void changeTrack(1)}
        onError={() => { if (audioRef.current?.getAttribute("src")) setMusicStatus("error") }} />
      <span className="sr-only" role="status">{printing ? "正在打开打印窗口，请选择另存为 PDF" : ""}</span>
    </div>
  )
}
