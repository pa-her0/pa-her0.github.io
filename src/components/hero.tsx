"use client"

import { ChevronUp, ChevronDown, MapPin, Pause, Play, Radio, Zap } from "lucide-react"
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { homeDashboard, type HomeTrack } from "@/data/home-dashboard"
import { HomeGlobe } from "@/components/home-globe"
import { useHomeWakatime } from "@/components/use-home-wakatime"
import type { ActivityDay } from "@/lib/home-activity"
import { ActivitySnake } from "@/components/activity-snake"
import { AboutSceneCard } from "@/components/about-scene-card"
import { TopicCloud } from "@/components/topic-cloud"
import { FlipDiskMatrix } from "@/components/ui/flip-disk-matrix"

export interface HeroProps {
  latestPost?: { title: string; description: string; href: string; image: string; date: string }
  activity: { days: ActivityDay[]; months: { label: string; column: number }[]; total: number }
  categories: { name: string; count: number }[]
}

function GalleryCard() {
  const [images, setImages] = useState(() => [...homeDashboard.gallery])
  return (
    <div className="bento-card bento-gallery" aria-label="噜噜相册">
      {images.map((image, index) => (
        <button key={image.src} type="button" className="bento-photo"
          style={{ zIndex: images.length - index, transform: `translate(-50%, calc(-50% - ${index * 6}px)) rotate(${[5, -7, 6, -5, 8][index]}deg)` }}
          aria-label={`切换图片：${image.alt}`} tabIndex={index === 0 ? 0 : -1}
          onClick={() => setImages((current) => [...current.filter((item) => item.src !== image.src), image])}>
          <img src={image.src} alt={image.alt} width={300} height={300} draggable={false}
            decoding="async" fetchPriority={index === 0 ? "high" : "low"} />
        </button>
      ))}
      <span className="sr-only" aria-live="polite">当前图片：{images[0].alt}</span>
    </div>
  )
}

function MusicCard() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const requestRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [trackIndex, setTrackIndex] = useState(0)
  const [status, setStatus] = useState<"idle" | "loading" | "playing" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [coverFailed, setCoverFailed] = useState(false)
  const track: HomeTrack = homeDashboard.tracks[trackIndex]

  function stop() {
    requestRef.current += 1
    clearTimeout(timerRef.current)
    audioRef.current?.pause()
    setStatus("idle")
  }
  function changeTrack(direction: number) {
    stop()
    const audio = audioRef.current
    if (audio) { audio.removeAttribute("src"); audio.load() }
    setTrackIndex((value) => (value + direction + homeDashboard.tracks.length) % homeDashboard.tracks.length)
    setProgress(0)
    setCoverFailed(false)
  }
  async function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (status === "playing" || status === "loading") { stop(); return }
    if (!track.src || !track.mimeType || audio.canPlayType(track.mimeType) === "") {
      setStatus("error")
      return
    }
    const request = ++requestRef.current
    setStatus("loading")
    if (audio.getAttribute("src") !== track.src) { audio.src = track.src; audio.load() }
    timerRef.current = setTimeout(() => {
      if (requestRef.current === request) {
        requestRef.current += 1
        audio.pause()
        setStatus("error")
      }
    }, 20000)
    try {
      document.querySelectorAll("audio").forEach((item) => { if (item !== audio) item.pause() })
      window.dispatchEvent(new CustomEvent("jiely:audio-play", { detail: audio }))
      await audio.play()
      if (requestRef.current !== request) return
      clearTimeout(timerRef.current)
      setStatus("playing")
    } catch {
      if (requestRef.current !== request) return
      clearTimeout(timerRef.current)
      setStatus("error")
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    const halt = () => {
      requestRef.current += 1
      clearTimeout(timerRef.current)
      audio?.pause()
    }
    const stopForAnotherPlayer = (event: Event) => {
      if (event instanceof CustomEvent && event.detail === audio) return
      halt()
      setStatus("idle")
    }
    document.addEventListener("astro:before-swap", halt)
    window.addEventListener("pagehide", halt)
    window.addEventListener("jiely:audio-play", stopForAnotherPlayer)
    return () => {
      halt()
      if (audio) { audio.removeAttribute("src"); audio.load() }
      document.removeEventListener("astro:before-swap", halt)
      window.removeEventListener("pagehide", halt)
      window.removeEventListener("jiely:audio-play", stopForAnotherPlayer)
    }
  }, [])

  return (
    <article className="bento-card bento-music">
      <a href={track.href} className="bento-music-service" target="_blank" rel="noreferrer" aria-label="在网易云音乐打开当前歌曲">
        {/* NetEase Cloud Music mark from Simple Icons (CC0), without its outer disc. */}
        <svg width={25} height={25} viewBox="3 3 18 18" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M13.046 9.388a3.919 3.919 0 0 0-.66.19c-.809.312-1.447.991-1.666 1.775a2.269 2.269 0 0 0-.074.81c.048.546.333 1.05.764 1.35a1.483 1.483 0 0 0 2.01-.286c.406-.531.355-1.183.24-1.636-.098-.387-.22-.816-.345-1.249a64.76 64.76 0 0 1-.269-.954zm-.82 10.07c-3.984 0-7.224-3.24-7.224-7.223 0-.98.226-3.02 1.884-4.822A7.188 7.188 0 0 1 9.502 5.6a.792.792 0 1 1 .587 1.472 5.619 5.619 0 0 0-2.795 2.462 5.538 5.538 0 0 0-.707 2.7 5.645 5.645 0 0 0 5.638 5.638c1.844 0 3.627-.953 4.542-2.428 1.042-1.68.772-3.931-.627-5.238a3.299 3.299 0 0 0-1.437-.777c.172.589.334 1.18.494 1.772.284 1.12.1 2.181-.519 2.989-.39.51-.956.888-1.592 1.064a3.038 3.038 0 0 1-2.58-.44 3.45 3.45 0 0 1-1.44-2.514c-.04-.467.002-.93.128-1.376.35-1.256 1.356-2.339 2.622-2.826a5.5 5.5 0 0 1 .823-.246l-.134-.505c-.37-1.371.25-2.579 1.547-3.007.329-.109.68-.145 1.025-.105.792.09 1.476.592 1.709 1.023.258.507-.096 1.153-.706 1.153a.788.788 0 0 1-.54-.213c-.088-.08-.163-.174-.259-.247a.825.825 0 0 0-.632-.166.807.807 0 0 0-.634.551c-.056.191-.031.406.02.595.07.256.159.597.217.82 1.11.098 2.162.54 2.97 1.296 1.974 1.844 2.35 4.886.892 7.233-1.197 1.93-3.509 3.177-5.889 3.177z" />
        </svg>
      </a>
      <div className="bento-music-top">
        <img className="bento-album" src={coverFailed ? "/hero-avatar.jpg" : track.cover} alt={track.album} width={160} height={160}
          onError={() => setCoverFailed(true)} />
        <div className="bento-music-buttons">
          <button type="button" onClick={() => changeTrack(-1)} aria-label="上一首"><ChevronUp size={20} /></button>
          <button type="button" onClick={() => void toggle()} aria-label={status === "playing" ? "暂停" : status === "loading" ? "取消加载" : "播放"}>
            {status === "playing" ? <Pause size={21} /> : <Play size={21} />}
          </button>
          <button type="button" onClick={() => changeTrack(1)} aria-label="下一首"><ChevronDown size={20} /></button>
        </div>
      </div>
      <div className="bento-music-copy">
        <p className="bento-playing" aria-live="polite"><Radio size={17} />{status === "playing" ? "Now playing…" : status === "loading" ? "Loading…" : status === "error" ? "暂时无法播放" : "Ready to play"}</p>
        <h2>{track.title}</h2>
        <p className="bento-muted">by {track.artist}</p>
        <p className="bento-muted bento-album-name" title={track.album}>on {track.album}</p>
        {status === "error" ? <a className="bento-audio-error" href={track.href} target="_blank" rel="noreferrer">音源受限或网络不可用，去网易云收听 ↗</a> : (
          <input className="bento-progress" type="range" min={0} max={100} step={0.1} value={progress}
            aria-label="播放进度" disabled={status !== "playing" && progress === 0}
            onChange={(event) => {
              const audio = audioRef.current
              if (audio && Number.isFinite(audio.duration)) {
                const value = Number(event.target.value)
                audio.currentTime = audio.duration * value / 100
                setProgress(value)
              }
            }} />
        )}
      </div>
      <audio ref={audioRef} preload="none" playsInline crossOrigin="anonymous"
        onTimeUpdate={() => {
          const audio = audioRef.current
          if (audio && Number.isFinite(audio.duration) && audio.duration > 0) setProgress(audio.currentTime / audio.duration * 100)
        }}
        onEnded={() => { setStatus("idle"); setProgress(0) }}
        onError={() => {
          if (audioRef.current?.getAttribute("src")) {
            clearTimeout(timerRef.current)
            setStatus("error")
          }
        }} />
    </article>
  )
}

export function Hero({ latestPost, activity, categories }: HeroProps) {
  const stackTrack = useRef<HTMLDivElement>(null)
  const bentoGrid = useRef<HTMLDivElement>(null)
  const bentoPointerFrame = useRef(0)
  const pendingBentoPointer = useRef<{ card: HTMLElement; clientX: number; clientY: number } | null>(null)

  function moveBentoSpotlight(event: ReactPointerEvent<HTMLDivElement>) {
    const card = (event.target as HTMLElement).closest<HTMLElement>(".bento-card")
    if (!card || !event.currentTarget.contains(card)) return
    pendingBentoPointer.current = { card, clientX: event.clientX, clientY: event.clientY }
    if (bentoPointerFrame.current) return
    bentoPointerFrame.current = window.requestAnimationFrame(() => {
      bentoPointerFrame.current = 0
      const pointer = pendingBentoPointer.current
      if (!pointer) return
      const bounds = pointer.card.getBoundingClientRect()
      const x = pointer.clientX - bounds.left
      const y = pointer.clientY - bounds.top
      pointer.card.style.setProperty("--bento-pointer-x", `${x}px`)
      pointer.card.style.setProperty("--bento-pointer-y", `${y}px`)
      pointer.card.style.setProperty("--bento-tilt-x", `${((x / bounds.width) - 0.5) * 1.4}deg`)
      pointer.card.style.setProperty("--bento-tilt-y", `${((y / bounds.height) - 0.5) * -1.4}deg`)
    })
  }

  function resetBentoSpotlight() {
    pendingBentoPointer.current = null
    if (bentoPointerFrame.current) window.cancelAnimationFrame(bentoPointerFrame.current)
    bentoPointerFrame.current = 0
    bentoGrid.current?.querySelectorAll<HTMLElement>(".bento-card").forEach((card) => {
      card.style.removeProperty("--bento-tilt-x")
      card.style.removeProperty("--bento-tilt-y")
    })
  }

  useEffect(() => {
    const track = stackTrack.current
    if (!track) return
    let inView = true
    const sync = () => { track.style.animationPlayState = document.hidden || !inView ? "paused" : "running" }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync() })
    observer.observe(track)
    document.addEventListener("visibilitychange", sync)
    sync()
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", sync)
      if (bentoPointerFrame.current) window.cancelAnimationFrame(bentoPointerFrame.current)
    }
  }, [])
  const { languages, calendar, error: statsError } = useHomeWakatime()
  const topics = languages ?? categories
  const secondsByDate = new Map(calendar?.map((day) => [day.date, day.seconds]))
  const days = calendar ? activity.days.map((day) => {
    const seconds = day.future ? 0 : (secondsByDate.get(day.date) ?? 0)
    return { ...day, count: Math.round(seconds / 60), level: seconds <= 0 ? 0 : seconds < 1800 ? 1 : seconds < 7200 ? 2 : seconds < 14400 ? 3 : 4 }
  }) : activity.days
  return (
    <section id="home-main" className="bento-home" aria-label="个人首页">
      <div className="bento-grid" ref={bentoGrid} onPointerMove={moveBentoSpotlight} onPointerLeave={resetBentoSpotlight}>
        <article className="bento-card bento-intro">
          <h1>{homeDashboard.intro.title}</h1>
          <div>{homeDashboard.intro.lines.map((line) => <p key={line}>{line}</p>)}</div>
        </article>
        <article className="bento-card bento-location">
          <h2 className="bento-card-label"><MapPin size={19} />{homeDashboard.location}</h2>
          <HomeGlobe />
        </article>
        <article className="bento-card bento-stack">
          <div className="bento-stack-heading">
            <h2 className="bento-card-label"><Zap size={19} />Stacks</h2>
          </div>
          <div className="bento-stack-marquee">
            <div className="bento-stack-track" ref={stackTrack}>
              {[0, 1].map((copy) => <div key={copy} className="bento-stack-icons" role="list" aria-label={copy === 0 ? "技术栈" : undefined} aria-hidden={copy === 1 ? true : undefined}>
                {homeDashboard.stack.map((item) => <div key={item.name} role="listitem" title={item.name}>
                  <img src={item.icon} alt="" width={34} height={34} /><span>{item.name}</span>
                </div>)}
              </div>)}
            </div>
          </div>
        </article>
        <GalleryCard />
        <article className="bento-card bento-flip-matrix" aria-label="翻盘点阵时钟">
          <FlipDiskMatrix latestPost={latestPost} />
        </article>
        <MusicCard />
        <article className="bento-card bento-usage">
          <h2 className="bento-card-label">{languages ? "Weekly tools" : "Writing topics"}</h2>
          <TopicCloud topics={topics} coding={!!languages} />
          {statsError ? <p className="bento-data-caption">外部统计暂不可用</p> : null}
        </article>
        <ActivitySnake days={days} coding={!!calendar} />
        <AboutSceneCard />
      </div>
    </section>
  )
}
