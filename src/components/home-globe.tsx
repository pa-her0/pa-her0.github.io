import { useEffect, useRef, useState } from "react"
import { homeDashboard } from "@/data/home-dashboard"

// Rendering parameters adapted from Serein's Location card; see THIRD-PARTY-NOTICES.md.
export function HomeGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef(0)
  const dragging = useRef<{ x: number; rotation: number } | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let cancelled = false
    let destroy: (() => void) | undefined
    let observer: ResizeObserver | undefined
    let themeObserver: MutationObserver | undefined
    let visibilityObserver: IntersectionObserver | undefined

    void import("cobe").then(({ default: createGlobe }) => {
      if (cancelled) return
      try {
        if (!canvas.getContext("webgl", { alpha: true, antialias: true })) {
          setUnavailable(true)
          return
        }
        let width = canvas.getBoundingClientRect().width
        let rotation = 0
        let visible = true
        let dark = document.documentElement.classList.contains("dark")
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const globe = createGlobe(canvas, {
          devicePixelRatio: dpr, width: width * dpr, height: width * dpr,
          phi: 2.75, theta: 0, dark: 1, diffuse: 3,
          mapSamples: 12000, mapBrightness: 3,
          baseColor: [0.8, 0.8, 0.8], markerColor: [1, 1, 1],
          glowColor: [0.09, 0.30, 0.52],
          markers: [{ location: homeDashboard.coordinates, size: 0.08 }],
          scale: 1.05,
          onRender(state) {
            if (!visible || document.hidden) return
            rotation += (target.current - rotation) * 0.12
            state.phi = 2.75 + rotation
            state.width = width * dpr
            state.height = width * dpr
            state.diffuse = dark ? 2 : 3
            state.mapBrightness = dark ? 2 : 3
            state.glowColor = dark ? [0.5, 0.5, 0.5] : [0.09, 0.30, 0.52]
          },
        })
        destroy = () => globe.destroy()
        observer = new ResizeObserver(([entry]) => { width = entry.contentRect.width })
        observer.observe(canvas)
        themeObserver = new MutationObserver(() => { dark = document.documentElement.classList.contains("dark") })
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
        visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting })
        visibilityObserver.observe(canvas)
      } catch {
        destroy?.()
        if (!cancelled) setUnavailable(true)
      }
    }).catch(() => { if (!cancelled) setUnavailable(true) })

    return () => {
      cancelled = true
      observer?.disconnect()
      themeObserver?.disconnect()
      visibilityObserver?.disconnect()
      destroy?.()
    }
  }, [])

  return unavailable ? <p className="bento-globe-fallback">当前浏览器未启用三维图形<br />{homeDashboard.location}</p> : (
    <div className="bento-globe">
      <canvas ref={canvasRef} tabIndex={0} role="img" aria-label={`${homeDashboard.location} 地球；拖动或使用左右方向键旋转`}
        onPointerDown={(event) => {
          dragging.current = { x: event.clientX, rotation: target.current }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (dragging.current) target.current = dragging.current.rotation + (event.clientX - dragging.current.x) / 200
        }}
        onPointerUp={() => { dragging.current = null }}
        onPointerCancel={() => { dragging.current = null }}
        onLostPointerCapture={() => { dragging.current = null }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault()
            target.current += event.key === "ArrowLeft" ? -0.3 : 0.3
          }
        }} />
    </div>
  )
}
