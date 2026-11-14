"use client"

import { memo, useEffect, useRef, useState } from "react"
import type { VoxelScene } from "@/lib/voxel-scene"
import { DINOSAUR_BRICKS, DINOSAUR_CENTER_X } from "@/data/voxel-dinosaur"
import { BRICK_PALETTE, brickVolumes, type BrickKind, type QuarterTurn } from "@/data/brick-kit"
import { BrickBackpack } from "@/components/ui/brick-backpack"

// Rendered before WebGL is ready, and retained when graphics are unavailable.
const VoxelBackdrop = memo(function VoxelBackdrop() {
  return (
    <svg className="voxel-playground__fallback" viewBox="0 0 1200 620" aria-hidden="true">
      <defs>
        <pattern id="voxel-grid" width="42" height="42" patternUnits="userSpaceOnUse">
          <path d="M42 0H0V42" fill="none" stroke="var(--home-line)" strokeWidth="1" />
        </pattern>
      </defs>
      <g transform="translate(600 280) rotate(-12) scale(1 .48) rotate(45)">
        <rect x="-420" y="-420" width="840" height="840" fill="url(#voxel-grid)" />
      </g>
      {DINOSAUR_BRICKS.flatMap((piece) => brickVolumes(piece).map((bounds) => ({ piece, bounds })))
        .sort((a, b) => a.bounds.minZ - b.bounds.minZ || a.bounds.minY - b.bounds.minY || a.bounds.minX - b.bounds.minX)
        .map(({ piece, bounds }, index) => {
        const width = bounds.maxX - bounds.minX, height = bounds.maxY - bounds.minY, depth = bounds.maxZ - bounds.minZ
        const x = 580 + (bounds.minX - DINOSAUR_CENTER_X) * 27 - bounds.minZ * 11
        const y = 505 - bounds.minY * 27 - bounds.minZ * 6
        const w = width * 27, h = height * 27, dx = depth * -11, dy = depth * -6
        return (
          <g key={index} transform={`translate(${x} ${y})`} fill={BRICK_PALETTE[piece.tone ?? "violet"]} stroke="var(--home-bg)" strokeWidth=".7">
            <path d={`M0 0H${w}V${-h}H0Z`} />
            <path d={`M0 ${-h}l${dx} ${dy}h${w}l${-dx} ${-dy}Z`} />
            <path d={`M0 ${-h}l${dx} ${dy}h${w}l${-dx} ${-dy}Z`} fill="white" fillOpacity=".2" />
            <path d={`M0 0l${dx} ${dy}v${-h}l${-dx} ${-dy}Z`} fill="black" fillOpacity=".1" />
            {piece.kind === "eye" && <><rect x="1" y={-h + 1} width={w - 2} height={h - 2} fill="#fff" /><rect x={w / 4} y={-h * 0.75} width={w / 2} height={h / 2} fill="#2c263d" /></>}
          </g>
        )
      })}
    </svg>
  )
})

export function VoxelPlayground() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<VoxelScene | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading")
  const [count, setCount] = useState(DINOSAUR_BRICKS.length)
  const [brush, setBrush] = useState<{ kind: BrickKind; turn: QuarterTurn }>({ kind: "cube", turn: 0 })
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false

    // Keep the renderer out of the initial React bundle and out of SSR.
    void import("@/lib/voxel-scene").then(({ createVoxelScene }) => {
      if (disposed) return
      const style = getComputedStyle(canvas)
      sceneRef.current = createVoxelScene(canvas, {
        background: style.getPropertyValue("--home-bg").trim(),
        accent: style.getPropertyValue("--home-accent").trim(),
        grid: style.getPropertyValue("--home-line").trim(),
        onChange: setCount,
        onBrushChange: (kind, turn) => setBrush({ kind, turn }),
        onFeedback: setFeedback,
      })
      setStatus("ready")
    }).catch((error: unknown) => {
      if (!disposed) {
        console.warn("The 3D playground could not start:", error)
        setStatus("fallback")
      }
    })

    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    sceneRef.current?.setBrush(brush.kind, brush.turn)
  }, [brush.kind, brush.turn, status])

  useEffect(() => {
    if (!feedback) return
    const timer = window.setTimeout(() => setFeedback(""), 2800)
    return () => window.clearTimeout(timer)
  }, [feedback])

  return (
    <div className="voxel-playground" data-status={status}>
      <VoxelBackdrop />
      <BrickBackpack
        kind={brush.kind}
        turn={brush.turn}
        disabled={status !== "ready"}
        onSelect={(kind) => setBrush((current) => ({ ...current, kind }))}
        onRotate={() => setBrush((current) => ({ ...current, turn: ((current.turn + 1) % 4) as QuarterTurn }))}
        onUndo={() => sceneRef.current?.undo()}
      />
      <div
        ref={canvasRef}
        className="voxel-playground__canvas"
        tabIndex={status === "ready" ? 0 : -1}
        role="application"
        aria-label="恐龙积木画布"
        aria-describedby="voxel-keyboard-instructions"
        aria-hidden={status === "fallback" ? true : undefined}
      />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{count} 块积木</span>
      <span className="voxel-playground__feedback" role="status" aria-live="polite" data-visible={Boolean(feedback)}>{feedback}</span>
      <p id="voxel-keyboard-instructions" className="sr-only">打开左上角的积木背包选择形状。鼠标左键添加积木，右键移除，拖动旋转，滚轮缩放。方向键选择格子，回车或空格添加，Delete 移除，R 旋转积木，Ctrl + Z 撤销，加减键缩放，W A S D 旋转场景，Escape 退出画布。触屏轻点添加，长按移除，滑动旋转。</p>
    </div>
  )
}
