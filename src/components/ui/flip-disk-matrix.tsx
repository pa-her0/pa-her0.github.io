"use client"

import { memo, useEffect, useRef, useState } from "react"
import { glyphBitmap } from "@/lib/flip-disk-glyph"
import { homeDashboard } from "@/data/home-dashboard"
import "@/styles/flip-disk-matrix.css"

const MODES = ["time", "text", "wave", "noise"] as const
const COLS = 31
const ROWS = 9
type Mode = typeof MODES[number]
const Disk = memo(function Disk({ on }: { on: boolean }) {
  return <span className="flip-disk" data-on={on}>
    <span className="flip-disk-rotor">
      <span className="flip-disk-front" />
      <span className="flip-disk-back" />
    </span>
  </span>
})

export function FlipDiskMatrix({ latestPost }: { latestPost?: { href: string; title: string } }) {
  const root = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>(homeDashboard.flipMatrix.defaultMode)
  const text = homeDashboard.flipMatrix.text.toUpperCase().replace(/[^A-Z0-9: ]/g, "").slice(0, 5)
  const [clock, setClock] = useState("")
  // Configured text is safe to render on the server; local time is read after mount.
  const [bits, setBits] = useState(() => glyphBitmap(mode === "text" ? text : "", COLS, ROWS))

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let timer: ReturnType<typeof setTimeout> | undefined
    let inView = true
    let stopped = false
    const animated = mode === "wave" || mode === "noise"
    const tick = () => {
      if (stopped || document.hidden || !inView) return
      const t = performance.now() / 1000
      const display = mode === "time" ? new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }) : text
      if (mode === "time") setClock(display)
      const next = mode === "time" || mode === "text" ? glyphBitmap(display, COLS, ROWS)
        : Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) =>
          mode === "wave" ? Math.sin(x * .2 + t * 3) * Math.cos(y * .3 + t * 2) > .2 : Math.random() > .6))
      setBits(prev => next.some((row, y) => row.some((cell, x) => cell !== prev[y][x])) ? next : prev)
      if (mode !== "text" && !(animated && reduced.matches)) {
        timer = setTimeout(tick, mode === "wave" ? 150 : mode === "noise" ? 250 : 1000)
      }
    }
    const restart = () => { clearTimeout(timer); tick() }
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; restart() })
    if (root.current) observer.observe(root.current)
    document.addEventListener("visibilitychange", restart)
    reduced.addEventListener("change", restart)
    tick()
    return () => {
      stopped = true
      clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener("visibilitychange", restart)
      reduced.removeEventListener("change", restart)
    }
  }, [mode, text])

  const label = mode === "time" ? `当前本地时间 ${clock || "加载中"}` : mode === "text" ? `点阵文字 ${text || "空白"}` : mode === "wave" ? "波浪翻盘点阵" : "随机翻盘点阵"
  return <div className="flip-matrix" ref={root}>
    <div className="flip-matrix-toolbar">
      <div className="flip-matrix-modes" role="group" aria-label="点阵显示模式">
        {MODES.map(m => <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>)}
      </div>
    </div>
    <div className="flip-matrix-display">
      <div className="flip-matrix-bezel" role="img" aria-label={label}>
        <div className="flip-matrix-grid" aria-hidden="true">
          {bits.flatMap((row, y) => row.map((on, x) => <Disk key={`${x}-${y}`} on={on} />))}
        </div>
      </div>
    </div>
    <div className="flip-matrix-caption">
      {latestPost ? <a href={latestPost.href} title={latestPost.title}>Latest note · {latestPost.title} ↗</a> : <span>Electromechanical Clock</span>}
    </div>
  </div>
}
