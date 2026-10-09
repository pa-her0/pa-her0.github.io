"use client"

import { ArrowUp, Pause, Play, RotateCcw, Trophy } from "lucide-react"
import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { createRunner, jumpRunner, pauseRunner, readRunnerBest, stepRunner, type RunnerPhase } from "@/lib/dino-runner"
import { paintRunner } from "@/lib/dino-renderer"
import "@/styles/dino-runner.css"

const BEST_KEY = "jiely-dino-best-v1"
type Controls = { jump: () => void; pause: () => void; reset: () => void; duck: (down: boolean) => void }
type Scoreboard = { phase: RunnerPhase; score: number; best: number; hits: number }

function formatScore(score: number) {
  return `${score < 0 ? "−" : ""}${String(Math.abs(score)).padStart(5, "0")}`
}

export function DinoRunner() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<Controls | null>(null)
  const [ready, setReady] = useState(false)
  const [board, setBoard] = useState<Scoreboard>({ phase: "idle", score: 0, best: 0, hits: 0 })

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!root || !canvas || !context) return

    let state = createRunner()
    let best = 0
    let savedBest = 0
    let frame = 0
    let lastTime = 0
    let lastPublish = 0
    let width = 900
    let height = 280
    let inView = true
    try { best = savedBest = readRunnerBest(localStorage.getItem(BEST_KEY)) } catch { /* Play also works without storage. */ }
    const styles = getComputedStyle(root)
    const palette = {
      ink: styles.getPropertyValue("--home-ink").trim() || "#2b333e",
      accent: styles.getPropertyValue("--home-accent").trim() || "#6c63ff",
      muted: styles.getPropertyValue("--home-muted").trim() || "#716f80",
      paper: styles.getPropertyValue("--home-bg").trim() || "#fafbfc",
    }
    const paint = () => paintRunner(context, state, width, height, palette)
    const persistBest = () => {
      if (best <= savedBest) return
      try { localStorage.setItem(BEST_KEY, String(best)); savedBest = best } catch { /* Keep the in-memory record. */ }
    }
    const publish = () => {
      best = Math.max(best, state.score)
      const next = { phase: state.phase, score: state.score, best, hits: state.hits }
      setBoard((previous) => previous.phase === next.phase && previous.score === next.score
        && previous.best === next.best && previous.hits === next.hits ? previous : next)
      if (best - savedBest >= 10) persistBest()
    }
    const tick = (time: number) => {
      frame = 0
      if (state.phase !== "running") return
      const dt = lastTime ? (time - lastTime) / 1000 : 0
      lastTime = time
      const previousHits = state.hits
      stepRunner(state, dt, width)
      best = Math.max(best, state.score)
      paint()
      if (time - lastPublish > 100 || state.hits !== previousHits) {
        lastPublish = time
        publish()
      }
      frame = requestAnimationFrame(tick)
    }
    const pause = () => {
      pauseRunner(state)
      cancelAnimationFrame(frame)
      frame = lastTime = 0
      publish()
      persistBest()
      paint()
    }
    const jump = () => {
      if (document.hidden || !inView) return
      jumpRunner(state)
      publish()
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const reset = () => {
      pause()
      state = createRunner()
      publish()
      paint()
    }
    controlsRef.current = { jump, pause, reset, duck: (down) => { state.ducking = down } }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      if (bounds.width <= 0 || bounds.height <= 0) return
      // Keep a comfortable reaction distance on phones without shrinking the whole page.
      const scale = Math.min(1.25, bounds.width / 560)
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      width = bounds.width / scale
      height = bounds.height / scale
      canvas.width = Math.round(bounds.width * ratio)
      canvas.height = Math.round(bounds.height * ratio)
      context.setTransform(ratio * scale, 0, 0, ratio * scale, 0, 0)
      paint()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.2
      if (!inView) pause()
    }, { threshold: [0, 0.2] })
    intersectionObserver.observe(canvas)
    const onVisibility = () => { if (document.hidden) pause() }
    const onBlur = () => pause()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("blur", onBlur)
    resize()
    publish()
    setReady(true)
    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("blur", onBlur)
      persistBest()
      controlsRef.current = null
    }
  }, [])

  const jump = () => {
    canvasRef.current?.focus({ preventScroll: true })
    controlsRef.current?.jump()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (["Space", "ArrowUp", "Enter"].includes(event.code)) {
      event.preventDefault()
      if (!event.repeat) controlsRef.current?.jump()
    } else if (event.code === "ArrowDown") {
      event.preventDefault()
      controlsRef.current?.duck(true)
    } else if (event.code === "Escape" || event.code === "KeyP") {
      event.preventDefault()
      controlsRef.current?.pause()
    }
  }

  return (
    <div ref={rootRef} className="dino-runner" data-phase={board.phase}>
      <div className="dino-runner__header">
        <div className="dino-runner__name"><span aria-hidden="true" />无尽漫游</div>
        <div className="dino-runner__scoreboard" aria-label="游戏计分">
          <span className="dino-runner__best" role="group" aria-label={`本机最高分 ${board.best}`} title="保存在这台设备上的最高分">
            <Trophy size={13} aria-hidden="true" /><span>最佳</span><strong>{formatScore(board.best)}</strong>
          </span>
          <span className="dino-runner__score" role="group" aria-label={`当前得分 ${board.score}`}><span>得分</span><strong>{formatScore(board.score)}</strong></span>
          <div className="dino-runner__actions">
            <button type="button" disabled={!ready || board.phase === "idle"} onClick={board.phase === "running" ? () => controlsRef.current?.pause() : jump} aria-label={board.phase === "running" ? "暂停游戏" : "继续游戏"} title={board.phase === "running" ? "暂停（P）" : "继续"}>
              {board.phase === "running" ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
            </button>
            <button type="button" disabled={!ready || board.phase === "idle"} onClick={() => controlsRef.current?.reset()} aria-label="重新开始游戏" title="重新开始"><RotateCcw size={15} aria-hidden="true" /></button>
          </div>
        </div>
      </div>
      <div className="dino-runner__scene">
        <canvas ref={canvasRef} className="dino-runner__canvas" tabIndex={0} role="button" aria-label="恐龙跑道，点按或按空格跳跃" aria-describedby="dino-instructions"
          onClick={jump} onKeyDown={onKeyDown}
          onKeyUp={(event) => { if (event.code === "ArrowDown") { event.preventDefault(); controlsRef.current?.duck(false) } }}
          onBlur={() => controlsRef.current?.duck(false)}>
          恐龙漫游：空格或上方向键跳跃，下方向键俯身。碰到障碍扣 10 分，奔跑继续。
        </canvas>
        {board.phase !== "running" ? (
          <div className="dino-runner__invitation">
            <p>{board.phase === "idle" ? "在这里，慢慢向前。" : "歇一会儿，也没关系。"}</p>
            <button type="button" disabled={!ready} onClick={jump} className="dino-runner__start">
              <Play size={14} fill="currentColor" aria-hidden="true" />{board.phase === "idle" ? "跑一会儿" : "继续奔跑"}
            </button>
          </div>
        ) : null}
      </div>
      <div className="dino-runner__footer" id="dino-instructions">
        <div className="dino-runner__keys"><span><kbd>空格</kbd> / <kbd>↑</kbd> 跳跃</span><span><kbd>↓</kbd> 俯身</span></div>
        <button type="button" disabled={!ready} className="dino-runner__touch" onClick={jump}><ArrowUp size={16} aria-hidden="true" />点按跳跃</button>
        <span className="dino-runner__rule">碰到障碍 <b>−10</b><i aria-hidden="true">·</i>奔跑继续</span>
      </div>
      <span className="sr-only" role="status">{board.phase === "paused" ? "游戏已暂停，可以继续奔跑。" : board.hits ? `已碰到 ${board.hits} 次障碍，每次扣 10 分，奔跑继续。` : ""}</span>
    </div>
  )
}
