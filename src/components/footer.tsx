import type { ComponentType, SVGProps } from "react"
import { Github, Music } from "lucide-react"
import { profile, type ExternalProfileLink, type ExternalProfileLinkType } from "@/data/profile"
import { QqIcon } from "@/components/icons/qq-icon"

const iconMap: Record<ExternalProfileLinkType, ComponentType<SVGProps<SVGSVGElement>>> = {
  qq: QqIcon,
  music: Music,
  github: Github,
}

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-8 w-9 overflow-hidden" aria-hidden="true">
                <img
                  src="/brand/whalefall-logo.png"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute left-1/2 top-0 h-[47px] w-[47px] max-w-none -translate-x-1/2"
                />
              </div>
              <span className="font-serif text-lg font-semibold tracking-tight text-[#0874c9]">Whalefall</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              In the end, you have to save yourself.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:flex md:justify-center">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">导航</h4>
              <nav className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3 md:grid-cols-2">
              {[
                { name: "首页", href: "/" },
                { name: "时间线", href: "/timeline/" },
                { name: "项目", href: "/projects/" },
                { name: "友链", href: "/friends/" },
                { name: "留言板", href: "/messages/" },
                { name: "关于", href: "/about/" },
              ].map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
            </nav>
            </div>
          </div>

          {/* Connect */}
          <div className="md:flex md:justify-end">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-4 uppercase tracking-wide">联系</h4>
              <div className="flex items-center gap-4">
                {profile.links.filter((link): link is ExternalProfileLink => link.type !== "wechat").map((link) => {
                  const Icon = iconMap[link.type]
                  return (
                    <a
                      key={link.name}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-200"
                      aria-label={link.name}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border/50 grid gap-4 md:grid-cols-3">
          <p className="text-muted-foreground text-sm">© 2026 Jiely. All rights reserved.</p>
          <span className="text-muted-foreground text-xs md:text-center">Powered by Astro</span>
          <a
            href="https://github.com/Lapis0x0/VermilionVoid"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors duration-200 group md:justify-end md:pr-4"
          >
            <Github className="w-3.5 h-3.5" />
            <span>博客主题：朱墨留白 | VermilionVoid</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
