import test from "node:test";
import assert from "node:assert/strict";
import { buildLearningInsights } from "../src/lib/learning-insights.ts";
import { learningTracks } from "../src/data/learning-plan.ts";
import type { LearningProgress } from "../src/lib/learning-progress.ts";

function progress(completedAt: Record<string, string>): LearningProgress {
  return {
    version: 1,
    updatedAt: "2026-10-07T00:00:00Z",
    dailyGoal: 10,
    completedAt,
    currentTaskByTrack: {},
    statusNoteByTrack: {},
  };
}

test("activity aggregates real dated tasks, excludes unknown and future records, and crosses months", () => {
  const result = buildLearningInsights(
    progress({
      "nowcoder-1-a": "2026-09-30",
      "nowcoder-1-c": "2026-10-01",
      "nowcoder-1-e": "2026-10-01",
      "nowcoder-1-f": "2026-10-06",
      "nowcoder-1-g": "2026-10-08",
      "not-a-task": "2026-10-07",
    }),
    learningTracks,
    "2026-10-07",
  );
  assert.equal(result.periodCompleted, 4);
  assert.equal(result.todayCompleted, 0);
  assert.equal(result.heatmapActiveDays, 3);
  assert.equal(result.streak, 1);
  assert.equal(result.recentDays[0].key, "2026-09-24");
  assert.equal(result.recentDays.at(-1)?.key, "2026-10-07");
  assert.equal(result.heatmap.length, 26 * 7);
  assert.equal(new Date(`${result.heatmap[0].key}T12:00:00`).getDay(), 1);
  assert.deepEqual(
    result.heatmap.filter((day) => day.future).map((day) => day.key),
    ["2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"],
  );
  assert.equal(
    result.heatmap.find((day) => day.key === "2026-10-01")?.count,
    2,
  );
});

test("milestone picks the closest incomplete group and skips completed groups", () => {
  const completed = Object.fromEntries(
    learningTracks[0].units[0].tasks
      .slice(0, 6)
      .map((task) => [task.id, "2026-10-06"]),
  );
  const result = buildLearningInsights(
    progress(completed),
    learningTracks,
    "2026-10-07",
  );
  assert.equal(result.nextMilestone?.unit.id, "nowcoder-1");
  assert.equal(result.nextMilestone?.completed, 6);
  assert.equal(result.nextMilestone?.total, 7);
  assert.equal(result.nextMilestone?.percentage, 86);
  completed[learningTracks[0].units[0].tasks[6].id] = "2026-10-07";
  const next = buildLearningInsights(
    progress(completed),
    learningTracks,
    "2026-10-07",
  );
  assert.equal(next.completedMilestones, 1);
  assert.equal(next.nextMilestone?.unit.id, "nowcoder-2");
  assert.equal(next.streak, 2);
});

test("empty progress has honest zero charts; completed plans have no next milestone", () => {
  const empty = buildLearningInsights(
    progress({}),
    learningTracks,
    "2026-01-01",
  );
  assert.equal(empty.heatmapCompleted, 0);
  assert.equal(empty.streak, 0);
  assert.ok(empty.recentDays.every((day) => day.count === 0));
  const all = Object.fromEntries(
    learningTracks.flatMap((track) =>
      track.units.flatMap((unit) =>
        unit.tasks.map((task) => [task.id, "2025-12-31"]),
      ),
    ),
  );
  assert.equal(
    buildLearningInsights(progress(all), learningTracks, "2026-01-01")
      .nextMilestone,
    null,
  );
});
