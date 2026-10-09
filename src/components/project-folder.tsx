"use client"

import { useEffect, useId, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { projects } from "@/data/projects"
import "@/styles/project-folder.css"

// Keep the silhouette and the three poses from the supplied folder reference.
const FLAP_PATH = "M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z"
const CARD_SPRING = { type: "spring" as const, stiffness: 120, damping: 13 }
const FLAP_SPRING = { type: "spring" as const, stiffness: 120, damping: 14 }
const CARD_POSES = [
  { rest: [-44, -22, -5], peek: [-44, -44, -9], open: [-214, -133, -20] },
  { rest: [-23, -15, -2], peek: [-23, -39, -5], open: [-109, -163, -11] },
  { rest: [3, -20, 2], peek: [3, -35, -1], open: [0, -180, -3] },
  { rest: [24, -13, 6], peek: [24, -33, 7], open: [109, -159, 11] },
  { rest: [44, -10, 10], peek: [44, -30, 14], open: [214, -130, 20] },
]

export function ProjectFolder() {
  const reduceMotion = useReducedMotion()
  const instanceId = useId().replace(/[^\w-]/g, "")
  const cardsId = `project-folder-cards-${instanceId}`
  const filterId = `project-folder-inset-${instanceId}`
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)")
    const sync = () => setCompact(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  const close = () => {
    setIsOpen(false)
    setActiveCard(null)
  }

  return (
    <div className="project-folder-stage">
      <div className="project-folder-scale">
        <div
          className="project-folder"
          data-project-folder
          data-folder-state={isOpen ? "open" : isHovered ? "peek" : "rest"}
          role="group"
          aria-label="项目文件夹"
          onPointerEnter={(event) => {
            if (event.pointerType !== "touch") setIsHovered(true)
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "touch") return
            setIsHovered(false)
            if (!event.currentTarget.querySelector(":focus-visible")) close()
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsHovered(false)
              close()
            }
          }}
          onKeyDown={(event) => {
            if (event.key !== "Escape") return
            event.preventDefault()
            close()
            toggleRef.current?.focus()
          }}
        >
          <motion.div
            className="project-folder__shadow"
            aria-hidden="true"
            initial={false}
            animate={{ scaleX: isOpen ? 1.18 : isHovered ? 1.08 : 1, opacity: isOpen ? 0.22 : 0.15 }}
            transition={reduceMotion ? { duration: 0 } : FLAP_SPRING}
          />
          <div className="project-folder__back" aria-hidden="true" />

          <motion.button
            ref={toggleRef}
            className="project-folder__flap"
            type="button"
            aria-label={isOpen ? "收起项目文件夹" : "展开项目文件夹"}
            aria-expanded={isOpen}
            aria-controls={cardsId}
            initial={false}
            animate={{ rotateX: isOpen ? -55 : isHovered ? -45 : -15 }}
            transition={reduceMotion ? { duration: 0 } : FLAP_SPRING}
            onFocus={(event) => {
              if (event.currentTarget.matches(":focus-visible")) setIsHovered(true)
            }}
            onClick={() => {
              setIsOpen((open) => !open)
              setActiveCard(null)
            }}
          >
            <span className="project-folder__glass" style={{ clipPath: `path('${FLAP_PATH}')` }} aria-hidden="true" />
            <svg width="321" height="241" viewBox="0 0 321 241" fill="none" aria-hidden="true">
              <defs>
                <filter id={filterId} x="-26" y="-26" width="373" height="293" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="clear" />
                  <feBlend in="SourceGraphic" in2="clear" result="shape" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feGaussianBlur stdDeviation="2.65" />
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                  <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.22 0" />
                  <feBlend in2="shape" />
                </filter>
              </defs>
              <path className="project-folder__flap-fill" d={FLAP_PATH} filter={`url(#${filterId})`} />
              <path className="project-folder__flap-edge" d={FLAP_PATH} strokeWidth="1" />
            </svg>
          </motion.button>

          <ul id={cardsId} className="project-folder__cards" aria-label="项目卡片" aria-hidden={!isOpen}>
            {projects.map((project, index) => {
              const poses = CARD_POSES[index % CARD_POSES.length]
              const pose = isOpen ? poses.open : isHovered ? poses.peek : poses.rest
              const active = isOpen && activeCard === index
              return (
                <motion.li
                  className="project-folder__card-position"
                  key={project.name}
                  initial={false}
                  animate={{
                    x: pose[0] * (isOpen && compact ? 0.68 : 1),
                    y: pose[1] - (active ? 20 : 0),
                    rotate: active ? 0 : pose[2],
                    scale: active ? 1.06 : 1,
                  }}
                  transition={reduceMotion ? { duration: 0 } : {
                    ...CARD_SPRING,
                    delay: active ? 0 : isOpen ? index * 0.045 : isHovered ? index * 0.03 : 0,
                  }}
                  style={{ zIndex: active ? 12 : index + 2 }}
                >
                  <a
                    className="folder-project-card"
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`打开项目：${project.name}`}
                    title={`${project.name}：${project.description}`}
                    tabIndex={isOpen ? 0 : -1}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== "touch") setActiveCard(index)
                    }}
                    onPointerLeave={() => setActiveCard(null)}
                    onFocus={() => setActiveCard(index)}
                    onBlur={() => setActiveCard(null)}
                  >
                    <span className="folder-project-card__topline">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span>{project.category}</span>
                    </span>
                    <span className="folder-project-card__visual">
                      <img src={project.cover} alt="" draggable={false} style={{ objectFit: project.coverFit as "contain" | "cover" }} />
                    </span>
                    <span className="folder-project-card__caption">
                      <strong>{project.shortName}</strong>
                      <span>{project.badge}</span>
                    </span>
                  </a>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
