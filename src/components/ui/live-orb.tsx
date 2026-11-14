import { useEffect, useRef } from "react"

export function LiveOrb() {
  const orbRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const orb = orbRef.current
    if (!orb) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const listeners = new AbortController()
    const listenerOptions = { passive: true, signal: listeners.signal }
    let pointerX = 0
    let pointerY = 0
    let frame = 0

    const updateGaze = () => {
      frame = 0
      const { left, top, width, height } = orb.getBoundingClientRect()
      const dx = pointerX - (left + width / 2)
      const dy = pointerY - (top + height / 2)
      // Keep the direction accurate even when the pointer is far from the mark.
      const distance = Math.max(96, Math.hypot(dx, dy))
      const x = dx / distance
      const y = dy / distance

      orb.style.setProperty("--orb-look-x", `${x * 24}%`)
      orb.style.setProperty("--orb-look-y", `${y * 22}%`)
      orb.style.setProperty("--orb-eye-width", String(1 - Math.abs(x) * 0.24))
    }

    const resetGaze = () => {
      cancelAnimationFrame(frame)
      frame = 0
      orb.style.removeProperty("--orb-look-x")
      orb.style.removeProperty("--orb-look-y")
      orb.style.removeProperty("--orb-eye-width")
    }

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return
      pointerX = event.clientX
      pointerY = event.clientY
      if (!frame) frame = requestAnimationFrame(updateGaze)
    }, listenerOptions)

    window.addEventListener("pointerout", (event) => {
      if (event.relatedTarget === null) resetGaze()
    }, listenerOptions)

    window.addEventListener("blur", resetGaze, listenerOptions)
    reducedMotion.addEventListener("change", resetGaze, listenerOptions)

    return () => {
      listeners.abort()
      resetGaze()
    }
  }, [])

  return (
    <span className="live-orb" ref={orbRef} aria-hidden="true">
      <span className="live-orb__gaze">
        <span className="live-orb__eye" />
        <span className="live-orb__eye" />
      </span>
    </span>
  )
}
