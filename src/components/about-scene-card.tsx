import { ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { SplineScene } from "@/components/ui/splite"
import { Spotlight } from "@/components/ui/spotlight"
import { homeDashboard } from "@/data/home-dashboard"
import "@/styles/about-scene.css"

export function AboutSceneCard() {
  return <Card className="bento-card bento-about-scene" aria-label="关于我：交互式 3D 场景">
    <Spotlight />
    <div className="about-scene-heading"><h2>{homeDashboard.aboutScene.title}</h2><span>INTERACTIVE 3D</span></div>
    <SplineScene scene={homeDashboard.aboutScene.scene} className="about-scene-viewport" />
    <a href="/about/" className="about-scene-link">了解我 <ArrowUpRight size={15} aria-hidden="true" /></a>
  </Card>
}
