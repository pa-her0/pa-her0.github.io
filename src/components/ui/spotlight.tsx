"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

// Adapted from the supplied ibelick spotlight; named handlers ensure cleanup.
export function Spotlight({ size = 180 }: { size?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const x = useSpring(0, { bounce: 0 })
  const y = useSpring(0, { bounce: 0 })
  const left = useTransform(x, value => value - size / 2)
  const top = useTransform(y, value => value - size / 2)
  useEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return
    const move = (event: PointerEvent) => {
      const bounds = parent.getBoundingClientRect()
      x.set(event.clientX - bounds.left)
      y.set(event.clientY - bounds.top)
    }
    const enter = () => setHovered(true)
    const leave = () => setHovered(false)
    parent.addEventListener("pointermove", move, { passive: true })
    parent.addEventListener("pointerenter", enter)
    parent.addEventListener("pointerleave", leave)
    return () => {
      parent.removeEventListener("pointermove", move)
      parent.removeEventListener("pointerenter", enter)
      parent.removeEventListener("pointerleave", leave)
    }
  }, [x, y])
  return <motion.div ref={ref} className="about-scene-spotlight" aria-hidden="true"
    style={{ width: size, height: size, left, top, opacity: hovered ? 1 : 0 }} />
}
