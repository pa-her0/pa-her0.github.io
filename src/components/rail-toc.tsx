"use client"

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent } from "react"
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring } from "framer-motion"
import { cn } from "@/lib/utils"

export type RailTocItem = { id: string; label: string; depth?: number }

type Point = { x: number; y: number }
type Geometry = { nodes: Point[]; d: string; width: number; height: number }
type RailTocProps = {
  items: RailTocItem[]
  offset?: number
  indent?: number
  showHeader?: boolean
  autoScroll?: boolean
}

const RAIL_X = 10
const LABEL_GAP = 16
const TRAVEL_SPRING = { stiffness: 140, damping: 26, mass: 0.6 }
const TURN_SPRING = { stiffness: 260, damping: 30 }
const PLANE = "M12 2 20.5 21 12 17.5 3.5 21z"
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

function buildPath(nodes: Point[]) {
  if (!nodes.length) return ""
  const point = ({ x, y }: Point) => `${Number(x.toFixed(2))} ${Number(y.toFixed(2))}`
  const commands = [`M${nodes[0].x} 0`, `L${point(nodes[0])}`]
  for (let i = 1; i < nodes.length; i++) {
    const from = nodes[i - 1]
    const to = nodes[i]
    const span = to.y - from.y
    if (from.x === to.x) {
      // A gentle alternating bow gives siblings a flowing rhythm. Vertical
      // tangents at each node keep the plane's heading continuous at joins.
      const sway = Math.min(5 + (i % 3) * 0.6, span * 0.18) * (i % 2 ? 1 : -1)
      const middle = { x: from.x + sway, y: from.y + span / 2 }
      commands.push(
        `C${point({ x: from.x, y: from.y + span * 0.22 })} ${point({ x: middle.x, y: middle.y - span * 0.2 })} ${point(middle)}`,
        `C${point({ x: middle.x, y: middle.y + span * 0.2 })} ${point({ x: to.x, y: to.y - span * 0.22 })} ${point(to)}`,
      )
    } else {
      // Keep control-point heights ordered: lengthAtY relies on a path that
      // always travels downward, including these broader chapter transitions.
      const bend = Math.min(24, span * 0.48)
      commands.push(`C${point({ x: from.x, y: from.y + bend })} ${point({ x: to.x, y: to.y - bend })} ${point(to)}`)
    }
  }
  return commands.join(" ")
}

function lengthAtY(path: SVGPathElement, total: number, y: number) {
  let lo = 0
  let hi = total
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (path.getPointAtLength(mid).y < y) lo = mid
    else hi = mid
  }
  return hi
}

export function RailToc({ items, offset = 96, indent = 18, showHeader = true, autoScroll = true }: RailTocProps) {
  const reduceMotion = useReducedMotion()
  const maskId = `rail-toc-${useId().replace(/[^\w-]/g, "")}`
  const navRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<(HTMLLIElement | null)[]>([])
  const pathRef = useRef<SVGPathElement>(null)
  const holeRefs = useRef<(SVGCircleElement | null)[]>([])
  const lengths = useRef<number[]>([])
  const total = useRef(0)
  const placed = useRef(false)
  const visible = useRef(false)
  const pinned = useRef<number | null>(null)
  const reachedRef = useRef(1)
  const page = useRef({ tops: [] as number[], articleTop: 0, articleHeight: 1, viewHeight: 0 })
  const [geometry, setGeometry] = useState<Geometry>()
  const [reached, setReached] = useState(1)
  const [readPercent, setReadPercent] = useState(0)

  const target = useMotionValue(0)
  const travel = useSpring(target, TRAVEL_SPRING)
  const distance = reduceMotion ? target : travel
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const heading = useMotionValue(180)
  const turn = useSpring(heading, TURN_SPRING)
  const filled = useMotionValue(0)

  const pose = useCallback((value: number) => {
    const path = pathRef.current
    const length = total.current
    if (!path || !length) return
    const position = Math.max(0, Math.min(length, value))
    const at = path.getPointAtLength(position)
    const behind = path.getPointAtLength(Math.max(0, position - 1))
    const ahead = path.getPointAtLength(Math.min(length, position + 1))
    x.set(at.x)
    y.set(at.y)
    holeRefs.current.forEach((hole) => {
      hole?.setAttribute("cx", `${at.x}`)
      hole?.setAttribute("cy", `${at.y}`)
    })
    heading.set((Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI + 90)
    filled.set(position / length)
    const covered = lengths.current.filter((node) => node <= position + 0.5).length
    if (covered !== reachedRef.current) {
      reachedRef.current = covered
      setReached(covered)
    }
  }, [x, y, heading, filled])

  useMotionValueEvent(distance, "change", pose)

  const sync = useCallback(() => {
    const nodes = lengths.current
    const { tops, articleTop, articleHeight, viewHeight } = page.current
    if (!nodes.length || nodes.length !== tops.length || !visible.current) return

    const scrollTop = window.scrollY
    const readableDistance = Math.max(articleHeight - viewHeight * 0.55, 1)
    setReadPercent(Math.min(100, Math.max(0, Math.round(((scrollTop - articleTop + offset) / readableDistance) * 100))))

    let next = nodes[0]
    if (pinned.current !== null) {
      next = nodes[pinned.current] ?? next
    } else {
      // Sweep the reading line toward the article's end, so short final sections
      // remain reachable even when the browser cannot align them at the top.
      const remaining = Math.max(0, articleTop + articleHeight - viewHeight - scrollTop)
      const line = Math.min(offset, scrollTop)
      const anchor = scrollTop + line + Math.max(0, viewHeight - line - remaining)
      let index = -1
      for (let i = 0; i < tops.length; i++) {
        if (tops[i] <= anchor) index = i
        else break
      }
      if (index === nodes.length - 1) next = nodes[index]
      else if (index >= 0) {
        const span = tops[index + 1] - tops[index]
        const progress = span > 0 ? Math.min(1, Math.max(0, (anchor - tops[index]) / span)) : 0
        next = nodes[index] + progress * (nodes[index + 1] - nodes[index])
      }
    }

    target.set(next)
    if (!placed.current) {
      placed.current = true
      travel.jump(next)
      pose(next)
      turn.jump(heading.get())
    }
  }, [offset, target, travel, pose, turn, heading])

  useIsoLayoutEffect(() => {
    const list = listRef.current
    const article = document.querySelector<HTMLElement>("article")
    if (!list || !article || !items.length) return
    const articleMain = article.closest(".article-reading__main") ?? article
    const details = list.closest("details")
    let frame = 0
    let disposed = false
    placed.current = false
    pinned.current = null

    const measure = () => {
      frame = 0
      if (disposed) return
      visible.current = list.offsetHeight > 0
      if (!visible.current) return

      const scrollTop = window.scrollY
      // Cache document positions on layout changes, not on every scroll tick.
      // Lazy images and deferred code blocks can change them during reading.
      page.current = {
        tops: items.map((item) => {
          const element = document.getElementById(item.id)
          return element ? element.getBoundingClientRect().top + scrollTop : Infinity
        }),
        articleTop: article.getBoundingClientRect().top + scrollTop,
        articleHeight: article.offsetHeight,
        viewHeight: window.innerHeight,
      }
      const nodes = items.map((item, i) => {
        const row = rowRefs.current[i]
        return { x: RAIL_X + (item.depth ?? 0) * indent, y: row ? row.offsetTop + row.offsetHeight / 2 : 0 }
      })
      const nextGeometry = {
        nodes,
        d: buildPath(nodes),
        width: Math.max(...nodes.map((node) => node.x)) + RAIL_X + 4,
        height: list.offsetHeight,
      }
      setGeometry((previous) => previous?.d === nextGeometry.d && previous.height === nextGeometry.height ? previous : nextGeometry)
      sync()
    }
    const scheduleMeasure = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    const observer = new ResizeObserver(scheduleMeasure)
    observer.observe(list)
    observer.observe(articleMain)
    articleMain.addEventListener("load", scheduleMeasure, true)
    details?.addEventListener("toggle", scheduleMeasure)
    window.addEventListener("resize", scheduleMeasure, { passive: true })
    document.fonts?.ready.then(() => { if (!disposed) scheduleMeasure() }).catch(() => {})
    return () => {
      disposed = true
      observer.disconnect()
      articleMain.removeEventListener("load", scheduleMeasure, true)
      details?.removeEventListener("toggle", scheduleMeasure)
      window.removeEventListener("resize", scheduleMeasure)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [items, indent, sync])

  useIsoLayoutEffect(() => {
    const path = pathRef.current
    if (!path || !geometry) return
    total.current = path.getTotalLength()
    lengths.current = geometry.nodes.map((node) => lengthAtY(path, total.current, node.y))
    sync()
    pose(distance.get())
  }, [geometry, sync, pose, distance])

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; sync() })
    }
    const onIntent = (event: Event) => {
      if (event instanceof KeyboardEvent) {
        if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) return
      } else if (navRef.current?.contains(event.target as Node)) return
      pinned.current = null
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("wheel", onIntent, { passive: true })
    window.addEventListener("touchstart", onIntent, { passive: true })
    window.addEventListener("pointerdown", onIntent)
    window.addEventListener("keydown", onIntent)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("wheel", onIntent)
      window.removeEventListener("touchstart", onIntent)
      window.removeEventListener("pointerdown", onIntent)
      window.removeEventListener("keydown", onIntent)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sync])

  const active = Math.max(0, reached - 1)

  useEffect(() => {
    if (!autoScroll) return
    const timer = window.setTimeout(() => {
      const scroller = scrollerRef.current
      const row = rowRefs.current[active]
      if (!scroller?.clientHeight || !row) return
      const containerRect = scroller.getBoundingClientRect()
      const rowRect = row.getBoundingClientRect()
      if (rowRect.top < containerRect.top + 12 || rowRect.bottom > containerRect.bottom - 12) {
        scroller.scrollTo({
          top: scroller.scrollTop + rowRect.top - containerRect.top - (scroller.clientHeight - rowRect.height) / 2,
          behavior: reduceMotion ? "auto" : "smooth",
        })
      }
    }, 90)
    return () => window.clearTimeout(timer)
  }, [active, autoScroll, reduceMotion])

  const select = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const element = document.getElementById(items[index].id)
    if (!element) return
    event.preventDefault()
    pinned.current = index
    sync()
    window.history.replaceState(window.history.state, "", `#${encodeURIComponent(items[index].id)}`)
    window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - offset, behavior: reduceMotion ? "auto" : "smooth" })
  }

  return (
    <nav ref={navRef} data-slot="rail-toc" aria-label="本页目录" className="toc-nav rail-toc">
      {showHeader ? (
        <div className="toc-nav__header">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M2 4h12M2 8h8M2 12h10" />
          </svg>
          本页目录
        </div>
      ) : null}
      <div ref={scrollerRef} className="toc-nav__scroller toc-scrollbar">
        <div className="rail-toc__body">
          {geometry ? (
            <>
              <svg className="rail-toc__track" width={geometry.width} height={geometry.height} aria-hidden="true">
                <defs>
                  <linearGradient id={`${maskId}-fade`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={Math.max(1, geometry.nodes[0].y - 4)}>
                    <stop offset="0" stopColor="black" />
                    <stop offset="1" stopColor="white" />
                  </linearGradient>
                  <mask id={maskId} maskUnits="userSpaceOnUse" x="-8" y="-8" width={geometry.width + 16} height={geometry.height + 16}>
                    <rect x="-8" y="-8" width={geometry.width + 16} height={geometry.height + 16} fill={`url(#${maskId}-fade)`} />
                    {geometry.nodes.map((node, i) => <circle key={items[i]?.id ?? i} cx={node.x} cy={node.y} r="4" fill="black" />)}
                    <circle ref={(element) => { holeRefs.current[0] = element }} r="4" fill="black" />
                  </mask>
                  <mask id={`${maskId}-nodes`} maskUnits="userSpaceOnUse" x="-8" y="-8" width={geometry.width + 16} height={geometry.height + 16}>
                    <rect x="-8" y="-8" width={geometry.width + 16} height={geometry.height + 16} fill="white" />
                    <circle ref={(element) => { holeRefs.current[1] = element }} r="4" fill="black" />
                  </mask>
                </defs>
                <g mask={`url(#${maskId})`}>
                  <path ref={pathRef} d={geometry.d} fill="none" strokeWidth="1.25" strokeDasharray="2 5" strokeLinecap="round" strokeLinejoin="round" className="rail-toc__trail" />
                  <motion.path d={geometry.d} fill="none" strokeWidth="1.4" stroke="var(--rail)" strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: filled }} />
                </g>
                <g mask={`url(#${maskId}-nodes)`}>
                  {geometry.nodes.map((node, i) => (
                    <circle key={items[i]?.id ?? i} cx={node.x} cy={node.y} r={i < reached ? 3 : 3.25} strokeWidth="1.25" className={cn("rail-toc__node", i < reached && "is-covered")} />
                  ))}
                </g>
              </svg>
              <motion.div data-slot="rail-toc-plane" className="rail-toc__plane" style={{ x, y, rotate: reduceMotion ? heading : turn }} aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d={PLANE} fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>
              </motion.div>
            </>
          ) : null}
          <ul ref={listRef} className="toc-nav__list">
            {items.map((item, index) => (
              <li key={item.id} className={cn("toc-nav__item", !item.depth && "toc-nav__item--section")} ref={(element) => { rowRefs.current[index] = element }}>
                <a href={`#${encodeURIComponent(item.id)}`} onClick={(event) => select(event, index)} aria-current={index === active ? "location" : undefined}
                  className={cn("toc-nav__link", (item.depth ?? 0) > 0 && "toc-nav__link--nested", index === active && "is-active")}
                  style={{ paddingLeft: RAIL_X + (item.depth ?? 0) * indent + LABEL_GAP }}>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="toc-nav__progress" aria-label={`已阅读 ${readPercent}%`}>
        <span>阅读进度</span><strong>{readPercent}%</strong>
      </div>
    </nav>
  )
}
