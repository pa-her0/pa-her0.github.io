"use client"

import { Button } from "@/components/ui/button"
import { AboutIcon, CvIcon, UpdatesIcon } from "@/components/ui/home-menu-icons"

interface GradientMenuProps {
  articleHref?: string
}

export default function GradientMenu({ articleHref = "/articles/" }: GradientMenuProps) {
  const items = [
    { id: "updates", title: "Updates", label: "Updates · 最近更新", href: articleHref, Icon: UpdatesIcon },
    { id: "about", title: "About", label: "About · 关于我", href: "/about/", Icon: AboutIcon },
    { id: "cv", title: "CV", label: "CV · 学习经历", href: "/acad-homepage/index.html", Icon: CvIcon },
  ]

  return (
    <nav className="gradient-menu" aria-label="首页快捷入口" lang="en">
      <ul className="gradient-menu__list">
        {items.map(({ id, title, label, href, Icon }) => (
          <li className="gradient-menu__item" key={id}>
            <Button asChild variant="glass" size="glass">
              <a href={href} aria-label={label} data-menu-item={id}
                data-astro-prefetch={id === "cv" ? undefined : "hover"}
                data-astro-reload={id === "cv" ? true : undefined}>
                <span className="gradient-menu__surface" aria-hidden="true" />
                <span className="gradient-menu__icon" aria-hidden="true"><Icon data-icon="inline-start" /></span>
                <span className="gradient-menu__label">{title}</span>
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
