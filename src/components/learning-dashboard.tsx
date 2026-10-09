"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  Circle,
  LockKeyhole,
  Save,
  Settings2,
  Sparkles,
  Undo2,
} from "lucide-react";
import {
  learningTracks,
  type LearningTask,
  type LearningTrack,
  type LearningTrackId,
  type LearningUnit,
} from "@/data/learning-plan";
import {
  getCurrentTask,
  getTrackStats,
  normalizeLearningProgress,
  toLocalDateKey,
  type LearningProgress,
  type LearningArticleLink,
} from "@/lib/learning-progress";
import { buildLearningInsights } from "@/lib/learning-insights";
import { Button } from "@/components/ui/button";
import {
  DraggableWidgetGrid,
  type WidgetItem,
} from "@/components/ui/draggable-widget-grid";
import {
  LearningWidget,
  LearningActivityDialog,
  learningWidgets,
  normalizeWidgetOrder,
} from "@/components/learning-widgets";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface LearningDashboardProps {
  initialProgress: LearningProgress;
  articles: LearningArticleLink[];
  initialDay: string;
  editable?: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

const localApiPath = "/__local/learning-progress";
const draftStorageKey = "jiely-learning-progress-draft-v1";
const orderStorageKey = "jiely-learning-widget-order-v2";
const defaultTrackOrder = learningTracks.map((track) => track.id);

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <span
      className="learning-progressbar"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <span style={{ width: `${value}%` }} />
    </span>
  );
}

interface TaskItemProps {
  task: LearningTask;
  complete: boolean;
  current: boolean;
  canEdit: boolean;
  onToggle: () => void;
  onSetCurrent: () => void;
}

function TaskItem({
  task,
  complete,
  current,
  canEdit,
  onToggle,
  onSetCurrent,
}: TaskItemProps) {
  return (
    <li
      className={cn(
        "learning-detail-task",
        complete && "is-complete",
        current && "is-current",
      )}
    >
      {canEdit ? (
        <label className="learning-detail-task__check">
          <input type="checkbox" checked={complete} onChange={onToggle} />
          <span aria-hidden="true">{complete ? <Check /> : null}</span>
          <span className="sr-only">
            {task.label}：{complete ? "标记为未完成" : "标记为完成"}
          </span>
        </label>
      ) : (
        <span className="learning-detail-task__state" aria-hidden="true">
          {complete ? <Check /> : current ? <Sparkles /> : <Circle />}
        </span>
      )}

      <span className="learning-detail-task__label">{task.label}</span>

      {canEdit && !complete && !current ? (
        <Button type="button" variant="ghost" size="sm" onClick={onSetCurrent}>
          设为当前
        </Button>
      ) : null}
      {task.href ? (
        <Button asChild variant="ghost" size="icon-sm">
          <a
            href={task.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`打开${task.label}`}
          >
            <ArrowUpRight />
          </a>
        </Button>
      ) : null}
    </li>
  );
}

function UnitGroup({
  track,
  unit,
  progress,
  canEdit,
  onToggle,
  onSetCurrent,
}: {
  track: LearningTrack;
  unit: LearningUnit;
  progress: LearningProgress;
  canEdit: boolean;
  onToggle: (taskId: string) => void;
  onSetCurrent: (trackId: LearningTrackId, taskId: string) => void;
}) {
  const currentTask = getCurrentTask(track.id, progress);
  const completed = unit.tasks.filter(
    (task) => progress.completedAt[task.id],
  ).length;
  const percentage = Math.round((completed / unit.tasks.length) * 100);

  return (
    <section
      className="learning-detail-unit"
      aria-labelledby={`unit-${unit.id}`}
    >
      <header>
        <div>
          <h3 id={`unit-${unit.id}`}>{unit.title}</h3>
          <span>
            {completed}/{unit.tasks.length}
          </span>
        </div>
        <ProgressBar value={percentage} label={`${unit.title}进度`} />
      </header>
      <ul>
        {unit.tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            complete={Boolean(progress.completedAt[task.id])}
            current={currentTask?.id === task.id}
            canEdit={canEdit}
            onToggle={() => onToggle(task.id)}
            onSetCurrent={() => onSetCurrent(track.id, task.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function TrackDialog({
  track,
  progress,
  canEdit,
  open,
  onOpenChange,
  onToggle,
  onSetCurrent,
  onNoteChange,
}: {
  track?: LearningTrack;
  progress: LearningProgress;
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (taskId: string) => void;
  onSetCurrent: (trackId: LearningTrackId, taskId: string) => void;
  onNoteChange: (trackId: LearningTrackId, note: string) => void;
}) {
  const stats = track ? getTrackStats(track.id, progress) : null;
  const currentTask = track ? getCurrentTask(track.id, progress) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {track && stats ? (
        <DialogContent className="learning-detail-dialog">
          <DialogHeader>
            <DialogTitle>{track.title}</DialogTitle>
            <DialogDescription>
              {track.units.length} 个任务组 · {stats.total} 项任务
            </DialogDescription>
          </DialogHeader>

          <div className="learning-detail-dialog__summary">
            <div>
              <span>当前进度</span>
              <strong>{stats.percentage}%</strong>
              <small>
                {stats.completed} / {stats.total} 项完成
              </small>
            </div>
            <div>
              <span>正在进行</span>
              <strong>{currentTask?.label ?? "全部完成"}</strong>
              <small>
                {currentTask ? "继续完成当前任务" : "这一方向已经完成"}
              </small>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={track.sourceHref} target="_blank" rel="noreferrer">
                {track.sourceLabel}
                <ArrowUpRight data-icon="inline-end" />
              </a>
            </Button>
          </div>

          <ProgressBar
            value={stats.percentage}
            label={`${track.title}总进度`}
          />

          {(canEdit || progress.statusNoteByTrack[track.id]) && (
            <div className="learning-detail-dialog__note">
              <span>当前记录</span>
              {canEdit ? (
                <textarea
                  value={progress.statusNoteByTrack[track.id] ?? ""}
                  maxLength={240}
                  rows={2}
                  aria-label={`${track.title}进度说明`}
                  placeholder="记录当前阶段或下一步……"
                  onChange={(event) =>
                    onNoteChange(track.id, event.target.value)
                  }
                />
              ) : (
                <p>{progress.statusNoteByTrack[track.id]}</p>
              )}
            </div>
          )}

          <div className="learning-detail-dialog__scroll">
            <div className="learning-detail-dialog__units">
              {track.units.map((unit) => (
                <UnitGroup
                  key={unit.id}
                  track={track}
                  unit={unit}
                  progress={progress}
                  canEdit={canEdit}
                  onToggle={onToggle}
                  onSetCurrent={onSetCurrent}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

export function LearningDashboard({
  initialProgress,
  articles,
  initialDay,
  editable = false,
}: LearningDashboardProps) {
  const [progress, setProgress] = useState(() =>
    normalizeLearningProgress(initialProgress),
  );
  const [widgets, setWidgets] = useState(learningWidgets);
  const [layoutVersion, setLayoutVersion] = useState(0);
  const [today, setToday] = useState(initialDay);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityDay, setActivityDay] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] =
    useState<LearningTrackId | null>(null);
  const [isLocal, setIsLocal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [loadError, setLoadError] = useState("");

  const canEdit = editable && isLocal;
  const selectedTrack = learningTracks.find(
    (track) => track.id === selectedTrackId,
  );
  const insights = useMemo(
    () => buildLearningInsights(progress, learningTracks, today),
    [progress, today],
  );

  useEffect(() => {
    const updateDay = () => setToday(toLocalDateKey());
    updateDay();
    const timer = window.setInterval(updateDay, 60_000);
    document.addEventListener("visibilitychange", updateDay);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateDay);
    };
  }, []);

  useEffect(() => {
    const local = isLocalHostname(window.location.hostname);
    setIsLocal(local);
    setMounted(true);

    try {
      setWidgets(
        normalizeWidgetOrder(
          JSON.parse(window.localStorage.getItem(orderStorageKey) ?? "[]"),
        ),
      );
      setLayoutVersion((version) => version + 1);
    } catch {
      // The default layout also works when browser storage is unavailable.
    }

    const syncTrackFromHash = () => {
      const hash = window.location.hash.slice(1) as LearningTrackId;
      setSelectedTrackId(defaultTrackOrder.includes(hash) ? hash : null);
    };
    syncTrackFromHash();
    window.addEventListener("hashchange", syncTrackFromHash);
    window.addEventListener("popstate", syncTrackFromHash);

    if (!local) {
      return () => {
        window.removeEventListener("hashchange", syncTrackFromHash);
        window.removeEventListener("popstate", syncTrackFromHash);
      };
    }

    let cancelled = false;
    fetch(localApiPath, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("本地进度服务暂不可用");
        return response.json();
      })
      .then((serverProgress) => {
        if (cancelled) return;
        if (editable) {
          const draft = window.localStorage.getItem(draftStorageKey);
          if (draft) {
            try {
              const parsed = JSON.parse(draft) as { progress?: unknown };
              setProgress(normalizeLearningProgress(parsed.progress));
              setDirty(true);
              return;
            } catch {
              window.localStorage.removeItem(draftStorageKey);
            }
          }
        }
        setProgress(normalizeLearningProgress(serverProgress));
      })
      .catch((error: Error) => {
        if (!cancelled) setLoadError(error.message);
      });

    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", syncTrackFromHash);
      window.removeEventListener("popstate", syncTrackFromHash);
    };
  }, [editable]);

  const persistLayout = (next: WidgetItem[]) => {
    setWidgets(next);
    try {
      window.localStorage.setItem(
        orderStorageKey,
        JSON.stringify(next.map((item) => item.id)),
      );
    } catch {
      /* Session-only layout when storage is unavailable. */
    }
  };

  const resetLayout = () => {
    persistLayout(learningWidgets);
    setLayoutVersion((version) => version + 1);
  };

  const openActivity = (day: string | null) => {
    setActivityDay(day);
    setActivityOpen(true);
  };

  const openTrack = (trackId: LearningTrackId) => {
    setSelectedTrackId(trackId);
    window.history.pushState(null, "", `#${trackId}`);
  };

  const closeTrack = () => {
    setSelectedTrackId(null);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  };

  const updateProgress = (
    updater: (current: LearningProgress) => LearningProgress,
  ) => {
    if (!canEdit) return;
    setProgress((current) => {
      const next = normalizeLearningProgress(updater(current));
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({ version: 1, progress: next }),
      );
      return next;
    });
    setDirty(true);
    setSaveState("idle");
  };

  const toggleTask = (taskId: string) => {
    updateProgress((current) => {
      const completedAt = { ...current.completedAt };
      if (completedAt[taskId]) delete completedAt[taskId];
      else completedAt[taskId] = toLocalDateKey();
      return { ...current, completedAt };
    });
  };

  const setCurrentTask = (trackId: LearningTrackId, taskId: string) => {
    updateProgress((current) => ({
      ...current,
      currentTaskByTrack: { ...current.currentTaskByTrack, [trackId]: taskId },
    }));
  };

  const setTrackNote = (trackId: LearningTrackId, note: string) => {
    updateProgress((current) => ({
      ...current,
      statusNoteByTrack: { ...current.statusNoteByTrack, [trackId]: note },
    }));
  };

  const saveProgress = async () => {
    if (!canEdit || !dirty) return;
    setSaveState("saving");
    try {
      const response = await fetch(localApiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
      if (!response.ok) throw new Error("保存失败");
      const saved = normalizeLearningProgress(await response.json());
      window.localStorage.removeItem(draftStorageKey);
      setProgress(saved);
      setDirty(false);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  };

  const discardDraft = async () => {
    if (!canEdit) return;
    window.localStorage.removeItem(draftStorageKey);
    setSaveState("idle");
    try {
      const response = await fetch(localApiPath, { cache: "no-store" });
      if (!response.ok) throw new Error("读取失败");
      setProgress(normalizeLearningProgress(await response.json()));
      setDirty(false);
    } catch {
      setSaveState("error");
    }
  };

  return (
    <section className="learning-board" aria-labelledby="learning-board-title">
      <header className="learning-board__header">
        <div className="learning-board__heading">
          <h1 id="learning-board-title">
            学习进度<span className="learning-board__heading-dot">.</span>
          </h1>
          <p>把每一次学习，留下一点痕迹。</p>
        </div>

        <div className="learning-board__actions">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={resetLayout}
          >
            <Undo2 data-icon="inline-start" />
            恢复默认
          </Button>
          {isLocal && !editable ? (
            <Button asChild variant="ghost" size="sm">
              <a href="/learning/manage/">
                <Settings2 data-icon="inline-start" />
                管理进度
              </a>
            </Button>
          ) : null}
          {editable ? (
            <Button asChild variant="ghost" size="sm">
              <a href="/learning/">
                公开页面
                <ArrowUpRight data-icon="inline-end" />
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      {editable ? (
        <div
          className={cn(
            "learning-board__admin",
            !mounted || !canEdit ? "is-locked" : "is-local",
          )}
        >
          <div>
            {mounted && canEdit ? <Settings2 /> : <LockKeyhole />}
            <span>
              {!mounted
                ? "正在确认管理环境"
                : canEdit
                  ? "本地管理模式"
                  : "线上只读模式"}
            </span>
          </div>
          {canEdit ? (
            <div className="learning-board__admin-actions">
              <label>
                每日目标
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={progress.dailyGoal}
                  onChange={(event) =>
                    updateProgress((current) => ({
                      ...current,
                      dailyGoal: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={discardDraft}
                disabled={!dirty}
              >
                <Undo2 data-icon="inline-start" />
                撤销
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={saveProgress}
                disabled={!dirty || saveState === "saving"}
              >
                <Save data-icon="inline-start" />
                {saveState === "saving"
                  ? "保存中…"
                  : saveState === "saved"
                    ? "已保存"
                    : "保存进度"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {loadError ? (
        <p className="learning-message">
          {loadError}，当前显示已发布的进度快照。
        </p>
      ) : null}
      {saveState === "error" ? (
        <p className="learning-message">
          保存失败，请确认页面由本地开发服务打开。
        </p>
      ) : null}

      <DraggableWidgetGrid
        key={layoutVersion}
        items={widgets}
        onChange={persistLayout}
        editable
        maxColumns={3}
        cellSize={320}
        rowHeight={306}
        gap={18}
        radius={26}
        className="learning-board__widgets"
        renderItem={(item) => (
          <LearningWidget
            id={item.id}
            insights={insights}
            progress={progress}
            articles={articles}
            today={today}
            onOpenTrack={openTrack}
            onOpenDay={openActivity}
          />
        )}
      />

      <footer className="learning-board__footer">
        <span>进度更新于 {progress.updatedAt.slice(0, 10)}</span>
        <span>拖动卡片空白处调整布局 · 自动保存</span>
      </footer>

      <LearningActivityDialog
        day={activityDay}
        open={activityOpen}
        onOpenChange={setActivityOpen}
        insights={insights}
        onOpenTrack={openTrack}
      />

      <TrackDialog
        track={selectedTrack}
        progress={progress}
        canEdit={canEdit}
        open={Boolean(selectedTrack)}
        onOpenChange={(open) => {
          if (!open) closeTrack();
        }}
        onToggle={toggleTask}
        onSetCurrent={setCurrentTask}
        onNoteChange={setTrackNote}
      />
    </section>
  );
}
