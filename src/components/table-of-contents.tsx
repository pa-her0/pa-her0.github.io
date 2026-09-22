"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  showHeader?: boolean
}

export function TableOfContents({ showHeader = true }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [readPercent, setReadPercent] = useState(0)
  const navRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const headingElementsRef = useRef<Map<string, IntersectionObserverEntry>>(new Map())
  // Pre-measured document-coord top of every heading. Refreshed on resize / page
  // load — never read inside the IO callback to avoid forced sync layout while
  // the user scrolls.
  const headingOffsetsRef = useRef<Array<{ id: string; top: number }>>([])
  const tocAutoScrollTimerRef = useRef<number | null>(null)
  const programmaticTargetRef = useRef<string>("")
  const programmaticLockRef = useRef(false)
  const lockTimerRef = useRef<number | null>(null)

  const unlockProgrammaticLock = useCallback(() => {
    programmaticLockRef.current = false
    programmaticTargetRef.current = ""
    if (lockTimerRef.current !== null) {
      window.clearTimeout(lockTimerRef.current)
      lockTimerRef.current = null
    }
  }, [])

  const clearTocAutoScrollTimer = useCallback(() => {
    if (tocAutoScrollTimerRef.current !== null) {
      window.clearTimeout(tocAutoScrollTimerRef.current)
      tocAutoScrollTimerRef.current = null
    }
  }, [])

  const collectHeadings = useCallback(() => {
    const article = document.querySelector("article")
    if (!article) return

    const elements = article.querySelectorAll("h2, h3")
    const items: TocItem[] = []
    elements.forEach((el) => {
      const id = el.id
      if (!id) return
      const clone = el.cloneNode(true) as HTMLElement
      clone.querySelectorAll(".anchor, .anchor-icon").forEach((a) => a.remove())
      const text = clone.textContent?.trim() || ""
      if (!text) return
      const level = parseInt(el.tagName[1], 10)
      items.push({ id, text, level })
    })
    setHeadings(items)
    return items
  }, [])

  const measureOffsets = useCallback((items: TocItem[]) => {
    const scrollY = window.scrollY
    const offsets: Array<{ id: string; top: number }> = []
    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (!el) return
      offsets.push({ id: item.id, top: el.getBoundingClientRect().top + scrollY })
    })
    offsets.sort((a, b) => a.top - b.top)
    headingOffsetsRef.current = offsets
  }, [])

  const setupObserver = useCallback(
    (items: TocItem[]) => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      headingElementsRef.current = new Map()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            headingElementsRef.current.set(entry.target.id, entry)
          })

          if (programmaticLockRef.current) {
            const targetId = programmaticTargetRef.current
            if (targetId) {
              // While a click-driven smooth scroll is in flight, keep activeId
              // pinned to the target. Unlock is driven by `scrollend` / 2500ms
              // hard timer / user gesture — never by IO geometry, which would
              // either flicker (entry-based) or cost a sync layout read
              // (rect-based, the original implementation).
              setActiveId(targetId)
              return
            }
            unlockProgrammaticLock()
          }

          const visibleHeadings: IntersectionObserverEntry[] = []
          headingElementsRef.current.forEach((entry) => {
            if (entry.isIntersecting) visibleHeadings.push(entry)
          })

          if (visibleHeadings.length > 0) {
            const sorted = visibleHeadings.sort(
              (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
            )
            setActiveId(sorted[0].target.id)
          } else {
            // Fallback: use pre-measured offsets instead of reading layout for
            // every heading on every callback (the original code triggered a
            // forced reflow per heading per scroll tick — the main mobile-jank
            // culprit reported by Codex).
            const scrollY = window.scrollY
            const offsets = headingOffsetsRef.current
            let closestId = ""
            for (const o of offsets) {
              if (o.top <= scrollY + 100) closestId = o.id
              else break
            }
            const nextId = closestId || offsets[0]?.id || ""
            if (nextId) setActiveId(nextId)
          }
        },
        {
          rootMargin: "-80px 0px -60% 0px",
          threshold: 0,
        },
      )

      items.forEach((item) => {
        const el = document.getElementById(item.id)
        if (el) observerRef.current?.observe(el)
      })
    },
    [unlockProgrammaticLock],
  )

  useEffect(() => {
    let resizeRaf = 0
    let remeasureRaf = 0
    let currentItems: TocItem[] = []
    let articleObserver: ResizeObserver | null = null

    const remeasure = () => {
      if (currentItems.length > 0) measureOffsets(currentItems)
    }

    const scheduleRemeasure = () => {
      if (remeasureRaf) cancelAnimationFrame(remeasureRaf)
      remeasureRaf = requestAnimationFrame(remeasure)
    }

    const observeArticleResize = () => {
      articleObserver?.disconnect()
      const article = document.querySelector("article")
      if (!article || typeof ResizeObserver === "undefined") return
      // Markdown images load lazily and rarely declare width/height, so the
      // article reflows during scrolling. Re-measure heading offsets whenever
      // article geometry changes — keeps the fallback branch accurate without
      // forcing a layout read inside the IO callback itself.
      articleObserver = new ResizeObserver(scheduleRemeasure)
      articleObserver.observe(article)
    }

    const init = () => {
      const items = collectHeadings()
      if (items && items.length > 0) {
        currentItems = items
        measureOffsets(items)
        setupObserver(items)
        observeArticleResize()
      }
    }

    init()
    window.addEventListener("load", remeasure)
    document.addEventListener("astro:page-load", init)

    const onResize = () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      resizeRaf = requestAnimationFrame(remeasure)
    }
    window.addEventListener("resize", onResize, { passive: true })

    const handleUserIntent = () => {
      if (programmaticLockRef.current) {
        unlockProgrammaticLock()
      }
    }

    // `scrollend` (Chrome 114+, Safari 18+, Firefox 109+) is the cleanest
    // signal that a programmatic smooth scroll has finished. Older browsers
    // fall back to the existing 2500ms hard timer + user-gesture unlock.
    const onScrollEnd = () => {
      if (programmaticLockRef.current) unlockProgrammaticLock()
    }

    window.addEventListener("wheel", handleUserIntent, { passive: true })
    window.addEventListener("touchstart", handleUserIntent, { passive: true })
    window.addEventListener("keydown", handleUserIntent)
    window.addEventListener("scrollend", onScrollEnd, { passive: true })

    return () => {
      observerRef.current?.disconnect()
      articleObserver?.disconnect()
      window.removeEventListener("load", remeasure)
      document.removeEventListener("astro:page-load", init)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("wheel", handleUserIntent)
      window.removeEventListener("touchstart", handleUserIntent)
      window.removeEventListener("keydown", handleUserIntent)
      window.removeEventListener("scrollend", onScrollEnd)
      if (resizeRaf) cancelAnimationFrame(resizeRaf)
      if (remeasureRaf) cancelAnimationFrame(remeasureRaf)
      clearTocAutoScrollTimer()
      unlockProgrammaticLock()
    }
  }, [clearTocAutoScrollTimer, collectHeadings, measureOffsets, setupObserver, unlockProgrammaticLock])

  useEffect(() => {
    let progressRaf = 0

    const updateReadPercent = () => {
      progressRaf = 0
      const article = document.querySelector<HTMLElement>("article")
      if (!article) return

      const articleTop = article.getBoundingClientRect().top + window.scrollY
      const readableDistance = Math.max(article.offsetHeight - window.innerHeight * 0.55, 1)
      const progress = ((window.scrollY - articleTop + 96) / readableDistance) * 100
      setReadPercent(Math.min(100, Math.max(0, Math.round(progress))))
    }

    const scheduleProgressUpdate = () => {
      if (progressRaf) return
      progressRaf = requestAnimationFrame(updateReadPercent)
    }

    updateReadPercent()
    window.addEventListener("scroll", scheduleProgressUpdate, { passive: true })
    window.addEventListener("resize", scheduleProgressUpdate, { passive: true })
    document.addEventListener("astro:page-load", updateReadPercent)

    return () => {
      window.removeEventListener("scroll", scheduleProgressUpdate)
      window.removeEventListener("resize", scheduleProgressUpdate)
      document.removeEventListener("astro:page-load", updateReadPercent)
      if (progressRaf) cancelAnimationFrame(progressRaf)
    }
  }, [])

  useEffect(() => {
    if (!activeId || !navRef.current) return

    // Mobile renders the TOC inside a drawer that's usually closed; auto-scroll
    // there forces extra layout reads on every heading change while the user
    // scrolls the article. Desktop (sidebar) is the only place where keeping
    // the active link visible matters.
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches) {
      return
    }

    clearTocAutoScrollTimer()
    tocAutoScrollTimerRef.current = window.setTimeout(() => {
      const nav = navRef.current
      if (!nav) return

      const activeLink = nav.querySelector<HTMLAnchorElement>(`a[href="#${CSS.escape(activeId)}"]`)
      if (!activeLink) return

      const scrollContainer = nav.querySelector<HTMLElement>(".toc-nav__scroller")
      if (!scrollContainer) return

      const containerRect = scrollContainer.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const isContainerVisible = containerRect.bottom > 0 && containerRect.top < viewportHeight
      if (!isContainerVisible) return

      const linkRect = activeLink.getBoundingClientRect()
      const padding = 16
      const isOutOfView =
        linkRect.top < containerRect.top + padding ||
        linkRect.bottom > containerRect.bottom - padding

      if (isOutOfView) {
        const linkCenter = activeLink.offsetTop + activeLink.offsetHeight / 2
        const targetTop = Math.max(0, linkCenter - scrollContainer.clientHeight / 2)
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        scrollContainer.scrollTo({ top: targetTop, behavior: reduceMotion ? "auto" : "smooth" })
      }
    }, 90)

    return () => {
      clearTocAutoScrollTimer()
    }
  }, [activeId, clearTocAutoScrollTimer])

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (!el) return

    unlockProgrammaticLock()
    programmaticLockRef.current = true
    programmaticTargetRef.current = id

    const top = el.getBoundingClientRect().top + window.scrollY - 80
    window.scrollTo({ top, behavior: "smooth" })
    setActiveId(id)

    lockTimerRef.current = window.setTimeout(() => {
      unlockProgrammaticLock()
    }, 2500)
  }

  if (headings.length === 0) return null

  return (
    <nav ref={navRef} aria-label="目录" className="toc-nav">
      {showHeader ? (
        <div className="toc-nav__header">本页目录</div>
      ) : null}
      <div className="toc-nav__scroller toc-scrollbar">
        <ul className="toc-nav__list">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => handleClick(e, heading.id)}
                className={cn(
                  "toc-nav__link",
                  heading.level === 3 && "toc-nav__link--nested",
                  activeId === heading.id && "is-active",
                )}
              >
                <span>{heading.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="toc-nav__progress" aria-label={`已阅读 ${readPercent}%`}>
        <span>阅读进度</span>
        <strong>{readPercent}%</strong>
      </div>
    </nav>
  )
}
