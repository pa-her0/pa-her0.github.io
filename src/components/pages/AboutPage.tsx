"use client"

import {
  IconArrowUpRight,
  IconBrain,
  IconBrandGithub,
  IconChecklist,
  IconChevronDown,
  IconChevronUp,
  IconMail,
  IconMapPin,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlugConnected,
  IconRadio,
  IconUsersGroup,
} from "@tabler/icons-react"
import { useEffect, useRef, useState } from "react"
import { ActivitySnake } from "@/components/activity-snake"
import { InteractiveHomeCharacter } from "@/components/interactive-home-character"
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

const journalTabs = [
  { id: "me", title: "About me", subtitle: "个人介绍", image: "about-black" },
  { id: "making", title: "Making", subtitle: "技术与近况", image: "updates" },
  { id: "life", title: "Life", subtitle: "照片与音乐", image: "cv" },
] as const
type JournalTab = typeof journalTabs[number]["id"]

const agentInterests = [
  { name: "Tool use & MCP", icon: IconPlugConnected },
  { name: "RAG & Memory", icon: IconBrain },
  { name: "Multi-agent", icon: IconUsersGroup },
  { name: "Agent evaluation", icon: IconChecklist },
] as const

export default function AboutPage({ activity }: AboutPageProps) {
  const [selected, setSelected] = useState<JournalTab>("me")
  const [catGreeting, setCatGreeting] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <main className="about-scrapbook" aria-labelledby="about-title">
      <h1 id="about-title" className="sr-only">关于 Jiely</h1>
      <div className="about-scrapbook__board">
        <div className="about-scrapbook__scene">
          <p className="about-scrapbook__note" aria-hidden="true">a little bit of <span>my world.</span></p>
          <div className="about-scrapbook__character"><InteractiveHomeCharacter /></div>
          <button type="button" className="scrapbook-cat" aria-label="摸摸橘猫"
            onPointerEnter={(event) => { if (event.pointerType !== "touch") setCatGreeting((n) => n + 1) }}
            onClick={() => setCatGreeting((n) => n + 1)}>
            <img key={catGreeting} data-petted={catGreeting > 0 ? "true" : undefined}
              src="/images/home-scrapbook/cat.webp" width="1280" height="1280" alt="" draggable="false" decoding="async" />
            <span aria-hidden="true">♡</span>
          </button>
          <svg className="about-scrapbook__star" viewBox="0 0 60 60" aria-hidden="true"><path d="m30 4 6 18 19 1-15 12 5 19-16-11-16 10 6-19L4 22l19 1Z" /></svg>
          <p className="about-scrapbook__aside" aria-hidden="true">stay curious <span>✦</span></p>
        </div>

        <div className="about-journal">
          <div className="about-journal__tabs" role="tablist" aria-label="关于我的栏目">
            {journalTabs.map((tab, index) => (
              <button key={tab.id} ref={(element) => { tabs.current[index] = element }}
                type="button" role="tab" id={`about-tab-${tab.id}`}
                aria-controls={`about-panel-${tab.id}`} aria-selected={selected === tab.id}
                tabIndex={selected === tab.id ? 0 : -1} aria-label={`${tab.title} · ${tab.subtitle}`}
                className="about-journal__tab" onClick={() => setSelected(tab.id)}
                onKeyDown={(event) => {
                  let next = index
                  if (event.key === "ArrowRight") next = (index + 1) % journalTabs.length
                  else if (event.key === "ArrowLeft") next = (index + journalTabs.length - 1) % journalTabs.length
                  else if (event.key === "Home") next = 0
                  else if (event.key === "End") next = journalTabs.length - 1
                  else return
                  event.preventDefault()
                  setSelected(journalTabs[next].id)
                  tabs.current[next]?.focus()
                }}>
                <img src={`/images/home-scrapbook/${tab.image}.webp`} width="1280" height="1280" alt="" draggable="false" decoding="async" />
                <span lang="en">{tab.title}</span>
                <small>{tab.subtitle}</small>
              </button>
            ))}
          </div>

          <div className="about-sheet">
            <span className="about-sheet__tape" aria-hidden="true" />
            <section id="about-panel-me" role="tabpanel" aria-labelledby="about-tab-me" tabIndex={0} hidden={selected !== "me"}>
              {selected === "me" && <div className="about-sheet__content">
                <span className="about-sheet__index" aria-hidden="true">01 / ME</span>
                <h2 className="about-sheet__title" lang="en">Hi, I'm Jiely<span>.</span></h2>
                <p className="about-sheet__lead">保持好奇，学习一切有趣的事物。</p>
                <div className="about-sheet__prose">
                  <p>兴趣是 HPC 高性能计算、AI Infra 与 AI Agent，喜欢探索前沿技术和 GitHub 开源项目。</p>
                  <p>这里记录生活，也记录学习。把学到的知识写下来，把想做的事情一步步实现。</p>
                </div>
                <div className="about-sheet__interests" aria-label="兴趣方向"><span>AI Agent</span><span>HPC</span><span>AI Infra</span><span>Open source</span></div>
                <p className="about-sheet__location"><IconMapPin size={16} stroke={1.5} />{homeDashboard.location}</p>
                <div className="about-sheet__links">
                  <a href="https://github.com/pa-her0" target="_blank" rel="noreferrer"><IconBrandGithub size={18} stroke={1.5} />GitHub</a>
                  <a href="mailto:2799620892@qq.com"><IconMail size={18} stroke={1.5} />Email</a>
                  <a href="/acad-homepage/index.html" data-astro-reload className="about-sheet__resume">Resume<IconArrowUpRight size={17} stroke={1.5} /></a>
                </div>
              </div>}
            </section>

            <section id="about-panel-making" role="tabpanel" aria-labelledby="about-tab-making" tabIndex={0} hidden={selected !== "making"}>
              {selected === "making" && <div className="about-sheet__content">
                <span className="about-sheet__index" aria-hidden="true">02 / MAKING</span>
                <h2 className="about-sheet__title" lang="en">Always learning<span>.</span></h2>
                <p className="about-sheet__lead">以学求知，以行作答。</p>
                <div className="about-journal__stack" role="list" aria-label="技术栈与技术兴趣">
                  {homeDashboard.stack.map((item) => <div key={item.name} role="listitem">
                    <img src={item.icon} alt="" width={25} height={25} /><span>{item.name}</span>
                  </div>)}
                  {agentInterests.map(({ name, icon: Icon }) => <div key={name} role="listitem">
                    <Icon size={25} stroke={1.5} aria-hidden="true" /><span>{name}</span>
                  </div>)}
                </div>
                <div className="about-journal__activity">
                  <ActivitySnake days={activity.days} />
                  <p><strong>{activity.total}</strong> 次记录，写下探索的痕迹。</p>
                </div>
                <div className="about-sheet__links">
                  <a href="/projects/" data-astro-prefetch="hover">研究与实践<IconArrowUpRight size={17} stroke={1.5} /></a>
                  <a href="/learning/" data-astro-prefetch="hover">学习进度<IconArrowUpRight size={17} stroke={1.5} /></a>
                  <a href="/notes/" data-astro-prefetch="hover">学习笔记<IconArrowUpRight size={17} stroke={1.5} /></a>
                </div>
              </div>}
            </section>

            <section id="about-panel-life" role="tabpanel" aria-labelledby="about-tab-life" tabIndex={0} hidden={selected !== "life"}>
              {selected === "life" && <div className="about-sheet__content">
                <span className="about-sheet__index" aria-hidden="true">03 / LIFE</span>
                <h2 className="about-sheet__title" lang="en">Little moments<span>.</span></h2>
                <GalleryStory />
                <MusicStory />
              </div>}
            </section>
            <span className="about-sheet__page" aria-hidden="true">{String(journalTabs.findIndex(tab => tab.id === selected) + 1).padStart(2, "0")} / 03</span>
          </div>
        </div>
      </div>
    </main>
  )
}
