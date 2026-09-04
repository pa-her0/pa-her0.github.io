import { Github, Mail, Rss } from "lucide-react"

const footerLinks = [
  { name: "GitHub", href: "https://github.com/pa-her0", icon: Github, external: true },
  { name: "Email", href: "mailto:2799620892@qq.com", icon: Mail, external: false },
  { name: "RSS", href: "/rss.xml", icon: Rss, external: false },
]

export function Footer() {
  return (
    <footer className="site-footer bg-background">
      <div className="mx-auto flex max-w-[78rem] flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">© 2026 Jiely. All rights reserved.</p>
        <div className="flex items-center gap-2">
          {footerLinks.map(({ name, href, icon: Icon, external }) => (
            <a key={name} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--panel-border)] text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary" aria-label={name}>
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
