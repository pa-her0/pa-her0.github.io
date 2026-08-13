import { BrainCircuit, Github, Mail, MapPin, ScanEye, Waypoints } from "lucide-react"
import { profile } from "@/data/profile"

const technologies = [
  { name: "Python", icon: "/icons/tech/python.svg" },
  { name: "C++", icon: "/icons/tech/cplusplus.svg" },
  { name: "TypeScript", icon: "/icons/tech/typescript.svg" },
  { name: "PyTorch", icon: "/icons/tech/pytorch.svg" },
  { name: "Astro", icon: "/icons/tech/astro.svg" },
]

const directions = [
  { name: "人工智能", detail: "Artificial Intelligence", icon: BrainCircuit, tone: "rose" },
  { name: "多智能体系统", detail: "Multi-Agent Systems", icon: Waypoints, tone: "amber" },
  { name: "计算机视觉", detail: "Computer Vision", icon: ScanEye, tone: "sky" },
] as const

const directionTone = {
  rose: "border-rose-200/80 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/35 dark:text-rose-300",
  amber: "border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/35 dark:text-amber-300",
  sky: "border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/35 dark:text-sky-300",
} as const

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark:bg-surface-subtle">
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <section className="mb-14 flex flex-col gap-8 md:flex-row md:items-center">
            <img
              src={profile.avatar}
              alt={profile.name}
              width={152}
              height={152}
              className="h-36 w-36 rounded-2xl border-2 border-border object-cover shadow-lg"
            />
            <div>
              <p className="mb-2 text-sm uppercase tracking-[0.22em] text-primary">About</p>
              <h1 className="mb-3 text-4xl font-bold text-foreground">你好，我是 Jiely</h1>
              <p className="mb-5 text-lg text-muted-foreground">{profile.bio}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />China</span>
                <a className="inline-flex items-center gap-1.5 hover:text-foreground" href="https://github.com/pa-her0"><Github className="h-4 w-4" />GitHub</a>
                <a className="inline-flex items-center gap-1.5 hover:text-foreground" href="mailto:2799620892@qq.com"><Mail className="h-4 w-4" />Email</a>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-7">
              <h2 className="mb-5 text-xl font-semibold text-foreground">教育与研究</h2>
              <div className="grid gap-2 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-start sm:gap-8">
                <div>
                  <h3 className="text-lg font-medium text-foreground">西南财经大学</h3>
                  <p className="mt-1 text-muted-foreground">超算协会 · 会长</p>
                </div>
                <p className="leading-7 text-foreground/80">关注人工智能、多智能体系统、算法交易与计算机视觉，也在这里记录科研、学习和生活。</p>
              </div>
            </section>
            <section className="rounded-2xl border border-border bg-card p-7">
              <h2 className="mb-5 text-xl font-semibold text-foreground">技术与方向</h2>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr] lg:gap-8">
                <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">技术栈</p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
                  {technologies.map((technology) => (
                    <div
                      key={technology.name}
                      className="flex items-center gap-2.5 rounded-xl border border-border/80 bg-secondary/55 px-3 py-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm">
                        <img src={technology.icon} alt="" className="h-5 w-5 object-contain" loading="lazy" />
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-foreground/85">{technology.name}</span>
                    </div>
                  ))}
                </div>
                </div>

                <div className="border-t border-border/70 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">研究方向</p>
                <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {directions.map((direction) => {
                    const Icon = direction.icon
                    return (
                      <div
                        key={direction.name}
                        className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 ${directionTone[direction.tone]}`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <span>
                          <strong className="block text-sm font-medium">{direction.name}</strong>
                          <span className="block text-[11px] opacity-70">{direction.detail}</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
                </div>
              </div>
            </section>
          </div>

          <blockquote className="mt-8 rounded-2xl border-l-4 border-primary bg-surface-subtle px-6 py-5 italic text-content-secondary">
            “计算机不是黑魔法，都是人做出来的。”
          </blockquote>
        </div>
      </main>
    </div>
  )
}
