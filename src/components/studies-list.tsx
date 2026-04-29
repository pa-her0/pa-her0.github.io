"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { Study } from "@/data/studies"
import { StatusMark } from "@/components/studies-shared"

type Mode = "index" | "timeline"

const MODE_KEY = "studies.mode"

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-primary text-[18px] font-medium font-serif tabular-nums" style={{ letterSpacing: 0.5 }}>
        {n}
      </span>
      <span className="text-muted-foreground text-[12px] font-serif">{label}</span>
    </div>
  )
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const btn = (key: Mode, label: string, icon: React.ReactNode) => {
    const on = mode === key
    return (
      <button
        type="button"
        onClick={() => onChange(key)}
        aria-pressed={on}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] transition-all border-0 cursor-pointer",
          on ? "bg-foreground text-background font-medium" : "text-muted-foreground hover:text-foreground bg-transparent",
        )}
        style={{ letterSpacing: 0.3 }}
      >
        {icon}
        {label}
      </button>
    )
  }
  return (
    <div className="inline-flex items-center gap-0.5 p-[3px] rounded-full bg-muted border border-border" role="group" aria-label="视图模式">
      {btn(
        "index",
        "索引",
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M3 4h10M3 8h10M3 12h7" />
        </svg>,
      )}
      {btn(
        "timeline",
        "时间轴",
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="3" cy="8" r="1.5" fill="currentColor" />
          <circle cx="9" cy="8" r="1.5" />
          <circle cx="13.5" cy="8" r="1.2" />
          <path d="M2 8h12" />
        </svg>,
      )}
    </div>
  )
}

function summarizeCounts(counts: Study["counts"]): string {
  return Object.entries(counts)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([t, n]) => `${n}${t}`)
    .join(" / ")
}

function detailHref(study: Study): string {
  return `/studies/${study.id}/`
}

function IndexItem({ study }: { study: Study }) {
  const summary = summarizeCounts(study.counts)
  return (
    <li>
      <a
        href={detailHref(study)}
        className="studies-link grid items-baseline gap-4 py-3.5 border-b border-border/50 cursor-pointer no-underline text-inherit focus-visible:outline-none focus-visible:bg-muted/40 rounded-sm"
        style={{ gridTemplateColumns: "44px 1fr auto" }}
      >
        <span
          className="font-serif text-[14px] italic text-right text-muted-foreground/70"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {study.no}.
        </span>
        <div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="studies-link-title font-serif text-[16px] font-semibold text-foreground">
              {study.title}
            </span>
            {summary && (
              <span className="font-serif text-[12px] italic text-muted-foreground">（{summary}）</span>
            )}
          </div>
          <div className="font-serif text-[12.5px] text-muted-foreground leading-[1.6] mt-1 max-w-[480px]">
            {study.epigraph}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 study-meta-right">
          <StatusMark status={study.status} />
          <span className="font-mono text-[10.5px] text-muted-foreground/70">{study.updated}</span>
        </div>
      </a>
    </li>
  )
}

function IndexView({ studies }: { studies: Study[] }) {
  const sorted = useMemo(() => [...studies].sort((a, b) => a.no.localeCompare(b.no)), [studies])
  return (
    <div className="studies-cross-fade mx-auto" style={{ maxWidth: 720 }}>
      <p className="font-serif text-[14.5px] text-muted-foreground leading-[1.85] mb-10 max-w-[580px]">
        下面是当前正在做的几个课题，按编号排列。括号里是各类型资源数量；右侧为状态与最近更新。点击进入详情。
      </p>
      <ol className="list-none p-0 m-0">
        {sorted.map((s) => (
          <IndexItem key={s.id} study={s} />
        ))}
      </ol>
      <div
        className="mt-14 pt-[22px] font-serif text-[12px] text-muted-foreground leading-[1.8]"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <span className="italic" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
          注：
        </span>
        专题不追求结论；一个课题搁置了，并不意味着它失败。
      </div>
    </div>
  )
}

function parseMonth(s: string): number {
  const [y, m] = s.replace(/\s/g, "").split("·").map(Number)
  return y * 12 + m
}

type Placed = { study: Study; xPx: number; xRatio: number; side: "above" | "below"; lane: number }

const CARD_W = 250 // 220 visual + 28 padding + 2 buffer
const CARD_H = 132
const LANE_GAP = 14
const SAFE_INSET = 130 // half-card + gutter, keeps edge cards from overflowing

function TimelineView({ studies }: { studies: Study[] }) {
  const sorted = useMemo(
    () => [...studies].sort((a, b) => parseMonth(a.started) - parseMonth(b.started)),
    [studies],
  )

  const positions = useMemo(() => sorted.map((s) => parseMonth(s.started)), [sorted])
  const minP = Math.min(...positions) - 1
  const maxP = Math.max(...positions) + 1
  const range = Math.max(1, maxP - minP)

  const yearMarks: { p: number; y: number; m: number }[] = []
  for (let p = minP; p <= maxP; p++) {
    const m = p % 12 === 0 ? 12 : p % 12
    const y = Math.floor((p - 1) / 12)
    if (m === 1 || m === 7) yearMarks.push({ p, y, m })
  }

  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(1100)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let raf = 0
    let lastW = -1
    const ro = new ResizeObserver((entries) => {
      const w = Math.round(entries[0]?.contentRect.width ?? 0)
      if (w === lastW) return
      lastW = w
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        setWidth(lastW)
      })
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Usable x range (inset on both ends so edge cards don't overflow)
  const usable = Math.max(1, width - SAFE_INSET * 2)

  const positionFor = (p: number): { px: number; pct: number } => {
    const ratio = (p - minP) / range
    const px = SAFE_INSET + ratio * usable
    return { px, pct: (px / Math.max(1, width)) * 100 }
  }

  const placed: Placed[] = useMemo(() => {
    const items = sorted.map((s) => {
      const ratio = (parseMonth(s.started) - minP) / range
      const xPx = SAFE_INSET + ratio * usable
      return { study: s, xPx, xRatio: ratio }
    })
    const lanes: { above: number[]; below: number[] } = { above: [], below: [] }
    return items.map((it, i) => {
      const tryPlace = (side: "above" | "below"): number => {
        const sideLanes = lanes[side]
        for (let l = 0; l < sideLanes.length; l++) {
          if (it.xPx - sideLanes[l] >= CARD_W) {
            sideLanes[l] = it.xPx
            return l
          }
        }
        sideLanes.push(it.xPx)
        return sideLanes.length - 1
      }
      const preferred: "above" | "below" = i % 2 === 0 ? "above" : "below"
      const other: "above" | "below" = preferred === "above" ? "below" : "above"
      const preferLastX = lanes[preferred].length ? Math.max(...lanes[preferred]) : -Infinity
      const otherLastX = lanes[other].length ? Math.max(...lanes[other]) : -Infinity
      const side: "above" | "below" =
        it.xPx - preferLastX < CARD_W && it.xPx - otherLastX >= CARD_W ? other : preferred
      const lane = tryPlace(side)
      return { ...it, side, lane }
    })
  }, [sorted, usable, minP, range])

  const lanesAbove = Math.max(1, ...placed.map((p) => (p.side === "above" ? p.lane + 1 : 0)))
  const lanesBelow = Math.max(1, ...placed.map((p) => (p.side === "below" ? p.lane + 1 : 0)))
  const padTop = 32 + lanesAbove * (CARD_H + LANE_GAP)
  const padBottom = 32 + lanesBelow * (CARD_H + LANE_GAP)

  return (
    <div className="studies-cross-fade mx-auto" style={{ maxWidth: 1100 }}>
      <p className="font-serif text-[14.5px] text-muted-foreground leading-[1.85] mb-6 max-w-[580px]">
        按开题时间排列。一个课题的"开始"，往往比它的"结束"更值得记。
      </p>
      <div
        ref={containerRef}
        className="relative"
        style={{ paddingTop: padTop, paddingBottom: padBottom, marginInline: 12 }}
      >
        <div
          className="absolute h-px bg-border"
          style={{ top: padTop, left: SAFE_INSET, right: SAFE_INSET }}
        />
        {yearMarks.map((mk) => {
          const { pct } = positionFor(mk.p)
          return (
            <div
              key={mk.p}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, top: padTop, transform: "translate(-50%, 0)" }}
            >
              <div className="bg-border" style={{ width: 1, height: 6, marginTop: -3 }} />
              <div className="mt-1.5 font-mono text-[10px] text-muted-foreground/80" style={{ letterSpacing: 0.5 }}>
                {mk.y}·{String(mk.m).padStart(2, "0")}
              </div>
            </div>
          )
        })}
        {placed.map((p) => (
          <TimelineNode
            key={p.study.id}
            study={p.study}
            xPct={(p.xPx / Math.max(1, width)) * 100}
            side={p.side}
            lane={p.lane}
            axisTop={padTop}
            laneStep={CARD_H + LANE_GAP}
          />
        ))}
      </div>
    </div>
  )
}

function TimelineNode({
  study,
  xPct,
  side,
  lane,
  axisTop,
  laneStep,
}: {
  study: Study
  xPct: number
  side: "above" | "below"
  lane: number
  axisTop: number
  laneStep: number
}) {
  const [hover, setHover] = useState(false)
  const above = side === "above"
  const stemLen = 24 + lane * laneStep
  const cardTop = above ? -(stemLen + 108) : stemLen
  const isActive = study.status === "在读"
  return (
    <a
      href={detailHref(study)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="absolute cursor-pointer no-underline text-inherit focus-visible:outline-none"
      style={{ left: `${xPct}%`, top: axisTop, transform: "translateX(-50%)" }}
    >
      {/* dot on axis */}
      <div
        className="absolute rounded-full transition-all"
        style={{
          left: "50%",
          top: 0,
          transform: "translate(-50%, -50%)",
          width: isActive ? 10 : 7,
          height: isActive ? 10 : 7,
          background: isActive ? "var(--primary)" : "var(--background)",
          border: `1.5px solid ${isActive ? "var(--primary)" : "var(--muted-foreground)"}`,
          zIndex: 2,
          boxShadow: hover ? "0 0 0 4px color-mix(in oklab, var(--foreground), transparent 95%)" : "none",
        }}
      />
      {/* stem */}
      <div
        className="absolute bg-border"
        style={{ left: "50%", top: above ? -stemLen : 0, width: 1, height: stemLen }}
      />
      {/* card */}
      <div
        className="absolute transition-colors"
        style={{
          left: "50%",
          top: cardTop,
          transform: "translateX(-50%)",
          width: 220,
          padding: "12px 14px",
          background: hover ? "color-mix(in oklab, var(--muted), transparent 30%)" : "transparent",
          borderLeft: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] italic text-muted-foreground/80"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
          >
            № {study.no} · {study.field}
          </span>
        </div>
        <h3 className="font-serif text-[15px] font-semibold text-foreground m-0 mb-1.5 leading-[1.35]">
          {study.title}
        </h3>
        <div className="text-[11px] text-muted-foreground font-serif italic leading-[1.5] mb-2">
          {study.epigraph}
        </div>
        <div className="flex justify-between items-center text-[10.5px] text-muted-foreground font-mono">
          <span>{study.started.replace(/\s/g, "")}</span>
          <StatusMark status={study.status} />
        </div>
      </div>
    </a>
  )
}

export function StudiesList({ studies }: { studies: Study[] }) {
  const [mode, setMode] = useState<Mode>("index")
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const saved = localStorage.getItem(MODE_KEY) as Mode | null
    if (saved === "index" || saved === "timeline") setMode(saved)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(MODE_KEY, mode)
  }, [hydrated, mode])

  const total = studies.length
  const inProgress = studies.filter((s) => s.status === "在读").length
  const totalResources = studies.reduce(
    (acc, s) => acc + Object.values(s.counts).reduce((a, b) => a + (b ?? 0), 0),
    0,
  )

  return (
    <div className="font-sans text-foreground">
      <main className="mx-auto" style={{ maxWidth: 1180, padding: "56px 64px 0" }}>
        {/* 标题 + 模式切换 */}
        <div className="flex items-end justify-between gap-6 flex-wrap mb-3.5 studies-header-row">
          <div>
            <div className="flex items-stretch gap-3.5">
              <div className="rounded-sm bg-primary" style={{ width: 3 }} />
              <div>
                <div
                  className="text-[11px] text-muted-foreground font-normal mb-2 uppercase"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
                >
                  Studies
                </div>
                <div
                  className="font-serif font-bold text-foreground"
                  style={{ fontSize: 40, letterSpacing: "-0.01em", lineHeight: 1 }}
                >
                  专题
                </div>
              </div>
            </div>
          </div>
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>
        <div
          className="font-serif text-[15px] text-muted-foreground leading-[1.7] mb-8"
          style={{ marginLeft: 17, maxWidth: 600 }}
        >
          正在做的功课。每个专题聚合一组围绕同一问题的阅读、观看与笔记。
        </div>

        {/* 元数据条 */}
        <div className="flex items-baseline gap-8 pb-[22px] mb-9 border-b border-border">
          <Stat n={total} label="个专题" />
          <Stat n={inProgress} label="在读" />
          <Stat n={totalResources} label="件资源" />
          <span
            className="ml-auto text-[11px] text-muted-foreground/80 italic uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
          >
            {mode === "index" ? "By Index" : "By Chronology"}
          </span>
        </div>

        {mode === "index" ? <IndexView studies={studies} /> : <TimelineView studies={studies} />}

        {/* 末尾 */}
        <div
          className="font-serif text-[13px] text-muted-foreground leading-[1.8] text-center"
          style={{ marginTop: 72, paddingTop: 22, borderTop: "1px solid var(--border)" }}
        >
          <div
            className="text-[11px] text-muted-foreground/80 mb-2.5 uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
          >
            Colophon
          </div>
          专题不追求结论。一个课题搁置了，并不意味着它失败——
          <br />
          也许只是时机未到。
        </div>
      </main>
    </div>
  )
}
