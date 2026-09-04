import { useEffect, useId, useMemo, useRef, useState } from "react"
import type { ActivityDay } from "@/lib/home-activity"
import { buildSnakeRoute } from "@/lib/activity-snake"
import "@/styles/activity-snake.css"

export function ActivitySnake({ days, coding = false }: { days: ActivityDay[]; coding?: boolean }) {
  const [visible, setVisible] = useState(false)
  const root = useRef<HTMLElement>(null)
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const columns = Math.ceil(days.length / 7)
  const { points, arrivals } = useMemo(() => buildSnakeRoute(columns), [columns])
  const last = points.length - 1
  const stepDuration = .18
  const duration = last * stepDuration
  const width = columns * 20 - 6
  const unit = coding ? "分钟" : "次更新"
  const position = (point: { x: number; y: number }) => `translate(${point.x * 20 + 7}px, ${point.y * 20 + 7}px)`
  const routeStyle = `@keyframes snake-${id}{${points.map((point, index) => `${index / last * 100}%{transform:${position(point)}}`).join("")}}`

  useEffect(() => {
    const element = root.current
    if (!element) return
    let intersecting = false
    const sync = () => setVisible(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; sync() })
    observer.observe(element)
    document.addEventListener("visibilitychange", sync)
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", sync) }
  }, [])

  return (
    <article ref={root} className={`bento-card bento-activity activity-snake${!visible ? " is-paused" : ""}`}>
      <div className="bento-activity-heading">
        <h2>{coding ? "Coding activity" : "Update activity"}</h2>
      </div>
      <style>{routeStyle}</style>
      <svg className="activity-snake__board" viewBox={`0 0 ${width} 134`} preserveAspectRatio="none" role="img"
        aria-label={coding ? "编码活动贪吃蛇：色块代表每日编码时长" : "更新记录贪吃蛇：色块代表文章与碎碎念的真实发表记录"}>
        <title>更新记录；悬停色块查看日期与数量</title>
        {days.map((day, index) => {
          const eatenAt = arrivals[index] / last * 100
          const name = `eat-${id}-${index}`
          return <g key={day.date}>
            <title>{`${day.date}：${day.count} ${unit}`}</title>
            <rect className="activity-snake__empty" x={Math.floor(index / 7) * 20} y={index % 7 * 20} width={14} height={14} rx={3} opacity={day.future ? .35 : 1} />
            {day.count > 0 && <>
              <style>{`@keyframes ${name}{0%,${eatenAt}%{opacity:1}${eatenAt + .01}%,99.99%{opacity:0}100%{opacity:1}}`}</style>
              <rect className="activity-snake__food" data-level={day.level} x={Math.floor(index / 7) * 20} y={index % 7 * 20} width={14} height={14} rx={3}
                style={{ animation: `${name} ${duration}s linear infinite` }} />
            </>}
          </g>
        })}
        {/* Tail follows the exact same route one cell behind each preceding segment. */}
        {[4, 3, 2, 1, 0].map(segment => <g key={segment} className="activity-snake__segment" aria-hidden="true"
          style={{ animation: `snake-${id} ${duration}s linear ${segment * stepDuration - duration}s infinite both`, opacity: 1 - segment * .12 }}>
          <rect x={-6} y={-6} width={12} height={12} rx={4} />
          {segment === 0 && <><circle cx={-2} cy={-2} r={1} /><circle cx={2} cy={-2} r={1} /></>}
        </g>)}
      </svg>
    </article>
  )
}
