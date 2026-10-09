import type { LearningTrack } from "@/data/learning-plan";
import type { LearningProgress } from "@/lib/learning-progress";

export interface ActivityDay {
  key: string;
  count: number;
  future: boolean;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function buildLearningInsights(
  progress: LearningProgress,
  tracks: LearningTrack[],
  today: string,
) {
  // Local noon avoids UTC date shifts and midnight daylight-saving boundaries.
  const current = new Date(`${today}T12:00:00`);
  const dailyCounts: Record<string, number> = {};
  const records = tracks
    .flatMap((track) =>
      track.units.flatMap((unit) =>
        unit.tasks.flatMap((task) => {
          const date = progress.completedAt[task.id];
          if (!date || date > today) return [];
          dailyCounts[date] = (dailyCounts[date] ?? 0) + 1;
          return [{ task, unit, track, date }];
        }),
      ),
    )
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || a.task.id.localeCompare(b.task.id),
    );

  const daysEndingAt = (count: number, end: Date): ActivityDay[] =>
    Array.from({ length: count }, (_, index) => {
      const date = new Date(end);
      date.setDate(date.getDate() - count + index + 1);
      const key = dateKey(date);
      return { key, count: dailyCounts[key] ?? 0, future: key > today };
    });

  const weekEnd = new Date(current);
  weekEnd.setDate(current.getDate() + ((7 - current.getDay()) % 7));
  const heatmap = daysEndingAt(26 * 7, weekEnd);
  const recentDays = daysEndingAt(14, current);
  const periodCompleted = recentDays.reduce((sum, day) => sum + day.count, 0);
  const previousWeek = recentDays
    .slice(0, 7)
    .reduce((sum, day) => sum + day.count, 0);
  const currentWeek = recentDays
    .slice(7)
    .reduce((sum, day) => sum + day.count, 0);

  const milestones = tracks.flatMap((track) =>
    track.units.map((unit) => {
      const completed = unit.tasks.filter(
        (task) =>
          progress.completedAt[task.id] &&
          progress.completedAt[task.id] <= today,
      ).length;
      return {
        track,
        unit,
        completed,
        total: unit.tasks.length,
        percentage: Math.round((completed / unit.tasks.length) * 100),
      };
    }),
  );
  const nextMilestone =
    milestones
      .filter((item) => item.completed < item.total)
      .sort((a, b) => b.percentage - a.percentage)[0] ?? null;

  let streak = 0;
  const cursor = new Date(current);
  if (!dailyCounts[today]) cursor.setDate(cursor.getDate() - 1);
  while (dailyCounts[dateKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    heatmap,
    heatmapCompleted: heatmap.reduce((sum, day) => sum + day.count, 0),
    heatmapActiveDays: heatmap.filter((day) => day.count > 0).length,
    recentDays,
    periodCompleted,
    weekDifference: currentWeek - previousWeek,
    todayCompleted: dailyCounts[today] ?? 0,
    streak,
    records,
    nextMilestone,
    completedMilestones: milestones.filter(
      (item) => item.completed === item.total,
    ).length,
  };
}

export type LearningInsights = ReturnType<typeof buildLearningInsights>;
