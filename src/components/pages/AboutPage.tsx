import { useState } from "react"
import { ArrowUpRight, BookOpen, FolderOpen, Github, Mail, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const portrait = "/images/home-scrapbook/character-hello.webp"

const pages = [
  { name: "学习笔记", href: "/notes/", icon: BookOpen },
  { name: "研究项目", href: "/projects/", icon: FolderOpen },
  { name: "生活记录", href: "/life/", icon: NotebookPen },
]

function AboutCover() {
  return (
    <div className="about-card__cover">
      <img src={portrait} width={1254} height={1254} alt="" draggable={false} fetchPriority="high" />
    </div>
  )
}

export default function AboutPage() {
  const [flipped, setFlipped] = useState(false)
  const flip = () => setFlipped((isFlipped) => !isFlipped)

  return (
    <div
      className="about-card"
      data-flipped={flipped}
      onClick={(event) => {
        if (!(event.target instanceof Element) || event.target.closest("a, button") || window.getSelection()?.toString()) return
        flip()
      }}
    >
      <button
        type="button"
        className="about-card__cover-control"
        aria-label={flipped ? "翻回正面" : "翻到背面"}
        aria-controls="about-card-back"
        aria-expanded={flipped}
        onClick={flip}
      />
      <div className="about-card__rotator">
        <Card className="about-card__face" inert={flipped} aria-hidden={flipped}>
          <AboutCover />
          <CardHeader className="about-card__intro">
            <CardTitle className="about-card__greeting">
              你好，我是 <span lang="en">Jiely</span>
            </CardTitle>
            <CardDescription>保持好奇，学习一切有趣的事物。</CardDescription>
          </CardHeader>
          <CardContent className="about-card__copy">
            <p>兴趣是 HPC 高性能计算、AI Infra 与 AI Agent，喜欢探索前沿技术和 GitHub 开源项目。</p>
            <p>这里记录生活，也记录学习。把学到的知识写下来，把想做的事情一步步实现。</p>
          </CardContent>
          <CardFooter className="about-card__footer">
            <Separator />
            <div className="about-card__links">
              <Button asChild variant="outline" size="icon">
                <a href="https://github.com/pa-her0" target="_blank" rel="noreferrer" aria-label="GitHub">
                  <Github aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon">
                <a href="mailto:2799620892@qq.com" aria-label="电子邮箱">
                  <Mail aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="icon">
                <a href="/acad-homepage/index.html" data-astro-reload aria-label="学术主页">
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            </div>
          </CardFooter>
        </Card>
        <Card id="about-card-back" className="about-card__face about-card__face--back" inert={!flipped} aria-hidden={!flipped}>
          <AboutCover />
          <CardHeader className="about-card__intro">
            <CardTitle className="about-card__greeting">我的学习与生活</CardTitle>
          </CardHeader>
          <CardContent>
            <nav className="about-card__destinations" aria-label="探索博客">
              {pages.map(({ name, href, icon: Icon }) => (
                <Button key={href} asChild variant="secondary" size="sm">
                  <a href={href} data-astro-prefetch>
                    <Icon data-icon="inline-start" aria-hidden="true" />
                    {name}
                  </a>
                </Button>
              ))}
            </nav>
          </CardContent>
          <CardFooter className="about-card__footer">
            <Separator />
            <div className="about-card__links">
              <Button asChild variant="outline">
                <a href="/learning/" data-astro-prefetch>学习进度</a>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
