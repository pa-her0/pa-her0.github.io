import { learningTasks, learningTrackIds, legacyCompetitionTrackIds, learningNoteMaxLength, type LearningTrackId } from "../data/learning-plan"

export interface LearningProgress {
  version: 1
  updatedAt: string
  dailyGoal: number
  completedAt: Record<string, string>
  currentTaskByTrack: Partial<Record<LearningTrackId, string>>
  statusNoteByTrack: Partial<Record<LearningTrackId, string>>
}
export interface LearningArticleLink {
  title: string
  href: string
  updated: string
}

export type LearningArticles = Record<LearningTrackId, LearningArticleLink[]>

const taskIds = new Set(learningTasks.map((task) => task.id))
const taskTrackById = new Map(learningTasks.map((task) => [task.id, task.trackId]))
const legacyTrackLabels = { nowcoder: "牛客多校", hdu: "HDU 多校", "regional-vp": "区域赛 VP" }

export function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function normalizeLearningProgress(value: unknown): LearningProgress {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const completedSource = source.completedAt && typeof source.completedAt === "object"
    ? source.completedAt as Record<string, unknown>
    : {}
  const completedAt: Record<string, string> = {}

  Object.entries(completedSource).forEach(([taskId, date]) => {
    if (taskIds.has(taskId) && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      completedAt[taskId] = date
    }
  })

  const currentSource = source.currentTaskByTrack && typeof source.currentTaskByTrack === "object"
    ? source.currentTaskByTrack as Record<string, unknown>
    : {}
  const currentTaskByTrack: Partial<Record<LearningTrackId, string>> = {}
  learningTrackIds.forEach((trackId) => {
    const taskId = currentSource[trackId]
    if (typeof taskId === "string" && taskTrackById.get(taskId) === trackId) {
      currentTaskByTrack[trackId] = taskId
    }
  })
  if (!currentTaskByTrack.algorithm) {
    const previousTasks = legacyCompetitionTrackIds.map((id) => currentSource[id])
      .filter((id): id is string => typeof id === "string" && taskTrackById.get(id) === "algorithm")
    const current = previousTasks.find((id) => !completedAt[id]) ?? previousTasks[0]
    if (current) currentTaskByTrack.algorithm = current
  }

  const noteSource = source.statusNoteByTrack && typeof source.statusNoteByTrack === "object"
    ? source.statusNoteByTrack as Record<string, unknown>
    : {}
  const statusNoteByTrack: Partial<Record<LearningTrackId, string>> = {}
  learningTrackIds.forEach((trackId) => {
    const note = noteSource[trackId]
    if (typeof note === "string") {
      statusNoteByTrack[trackId] = note.slice(0, learningNoteMaxLength)
    }
  })
  if (typeof noteSource.algorithm !== "string") {
    const notes = legacyCompetitionTrackIds.flatMap((id) => {
      const note = noteSource[id]
      return typeof note === "string" && note.trim() ? [`${legacyTrackLabels[id]}：${note.slice(0, 240)}`] : []
    })
    if (notes.length) statusNoteByTrack.algorithm = notes.join("\n")
  }

  return {
    version: 1,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date().toISOString(),
    dailyGoal: Math.max(1, Math.min(20, Number(source.dailyGoal) || 1)),
    completedAt,
    currentTaskByTrack,
    statusNoteByTrack,
  }
}

export function getTrackStats(trackId: LearningTrackId, progress: LearningProgress) {
  const trackTasks = learningTasks.filter((task) => task.trackId === trackId)
  const completed = trackTasks.filter((task) => progress.completedAt[task.id]).length
  const total = trackTasks.length
  return { completed, total, percentage: total === 0 ? 0 : Math.round((completed / total) * 100) }
}

export function getCurrentTask(trackId: LearningTrackId, progress: LearningProgress) {
  const trackTasks = learningTasks.filter((task) => task.trackId === trackId)
  const selectedId = progress.currentTaskByTrack[trackId]
  return trackTasks.find((task) => task.id === selectedId && !progress.completedAt[task.id])
    ?? trackTasks.find((task) => !progress.completedAt[task.id])
}

export function getLearningStats(progress: LearningProgress, now = new Date()) {
  const completed = Object.keys(progress.completedAt).length
  const total = learningTasks.length
  const today = toLocalDateKey(now)
  const month = today.slice(0, 7)
  const dailyCounts = Object.values(progress.completedAt).reduce<Record<string, number>>((counts, date) => {
    counts[date] = (counts[date] ?? 0) + 1
    return counts
  }, {})

  const todayCompleted = dailyCounts[today] ?? 0
  const monthCompleted = Object.entries(dailyCounts)
    .filter(([date]) => date.startsWith(month))
    .reduce((sum, [, count]) => sum + count, 0)

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!dailyCounts[toLocalDateKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (dailyCounts[toLocalDateKey(cursor)]) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return {
    completed,
    total,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    todayCompleted,
    monthCompleted,
    streak,
    dailyCounts,
  }
}

export function getRecentDays(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    date.setDate(date.getDate() - (count - index - 1))
    return { key: toLocalDateKey(date), date }
  })
}
