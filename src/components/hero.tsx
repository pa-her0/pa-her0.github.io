"use client"

import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react"

const phrases = [
  { prefix: "让智能体学会", highlight: "协作" },
  { prefix: "在市场噪声中", highlight: "寻找信号" },
  { prefix: "把模型带进", highlight: "真实世界" },
  { prefix: "写下仍在发生的", highlight: "思考" },
]

const heroImages = [
  { src: "/hero-avatar.jpg", alt: "橘子角色在雪山前唱歌的插画" },
  { src: "/hero-avatar-02.jpg", alt: "橘子角色站在蓝色阶梯上的插画" },
  { src: "/hero-avatar-03.jpg", alt: "橘子角色演绎大白鲨电影的插画" },
  { src: "/hero-avatar-04.jpg", alt: "橘子角色坐在复古座椅上的插画" },
  { src: "/hero-avatar-05.jpg", alt: "橘子角色演绎肖申克的救赎电影的插画" },
]

const HERO_IMAGE_STORAGE_KEY = "jiely-home-hero-image"

interface HeroProps {
  articleCount: number
  thoughtCount: number
  projectCount: number
}

export function Hero({ articleCount, thoughtCount, projectCount }: HeroProps) {
  const [mounted, setMounted] = useState(false)
  const [heroImageIndex, setHeroImageIndex] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  // Pause the typewriter loop when the hero is offscreen or the tab is hidden;
  // otherwise the setTimeout chain keeps re-rendering React state while the
  // user reads other parts of the home page.
  const [isActive, setIsActive] = useState(true)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)

    const previousIndex = Number.parseInt(sessionStorage.getItem(HERO_IMAGE_STORAGE_KEY) ?? "-1", 10)
    const hasPreviousImage = Number.isInteger(previousIndex) && previousIndex >= 0 && previousIndex < heroImages.length
    const nextIndex = hasPreviousImage
      ? (previousIndex + 1) % heroImages.length
      : 0

    sessionStorage.setItem(HERO_IMAGE_STORAGE_KEY, String(nextIndex))
    setHeroImageIndex(nextIndex)
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setIsActive(false)
      else if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect()
        setIsActive(rect.bottom > 0 && rect.top < window.innerHeight)
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    let observer: IntersectionObserver | null = null
    if (sectionRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setIsActive(entry.isIntersecting && !document.hidden)
          }
        },
        { threshold: 0 },
      )
      observer.observe(sectionRef.current)
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      observer?.disconnect()
    }
  }, [])

  const getTypeSpeed = useCallback(() => {
    // Random variation for natural typing rhythm (50-90ms)
    return 50 + Math.random() * 40
  }, [])

  const getDeleteSpeed = useCallback(() => {
    // Faster, more consistent deletion (25-40ms)
    return 25 + Math.random() * 15
  }, [])

  const innerTimerRef = useRef<number | null>(null)

  const typeWriter = useCallback(() => {
    const currentPhrase = phrases[phraseIndex]
    const fullText = currentPhrase.prefix + currentPhrase.highlight

    if (innerTimerRef.current !== null) {
      window.clearTimeout(innerTimerRef.current)
      innerTimerRef.current = null
    }

    if (!isDeleting) {
      if (displayText.length < fullText.length) {
        innerTimerRef.current = window.setTimeout(() => {
          setDisplayText(fullText.slice(0, displayText.length + 1))
        }, getTypeSpeed())
      } else {
        innerTimerRef.current = window.setTimeout(() => setIsDeleting(true), 1500)
      }
    } else {
      if (displayText.length > 0) {
        innerTimerRef.current = window.setTimeout(() => {
          setDisplayText(displayText.slice(0, -1))
        }, getDeleteSpeed())
      } else {
        setIsDeleting(false)
        setPhraseIndex((prev) => (prev + 1) % phrases.length)
      }
    }
  }, [displayText, isDeleting, phraseIndex, getTypeSpeed, getDeleteSpeed])

  useEffect(() => {
    if (!mounted || !isActive) return
    const timer = window.setTimeout(typeWriter, 50)
    return () => {
      window.clearTimeout(timer)
      if (innerTimerRef.current !== null) {
        window.clearTimeout(innerTimerRef.current)
        innerTimerRef.current = null
      }
    }
  }, [mounted, isActive, typeWriter])

  const renderText = () => {
    const currentPhrase = phrases[phraseIndex]
    const prefixLength = currentPhrase.prefix.length

    if (displayText.length <= prefixLength) {
      return <span>{displayText}</span>
    } else {
      return (
        <>
          <span>{currentPhrase.prefix}</span>
          <span className="text-primary">{displayText.slice(prefixLength)}</span>
        </>
      )
    }
  }

  const handleBrowseClick = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    const target = document.getElementById("home-main")
    if (!target) return
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    if (history.replaceState) {
      history.replaceState({}, "", "#home-main")
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative flex min-h-[calc(100svh-4rem)] items-center bg-surface-subtle px-6 py-14 sm:py-20 lg:py-24">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div
          className={`lg:col-span-7 transition-all duration-1000 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p className="mb-6 text-xs tracking-[0.28em] text-muted-foreground sm:text-sm">
            JIELY · 生活 · 学习
          </p>

          <h1
            aria-live="polite"
            className="mb-7 min-h-[2.35em] text-balance font-display-sans text-[clamp(2.65rem,6vw,5.25rem)] font-bold leading-[1.12] tracking-[-0.055em] text-foreground sm:min-h-[2.3em]"
          >
            {renderText()}
            <span className="hero-cursor ml-2 inline-block h-[0.9em] w-[0.075em] -translate-y-[0.04em] rounded-sm bg-foreground align-middle" />
          </h1>

          <blockquote className="mb-8 border-l border-border pl-5">
            <p className="text-base italic leading-relaxed text-content-secondary sm:text-lg">
              「In the end, you have to save yourself.」
            </p>
            <footer className="mt-2 text-sm text-muted-foreground/70">—— Jiely</footer>
          </blockquote>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <a
              href="#home-main"
              onClick={handleBrowseClick}
              className="group inline-flex min-w-36 items-center justify-center gap-2 rounded-full bg-foreground px-8 py-3.5 text-sm font-medium text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-foreground/90"
            >
              浏览文章
              <svg
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/about/"
              className="inline-flex min-w-32 items-center justify-center rounded-full border border-border px-8 py-3.5 text-sm font-medium text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/40"
            >
              关于我
            </a>
          </div>

          <div className="grid gap-8 border-t border-border pt-8 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-10">
            <p className="max-w-md text-sm font-light leading-7 text-muted-foreground sm:text-[15px]">
              在复杂系统中寻找清晰结构。这里记录人工智能、多智能体研究与算法实践，也保存仍在发生的学习和生活。
            </p>
            <div className="grid grid-cols-3 gap-6 sm:gap-8">
              <a href="#home-main" onClick={handleBrowseClick} className="group min-w-14 text-center">
                <strong className="block text-3xl font-light leading-none tabular-nums text-foreground">{articleCount}</strong>
                <span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground group-hover:text-primary">Articles</span>
              </a>
              <a href="/thoughts/" className="group min-w-14 text-center">
                <strong className="block text-3xl font-light leading-none tabular-nums text-foreground">{thoughtCount}</strong>
                <span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground group-hover:text-primary">Thoughts</span>
              </a>
              <a href="/projects/" className="group min-w-14 text-center">
                <strong className="block text-3xl font-light leading-none tabular-nums text-foreground">{projectCount}</strong>
                <span className="mt-2 block font-mono text-[8px] uppercase tracking-[0.12em] text-muted-foreground group-hover:text-primary">Projects</span>
              </a>
            </div>
          </div>
        </div>

        <figure
          className={`relative mx-auto aspect-[3/4] w-full max-w-[32rem] overflow-hidden rounded-xl border border-border bg-surface-subtle shadow-[0_2rem_5rem_rgba(0,0,0,0.08)] lg:col-span-5 transition-all delay-150 duration-1000 ease-out ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <img
            src={heroImages[heroImageIndex].src}
            alt={heroImages[heroImageIndex].alt}
            width={980}
            height={980}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.015] dark:brightness-[0.86]"
            fetchPriority="high"
          />
          <figcaption className="sr-only">Jiely 的个人插画头像</figcaption>
        </figure>
      </div>
    </section>
  )
}
