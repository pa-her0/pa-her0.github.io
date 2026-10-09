"use client"

import { IconArrowUpRight } from "@tabler/icons-react"
import { VoxelPlayground } from "@/components/voxel-playground"

interface HeroProps {
  articleHref?: string
}

export function Hero({ articleHref = "/articles/" }: HeroProps) {
  return (
    <section id="home-main" data-binary-home className="jiely-hero" aria-labelledby="jiely-home-title">
      <div className="jiely-hero__stage">
        <VoxelPlayground />
        <div className="jiely-hero__copy">
          <div className="jiely-hero__signature">
            <p className="jiely-hero__motto" lang="en">The one<br />beyond compare</p>
            <h1 id="jiely-home-title" className="jiely-hero__wordmark">
              <span className="sr-only">Jiely 的博客</span>
              <img src="/brand/jiely-display-v2.png" alt="" width={1888} height={833} fetchPriority="high" decoding="async" draggable={false} />
            </h1>
          </div>
          <nav className="jiely-hero__links" aria-label="首页快捷入口">
            <a href={articleHref} data-astro-prefetch>最近更新 <IconArrowUpRight size={17} stroke={1.6} aria-hidden="true" /></a>
            <a href="/about/" data-astro-prefetch>关于我</a>
            <a href="/acad-homepage/index.html">学习经历</a>
          </nav>
        </div>
      </div>
    </section>
  )
}
