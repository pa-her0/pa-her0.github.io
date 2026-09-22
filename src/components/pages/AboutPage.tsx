"use client"

import {
  IconArrowUpRight,
  IconBrandGithub,
  IconChevronDown,
  IconChevronUp,
  IconMail,
  IconMapPin,
  IconPlayerPause,
  IconPlayerPlay,
  IconRadio,
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { ActivitySnake } from "@/components/activity-snake"
import { HomeGlobe } from "@/components/home-globe"
import { homeDashboard, type HomeTrack } from "@/data/home-dashboard"
import type { ActivityDay } from "@/lib/home-activity"

export interface AboutPageProps {
  activity: {
    days: ActivityDay[]
    total: number
  }
}

function GalleryStory() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = homeDashboard.gallery[activeIndex]

  return (
    <div className="about-memory__gallery">
      <figure className="about-memory__photo">
        <img
          key={active.src}
          src={active.src}
          alt={active.alt}
          width={680}
          height={680}
          decoding="async"
        />
        <figcaption>
          <span>{String(activeIndex + 1).padStart(2, "0")}</span>
          {active.alt}
        </figcaption>
      </figure>

      <div className="about-memory__thumbs" role="group" aria-label="选择相册图片">
        {homeDashboard.gallery.map((image, index) => (
          <button
            key={image.src}
            type="button"
            aria-label={`查看${image.alt}`}
            aria-pressed={index === activeIndex}
            onClick={() => setActiveIndex(index)}
          >
            <img src={image.src} alt="" width={96} height={96} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    </div>
  )
}

function MusicStory() {
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
    if (audio) {
      audio.removeAttribute("src")
      audio.load()
    }
    setTrackIndex((value) => (value + direction + homeDashboard.tracks.length) % homeDashboard.tracks.length)
    setProgress(0)
    setCoverFailed(false)
  }

  async function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (status === "playing" || status === "loading") {
      stop()
      return
    }
    if (!track.src || !track.mimeType || audio.canPlayType(track.mimeType) === "") {
      setStatus("error")
      return
    }

    const request = ++requestRef.current
    setStatus("loading")
    if (audio.getAttribute("src") !== track.src) {
      audio.src = track.src
      audio.load()
    }
    timerRef.current = setTimeout(() => {
      if (requestRef.current !== request) return
      requestRef.current += 1
      audio.pause()
      setStatus("error")
    }, 20000)

    try {
      document.querySelectorAll("audio").forEach((item) => {
        if (item !== audio) item.pause()
      })
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
      if (audio) {
        audio.removeAttribute("src")
        audio.load()
      }
      document.removeEventListener("astro:before-swap", halt)
      window.removeEventListener("pagehide", halt)
      window.removeEventListener("jiely:audio-play", stopForAnotherPlayer)
    }
  }, [])

  return (
    <div className="about-music" data-playing={status === "playing"}>
      <div className="about-music__art">
        <img
          src={coverFailed ? "/home-gallery/hero-avatar.webp" : track.cover}
          alt={track.album}
          width={240}
          height={240}
          onError={() => setCoverFailed(true)}
        />
        <span aria-hidden="true" />
      </div>

      <div className="about-music__body">
        <p className="about-music__state" aria-live="polite">
          <IconRadio size={17} stroke={1.6} />
          {status === "playing" ? "Now playing" : status === "loading" ? "Loading" : status === "error" ? "暂时无法播放" : "Ready to play"}
        </p>
        <h3>{track.title}</h3>
        <p>{track.artist}</p>
        <span title={track.album}>{track.album}</span>

        <div className="about-music__controls">
          <button type="button" onClick={() => changeTrack(-1)} aria-label="上一首">
            <IconChevronUp size={20} stroke={1.6} />
          </button>
          <button
            type="button"
            onClick={() => void toggle()}
            aria-label={status === "playing" ? "暂停" : status === "loading" ? "取消加载" : "播放"}
          >
            {status === "playing" ? <IconPlayerPause size={22} stroke={1.5} /> : <IconPlayerPlay size={22} stroke={1.5} />}
          </button>
          <button type="button" onClick={() => changeTrack(1)} aria-label="下一首">
            <IconChevronDown size={20} stroke={1.6} />
          </button>
          <a href={track.href} target="_blank" rel="noreferrer">
            网易云音乐 <IconArrowUpRight size={16} stroke={1.6} />
          </a>
        </div>

        {status === "error" ? (
          <p className="about-music__error">音源受限或网络不可用，可前往网易云收听。</p>
        ) : (
          <input
            className="about-music__progress"
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            aria-label="播放进度"
            disabled={status !== "playing" && progress === 0}
            onChange={(event) => {
              const audio = audioRef.current
              if (!audio || !Number.isFinite(audio.duration)) return
              const value = Number(event.target.value)
              audio.currentTime = audio.duration * value / 100
              setProgress(value)
            }}
          />
        )}
      </div>

      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onTimeUpdate={() => {
          const audio = audioRef.current
          if (audio && Number.isFinite(audio.duration) && audio.duration > 0) {
            setProgress(audio.currentTime / audio.duration * 100)
          }
        }}
        onEnded={() => {
          setStatus("idle")
          setProgress(0)
        }}
        onError={() => {
          if (!audioRef.current?.getAttribute("src")) return
          clearTimeout(timerRef.current)
          setStatus("error")
        }}
      />
    </div>
  )
}

export default function AboutPage({ activity }: AboutPageProps) {
  return (
    <main className="about-archive">
      <section className="about-intro" aria-labelledby="about-title">
        <div className="about-intro__copy">
          <p className="about-section__eyebrow">JIELY / ABOUT</p>
          <h1 id="about-title" className="about-intro__title">
            <span className="sr-only">你好，我是 Jiely。</span>
            <img
              src="/brand/jiely-about-brush-v1.png"
              alt=""
              width={1536}
              height={1024}
              decoding="async"
            />
          </h1>
          <p className="about-intro__lead">保持好奇，学习一切有趣的事物。</p>
          <div className="about-intro__notes">
            {homeDashboard.intro.lines.map((line) => <p key={line}>{line}</p>)}
          </div>
          <div className="about-intro__links">
            <a href="https://github.com/pa-her0" target="_blank" rel="noreferrer">
              <IconBrandGithub size={18} stroke={1.5} /> GitHub
            </a>
            <a href="mailto:2799620892@qq.com">
              <IconMail size={18} stroke={1.5} /> Email
            </a>
          </div>
        </div>

        <div className="about-intro__mark" aria-hidden="true">
          <span>01</span>
          <strong>保持<br />好奇</strong>
          <small>STAY CURIOUS</small>
        </div>
      </section>

      <section className="about-coordinates" aria-label="坐标与技术栈">
        <div className="about-place">
          <div className="about-section__heading">
            <p className="about-section__eyebrow">WHERE I AM</p>
            <h2><IconMapPin size={24} stroke={1.45} />{homeDashboard.location}</h2>
          </div>
          <div className="about-place__globe">
            <HomeGlobe />
          </div>
        </div>

        <div className="about-stack">
          <div className="about-section__heading">
            <p className="about-section__eyebrow">WHAT I USE</p>
            <h2>Stacks</h2>
          </div>
          <div className="about-stack__items" role="list" aria-label="技术栈">
            {homeDashboard.stack.map((item, index) => (
              <div key={item.name} role="listitem">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <img src={item.icon} alt="" width={42} height={42} />
                <strong>{item.name}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-memory" aria-labelledby="about-memory-title">
        <div className="about-section__heading about-section__heading--wide">
          <p className="about-section__eyebrow">LIFE IN FRAGMENTS</p>
          <h2 id="about-memory-title">日常的一些切片</h2>
          <p>照片会记住一些瞬间，音乐会记住当时的情绪。</p>
        </div>
        <div className="about-memory__grid">
          <GalleryStory />
          <MusicStory />
        </div>
      </section>

      <section className="about-current" aria-labelledby="about-writing-title">
        <section className="about-writing">
          <div className="about-section__heading">
            <h2 id="about-writing-title">更新轨迹</h2>
          </div>
          <p className="about-writing__intro">文章与碎碎念，共同组成这条不完全规律的轨迹。</p>
          <div className="about-writing__activity">
            <ActivitySnake days={activity.days} />
            <p>{activity.total} 次内容更新，继续生长。</p>
          </div>
        </section>
      </section>
    </main>
  )
}
