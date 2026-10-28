import { useEffect, useRef, useState } from "react"
import {
  CHARACTER_IMAGE_ROOT, CHARACTER_SPRITES, createActionDeck, getActionDuration, getActionFrame, getActionMotion,
  type CharacterAction,
} from "@/lib/home-character-actions"

const images = new Map<string, Promise<HTMLImageElement>>()
function loadImage(file: string) {
  const cached = images.get(file)
  if (cached) return cached
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    const timeout = window.setTimeout(() => reject(new Error("Character frame timed out")), 10000)
    image.onload = () => { window.clearTimeout(timeout); image.decode().then(() => resolve(image), reject) }
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error("Character frame unavailable")) }
    image.src = CHARACTER_IMAGE_ROOT + file
  }).catch((error: unknown) => { images.delete(file); throw error })
  images.set(file, promise)
  return promise
}

async function loadAction(action: CharacterAction) {
  const files = [...new Set(action.phases.flatMap((phase) => CHARACTER_SPRITES[phase.asset].frames))]
  return new Map(await Promise.all(files.map(async (file) => [file, await loadImage(file)] as const)))
}

interface Playback { action: CharacterAction; images: Map<string, HTMLImageElement>; elapsed: number }

export function InteractiveHomeCharacter() {
  const canvas = useRef<HTMLCanvasElement>(null)
  const deck = useRef<ReturnType<typeof createActionDeck> | null>(null)
  const playback = useRef<Playback | null>(null)
  const request = useRef(0)
  const frame = useRef(0)
  const timer = useRef(0)
  const reducedMotion = useRef(false)
  const [active, setActive] = useState<CharacterAction | null>(null)
  const [loading, setLoading] = useState(false)
  const [announcement, setAnnouncement] = useState("")

  const getDeck = () => deck.current ?? (deck.current = createActionDeck())
  const stop = () => { cancelAnimationFrame(frame.current); window.clearTimeout(timer.current) }
  const draw = () => {
    const surface = canvas.current, current = playback.current
    if (!surface || !current) return
    const context = surface.getContext("2d")
    if (!context) return
    const pose = getActionFrame(current.action, current.elapsed, reducedMotion.current)
    const picture = current.images.get(pose.file)
    if (!picture) return
    const size = surface.width
    const { crop } = pose
    const sourceWidth = picture.naturalWidth * crop.width, sourceHeight = picture.naturalHeight * crop.height
    let height = size * pose.height, width = height * sourceWidth / sourceHeight
    if (width > size * .79) { height *= size * .79 / width; width = size * .79 }
    const motion = reducedMotion.current ? { x: 0, y: 0, angle: 0, scaleY: 1 } : getActionMotion(current.action.motion, current.elapsed / getActionDuration(current.action))
    context.clearRect(0, 0, size, size)
    context.save()
    context.translate(size * (.42 + motion.x), size * (.965 + motion.y))
    context.rotate(motion.angle)
    context.scale(1, motion.scaleY)
    context.drawImage(picture, picture.naturalWidth * crop.x, picture.naturalHeight * crop.y, sourceWidth, sourceHeight, -width / 2, -height, width, height)
    context.restore()
  }

  useEffect(() => {
    const surface = canvas.current
    if (!surface) return
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    reducedMotion.current = motion.matches
    const reset = () => {
      request.current++
      stop()
      playback.current = null
      setActive(null)
      setLoading(false)
    }
    const onMotionChange = () => { reducedMotion.current = motion.matches; reset() }
    const onVisibilityChange = () => { if (document.hidden) reset() }
    const resize = () => {
      const size = Math.max(1, Math.round(surface.clientWidth * Math.min(window.devicePixelRatio || 1, 2)))
      surface.width = surface.height = size
      draw()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(surface)
    resize()
    motion.addEventListener("change", onMotionChange)
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      request.current++
      stop()
      playback.current = null
      observer.disconnect()
      motion.removeEventListener("change", onMotionChange)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      images.clear()
    }
  }, [])

  const warmNext = () => { void loadAction(getDeck().peek()).catch(() => {}) }
  const play = async () => {
    const action = getDeck().next(), token = ++request.current
    stop()
    setLoading(true)
    try {
      const loaded = await loadAction(action)
      if (token !== request.current) return
      if (!canvas.current?.getContext("2d")) throw new Error("Canvas unavailable")
      const started = performance.now(), duration = getActionDuration(action)
      playback.current = { action, images: loaded, elapsed: 0 }
      draw()
      setActive(action)
      setLoading(false)
      setAnnouncement(action.label)
      const finish = () => {
        if (token !== request.current) return
        playback.current = null
        setActive(null)
      }
      const animate = (now: number) => {
        if (token !== request.current || !playback.current) return
        playback.current.elapsed = now - started
        if (playback.current.elapsed >= duration) { finish(); return }
        draw()
        frame.current = requestAnimationFrame(animate)
      }
      if (reducedMotion.current) timer.current = window.setTimeout(finish, Math.min(duration, 2200))
      else frame.current = requestAnimationFrame(animate)
      // Only warm the next interaction, keeping the initial page lightweight.
      warmNext()
    } catch {
      if (token !== request.current) return
      playback.current = null
      setActive(null)
      setLoading(false)
      setAnnouncement("动作暂时没有加载出来，再点一下试试。")
    }
  }

  return (
    <button type="button" className="scrapbook-person" aria-label="Hello！点击切换人物动作"
      aria-busy={loading || undefined} data-action={active?.id ?? "hello"}
      onPointerEnter={warmNext} onFocus={warmNext} onClick={play}>
      <span className="scrapbook-person__drawing" data-playing={active ? "true" : undefined} aria-hidden="true">
        <img className="scrapbook-person__portrait" src="/images/home-scrapbook/character-hello.webp" width="1254" height="1254" alt="" draggable="false" fetchPriority="high" />
        <canvas ref={canvas} className="scrapbook-person__canvas" />
      </span>
      <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    </button>
  )
}
