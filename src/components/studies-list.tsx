"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { StudyData as Study } from "@/lib/studies"
import { StatusMark } from "@/components/studies-shared"

type Mode = "index" | "timeline"

const MODE_KEY = "studies.mode"

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-primary text-[18px] font-medium font-serif tabular-nums" style={{ letterSpacing: 0.5 }}>
        {n}
      </span>
      <span className="text-muted-foreground text-[12px] font-serif-cn whitespace-nowrap">{label}</span>
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

function totalCount(counts: Study["counts"]): number {
  return Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)
}

function detailHref(study: Study): string {
  return `/studies/${study.id}/`
}

function IndexItem({ study }: { study: Study }) {
  const total = totalCount(study.counts)
  return (
    <li className="border-b border-border/50 last:border-b-0">
      <a
        href={detailHref(study)}
        className="studies-link studies-index-item grid items-baseline grid-cols-[28px_1fr] gap-x-2.5 gap-y-1.5 md:grid-cols-[44px_1fr_auto] md:gap-x-4 md:gap-y-0 py-3.5 cursor-pointer no-underline text-inherit focus-visible:outline-none focus-visible:bg-muted/40 rounded-sm"
      >
        <span
          className="font-serif-cn text-[14px] italic text-right text-muted-foreground/70"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {study.no}.
        </span>
        <div>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="studies-link-title font-serif-cn text-[16px] font-semibold text-foreground">
              {study.title}
            </span>
            {total > 0 && (
              <span className="font-serif-cn text-[12.5px] text-muted-foreground/70">
                <span className="mr-1.5">·</span>
                {total} 件
              </span>
            )}
          </div>
          <div className="font-serif-cn text-[12.5px] text-muted-foreground leading-[1.6] mt-1 max-w-[480px]">
            {study.epigraph}
          </div>
        </div>
        <div className="flex flex-row items-center gap-2.5 col-start-2 row-start-2 md:flex-col md:items-end md:gap-1 md:col-start-3 md:row-start-1 study-meta-right">
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
      <ol className="list-none p-0 m-0">
        {sorted.map((s) => (
          <IndexItem key={s.id} study={s} />
        ))}
      </ol>
    </div>
  )
}

function parseMonth(s: string): number {
  const [y, m] = s.replace(/\s/g, "").split("·").map(Number)
  return y * 12 + m
}

function toYearMonth(s: string): string {
  const parts = s.replace(/\s/g, "").split("·")
  return parts.slice(0, 2).join("·")
}

function todayMonth(): number {
  const d = new Date()
  return d.getFullYear() * 12 + (d.getMonth() + 1)
}

function endMonth(study: Study): number {
  const startP = parseMonth(study.started)
  if (study.status === "在读") return Math.max(startP, todayMonth())
  if (study.updated) return Math.max(startP, parseMonth(toYearMonth(study.updated)))
  return startP
}

function formatSpan(study: Study): string {
  const start = toYearMonth(study.started)
  const end = study.updated ? toYearMonth(study.updated) : start
  if (study.status === "在读") return `${start} → 至今`
  if (start === end) return start
  return `${start} → ${end}`
}

type Placed = {
  study: Study
  xStartPct: number
  xEndPct: number
  side: "above" | "below"
  lane: number
}

const CARD_H = 108
const LEFT_INSET = 56 // 卡片左边超出 dot 的宽度
const LANE_GAP = 14
const AXIS_PAD = 32
const MIN_GAP_PCT = 1.2 // 同一 lane/side 上两张卡之间至少留 1.2% 间隙

function TimelineView({ studies }: { studies: Study[] }) {
  const sorted = useMemo(
    () => [...studies].sort((a, b) => parseMonth(a.started) - parseMonth(b.started)),
    [studies],
  )

  const startPositions = sorted.map((s) => parseMonth(s.started))
  const endPositions = sorted.map((s) => endMonth(s))
  const minP = Math.min(...startPositions) - 1
  const maxP = Math.max(...endPositions) + 1
  const range = Math.max(1, maxP - minP)

  const positionFor = (p: number): number => ((p - minP) / range) * 100

  const yearMarks: { p: number; y: number; m: number }[] = []
  for (let p = minP; p <= maxP; p++) {
    const m = p % 12 === 0 ? 12 : p % 12
    const y = Math.floor((p - 1) / 12)
    if (m === 1 || m === 7) yearMarks.push({ p, y, m })
  }

  const placed: Placed[] = useMemo(() => {
    const items = sorted.map((s) => {
      const xStartPct = positionFor(parseMonth(s.started))
      const endP = s.status === "在读" ? maxP : endMonth(s)
      const xEndPct = positionFor(endP)
      return { study: s, xStartPct, xEndPct }
    })
    // 同 side 同 lane 内不允许时间区间重叠（按 [xStart, xEnd] 检测）
    const lanes: { above: number[][]; below: number[][] } = { above: [], below: [] }
    return items.map((it, i) => {
      const tryPlace = (side: "above" | "below"): number => {
        const sideLanes = lanes[side]
        for (let l = 0; l < sideLanes.length; l++) {
          const lastEnd = sideLanes[l][sideLanes[l].length - 1]
          if (it.xStartPct - lastEnd >= MIN_GAP_PCT) {
            sideLanes[l].push(it.xEndPct)
            return l
          }
        }
        sideLanes.push([it.xEndPct])
        return sideLanes.length - 1
      }
      const preferred: "above" | "below" = i % 2 === 0 ? "above" : "below"
      const other: "above" | "below" = preferred === "above" ? "below" : "above"
      const fits = (side: "above" | "below") =>
        lanes[side].some((ln) => it.xStartPct - ln[ln.length - 1] >= MIN_GAP_PCT) ||
        lanes[side].length === 0
      const side: "above" | "below" =
        fits(preferred) ? preferred : fits(other) ? other : preferred
      const lane = tryPlace(side)
      return { ...it, side, lane }
    })
  }, [sorted, minP, range])

  const lanesAbove = Math.max(1, ...placed.map((p) => (p.side === "above" ? p.lane + 1 : 0)))
  const lanesBelow = Math.max(1, ...placed.map((p) => (p.side === "below" ? p.lane + 1 : 0)))
  const padTop = AXIS_PAD + lanesAbove * (CARD_H + LANE_GAP)
  const padBottom = AXIS_PAD + lanesBelow * (CARD_H + LANE_GAP)

  // Force a comfortable timeline width so it horizontally scrolls instead of getting squished.
  // ~88px per month, with a sensible floor.
  const innerMinWidth = Math.max(720, range * 88)

  return (
    <div className="studies-cross-fade mx-auto" style={{ maxWidth: 1100, width: "100%" }}>
      <div
        className="studies-timeline-scroll"
        style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}
      >
      <div
        className="relative"
        style={{ paddingTop: padTop, paddingBottom: padBottom, marginInline: 12, minWidth: innerMinWidth, width: "calc(100% - 24px)" }}
      >
        <div
          className="absolute h-px bg-border"
          style={{ top: padTop, left: 0, right: 0 }}
        />
        {yearMarks.map((mk) => (
          <div
            key={mk.p}
            className="absolute flex flex-col items-center"
            style={{ left: `${positionFor(mk.p)}%`, top: padTop, transform: "translate(-50%, 0)" }}
          >
            <div className="bg-border" style={{ width: 1, height: 6, marginTop: -3 }} />
            <div className="mt-1.5 font-mono text-[10px] text-muted-foreground/80" style={{ letterSpacing: 0.5 }}>
              {mk.y}·{String(mk.m).padStart(2, "0")}
            </div>
          </div>
        ))}
        {placed.map((p) => (
          <TimelineNode
            key={p.study.id}
            study={p.study}
            xStartPct={p.xStartPct}
            xEndPct={p.xEndPct}
            side={p.side}
            lane={p.lane}
            axisTop={padTop}
            laneStep={CARD_H + LANE_GAP}
          />
        ))}
      </div>
      </div>
    </div>
  )
}

function TimelineNode({
  study,
  xStartPct,
  xEndPct,
  side,
  lane,
  axisTop,
  laneStep,
}: {
  study: Study
  xStartPct: number
  xEndPct: number
  side: "above" | "below"
  lane: number
  axisTop: number
  laneStep: number
}) {
  const [hover, setHover] = useState(false)
  const above = side === "above"
  const stemLen = 24 + lane * laneStep
  const cardTop = above ? -(stemLen + CARD_H) : stemLen
  const isActive = study.status === "在读"
  const widthPct = Math.max(0, xEndPct - xStartPct)
  return (
    <>
      {/* start dot on axis — positioned in timeline container coordinates */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          left: `${xStartPct}%`,
          top: axisTop,
          transform: "translate(-50%, -50%)",
          width: isActive ? 10 : 7,
          height: isActive ? 10 : 7,
          background: isActive ? "var(--primary)" : "var(--background)",
          border: `1.5px solid ${isActive ? "var(--primary)" : "var(--muted-foreground)"}`,
          zIndex: 3,
          boxShadow: hover ? "0 0 0 4px color-mix(in oklab, var(--foreground), transparent 95%)" : "none",
          transition: "box-shadow 0.2s",
        }}
      />
      {/* stem from axis dot to card's left edge */}
      <div
        className="absolute bg-border pointer-events-none"
        style={{
          left: `${xStartPct}%`,
          top: above ? axisTop - stemLen : axisTop,
          width: 1,
          height: stemLen,
        }}
      />
      {/* card — left edge sits 28px LEFT of xStart so the start dot lives inside the card */}
      <a
        href={detailHref(study)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className="absolute block no-underline text-inherit cursor-pointer focus-visible:outline-none"
        style={{
          left: `calc(${xStartPct}% - ${LEFT_INSET}px)`,
          width: `calc(${widthPct}% + ${LEFT_INSET}px)`,
          top: axisTop + cardTop,
          height: CARD_H,
          padding: "12px 18px 12px 16px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: hover
            ? "color-mix(in oklab, var(--muted), transparent 30%)"
            : "color-mix(in oklab, var(--card), transparent 40%)",
          border: "1px solid var(--border)",
          borderLeft: `2px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
          borderRadius: 2,
          boxSizing: "border-box",
          overflow: "hidden",
          transition: "background 0.2s",
        }}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] italic text-muted-foreground/80 whitespace-nowrap"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
          >
            № {study.no} · {study.field}
          </span>
        </div>
        <h3
          className="font-serif-cn text-[15px] font-semibold text-foreground m-0 mb-1.5 leading-[1.35]"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {study.title}
        </h3>
        <div
          className="text-[11px] text-muted-foreground font-serif-cn italic leading-[1.5] mb-2"
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {study.epigraph}
        </div>
        <div className="flex justify-between items-center text-[10.5px] text-muted-foreground font-mono">
          <span>{formatSpan(study)}</span>
          <StatusMark status={study.status} />
        </div>
      </a>
    </>
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
    <div className="font-sans text-foreground mx-auto w-full max-w-[1180px] px-5 pt-8 md:px-16 md:pt-14">
      <div>
        {/* 标题 + 模式切换 */}
        <div className="flex flex-col items-start gap-[18px] mb-3.5 md:flex-row md:items-end md:justify-between md:gap-6 md:flex-wrap">
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
                  className="font-serif-cn font-bold text-foreground"
                  style={{ fontSize: 40, letterSpacing: "-0.01em", lineHeight: 1 }}
                >
                  专题
                </div>
              </div>
            </div>
          </div>
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>
        <p
          className="font-serif-cn text-[15px] text-muted-foreground leading-[1.7] mb-3"
          style={{ marginLeft: 17 }}
        >
          一个问题最有趣的形态，是它还没有被完全回答的时候。
        </p>

        {/* 元数据条 */}
        <div className="flex items-baseline gap-x-6 gap-y-2 sm:gap-8 flex-wrap pb-[22px] mb-9 border-b border-border">
          <Stat n={total} label="个专题" />
          <Stat n={inProgress} label="在读" />
          <Stat n={totalResources} label="件资源" />
          <span
            className="hidden sm:inline-block ml-auto text-[11px] text-muted-foreground/80 italic uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
          >
            {mode === "index" ? "By Index" : "By Chronology"}
          </span>
        </div>

        {mode === "index" ? <IndexView studies={studies} /> : <TimelineView studies={studies} />}

        {/* 末尾 */}
        <div
          className="mx-auto font-serif-cn text-[13px] text-muted-foreground leading-[1.8] text-center"
          style={{ maxWidth: 720, marginTop: 72, paddingTop: 28, paddingBottom: 28, borderTop: "1px solid var(--border)" }}
        >
          <div
            className="text-[11px] text-muted-foreground/80 mb-2.5 uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
          >
            Colophon
          </div>
          专题不追求结论。一个课题搁置了，并不意味着它失败——也许只是时机未到。
        </div>
      </div>
    </div>
  )
}
