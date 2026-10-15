"use client"

import GradientMenu from "@/components/ui/gradient-menu"
import { VoxelPlayground } from "@/components/voxel-playground"

interface HeroProps {
  articleHref?: string
}

export function Hero({ articleHref = "/articles/" }: HeroProps) {
  return (
    <section id="home-main" data-binary-home className="jiely-hero" aria-labelledby="jiely-home-title">
      <h1 id="jiely-home-title" className="sr-only">Jiely 的博客</h1>
      <div className="jiely-hero__stage">
        <VoxelPlayground />
        <div className="jiely-hero__copy">
          <GradientMenu articleHref={articleHref} />
        </div>
      </div>
    </section>
  )
}
