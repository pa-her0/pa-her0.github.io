"use client"

import { useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  Flame,
  Footprints,
  LayoutGrid,
  NotebookPen,
  Sprout,
  Target,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { learningTasks, learningTracks, type LearningTrackId } from "@/data/learning-plan"
import {
  getCurrentTask,
  getLearningStats,
  getRecentDays,
  getTrackStats,
  toLocalDateKey,
  type LearningArticles,
  type LearningProgress,
} from "@/lib/learning-progress"
import { cn } from "@/lib/utils"

export type LearningView = "overview" | "calendar" | "activity" | "notes" | LearningTrackId
const weekdays = ["一", "二", "三", "四", "五", "六", "日"]
const mainViews = [
  { id: "overview", label: "学习总览", icon: LayoutGrid },
  { id: "calendar", label: "学习日历", icon: CalendarDays },
  { id: "activity", label: "学习足迹", icon: Footprints },
  { id: "notes", label: "关联笔记", icon: NotebookPen },
] as const
const trackIcons = { nowcoder: Code2, hdu: BookOpen, "regional-vp": Trophy, "ai-infra": Cpu, agent: Bot }

export function isLearningView(value: string): value is LearningView {
  return mainViews.some((view) => view.id === value) || learningTracks.some((track) => track.id === value)
}

export function learningViewTitle(view: LearningView) {
  return (
    mainViews.find((item) => item.id === view)?.label ??
    learningTracks.find((track) => track.id === view)?.title ??
    "学习总览"
  )
}

export function getWeekDays(date: Date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from(
    { length: 7 },
    (_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index),
  )
}

function getMonthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const length = Math.ceil((offset + new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) / 7) * 7
  return Array.from(
    { length },
    (_, index) => new Date(date.getFullYear(), date.getMonth(), index - offset + 1),
  )
}

function getCompletedTasks(progress: LearningProgress, day?: string) {
  return learningTasks
    .filter((task) => progress.completedAt[task.id] && (!day || progress.completedAt[task.id] === day))
    .sort((a, b) => progress.completedAt[b.id].localeCompare(progress.completedAt[a.id]))
}

function EmptyRecord({ title, description }: { title: string; description: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sprout />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function LearningNavigation({
  view,
  progress,
  onNavigate,
}: {
  view: LearningView
  progress: LearningProgress
  onNavigate: (view: LearningView) => void
}) {
  const stats = getLearningStats(progress)
  return (
    <aside className="learning-nav">
      <a
        className="learning-nav__brand"
        href="#overview"
        onClick={(event) => {
          event.preventDefault()
          onNavigate("overview")
        }}
      >
        <span>
          <Sprout size={22} />
        </span>
        <div>
          <strong>学习 · 生长</strong>
        </div>
      </a>
      <nav aria-label="学习工作台导航">
        <p className="learning-nav__label">我的工作台</p>
        <div className="learning-nav__links">
          {mainViews.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={view === id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault()
                onNavigate(id)
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
              {view === id ? <span className="learning-nav__dot" /> : null}
            </a>
          ))}
        </div>
        <p className="learning-nav__label">
          学习分类 <span>{learningTracks.length}</span>
        </p>
        <div className="learning-nav__links learning-nav__tracks">
          {learningTracks.map((track) => {
            const Icon = trackIcons[track.id]
            const trackStats = getTrackStats(track.id, progress)
            return (
              <a
                key={track.id}
                data-track={track.id}
                href={`#${track.id}`}
                aria-current={view === track.id ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  onNavigate(track.id)
                }}
              >
                <Icon size={17} />
                <span>{track.shortTitle}</span>
                <small>
                  {trackStats.completed}/{trackStats.total}
                </small>
              </a>
            )
          })}
        </div>
      </nav>
      <div className="learning-nav__bottom">
        <div className="learning-nav__total">
          <span>总学习进度</span>
          <strong>{stats.percentage}%</strong>
        </div>
        <div className="learning-progressbar">
          <span style={{ width: `${stats.percentage}%` }} />
        </div>
        <a href="/">
          <ArrowLeft size={14} /> 返回博客首页
        </a>
      </div>
    </aside>
  )
}

export function LearningOverview({
  now,
  progress,
  onNavigate,
  onSelectDay,
}: {
  now: Date | null
  progress: LearningProgress
  onNavigate: (view: LearningView) => void
  onSelectDay: (date: Date) => void
}) {
  const stats = now ? getLearningStats(progress, now) : null
  const week = now ? getWeekDays(now) : []
  const weekTotal = week.reduce((sum, day) => sum + (stats?.dailyCounts[toLocalDateKey(day)] ?? 0), 0)
  const recent = getCompletedTasks(progress).slice(0, 3)
  return (
    <div className="learning-view-stack">
      <section className="learning-welcome" aria-label="学习进度概览">
        <div className="learning-welcome__illustration">
          <img
            src="/learning/study-companion.png"
            alt="在电脑前学习的女孩"
            width="1024"
            height="1024"
            fetchPriority="high"
          />
        </div>
        <div className="learning-welcome__copy">
          <h2>
            学习这件事，
            <br />
            <span>一点点积累。</span>
          </h2>
          <div className="learning-welcome__summary">
            <span>{learningTracks.length} 个学习方向</span>
            <span>
              已完成 <strong>{Object.keys(progress.completedAt).length}</strong> 项
            </span>
          </div>
          <div className="learning-welcome__actions">
            <button type="button" onClick={() => onNavigate("nowcoder")}>
              继续学习 <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onNavigate("calendar")}>
              <CalendarDays size={16} /> 学习日历
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="learning-directions-title">
        <div className="learning-section-heading">
          <div>
            <h2 id="learning-directions-title">我的学习方向</h2>
          </div>
          <span>{learningTracks.length} 个学习分类</span>
        </div>
        <div className="learning-direction-grid">
          {learningTracks.map((track) => {
            const trackStats = getTrackStats(track.id, progress)
            const Icon = trackIcons[track.id]
            return (
              <button
                type="button"
                className="learning-direction"
                key={track.id}
                data-track={track.id}
                onClick={() => onNavigate(track.id)}
                aria-label={`查看${track.title}任务`}
              >
                <span className="learning-direction__top">
                  <span className="learning-direction__icon">
                    <Icon size={21} strokeWidth={1.7} />
                  </span>
                  <ArrowUpRight size={17} />
                </span>
                <strong>{track.title}</strong>
                <span className="learning-direction__meta">
                  <span>
                    {track.units.length} 个章节 · {trackStats.total} 项任务
                  </span>
                  <b>{trackStats.percentage}%</b>
                </span>
                <span className="learning-progressbar">
                  <span style={{ width: `${trackStats.percentage}%` }} />
                </span>
                <span className="learning-direction__bottom">
                  已完成 {trackStats.completed} 项
                  <span>
                    点击展开 <ChevronRight size={12} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="learning-week-card" aria-labelledby="learning-week-title">
        <div className="learning-section-heading">
          <div>
            <h2 id="learning-week-title">这一周的脚印</h2>
          </div>
          <span>
            本周完成 <b>{weekTotal}</b> 项
          </span>
        </div>
        <div className="learning-week-strip">
          {week.map((day, index) => {
            const key = toLocalDateKey(day)
            const count = stats?.dailyCounts[key] ?? 0
            return (
              <button
                key={key}
                type="button"
                className={cn(now && key === toLocalDateKey(now) && "is-today")}
                onClick={() => onSelectDay(day)}
                aria-label={`查看 ${key} 的完成记录`}
              >
                <span>周{weekdays[index]}</span>
                <strong>{day.getDate()}</strong>
                <span className="learning-week-strip__mark">{count ? <Check size={14} /> : <span />}</span>
                <small>{count ? `${count} 项完成` : "待点亮"}</small>
              </button>
            )
          })}
        </div>
      </section>

      <section className="learning-recent" aria-labelledby="learning-recent-title">
        <div className="learning-section-heading">
          <h2 id="learning-recent-title">最近完成</h2>
          <button type="button" onClick={() => onNavigate("activity")}>
            全部足迹 <ArrowRight size={14} />
          </button>
        </div>
        {recent.length ? (
          <CompletedList tasks={recent} progress={progress} onNavigate={onNavigate} />
        ) : (
          <EmptyRecord
            title="第一步，从今天开始"
            description="完成一个学习任务后，你的足迹就会出现在这里。"
          />
        )}
      </section>
    </div>
  )
}

function CompletedList({
  tasks,
  progress,
  onNavigate,
}: {
  tasks: typeof learningTasks
  progress: LearningProgress
  onNavigate: (view: LearningView) => void
}) {
  return (
    <ul className="learning-records">
      {tasks.map((task) => {
        const track = learningTracks.find((item) => item.id === task.trackId)!
        const unit = track.units.find((item) => item.id === task.unitId)!
        return (
          <li key={task.id} data-track={track.id}>
            <span className="learning-records__check">
              <Check size={14} />
            </span>
            <button type="button" onClick={() => onNavigate(track.id)}>
              <strong>
                {unit.title} · {task.label}
              </strong>
              <small>{track.title}</small>
            </button>
            <time dateTime={progress.completedAt[task.id]}>
              {progress.completedAt[task.id].slice(5).replace("-", "/")}
            </time>
            <ArrowUpRight size={14} />
          </li>
        )
      })}
    </ul>
  )
}

export function LearningMonth({
  date,
  now,
  progress,
  onChange,
  onSelect,
}: {
  date: Date
  now: Date | null
  progress: LearningProgress
  onChange: (date: Date) => void
  onSelect: (date: Date) => void
}) {
  const stats = getLearningStats(progress, date)
  return (
    <section className="learning-month" aria-label="月度学习热力日历">
      <div className="learning-month__heading">
        <h2>
          {date.getFullYear()} <span>/</span> {String(date.getMonth() + 1).padStart(2, "0")}
        </h2>
        <div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="上个月"
            onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() - 1, 1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="下个月"
            onClick={() => onChange(new Date(date.getFullYear(), date.getMonth() + 1, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="learning-month__weekdays">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="learning-month__days">
        {getMonthDays(date).map((day) => {
          const key = toLocalDateKey(day)
          const count = stats.dailyCounts[key] ?? 0
          return (
            <button
              type="button"
              key={key}
              data-level={Math.min(count, 4)}
              className={cn(
                day.getMonth() !== date.getMonth() && "is-outside",
                now && key === toLocalDateKey(now) && "is-today",
              )}
              onClick={() => onSelect(day)}
              aria-label={`${key}，完成 ${count} 项`}
              aria-current={now && key === toLocalDateKey(now) ? "date" : undefined}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
      <div className="learning-heatmap-legend">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i key={level} data-level={level} />
        ))}
        <span>多</span>
        <small>完成记录</small>
      </div>
    </section>
  )
}

export function LearningAside({
  now,
  progress,
  onSelectDay,
  onNavigate,
}: {
  now: Date | null
  progress: LearningProgress
  onSelectDay: (date: Date) => void
  onNavigate: (view: LearningView) => void
}) {
  const [month, setMonth] = useState<Date | null>(null)
  const stats = now ? getLearningStats(progress, now) : null
  const today = stats?.todayCompleted ?? 0
  const goalPercentage = Math.min(100, Math.round((today / progress.dailyGoal) * 100))
  return (
    <aside className="learning-aside" aria-label="学习概况">
      <div className="learning-aside__title">
        <span>我的学习节奏</span>
        <Sprout size={16} />
      </div>
      {now ? (
        <LearningMonth
          date={month ?? now}
          now={now}
          progress={progress}
          onChange={setMonth}
          onSelect={onSelectDay}
        />
      ) : (
        <p className="learning-loading">正在加载日历…</p>
      )}
      <section className="learning-today-goal">
        <div>
          <span>
            <Target size={15} /> 今日小目标
          </span>
          <small>{goalPercentage}%</small>
        </div>
        <strong>
          {today}
          <span> / {progress.dailyGoal} 项</span>
        </strong>
        <div
          className="learning-progressbar"
          role="progressbar"
          aria-label="今日目标"
          aria-valuenow={goalPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${goalPercentage}%` }} />
        </div>
      </section>
      <div className="learning-aside__stats">
        <div>
          <Flame size={16} />
          <strong>
            {stats?.streak ?? 0}
            <small>天</small>
          </strong>
          <span>连续学习</span>
        </div>
        <div>
          <Check size={16} />
          <strong>
            {stats?.monthCompleted ?? 0}
            <small>项</small>
          </strong>
          <span>本月完成</span>
        </div>
      </div>
      <section className="learning-next-directions">
        <div className="learning-section-heading">
          <h2>待完成</h2>
        </div>
        {learningTracks
          .filter((track) => getCurrentTask(track.id, progress))
          .slice(0, 3)
          .map((track) => {
            const task = getCurrentTask(track.id, progress)!
            return (
              <button type="button" key={track.id} data-track={track.id} onClick={() => onNavigate(track.id)}>
                <i />
                <span>
                  <small>{track.shortTitle}</small>
                  <strong>{task.label}</strong>
                </span>
                <ChevronRight size={14} />
              </button>
            )
          })}
      </section>
    </aside>
  )
}

export function LearningCalendar({
  date,
  now,
  progress,
  onSelectDay,
  onNavigate,
}: {
  date: Date
  now: Date
  progress: LearningProgress
  onSelectDay: (date: Date) => void
  onNavigate: (view: LearningView) => void
}) {
  const [mode, setMode] = useState("month")
  const stats = getLearningStats(progress, now)
  const selectedKey = toLocalDateKey(date)
  const selectedTasks = getCompletedTasks(progress, selectedKey)
  const move = (direction: number) =>
    onSelectDay(
      mode === "month"
        ? new Date(date.getFullYear(), date.getMonth() + direction, 1)
        : new Date(date.getFullYear(), date.getMonth(), date.getDate() + direction * 7),
    )
  const renderGrid = (days: Date[], weekly = false) => (
    <div className={cn("learning-calendar-grid", weekly && "is-week")}>
      {weekdays.map((day) => (
        <span className="learning-calendar-grid__weekday" key={day}>
          周{day}
        </span>
      ))}
      {days.map((day) => {
        const key = toLocalDateKey(day)
        const tasks = getCompletedTasks(progress, key)
        return (
          <button
            type="button"
            key={key}
            className={cn(
              "learning-calendar-day",
              key === selectedKey && "is-selected",
              key === toLocalDateKey(now) && "is-today",
              !weekly && day.getMonth() !== date.getMonth() && "is-outside",
            )}
            onClick={() => onSelectDay(day)}
            aria-pressed={key === selectedKey}
            aria-label={`${key}，完成 ${tasks.length} 项`}
          >
            <span className="learning-calendar-day__number">
              {day.getDate()}
              {key === toLocalDateKey(now) ? <small>今天</small> : null}
            </span>
            <span className="learning-calendar-day__tasks">
              {tasks.slice(0, weekly ? 5 : 2).map((task) => (
                <span key={task.id} data-track={task.trackId}>
                  {learningTracks.find((track) => track.id === task.trackId)?.shortTitle} · {task.label}
                </span>
              ))}
            </span>
            {tasks.length > (weekly ? 5 : 2) ? <small>+{tasks.length - (weekly ? 5 : 2)} 项</small> : null}
            <span className="learning-calendar-day__count">
              {stats.dailyCounts[key] ? `${stats.dailyCounts[key]} 项完成` : ""}
            </span>
          </button>
        )
      })}
    </div>
  )
  return (
    <div className="learning-view-stack">
      <section className="learning-calendar-panel">
        <Tabs value={mode} onValueChange={setMode}>
          <div className="learning-calendar-toolbar">
            <div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={mode === "month" ? "上一月" : "上一周"}
                onClick={() => move(-1)}
              >
                <ChevronLeft />
              </Button>
              <h2>
                {date.getFullYear()} 年 {date.getMonth() + 1} 月
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={mode === "month" ? "下一月" : "下一周"}
                onClick={() => move(1)}
              >
                <ChevronRight />
              </Button>
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => onSelectDay(now)}>
                今天
              </Button>
              <TabsList aria-label="日历视图">
                <TabsTrigger value="month">月视图</TabsTrigger>
                <TabsTrigger value="week">周视图</TabsTrigger>
              </TabsList>
            </div>
          </div>
          <p className="learning-calendar-caption">按完成日期回看学习记录，点击日期查看详情。</p>
          <TabsContent value="month">{renderGrid(getMonthDays(date))}</TabsContent>
          <TabsContent value="week">{renderGrid(getWeekDays(date), true)}</TabsContent>
        </Tabs>
      </section>
      <section className="learning-recent">
        <div className="learning-section-heading">
          <h2>
            {date.getMonth() + 1} 月 {date.getDate()} 日的学习记录
          </h2>
          <span>{selectedTasks.length} 项完成</span>
        </div>
        {selectedTasks.length ? (
          <CompletedList tasks={selectedTasks} progress={progress} onNavigate={onNavigate} />
        ) : (
          <EmptyRecord
            title="这一天，留一点空白"
            description="当天还没有完成记录。完成的任务会按日期自动汇总到日历中。"
          />
        )}
      </section>
    </div>
  )
}

export function LearningHistory({
  now,
  progress,
  onNavigate,
  onSelectDay,
}: {
  now: Date
  progress: LearningProgress
  onNavigate: (view: LearningView) => void
  onSelectDay: (date: Date) => void
}) {
  const stats = getLearningStats(progress, now)
  const days = getRecentDays(91, now)
  const completed = getCompletedTasks(progress)
  return (
    <div className="learning-view-stack">
      <Card>
        <CardHeader>
          <CardTitle>学习热力图</CardTitle>
          <CardDescription>近 13 周 · 每一个色块，都是积累的痕迹</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="learning-heatmap">
            {days.map((day) => (
              <button
                type="button"
                key={day.key}
                data-level={Math.min(stats.dailyCounts[day.key] ?? 0, 4)}
                aria-label={`${day.key}，完成 ${stats.dailyCounts[day.key] ?? 0} 项`}
                title={`${day.key}：${stats.dailyCounts[day.key] ?? 0} 项`}
                onClick={() => onSelectDay(day.date)}
              />
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <small>
            {days[0].key} — {days.at(-1)?.key}
          </small>
          <div className="learning-heatmap-legend">
            <span>少</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} data-level={level} />
            ))}
            <span>多</span>
          </div>
        </CardFooter>
      </Card>
      <section className="learning-recent">
        <div className="learning-section-heading">
          <h2>已完成的学习</h2>
          <span>{completed.length} 项记录</span>
        </div>
        {completed.length ? (
          <CompletedList tasks={completed} progress={progress} onNavigate={onNavigate} />
        ) : (
          <EmptyRecord title="还没有学习足迹" description="从一个小任务开始，记录属于自己的学习节奏。" />
        )}
      </section>
    </div>
  )
}

export function LearningNotes({
  articles,
  onNavigate,
}: {
  articles: LearningArticles
  onNavigate: (view: LearningView) => void
}) {
  return (
    <div className="learning-view-stack">
      {learningTracks.map((track) => (
        <section className="learning-note-group" data-track={track.id} key={track.id}>
          <div className="learning-section-heading">
            <h2>
              <BookOpen size={17} />
              {track.title}
            </h2>
            <button type="button" onClick={() => onNavigate(track.id)}>
              查看任务 <ArrowRight size={14} />
            </button>
          </div>
          {articles[track.id].length ? (
            <ul>
              {articles[track.id].map((article) => (
                <li key={article.href}>
                  <a href={article.href}>
                    <span>{article.title}</span>
                    <small>{article.updated}</small>
                    <ArrowUpRight size={15} />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRecord
              title="笔记正在路上"
              description="这个方向还没有关联文章，学习后记下思路和收获吧。"
            />
          )}
        </section>
      ))}
    </div>
  )
}
