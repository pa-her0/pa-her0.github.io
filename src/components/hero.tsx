"use client"

import { useGSAP } from "@gsap/react"
import { IconArrowUpRight } from "@tabler/icons-react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useEffect, useRef } from "react"
import { SiteBrand } from "@/components/site-brand"

gsap.registerPlugin(useGSAP, ScrollTrigger)

type BinaryParticle = {
  x: number
  y: number
  value: "0" | "1"
  bornAt: number
  duration: number
  size: number
  driftX: number
  driftY: number
  strength: number
}

function useBinaryField(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    const root = rootRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !root || !context) return

    const baseCanvas = document.createElement("canvas")
    const baseContext = baseCanvas.getContext("2d")
    if (!baseContext) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const particles: BinaryParticle[] = []
    let animationFrame = 0
    let pixelRatio = 1
    let width = 0
    let height = 0
    let lastPointer = { x: -100, y: -100 }

    const drawBase = () => {
      baseContext.clearRect(0, 0, width, height)
      baseContext.fillStyle = "rgba(89, 86, 106, 0.038)"
      baseContext.textAlign = "center"
      baseContext.textBaseline = "middle"
      baseContext.font = '500 10px "Geist Mono", ui-monospace, monospace'

      const gap = width < 720 ? 48 : 42
      const columns = Math.ceil(width / gap) + 1
      const rows = Math.ceil(height / gap) + 1
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          if ((row * 5 + column * 3) % 4 === 0) continue
          const value = (row * 7 + column * 13) % 2 === 0 ? "0" : "1"
          baseContext.fillText(value, column * gap + gap / 2, row * gap + gap / 2)
        }
      }
    }

    const paint = (timestamp: number) => {
      animationFrame = 0
      context.clearRect(0, 0, width, height)
      context.drawImage(baseCanvas, 0, 0, width, height)

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index]
        const progress = Math.min(1, Math.max(0, (timestamp - particle.bornAt) / particle.duration))
        const eased = 1 - (1 - progress) ** 3
        const alpha = (1 - progress) * particle.strength

        context.fillStyle = `rgba(108, 99, 255, ${alpha * 0.72})`
        context.font = `600 ${particle.size}px "Geist Mono", ui-monospace, monospace`
        context.textAlign = "center"
        context.textBaseline = "middle"
        context.fillText(
          particle.value,
          particle.x + particle.driftX * eased,
          particle.y + particle.driftY * eased,
        )

        if (progress >= 1) particles.splice(index, 1)
      }

      if (particles.length > 0) animationFrame = window.requestAnimationFrame(paint)
    }

    const schedulePaint = () => {
      if (animationFrame === 0) animationFrame = window.requestAnimationFrame(paint)
    }

    const resize = () => {
      const bounds = root.getBoundingClientRect()
      width = Math.max(1, Math.round(bounds.width))
      height = Math.max(1, Math.round(bounds.height))
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

      baseCanvas.width = Math.round(width * pixelRatio)
      baseCanvas.height = Math.round(height * pixelRatio)
      baseContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      drawBase()
      context.clearRect(0, 0, width, height)
      context.drawImage(baseCanvas, 0, 0, width, height)
    }

    const addBinaryTrail = (event: PointerEvent) => {
      if (reduceMotion.matches || event.pointerType === "touch") return

      const bounds = root.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) return

      const distance = Math.hypot(x - lastPointer.x, y - lastPointer.y)
      if (distance < 9) return

      const steps = Math.min(4, Math.max(1, Math.floor(distance / 14)))
      const now = performance.now()
      for (let step = 0; step < steps; step += 1) {
        const ratio = (step + 1) / steps
        const pointX = lastPointer.x < 0 ? x : lastPointer.x + (x - lastPointer.x) * ratio
        const pointY = lastPointer.y < 0 ? y : lastPointer.y + (y - lastPointer.y) * ratio

        particles.push({
          x: pointX + (Math.random() - 0.5) * 24,
          y: pointY + (Math.random() - 0.5) * 18,
          value: Math.random() > 0.5 ? "1" : "0",
          bornAt: now,
          duration: 620 + Math.random() * 420,
          size: 10 + Math.random() * 8,
          driftX: (Math.random() - 0.5) * 20,
          driftY: -12 - Math.random() * 24,
          strength: 0.38 + Math.random() * 0.42,
        })
      }

      if (particles.length > 150) particles.splice(0, particles.length - 150)
      lastPointer = { x, y }
      schedulePaint()
    }

    const resetPointer = () => {
      lastPointer = { x: -100, y: -100 }
    }

    const handleMotionPreference = () => {
      if (!reduceMotion.matches) return
      particles.length = 0
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
      context.clearRect(0, 0, width, height)
      context.drawImage(baseCanvas, 0, 0, width, height)
    }

    resize()
    window.addEventListener("resize", resize, { passive: true })
    root.addEventListener("pointermove", addBinaryTrail, { passive: true })
    root.addEventListener("pointerleave", resetPointer, { passive: true })
    reduceMotion.addEventListener("change", handleMotionPreference)

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", resize)
      root.removeEventListener("pointermove", addBinaryTrail)
      root.removeEventListener("pointerleave", resetPointer)
      reduceMotion.removeEventListener("change", handleMotionPreference)
    }
  }, [canvasRef, rootRef])
}

type BrushStamp = {
  x: number
  y: number
  radius: number
  angle: number
  strength: number
}

function useCalligraphyBrush(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  calligraphyRef: React.RefObject<HTMLDivElement | null>,
  rootRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    const calligraphy = calligraphyRef.current
    const root = rootRef.current
    const baseImage = calligraphy?.querySelector<HTMLImageElement>(".jiely-calligraphy__ink--base")
    const context = canvas?.getContext("2d")
    if (!canvas || !calligraphy || !root || !baseImage || !context) return

    const inkCanvas = document.createElement("canvas")
    const maskCanvas = document.createElement("canvas")
    const inkContext = inkCanvas.getContext("2d")
    const maskContext = maskCanvas.getContext("2d")
    if (!inkContext || !maskContext) return

    const strokes: BrushStamp[] = []
    const pendingStrokes: BrushStamp[] = []
    let frame = 0
    let width = 0
    let height = 0
    let pixelRatio = 1
    let previousPoint: { x: number; y: number } | null = null

    const stampMask = (stamp: BrushStamp) => {
      const x = stamp.x * width
      const y = stamp.y * height
      const radius = stamp.radius * width
      const gradient = maskContext.createRadialGradient(0, 0, 0, 0, 0, radius)
      gradient.addColorStop(0, `rgb(255 255 255 / ${0.96 * stamp.strength})`)
      gradient.addColorStop(0.46, `rgb(255 255 255 / ${0.82 * stamp.strength})`)
      gradient.addColorStop(0.78, `rgb(255 255 255 / ${0.28 * stamp.strength})`)
      gradient.addColorStop(1, "transparent")

      maskContext.save()
      maskContext.translate(x, y)
      maskContext.rotate(stamp.angle)
      maskContext.scale(1, 0.7)
      maskContext.fillStyle = gradient
      maskContext.beginPath()
      maskContext.arc(0, 0, radius, 0, Math.PI * 2)
      maskContext.fill()
      maskContext.restore()
    }

    const renderInk = () => {
      context.save()
      context.setTransform(1, 0, 0, 1, 0, 0)
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(inkCanvas, 0, 0)
      context.globalCompositeOperation = "destination-in"
      context.drawImage(maskCanvas, 0, 0)
      context.restore()
    }

    const paintPendingStrokes = () => {
      frame = 0
      if (pendingStrokes.length === 0) return
      pendingStrokes.splice(0).forEach(stampMask)
      renderInk()
    }

    const schedulePaint = () => {
      if (frame === 0) frame = window.requestAnimationFrame(paintPendingStrokes)
    }

    const prepareCanvases = () => {
      const bounds = calligraphy.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)

      const backingWidth = Math.round(width * pixelRatio)
      const backingHeight = Math.round(height * pixelRatio)
      canvas.width = backingWidth
      canvas.height = backingHeight
      inkCanvas.width = backingWidth
      inkCanvas.height = backingHeight
      maskCanvas.width = backingWidth
      maskCanvas.height = backingHeight

      inkContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      inkContext.clearRect(0, 0, width, height)
      inkContext.drawImage(baseImage, 0, 0, width, height)
      inkContext.globalCompositeOperation = "source-in"
      inkContext.fillStyle = "#6c63ff"
      inkContext.fillRect(0, 0, width, height)
      inkContext.globalCompositeOperation = "source-over"

      maskContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      maskContext.clearRect(0, 0, width, height)
      strokes.forEach(stampMask)
      renderInk()
    }

    const addBrushStroke = (event: PointerEvent) => {
      if (event.pointerType === "touch") return

      const bounds = calligraphy.getBoundingClientRect()
      const x = event.clientX - bounds.left
      const y = event.clientY - bounds.top
      if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
        previousPoint = null
        return
      }

      const currentPoint = { x, y }
      const distance = previousPoint
        ? Math.hypot(currentPoint.x - previousPoint.x, currentPoint.y - previousPoint.y)
        : 0
      const baseRadius = Math.min(27, Math.max(14, bounds.width * 0.019))
      const spacing = Math.max(3, baseRadius * 0.3)
      const steps = previousPoint ? Math.min(16, Math.max(1, Math.ceil(distance / spacing))) : 1
      const angle = previousPoint
        ? Math.atan2(currentPoint.y - previousPoint.y, currentPoint.x - previousPoint.x)
        : 0

      for (let step = 1; step <= steps; step += 1) {
        const progress = step / steps
        const pointX = previousPoint
          ? previousPoint.x + (currentPoint.x - previousPoint.x) * progress
          : currentPoint.x
        const pointY = previousPoint
          ? previousPoint.y + (currentPoint.y - previousPoint.y) * progress
          : currentPoint.y
        const variation = 0.9 + Math.sin((strokes.length + step) * 1.73) * 0.1
        const pressure = event.pointerType === "pen" && event.pressure > 0
          ? 0.72 + event.pressure * 0.42
          : 1
        const stamp: BrushStamp = {
          x: pointX / bounds.width,
          y: pointY / bounds.height,
          radius: (baseRadius * variation * pressure) / bounds.width,
          angle,
          strength: 0.88 + Math.cos((strokes.length + step) * 2.17) * 0.08,
        }
        strokes.push(stamp)
        pendingStrokes.push(stamp)
      }

      previousPoint = currentPoint
      schedulePaint()
    }

    const stopStroke = () => {
      previousPoint = null
    }

    const resizeObserver = new ResizeObserver(prepareCanvases)
    resizeObserver.observe(calligraphy)
    if (baseImage.complete) prepareCanvases()
    else baseImage.addEventListener("load", prepareCanvases, { once: true })
    root.addEventListener("pointermove", addBrushStroke, { passive: true })
    root.addEventListener("pointerleave", stopStroke, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      baseImage.removeEventListener("load", prepareCanvases)
      root.removeEventListener("pointermove", addBrushStroke)
      root.removeEventListener("pointerleave", stopStroke)
    }
  }, [canvasRef, calligraphyRef, rootRef])
}

interface HeroProps {
  articleHref?: string
}

export function Hero({ articleHref = "/articles/" }: HeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const calligraphyRef = useRef<HTMLDivElement>(null)
  const calligraphyCanvasRef = useRef<HTMLCanvasElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)

  useBinaryField(canvasRef, rootRef)
  useCalligraphyBrush(calligraphyCanvasRef, calligraphyRef, rootRef)

  useGSAP(
    () => {
      const root = rootRef.current
      const calligraphy = calligraphyRef.current
      const copy = copyRef.current
      if (!root || !calligraphy || !copy) return

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (reduceMotion) {
        gsap.set(".jiely-intro", { display: "none" })
        gsap.set([calligraphy, copy], { clearProps: "transform,opacity,visibility" })
        return
      }

      // Keep centering relative to the artwork when the viewport is resized.
      gsap.set(calligraphy, { x: 0, y: 0, xPercent: -50, yPercent: -50 })

      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
      timeline
        .fromTo(
          ".jiely-intro__lockup",
          { autoAlpha: 0, y: 10, scale: 0.96 },
          { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 },
        )
        .to(".jiely-intro__lockup", { autoAlpha: 0, y: -8, duration: 0.24 }, "+=0.28")
        .to(".jiely-intro__panel--top", { yPercent: -100, duration: 0.72 }, "-=0.05")
        .to(".jiely-intro__panel--bottom", { yPercent: 100, duration: 0.72 }, "<")
        .from(calligraphy, { autoAlpha: 0, y: 22, scale: 0.965, duration: 0.82 }, "-=0.48")
        .from(
          copy.children,
          { autoAlpha: 0, y: 18, duration: 0.58, stagger: 0.08 },
          "<0.08",
        )
        .set(".jiely-intro", { display: "none" })

      gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.65,
        },
      })
        .to(calligraphy, { yPercent: -55, scale: 1.025, rotation: -0.6, ease: "none" }, 0)
        .to(copy, { yPercent: -4, autoAlpha: 0.88, ease: "none" }, 0)

      return () => {
        timeline.kill()
      }
    },
    { scope: rootRef },
  )

  return (
    <section
      id="home-main"
      ref={rootRef}
      data-binary-home
      className="jiely-hero"
      aria-labelledby="jiely-home-title"
    >
      <div className="jiely-hero__stage">
        <canvas ref={canvasRef} className="jiely-hero__binary" aria-hidden="true" />

        <div className="jiely-intro" aria-hidden="true">
          <div className="jiely-intro__panel jiely-intro__panel--top" />
          <div className="jiely-intro__panel jiely-intro__panel--bottom" />
          <div className="jiely-intro__lockup">
            <SiteBrand />
          </div>
        </div>

        <div ref={calligraphyRef} className="jiely-calligraphy" aria-hidden="true">
          <img
            className="jiely-calligraphy__ink jiely-calligraphy__ink--base"
            src="/brand/tianxia-wushuang-handwriting-v2.webp"
            alt=""
            width={2004}
            height={785}
            decoding="async"
          />
          <canvas
            ref={calligraphyCanvasRef}
            className="jiely-calligraphy__ink jiely-calligraphy__ink--paint"
          />
        </div>

        <div ref={copyRef} className="jiely-hero__copy">
          <h1 id="jiely-home-title" className="jiely-hero__title">
            <span className="sr-only">写技术，也写人间。</span>
            <img
              src="/brand/home-writing-humanity-v2.png"
              alt=""
              width={2076}
              height={757}
              decoding="async"
            />
          </h1>
          <p className="jiely-hero__summary">
            <span className="sr-only">记录技术的求索，也珍藏生活的微光。</span>
            <img
              src="/brand/home-subtitle-handwriting-v1.png"
              alt=""
              width={2172}
              height={724}
              decoding="async"
            />
          </p>
          <div className="jiely-hero__links">
            <a href={articleHref} data-astro-prefetch>
              最近更新 <IconArrowUpRight size={18} stroke={1.6} aria-hidden="true" />
            </a>
            <a href="/about/" data-astro-prefetch>
              关于我
            </a>
            <a href="/acad-homepage/index.html">
              学习经历
            </a>
          </div>
        </div>
        <a className="jiely-hero__scroll" href="#personal-journey" aria-label="向下，认识 Jiely">
          <span>向下，认识我</span><span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  )
}
