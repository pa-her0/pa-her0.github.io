"use client";

import { type CSSProperties, type ReactNode } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Grip,
  Trophy,
} from "lucide-react";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";
import { learningTracks, type LearningTrackId } from "@/data/learning-plan";
import {
  getTrackStats,
  type LearningArticleLink,
  type LearningProgress,
} from "@/lib/learning-progress";
import type { LearningInsights } from "@/lib/learning-insights";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WidgetItem } from "@/components/ui/draggable-widget-grid";
import { cn } from "@/lib/utils";

export const learningWidgets: WidgetItem[] = [
  { id: "activity", size: "wide", label: "学习足迹" },
  { id: "today", size: "sm", label: "每日目标" },
  { id: "rhythm", size: "sm", label: "学习节奏" },
  { id: "tracks", size: "wide", label: "学习清单" },
  { id: "notes", size: "wide", label: "知识笔记" },
  { id: "milestone", size: "sm", label: "下一里程碑" },
];

export function normalizeWidgetOrder(value: unknown): WidgetItem[] {
  if (!Array.isArray(value)) return learningWidgets;
  const ids = new Set<string>();
  const ordered: WidgetItem[] = [];
  for (const id of value) {
    const widget = learningWidgets.find((item) => item.id === id);
    if (widget && !ids.has(widget.id)) {
      ordered.push(widget);
      ids.add(widget.id);
    }
  }
  return [...ordered, ...learningWidgets.filter((item) => !ids.has(item.id))];
}

function WidgetShell({
  title,
  meta,
  children,
  footer,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("learning-widget", className)}>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardAction>
          {meta}
          <span
            className="learning-widget__grip"
            title="拖动调整位置；触屏可长按拖动"
            aria-hidden="true"
          >
            <Grip />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}

interface WidgetProps {
  insights: LearningInsights;
  progress: LearningProgress;
  articles: LearningArticleLink[];
  today: string;
  onOpenTrack: (id: LearningTrackId) => void;
  onOpenDay: (day: string | null) => void;
}

function ActivityWidget({ insights, today, onOpenDay }: WidgetProps) {
  const months = Array.from({ length: 26 }, (_, week) => {
    const date = insights.heatmap[week * 7].key;
    const previous = insights.heatmap[Math.max(0, (week - 1) * 7)].key;
    return week === 0 || date.slice(0, 7) !== previous.slice(0, 7)
      ? `${Number(date.slice(5, 7))}月`
      : "";
  });
  return (
    <WidgetShell
      title="学习足迹"
      meta="近半年"
      className="learning-widget--activity"
      footer={
        <>
          <span>{insights.heatmapActiveDays} 天有记录</span>
          <span className="learning-heatmap__legend">
            少
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} data-level={level} />
            ))}
            多
          </span>
        </>
      }
    >
      <div className="learning-widget__metric">
        <strong>{String(insights.heatmapCompleted).padStart(2, "0")}</strong>
        <span>项完成</span>
        <button
          type="button"
          className="learning-widget__text-action"
          onClick={() => onOpenDay(null)}
        >
          查看记录 <ArrowUpRight />
        </button>
      </div>
      <div className="learning-heatmap" aria-label="近半年每日完成记录">
        <div className="learning-heatmap__months" aria-hidden="true">
          {months.map((month, index) => (
            <span key={index}>{month}</span>
          ))}
        </div>
        <div className="learning-heatmap__days">
          {insights.heatmap.map((day) => (
            <button
              key={day.key}
              type="button"
              data-level={Math.min(day.count, 4)}
              data-future={day.future || undefined}
              data-today={day.key === today || undefined}
              disabled={day.future}
              tabIndex={day.count > 0 ? 0 : -1}
              title={`${day.key} · 完成 ${day.count} 项`}
              aria-label={`${day.key} 完成 ${day.count} 项，查看记录`}
              onClick={() => onOpenDay(day.key)}
            />
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

function TodayWidget({ progress, insights, today, onOpenDay }: WidgetProps) {
  const ratio = Math.min(1, insights.todayCompleted / progress.dailyGoal);
  return (
    <WidgetShell
      title="每日目标"
      meta={`${Number(today.slice(5, 7))}月${Number(today.slice(8))}日`}
      footer={
        <>
          <span className="learning-widget__status">
            <Flame />
            连续 {insights.streak} 天
          </span>
          <button
            className="learning-widget__text-action"
            type="button"
            onClick={() => onOpenDay(today)}
          >
            今日记录 <ArrowUpRight />
          </button>
        </>
      }
    >
      <div className="learning-widget__metric">
        <strong>{String(insights.todayCompleted).padStart(2, "0")}</strong>
        <span>/ {progress.dailyGoal} 项</span>
      </div>
      <p className="learning-widget__caption">
        {ratio >= 1
          ? "今日目标已完成"
          : `今天还差 ${Math.max(0, progress.dailyGoal - insights.todayCompleted)} 项`}
      </p>
      <div
        className="learning-goal"
        role="progressbar"
        aria-label="今日目标完成度"
        aria-valuemin={0}
        aria-valuemax={progress.dailyGoal}
        aria-valuenow={Math.min(insights.todayCompleted, progress.dailyGoal)}
      >
        {Array.from({ length: 30 }, (_, index) => (
          <span
            key={index}
            className={cn(index < Math.round(ratio * 30) && "is-filled")}
          />
        ))}
      </div>
      <div className="learning-goal__labels">
        <span>今日进度</span>
        <span>{Math.round(ratio * 100)}%</span>
      </div>
    </WidgetShell>
  );
}

const rhythmConfig = {
  count: { label: "完成任务", color: "var(--learning-chart)" },
};

function RhythmWidget({ insights, onOpenDay }: WidgetProps) {
  const difference = insights.weekDifference;
  const Trend = difference >= 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <WidgetShell
      title="学习节奏"
      meta="近 14 天"
      footer={
        <>
          <span
            className={cn(
              "learning-widget__trend",
              difference > 0 && "is-positive",
            )}
          >
            <Trend />
            较前 7 天 {difference > 0 ? "+" : ""}
            {difference} 项
          </span>
          <button
            className="learning-widget__text-action"
            type="button"
            onClick={() => onOpenDay(null)}
            aria-label="查看全部完成记录"
          >
            <ArrowUpRight />
          </button>
        </>
      }
    >
      <div className="learning-widget__metric">
        <strong>{String(insights.periodCompleted).padStart(2, "0")}</strong>
        <span>项完成</span>
      </div>
      <ChartContainer
        config={rhythmConfig}
        className="learning-rhythm"
        aria-label={`近十四天完成 ${insights.periodCompleted} 项任务`}
      >
        <BarChart
          accessibilityLayer
          data={insights.recentDays}
          margin={{ top: 12, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey="key"
            axisLine={false}
            tickLine={false}
            ticks={[
              insights.recentDays[1].key,
              insights.recentDays[7].key,
              insights.recentDays[12].key,
            ]}
            tickFormatter={(key: string) => key.slice(5).replace("-", "/")}
            tickMargin={10}
            minTickGap={0}
            interval={0}
          />
          <YAxis
            hide
            domain={[
              0,
              Math.max(4, ...insights.recentDays.map((day) => day.count)),
            ]}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar
            dataKey="count"
            radius={[5, 5, 5, 5]}
            minPointSize={3}
            isAnimationActive={false}
          >
            {insights.recentDays.map((day) => (
              <Cell
                key={day.key}
                fill={
                  day.count > 0
                    ? "var(--learning-chart)"
                    : "var(--learning-chart-empty)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </WidgetShell>
  );
}

function TracksWidget({ progress, onOpenTrack }: WidgetProps) {
  const stats = learningTracks.map((track) => ({
    track,
    ...getTrackStats(track.id, progress),
  }));
  const completed = stats.reduce((sum, track) => sum + track.completed, 0);
  const total = stats.reduce((sum, track) => sum + track.total, 0);
  return (
    <WidgetShell
      title="学习清单"
      meta={`${learningTracks.length} 个方向`}
      className="learning-widget--tracks"
      footer={
        <>
          <span>
            已完成 {completed} / {total} 项
          </span>
          <span>
            点击方向查看任务 <ArrowUpRight />
          </span>
        </>
      }
    >
      <div className="learning-track-list">
        {stats.map(({ track, completed, total, percentage }, index) => (
          <button
            key={track.id}
            type="button"
            onClick={() => onOpenTrack(track.id)}
            aria-label={`查看${track.title}，已完成 ${completed}/${total} 项`}
          >
            <span className="learning-track-list__number">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="learning-track-list__title">{track.title}</span>
            <span className="learning-track-list__bar" aria-hidden="true">
              <span style={{ width: `${percentage}%` }} />
            </span>
            <span className="learning-track-list__count">
              {completed}
              <small> / {total}</small>
            </span>
            <ChevronRight />
          </button>
        ))}
      </div>
    </WidgetShell>
  );
}

function NotesWidget({ articles }: WidgetProps) {
  return (
    <WidgetShell
      title="知识笔记"
      meta={<BookOpen aria-hidden="true" />}
      className="learning-widget--notes"
      footer={
        <>
          <span>与学习方向关联的文章</span>
          <a className="learning-widget__text-action" href="/notes/">
            全部笔记 <ArrowRight />
          </a>
        </>
      }
    >
      <div className="learning-widget__metric">
        <strong>{String(articles.length).padStart(2, "0")}</strong>
        <span>篇积累</span>
      </div>
      <div className="learning-note-list">
        {articles.slice(0, 3).map((article) => (
          <a key={article.href} href={article.href}>
            <span>{article.title}</span>
            <time dateTime={article.updated}>
              {article.updated.slice(5).replace("-", "/")}
            </time>
            <ArrowUpRight />
          </a>
        ))}
        {articles.length === 0 ? (
          <p className="learning-widget__caption">
            写下第一篇学习笔记，从这里开始积累。
          </p>
        ) : null}
      </div>
    </WidgetShell>
  );
}

function MilestoneWidget({ insights, onOpenTrack }: WidgetProps) {
  const milestone = insights.nextMilestone;
  const percentage = milestone?.percentage ?? 100;
  return (
    <WidgetShell
      title="下一里程碑"
      meta={<Trophy aria-hidden="true" />}
      className="learning-widget--milestone"
      footer={
        <>
          <span>
            {milestone
              ? `还差 ${milestone.total - milestone.completed} 项`
              : "所有任务组已完成"}
          </span>
          {milestone ? (
            <button
              type="button"
              className="learning-widget__text-action"
              onClick={() => onOpenTrack(milestone.track.id)}
            >
              继续学习 <ArrowUpRight />
            </button>
          ) : (
            <Check />
          )}
        </>
      }
    >
      <div className="learning-milestone">
        <div
          className="learning-milestone__ring"
          style={{ "--completion": percentage } as CSSProperties}
          role="img"
          aria-label={`任务组完成度 ${percentage}%`}
        >
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="51" />
            <circle
              cx="60"
              cy="60"
              r="51"
              pathLength="100"
              strokeDasharray={`${percentage} 100`}
            />
          </svg>
          <strong>
            {percentage}
            <small>%</small>
          </strong>
        </div>
        <div>
          <h3>{milestone?.unit.title ?? "全部达成"}</h3>
          <p>
            {milestone
              ? `已完成 ${milestone.completed} / ${milestone.total} 项`
              : "新的学习旅程等你开启"}
          </p>
        </div>
      </div>
    </WidgetShell>
  );
}

export function LearningWidget({ id, ...props }: WidgetProps & { id: string }) {
  switch (id) {
    case "activity":
      return <ActivityWidget {...props} />;
    case "today":
      return <TodayWidget {...props} />;
    case "rhythm":
      return <RhythmWidget {...props} />;
    case "tracks":
      return <TracksWidget {...props} />;
    case "notes":
      return <NotesWidget {...props} />;
    case "milestone":
      return <MilestoneWidget {...props} />;
    default:
      return null;
  }
}

export function LearningActivityDialog({
  day,
  open,
  onOpenChange,
  insights,
  onOpenTrack,
}: {
  day: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insights: LearningInsights;
  onOpenTrack: (id: LearningTrackId) => void;
}) {
  const records = insights.records.filter(
    (record) => day === null || record.date === day,
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="learning-history-dialog">
        <DialogHeader>
          <DialogTitle>{day ? `${day} 的学习记录` : "完成记录"}</DialogTitle>
          <DialogDescription>共完成 {records.length} 项任务</DialogDescription>
        </DialogHeader>
        <div className="learning-history-dialog__list">
          {records.map(({ task, unit, track, date }) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onOpenChange(false);
                onOpenTrack(track.id);
              }}
            >
              <Check />
              <span>
                <strong>
                  {unit.title} · {task.label}
                </strong>
                <small>{track.title}</small>
              </span>
              <time dateTime={date}>{date.slice(5).replace("-", "/")}</time>
              <ChevronRight />
            </button>
          ))}
          {records.length === 0 ? (
            <div className="learning-history-dialog__empty">
              <BookOpen />
              <p>这一天还没有完成记录</p>
              <span>完成任务后，足迹和图表会同步更新。</span>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
