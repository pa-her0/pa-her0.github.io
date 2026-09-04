"use client"

import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import type { Application } from "@splinetool/runtime"

const Spline = lazy(() => import("@splinetool/react-spline"))

function SceneLoading() {
  return <div className="about-scene-status" role="status"><span className="about-scene-loader" />加载 3D 场景…</div>
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    return this.state.failed
      ? <div className="about-scene-status" role="status">3D 场景暂不可用<br />仍可点击下方了解我</div>
      : this.props.children
  }
}

export function SplineScene({ scene, className }: { scene: string; className?: string }) {
  const root = useRef<HTMLDivElement>(null)
  const app = useRef<Application | null>(null)
  const visible = useRef(false)
  const reduced = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const syncBackground = useCallback(() => {
    if (!root.current || !app.current) return
    const color = getComputedStyle(root.current).getPropertyValue("--bento-surface").trim()
    if (color) app.current.setBackgroundColor(color)
  }, [])
  const sync = useCallback(() => {
    if (!app.current) return
    if (document.hidden || !visible.current || reduced.current) app.current.stop()
    else app.current.play()
  }, [])
  useEffect(() => {
    let delay: ReturnType<typeof setTimeout> | undefined
    let idle: number | undefined
    let started = false
    const cancelScheduled = () => {
      clearTimeout(delay)
      if (idle !== undefined) window.cancelIdleCallback(idle)
      delay = undefined
      idle = undefined
    }
    const schedule = () => {
      if (started || delay !== undefined || idle !== undefined || !visible.current || document.hidden) return
      // Let the static homepage and basic interactions settle before parsing WebGL.
      delay = setTimeout(() => {
        delay = undefined
        const enable = () => {
          idle = undefined
          if (!visible.current || document.hidden) return
          started = true
          setEnabled(true)
        }
        if ("requestIdleCallback" in window) idle = window.requestIdleCallback(enable, { timeout: 2000 })
        else enable()
      }, 1200)
    }
    const onVisibility = () => {
      if (document.hidden || !visible.current) cancelScheduled()
      else schedule()
      sync()
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const themeObserver = new MutationObserver(syncBackground)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    const onMotion = () => { reduced.current = motion.matches; sync() }
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting
      onVisibility()
    })
    if (root.current) observer.observe(root.current)
    document.addEventListener("visibilitychange", onVisibility)
    motion.addEventListener("change", onMotion)
    onMotion()
    return () => {
      observer.disconnect()
      cancelScheduled()
      themeObserver.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      motion.removeEventListener("change", onMotion)
      app.current = null // React-Spline owns and disposes the renderer on unmount.
    }
  }, [sync, syncBackground])
  const onLoad = useCallback((instance: Application) => {
    app.current = instance
    syncBackground()
    sync()
  }, [sync, syncBackground])

  return <div ref={root} className={className}>
    <SceneBoundary key={scene}>
      {enabled ? <Suspense fallback={<SceneLoading />}>
        <Spline scene={scene} className="about-scene-canvas" renderOnDemand onLoad={onLoad}>
          <SceneLoading />
        </Spline>
      </Suspense> : <SceneLoading />}
    </SceneBoundary>
  </div>
}
