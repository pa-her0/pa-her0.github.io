"use client"

import { useEffect, useState } from "react"
import { RailToc, type RailTocItem } from "./rail-toc"

interface TableOfContentsProps {
  showHeader?: boolean
}

export function TableOfContents({ showHeader = true }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<RailTocItem[]>([])
  const [isViewportActive, setIsViewportActive] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)")
    const sync = () => setIsViewportActive(showHeader ? !media.matches : media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [showHeader])

  useEffect(() => {
    if (!isViewportActive) return

    const collectHeadings = () => {
      const article = document.querySelector("article")
      const elements = Array.from(article?.querySelectorAll("h2[id], h3[id], h4[id]") ?? [])
      const baseLevel = Math.min(...elements.map((element) => Number(element.tagName[1])))
      const items = elements.flatMap((element) => {
        const clone = element.cloneNode(true) as HTMLElement
        clone.querySelectorAll(".anchor, .anchor-icon, [aria-hidden='true']").forEach((node) => node.remove())
        const label = clone.textContent?.trim()
        return label ? [{ id: element.id, label, depth: Number(element.tagName[1]) - baseLevel }] : []
      })
      setHeadings(items)
    }

    collectHeadings()
    document.addEventListener("astro:page-load", collectHeadings)
    return () => document.removeEventListener("astro:page-load", collectHeadings)
  }, [isViewportActive])

  if (!isViewportActive || !headings.length) return null

  return <RailToc items={headings} showHeader={showHeader} autoScroll={showHeader} />
}
