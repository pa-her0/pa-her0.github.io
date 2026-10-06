"use client"

import { useEffect, useState } from "react"
import {
  ArrowUpRight,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Circle,
  LockKeyhole,
  NotebookPen,
  Save,
  Settings2,
  Sparkles,
  Undo2,
} from "lucide-react"
import {
  learningTracks,
  type LearningTask,
  type LearningTrack,
  type LearningTrackId,
  type LearningUnit,
} from "@/data/learning-plan"
import {
  getCurrentTask,
  getTrackStats,
  normalizeLearningProgress,
  toLocalDateKey,
  type LearningArticles,
  type LearningProgress,
} from "@/lib/learning-progress"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  LearningNavigation,
  LearningOverview,
  LearningAside,
  LearningCalendar,
  LearningHistory,
  LearningNotes,
  isLearningView,
  learningViewTitle,
  type LearningView,
} from "@/components/learning-board"

interface LearningDashboardProps {
  initialProgress: LearningProgress
  articles: LearningArticles
  editable?: boolean
}

type SaveState = "idle" | "saving" | "saved" | "error"

const localApiPath = "/__local/learning-progress"
const draftStorageKey = "jiely-learning-progress-draft-v1"

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
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
    <div
      className="learning-progressbar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </div>
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
    <li
      className={cn(
        "learning-task",
        complete && "is-complete",
        current && "is-current",
        compact && "is-compact",
      )}
    >
      {canEdit ? (
        <label className="learning-task__check">
          <input type="checkbox" checked={complete} onChange={() => onToggle(task.id)} />
          <span aria-hidden="true">{complete ? <Check size={13} /> : null}</span>
          <span className="sr-only">
            {task.label}：{complete ? "标记为未完成" : "标记为完成"}
          </span>
        </label>
      ) : (
        <span
          className="learning-task__status"
          aria-label={complete ? "已完成" : current ? "正在学习" : "待完成"}
        >
          {complete ? <Check size={13} /> : current ? <Sparkles size={13} /> : <Circle size={10} />}
        </span>
      )}

      <div className="learning-task__body">
        <div className="learning-task__titleline">
          <strong>{task.label}</strong>
          {current && !complete ? <span className="learning-task__current">当前</span> : null}
        </div>
      </div>

      <div className="learning-task__actions">
        {canEdit && !current && !complete ? (
          <button type="button" onClick={() => onSetCurrent(task.id)}>
            设为当前
          </button>
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
  index: number
  onToggle: (taskId: string) => void
  onSetCurrent: (taskId: string) => void
}

function UnitCard({ unit, progress, currentTaskId, canEdit, index, onToggle, onSetCurrent }: UnitCardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const completed = unit.tasks.filter((task) => progress.completedAt[task.id]).length
  const percentage = Math.round((completed / unit.tasks.length) * 100)
  const compact = unit.tasks.every((task) => !task.summary)

  return (
    <Collapsible className="learning-unit" open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="learning-unit__trigger">
        <span className="learning-unit__summary-main">
          <span className="learning-unit__index">{String(index + 1).padStart(2, "0")}</span>
          <span>
            <strong>{unit.title}</strong>
          </span>
        </span>
        <span className="learning-unit__summary-progress">
          <span>
            {completed}/{unit.tasks.length}
          </span>
          <ChevronDown size={17} aria-hidden="true" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="learning-unit__content">
        <ProgressBar value={percentage} label={`${unit.title}进度`} />
        <ul className={cn("learning-task-list", compact && "is-grid")}>
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
      </CollapsibleContent>
    </Collapsible>
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

function TrackContent({
  track,
  progress,
  articles,
  canEdit,
  onToggle,
  onSetCurrent,
  onNoteChange,
}: TrackContentProps) {
  const stats = getTrackStats(track.id, progress)
  const currentTask = getCurrentTask(track.id, progress)
  const currentContext = findTaskContext(currentTask?.id)

  return (
    <section className="learning-track" data-track={track.id} aria-labelledby={`track-${track.id}`}>
      <header className="learning-track__header">
        <div>
          <h2 id={`track-${track.id}`}>{track.title}</h2>
        </div>
        <a href={track.sourceHref} target="_blank" rel="noreferrer" className="learning-source-link">
          {track.sourceLabel}
          <ArrowUpRight size={15} />
        </a>
      </header>

      <div className="learning-track__status">
        <div>
          <span>当前进度</span>
          <strong>{stats.percentage}%</strong>
          <small>
            {stats.completed} / {stats.total} 项完成
          </small>
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
          <p>{progress.statusNoteByTrack[track.id] || "暂无记录"}</p>
        )}
      </div>

      <div className="learning-section-heading">
        <h3>章节与任务</h3>
      </div>
      <div className="learning-units">
        {track.units.map((unit, index) => (
          <UnitCard
            key={unit.id}
            unit={unit}
            progress={progress}
            currentTaskId={currentTask?.id}
            canEdit={canEdit}
            index={index}
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
              <li key={article.href}>
                <a href={article.href}>
                  {article.title}
                  <span>{article.updated}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>还没有关联文章。以后新增笔记时设置对应的学习路线，就会自动出现在这里。</p>
        )}
      </section>
    </section>
  )
}

export function LearningDashboard({ initialProgress, articles, editable = false }: LearningDashboardProps) {
  const [progress, setProgress] = useState(() => normalizeLearningProgress(initialProgress))
  const [view, setView] = useState<LearningView>("overview")
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [now, setNow] = useState<Date | null>(null)
  const [isLocal, setIsLocal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [loadError, setLoadError] = useState("")

  const activeTrack = learningTracks.find((track) => track.id === view)
  const canEdit = editable && isLocal

  const navigate = (next: LearningView) => {
    setView(next)
    if (window.location.hash !== "#" + next) window.history.pushState(null, "", "#" + next)
    if (view !== next)
      window.requestAnimationFrame(() => {
        const heading = document.querySelector<HTMLElement>(".learning-topbar h1")
        heading?.focus({ preventScroll: true })
        if (heading && heading.getBoundingClientRect().top < 80) heading.scrollIntoView({ block: "start" })
      })
  }

  const selectDay = (date: Date) => {
    setSelectedDay(date)
    navigate("calendar")
  }

  useEffect(() => {
    const syncView = () => {
      const hash = window.location.hash.slice(1)
      setView(isLearningView(hash) ? hash : "overview")
    }
    syncView()
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    window.addEventListener("hashchange", syncView)
    window.addEventListener("popstate", syncView)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("hashchange", syncView)
      window.removeEventListener("popstate", syncView)
    }
  }, [])

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

    return () => {
      cancelled = true
    }
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
      <LearningNavigation view={view} progress={progress} onNavigate={navigate} />
      <div className="learning-center">
        <header className="learning-topbar">
          <div>
            <h1 tabIndex={-1}>{learningViewTitle(view)}</h1>
            <span>
              {now
                ? now.toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "long" })
                : "记录学习，慢慢生长"}
            </span>
          </div>
          <div className="learning-topbar__actions">
            {isLocal && !editable ? (
              <a href={"/learning/manage/#" + view}>
                <Settings2 size={14} /> 管理进度
              </a>
            ) : null}
            {editable ? (
              <a href={"/learning/#" + view}>
                <ArrowUpRight size={14} /> 公开页面
              </a>
            ) : null}
          </div>
        </header>
        {editable ? (
          <div
            className={cn(
              "learning-admin-banner",
              !mounted ? "is-checking" : canEdit ? "is-local" : "is-locked",
            )}
          >
            <div>
              {mounted && canEdit ? <Settings2 size={19} /> : <LockKeyhole size={19} />}
              <p>
                <strong>{!mounted ? "正在确认管理环境" : canEdit ? "本地管理模式" : "线上只读模式"}</strong>
                <span>
                  {!mounted
                    ? "管理控件仅会在本机开发环境启用。"
                    : canEdit
                      ? "勾选任务后保存，进度会写入项目并随下次发布同步。"
                      : "管理功能只在 localhost / 127.0.0.1 开放，线上无法修改。"}
                </span>
              </p>
            </div>
            {canEdit ? (
              <div className="learning-admin-banner__actions">
                <label>
                  每日目标{" "}
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={progress.dailyGoal}
                    onChange={(event) =>
                      updateProgress((current) => ({ ...current, dailyGoal: Number(event.target.value) }))
                    }
                  />{" "}
                  项
                </label>
                <button type="button" onClick={discardDraft} disabled={!dirty}>
                  <Undo2 size={15} /> 撤销
                </button>
                <button
                  type="button"
                  className="is-primary"
                  onClick={saveProgress}
                  disabled={!dirty || saveState === "saving"}
                >
                  <Save size={15} />{" "}
                  {saveState === "saving" ? "保存中…" : saveState === "saved" ? "已保存" : "保存进度"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {loadError ? (
          <p className="learning-message is-error">{loadError}，当前显示已发布的进度快照。</p>
        ) : null}
        {saveState === "error" ? (
          <p className="learning-message is-error">保存没有成功，请确认当前页面由本地开发服务打开。</p>
        ) : null}

        <section className="learning-main" aria-label={learningViewTitle(view)}>
          {view === "overview" ? (
            <LearningOverview now={now} progress={progress} onNavigate={navigate} onSelectDay={selectDay} />
          ) : null}
          {view === "calendar" && now ? (
            <LearningCalendar
              date={selectedDay ?? now}
              now={now}
              progress={progress}
              onSelectDay={selectDay}
              onNavigate={navigate}
            />
          ) : null}
          {view === "activity" && now ? (
            <LearningHistory now={now} progress={progress} onNavigate={navigate} onSelectDay={selectDay} />
          ) : null}
          {view === "notes" ? <LearningNotes articles={articles} onNavigate={navigate} /> : null}
          {activeTrack ? (
            <>
              <button type="button" className="learning-back" onClick={() => navigate("overview")}>
                <ArrowLeft size={14} /> 返回学习总览
              </button>
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
            </>
          ) : null}
        </section>
        <footer className="learning-workspace-footer">
          <span>进度更新于 {progress.updatedAt.slice(0, 10)}</span>
        </footer>
      </div>
      <LearningAside now={now} progress={progress} onSelectDay={selectDay} onNavigate={navigate} />
    </div>
  )
}
