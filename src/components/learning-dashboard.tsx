"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  Circle,
  Flame,
  Gauge,
  LockKeyhole,
  NotebookPen,
  Save,
  Settings2,
  Sparkles,
  Target,
  Undo2,
} from "lucide-react"
import { learningTasks, learningTracks, type LearningTask, type LearningTrack, type LearningTrackId, type LearningUnit } from "@/data/learning-plan"
import {
  getCurrentTask,
  getLearningStats,
  getRecentDays,
  getTrackStats,
  normalizeLearningProgress,
  toLocalDateKey,
  type LearningArticles,
  type LearningProgress,
} from "@/lib/learning-progress"

interface LearningDashboardProps {
  initialProgress: LearningProgress
  articles: LearningArticles
  editable?: boolean
}

type SaveState = "idle" | "saving" | "saved" | "error"

const localApiPath = "/__local/learning-progress"
const draftStorageKey = "jiely-learning-progress-draft-v1"
const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"]

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

function getWeekDays(now: Date) {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const offset = (monday.getDay() + 6) % 7
  monday.setDate(monday.getDate() - offset)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date
  })
}

function findTaskContext(taskId?: string) {
  if (!taskId) return undefined
  for (const track of learningTracks) {
    for (const unit of track.units) {
      const task = unit.tasks.find((candidate) => candidate.id === taskId)
      if (task) return { track, unit, task }
    }
  }
  return undefined
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="learning-progressbar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, suffix }: { icon: typeof Target; label: string; value: string | number; suffix?: string }) {
  return (
    <article className="learning-metric">
      <span className="learning-metric__icon"><Icon size={17} strokeWidth={1.8} /></span>
      <div><strong>{value}</strong>{suffix ? <small>{suffix}</small> : null}</div>
      <p>{label}</p>
    </article>
  )
}

interface TaskRowProps {
  task: LearningTask
  complete: boolean
  current: boolean
  canEdit: boolean
  compact: boolean
  onToggle: (taskId: string) => void
  onSetCurrent: (taskId: string) => void
}

function TaskRow({ task, complete, current, canEdit, compact, onToggle, onSetCurrent }: TaskRowProps) {
  return (
    <li className={`learning-task${complete ? " is-complete" : ""}${current ? " is-current" : ""}${compact ? " is-compact" : ""}`}>
      {canEdit ? (
        <label className="learning-task__check">
          <input type="checkbox" checked={complete} onChange={() => onToggle(task.id)} />
          <span aria-hidden="true">{complete ? <Check size={13} /> : null}</span>
          <span className="sr-only">{complete ? "标记为未完成" : "标记为完成"}</span>
        </label>
      ) : (
        <span className="learning-task__status" aria-label={complete ? "已完成" : current ? "正在学习" : "待完成"}>
          {complete ? <Check size={13} /> : current ? <Sparkles size={13} /> : <Circle size={10} />}
        </span>
      )}

      <div className="learning-task__body">
        <div className="learning-task__titleline">
          <strong>{task.label}</strong>
          {current && !complete ? <span className="learning-task__current">当前</span> : null}
        </div>
        {task.summary ? <p>{task.summary}</p> : null}
      </div>

      <div className="learning-task__actions">
        {canEdit && !current && !complete ? (
          <button type="button" onClick={() => onSetCurrent(task.id)}>设为当前</button>
        ) : null}
        {task.href ? (
          <a href={task.href} target="_blank" rel="noreferrer" aria-label={`打开${task.label}`}>
            <ArrowUpRight size={15} />
          </a>
        ) : null}
      </div>
    </li>
  )
}

interface UnitCardProps {
  unit: LearningUnit
  progress: LearningProgress
  currentTaskId?: string
  canEdit: boolean
  defaultOpen: boolean
  onToggle: (taskId: string) => void
  onSetCurrent: (taskId: string) => void
}

function UnitCard({ unit, progress, currentTaskId, canEdit, defaultOpen, onToggle, onSetCurrent }: UnitCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const completed = unit.tasks.filter((task) => progress.completedAt[task.id]).length
  const percentage = Math.round((completed / unit.tasks.length) * 100)
  const compact = unit.tasks.every((task) => !task.summary)

  return (
    <details className="learning-unit" open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary>
        <span className="learning-unit__summary-main">
          <span className="learning-unit__index">{String(unit.title.match(/\d+/)?.[0] ?? "·").padStart(2, "0")}</span>
          <span><strong>{unit.title}</strong><small>{unit.description}</small></span>
        </span>
        <span className="learning-unit__summary-progress">
          <span>{completed}/{unit.tasks.length}</span>
          <ChevronDown size={17} aria-hidden="true" />
        </span>
      </summary>
      <div className="learning-unit__content">
        <ProgressBar value={percentage} label={`${unit.title}进度`} />
        <ul className={`learning-task-list${compact ? " is-grid" : ""}`}>
          {unit.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              complete={Boolean(progress.completedAt[task.id])}
              current={currentTaskId === task.id}
              canEdit={canEdit}
              compact={compact}
              onToggle={onToggle}
              onSetCurrent={onSetCurrent}
            />
          ))}
        </ul>
        <a className="learning-unit__source" href={unit.href} target="_blank" rel="noreferrer">
          查看本章节资料 <ArrowUpRight size={14} />
        </a>
      </div>
    </details>
  )
}

interface TrackContentProps {
  track: LearningTrack
  progress: LearningProgress
  articles: LearningArticles
  canEdit: boolean
  onToggle: (taskId: string) => void
  onSetCurrent: (trackId: LearningTrackId, taskId: string) => void
  onNoteChange: (trackId: LearningTrackId, note: string) => void
}

function TrackContent({ track, progress, articles, canEdit, onToggle, onSetCurrent, onNoteChange }: TrackContentProps) {
  const stats = getTrackStats(track.id, progress)
  const currentTask = getCurrentTask(track.id, progress)
  const currentContext = findTaskContext(currentTask?.id)

  return (
    <section className="learning-track" data-track={track.id} aria-labelledby={`track-${track.id}`}>
      <header className="learning-track__header">
        <div>
          <p>{track.eyebrow}</p>
          <h2 id={`track-${track.id}`}>{track.title}</h2>
          <div className="learning-track__description">{track.description}</div>
        </div>
        <a href={track.sourceHref} target="_blank" rel="noreferrer" className="learning-source-link">
          {track.sourceLabel}<ArrowUpRight size={15} />
        </a>
      </header>

      <div className="learning-track__status">
        <div>
          <span>当前进度</span>
          <strong>{stats.percentage}%</strong>
          <small>{stats.completed} / {stats.total} 项完成</small>
        </div>
        <div className="learning-track__now">
          <span>正在进行</span>
          <strong>{currentContext?.unit.title ?? "本路线已完成"}</strong>
          <small>{currentTask?.label ?? "可以开始下一段旅程了"}</small>
        </div>
      </div>
      <ProgressBar value={stats.percentage} label={`${track.title}总进度`} />

      <div className="learning-track__note">
        <NotebookPen size={17} />
        {canEdit ? (
          <textarea
            value={progress.statusNoteByTrack[track.id] ?? ""}
            maxLength={240}
            rows={2}
            aria-label={`${track.title}进度说明`}
            placeholder="写下当前阶段、下一步或需要复盘的内容……"
            onChange={(event) => onNoteChange(track.id, event.target.value)}
          />
        ) : (
          <p>{progress.statusNoteByTrack[track.id] || "按计划逐项推进，完成后同步整理学习笔记。"}</p>
        )}
      </div>

      <div className="learning-units">
        {track.units.map((unit, index) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            progress={progress}
            currentTaskId={currentTask?.id}
            canEdit={canEdit}
            defaultOpen={index === 0 || unit.id === currentContext?.unit.id}
            onToggle={onToggle}
            onSetCurrent={(taskId) => onSetCurrent(track.id, taskId)}
          />
        ))}
      </div>

      <section className="learning-inline-articles" aria-labelledby={`articles-${track.id}`}>
        <div>
          <BookOpen size={18} />
          <h3 id={`articles-${track.id}`}>关联笔记</h3>
        </div>
        {articles[track.id].length > 0 ? (
          <ul>
            {articles[track.id].slice(0, 4).map((article) => (
              <li key={article.href}><a href={article.href}>{article.title}<span>{article.updated}</span></a></li>
            ))}
          </ul>
        ) : (
          <p>还没有关联文章。以后新增笔记时设置对应的学习路线，就会自动出现在这里。</p>
        )}
      </section>
    </section>
  )
}

interface TodayPanelProps {
  now: Date | null
  progress: LearningProgress
  activeTrackId: LearningTrackId
}

function TodayPanel({ now, progress, activeTrackId }: TodayPanelProps) {
  const datedStats = now ? getLearningStats(progress, now) : null
  const weekDays = now ? getWeekDays(now) : []
  const currentTask = getCurrentTask(activeTrackId, progress)
  const context = findTaskContext(currentTask?.id)
  const goalProgress = datedStats ? Math.min(100, Math.round((datedStats.todayCompleted / progress.dailyGoal) * 100)) : 0

  return (
    <section className="learning-sidecard learning-today" aria-labelledby="today-title">
      <div className="learning-sidecard__heading">
        <div><CalendarDays size={17} /><h2 id="today-title">今日学习</h2></div>
        <span>{now ? toLocalDateKey(now).slice(5).replace("-", "/") : "--/--"}</span>
      </div>

      <div className="learning-week" aria-label="本周日期">
        {weekDays.length > 0 ? weekDays.map((date) => {
          const isToday = now ? toLocalDateKey(date) === toLocalDateKey(now) : false
          return (
            <div key={toLocalDateKey(date)} className={isToday ? "is-today" : ""}>
              <span>{weekdayLabels[date.getDay()]}</span><strong>{String(date.getDate()).padStart(2, "0")}</strong>
            </div>
          )
        }) : Array.from({ length: 7 }, (_, index) => <div key={index} className="is-loading"><span>·</span><strong>--</strong></div>)}
      </div>

      <div className="learning-daily-goal">
        <div>
          <span><Flame size={16} /> 每日 {progress.dailyGoal} 项</span>
          <strong>{datedStats?.todayCompleted ?? 0}/{progress.dailyGoal}</strong>
        </div>
        <ProgressBar value={goalProgress} label="今日目标进度" />
      </div>

      <article className="learning-next-task">
        <span>接下来</span>
        <strong>{currentTask?.label ?? "路线已完成"}</strong>
        <p>{context?.unit.title ?? "为自己安排一段新的学习旅程"}</p>
        {currentTask?.href ? <a href={currentTask.href} target="_blank" rel="noreferrer">开始学习 <ArrowUpRight size={14} /></a> : null}
      </article>

      <div className="learning-today__stats">
        <div><span>连续学习</span><strong>{datedStats?.streak ?? 0}<small>天</small></strong></div>
        <div><span>本月完成</span><strong>{datedStats?.monthCompleted ?? 0}<small>项</small></strong></div>
        <div><span>今日完成</span><strong>{datedStats?.todayCompleted ?? 0}<small>项</small></strong></div>
      </div>
    </section>
  )
}

function ActivityPanel({ now, progress }: { now: Date | null; progress: LearningProgress }) {
  const stats = now ? getLearningStats(progress, now) : null
  const days = now ? getRecentDays(91, now) : []
  const monthLabels = days.reduce<{ key: string; label: string }[]>((labels, day) => {
    const key = day.key.slice(0, 7)
    if (!labels.some((item) => item.key === key)) labels.push({ key, label: `${day.date.getMonth() + 1}月` })
    return labels
  }, [])

  return (
    <section className="learning-sidecard learning-activity" aria-labelledby="activity-title">
      <div className="learning-sidecard__heading">
        <div><Gauge size={17} /><h2 id="activity-title">学习足迹</h2></div>
        <span>近 13 周</span>
      </div>
      <div className="learning-heatmap" aria-label="近十三周完成记录">
        {days.length > 0 ? days.map((day) => {
          const count = stats?.dailyCounts[day.key] ?? 0
          const level = count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 5 ? 3 : 4
          return <span key={day.key} data-level={level} title={`${day.key}：${count} 项`} />
        }) : Array.from({ length: 91 }, (_, index) => <span key={index} data-level={0} />)}
      </div>
      <div className="learning-heatmap__months">
        {(monthLabels.length > 0 ? monthLabels : [{ key: "a", label: "" }, { key: "b", label: "" }, { key: "c", label: "" }]).map((item) => <span key={item.key}>{item.label}</span>)}
      </div>
    </section>
  )
}

function DistributionPanel({ progress }: { progress: LearningProgress }) {
  const totalCompleted = Object.keys(progress.completedAt).length
  const total = learningTasks.length
  const percentage = total === 0 ? 0 : Math.round((totalCompleted / total) * 100)

  return (
    <section className="learning-sidecard learning-distribution" aria-labelledby="distribution-title">
      <div className="learning-sidecard__heading">
        <div><Target size={17} /><h2 id="distribution-title">路线进度</h2></div>
        <span>{totalCompleted}/{total}</span>
      </div>
      <div className="learning-distribution__body">
        <div className="learning-ring" style={{ "--ring-progress": `${percentage * 3.6}deg` } as React.CSSProperties}>
          <strong>{percentage}%</strong><span>总进度</span>
        </div>
        <ul>
          {learningTracks.map((track) => {
            const stats = getTrackStats(track.id, progress)
            return <li key={track.id} data-track={track.id}><span>{track.shortTitle}</span><strong>{stats.percentage}%</strong></li>
          })}
        </ul>
      </div>
    </section>
  )
}

export function LearningDashboard({ initialProgress, articles, editable = false }: LearningDashboardProps) {
  const [progress, setProgress] = useState(() => normalizeLearningProgress(initialProgress))
  const [activeTrackId, setActiveTrackId] = useState<LearningTrackId>("nowcoder")
  const [now, setNow] = useState<Date | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [loadError, setLoadError] = useState("")

  const activeTrack = learningTracks.find((track) => track.id === activeTrackId) ?? learningTracks[0]
  const canEdit = editable && isLocal
  const completedCount = Object.keys(progress.completedAt).length
  const overallPercentage = Math.round((completedCount / learningTasks.length) * 100)
  const datedStats = useMemo(() => now ? getLearningStats(progress, now) : null, [now, progress])

  useEffect(() => {
    const local = isLocalHostname(window.location.hostname)
    setIsLocal(local)
    setMounted(true)
    setNow(new Date())
    if (!local) return

    let cancelled = false
    fetch(localApiPath, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("本地进度服务暂不可用")
        return response.json()
      })
      .then((serverProgress) => {
        if (cancelled) return
        if (editable) {
          const draft = window.localStorage.getItem(draftStorageKey)
          if (draft) {
            try {
              const parsed = JSON.parse(draft) as { progress?: unknown }
              setProgress(normalizeLearningProgress(parsed.progress))
              setDirty(true)
              return
            } catch {
              window.localStorage.removeItem(draftStorageKey)
            }
          }
        }
        setProgress(normalizeLearningProgress(serverProgress))
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message)
      })

    return () => { cancelled = true }
  }, [editable])

  const updateProgress = (updater: (current: LearningProgress) => LearningProgress) => {
    if (!canEdit) return
    setProgress((current) => {
      const next = normalizeLearningProgress(updater(current))
      window.localStorage.setItem(draftStorageKey, JSON.stringify({ version: 1, progress: next }))
      return next
    })
    setDirty(true)
    setSaveState("idle")
  }

  const toggleTask = (taskId: string) => {
    updateProgress((current) => {
      const completedAt = { ...current.completedAt }
      if (completedAt[taskId]) delete completedAt[taskId]
      else completedAt[taskId] = toLocalDateKey()
      return { ...current, completedAt }
    })
  }

  const setCurrentTask = (trackId: LearningTrackId, taskId: string) => {
    updateProgress((current) => ({
      ...current,
      currentTaskByTrack: { ...current.currentTaskByTrack, [trackId]: taskId },
    }))
  }

  const setTrackNote = (trackId: LearningTrackId, note: string) => {
    updateProgress((current) => ({
      ...current,
      statusNoteByTrack: { ...current.statusNoteByTrack, [trackId]: note },
    }))
  }

  const saveProgress = async () => {
    if (!canEdit || !dirty) return
    setSaveState("saving")
    try {
      const response = await fetch(localApiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      })
      if (!response.ok) throw new Error("保存失败")
      const saved = normalizeLearningProgress(await response.json())
      window.localStorage.removeItem(draftStorageKey)
      setProgress(saved)
      setDirty(false)
      setSaveState("saved")
    } catch {
      setSaveState("error")
    }
  }

  const discardDraft = async () => {
    if (!canEdit) return
    window.localStorage.removeItem(draftStorageKey)
    setSaveState("idle")
    try {
      const response = await fetch(localApiPath, { cache: "no-store" })
      if (!response.ok) throw new Error("读取失败")
      setProgress(normalizeLearningProgress(await response.json()))
      setDirty(false)
    } catch {
      setSaveState("error")
    }
  }

  return (
    <div className="learning-dashboard">
      <header className="learning-hero">
        <div className="learning-hero__copy">
          <p className="learning-hero__eyebrow"><Sparkles size={15} /> LEARNING COMPASS</p>
          <h1>学习进度</h1>
          <p>把题目、章节和笔记放在同一张路线图里。每天推进一点，也能看见长期积累的形状。</p>
          <div className="learning-hero__actions">
            {isLocal && !editable ? <a href="/learning/manage/"><Settings2 size={16} /> 打开本地管理页</a> : null}
            {editable ? <a href="/learning/"><ArrowUpRight size={16} /> 查看公开页面</a> : null}
            <span>数据更新于 {progress.updatedAt.slice(0, 10)}</span>
          </div>
        </div>
        <div className="learning-hero__score" aria-label={`总学习进度 ${overallPercentage}%`}>
          <div className="learning-hero__ring" style={{ "--hero-progress": `${overallPercentage * 3.6}deg` } as React.CSSProperties}>
            <strong>{overallPercentage}<small>%</small></strong>
          </div>
          <p><span>{completedCount}</span> / {learningTasks.length} 项已完成</p>
        </div>
      </header>

      {editable ? (
        <div className={`learning-admin-banner${!mounted ? " is-checking" : canEdit ? " is-local" : " is-locked"}`}>
          <div>
            {mounted && canEdit ? <Settings2 size={19} /> : <LockKeyhole size={19} />}
            <p>
              <strong>{!mounted ? "正在确认管理环境" : canEdit ? "本地管理模式" : "线上只读模式"}</strong>
              <span>{!mounted ? "管理控件仅会在本机开发环境启用。" : canEdit ? "勾选任务后保存，进度会写入项目并随下次发布同步。" : "管理功能只在 localhost / 127.0.0.1 开放，线上无法修改。"}</span>
            </p>
          </div>
          {canEdit ? (
            <div className="learning-admin-banner__actions">
              <label>每日目标 <input type="number" min={1} max={20} value={progress.dailyGoal} onChange={(event) => updateProgress((current) => ({ ...current, dailyGoal: Number(event.target.value) }))} /> 项</label>
              <button type="button" onClick={discardDraft} disabled={!dirty}><Undo2 size={15} /> 撤销</button>
              <button type="button" className="is-primary" onClick={saveProgress} disabled={!dirty || saveState === "saving"}><Save size={15} /> {saveState === "saving" ? "保存中…" : saveState === "saved" ? "已保存" : "保存进度"}</button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loadError ? <p className="learning-message is-error">{loadError}，当前显示已发布的进度快照。</p> : null}
      {saveState === "error" ? <p className="learning-message is-error">保存没有成功，请确认当前页面由本地开发服务打开。</p> : null}

      <section className="learning-metrics" aria-label="学习统计">
        <MetricCard icon={Target} label="全部学习项" value={learningTasks.length} suffix="项" />
        <MetricCard icon={Check} label="已经完成" value={completedCount} suffix="项" />
        <MetricCard icon={Flame} label="连续学习" value={datedStats?.streak ?? 0} suffix="天" />
        <MetricCard icon={CalendarDays} label="本月完成" value={datedStats?.monthCompleted ?? 0} suffix="项" />
      </section>

      <nav className="learning-track-tabs" aria-label="学习路线">
        {learningTracks.map((track) => {
          const stats = getTrackStats(track.id, progress)
          return (
            <button key={track.id} type="button" data-track={track.id} aria-current={activeTrackId === track.id ? "page" : undefined} onClick={() => setActiveTrackId(track.id)}>
              <span>{track.shortTitle}</span><strong>{stats.percentage}%</strong><small>{stats.completed}/{stats.total}</small>
            </button>
          )
        })}
      </nav>

      <div className="learning-layout">
        <section className="learning-main" aria-label={`${activeTrack.title} 学习任务`}>
          <TrackContent
            key={activeTrack.id}
            track={activeTrack}
            progress={progress}
            articles={articles}
            canEdit={canEdit}
            onToggle={toggleTask}
            onSetCurrent={setCurrentTask}
            onNoteChange={setTrackNote}
          />
        </section>
        <aside className="learning-sidebar" aria-label="每日学习概览">
          <TodayPanel now={now} progress={progress} activeTrackId={activeTrackId} />
          <ActivityPanel now={now} progress={progress} />
          <DistributionPanel progress={progress} />
        </aside>
      </div>
    </div>
  )
}
