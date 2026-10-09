"use client"

import { useEffect, useRef, useState } from "react"
import type { VoxelScene } from "@/lib/voxel-scene"

// Rendered before WebGL is ready, and retained when graphics are unavailable.
function VoxelBackdrop() {
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
      {[[260, 300], [760, 190], [940, 365], [485, 235], [660, 375]].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <path d="M0-48 29-35 0-20-29-34Z" fill="var(--voxel-top)" />
          <path d="M-29-34 0-20V14L-29 0Z" fill="var(--home-accent)" />
          <path d="M0-20 29-35V0L0 14Z" fill="var(--voxel-side)" />
        </g>
      ))}
    </svg>
  )
}

export function VoxelPlayground() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<VoxelScene | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading")
  const [count, setCount] = useState(6)

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

  return (
    <div className="voxel-playground" data-status={status}>
      <VoxelBackdrop />
      <div
        ref={canvasRef}
        className="voxel-playground__canvas"
        tabIndex={status === "ready" ? 0 : -1}
        role="application"
        aria-label="立体方块画布"
        aria-describedby="voxel-keyboard-instructions"
        aria-hidden={status === "fallback" ? true : undefined}
      />
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{count} 个方块</span>
      <p id="voxel-keyboard-instructions" className="sr-only">鼠标左键添加方块，右键移除，拖动旋转，滚轮缩放。方向键选择格子，回车或空格添加，Delete 移除，Ctrl + Z 撤销，加减键缩放，W A S D 旋转，Escape 退出画布。触屏轻点添加，长按移除，滑动旋转。</p>
    </div>
  )
}
