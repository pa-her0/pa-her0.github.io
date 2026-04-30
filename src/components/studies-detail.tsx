"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import type { ParsedResource, StudyData } from "@/lib/studies"
import { StatusMark } from "@/components/studies-shared"

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground/70 mb-1.5 font-serif-cn">
        {label}
      </div>
      <div className="text-[13px] font-serif-cn text-foreground/90">{value}</div>
    </div>
  )
}

type View = "trail" | "medium"

function formatCompactDate(iso: string): string {
  // "2026-04-25" → "2026·04·25"; "2026-04" → "2026·04"
  const m = iso.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/)
  if (!m) return iso
  return [m[1], m[2], m[3]].filter(Boolean).join("·")
}

// 左侧"印章"：单字（或两字）+ 一道细横线 + 日期
function TypeStamp({ type, date }: { type: string; date: string }) {
  return (
    <div className="text-center" style={{ paddingTop: 14 }}>
      <div
        className="font-serif-cn text-foreground"
        style={{
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1,
          paddingBottom: 8,
          marginBottom: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {type}
      </div>
      <div
        className="text-[10px] text-muted-foreground font-mono"
        style={{ letterSpacing: 0.3 }}
      >
        {formatCompactDate(date)}
      </div>
    </div>
  )
}

function ResourceRow({ r, noBorder }: { r: ParsedResource; noBorder?: boolean }) {
  return (
    <article
      className={cn(
        "grid items-start study-resource-row",
        !noBorder && "border-b border-border/50",
      )}
      style={{
        gridTemplateColumns: "72px 1fr auto",
        columnGap: 24,
        rowGap: 12,
        padding: "26px 0",
      }}
    >
      <div className="study-resource-stamp" style={{ gridColumn: 1, gridRow: "1 / -1" }}>
        <TypeStamp type={r.type} date={r.date} />
      </div>

      <div className="study-resource-head" style={{ gridColumn: 2, gridRow: 1 }}>
        {r.typeFull && (
          <div
            className="study-resource-meta font-serif-cn text-muted-foreground italic"
            style={{
              fontSize: 12,
              letterSpacing: "0.05em",
              marginBottom: 4,
            }}
          >
            {r.typeFull}
            <span className="study-resource-meta-date font-mono not-italic">
              {" · "}
              {formatCompactDate(r.date)}
            </span>
          </div>
        )}
        {!r.typeFull && (
          <div
            className="study-resource-meta-date-only font-mono text-muted-foreground"
            style={{ fontSize: 11, marginBottom: 4 }}
          >
            {formatCompactDate(r.date)}
          </div>
        )}
        <h3
          className="font-serif-cn font-bold text-foreground"
          style={{ fontSize: 19, margin: "0 0 4px", letterSpacing: "-0.005em", lineHeight: 1.35 }}
        >
          {r.titleMain}
        </h3>
        {(r.byline || r.year) && (
          <div
            className="font-serif-cn text-muted-foreground"
            style={{ fontSize: 12.5 }}
          >
            {r.byline}
            {r.byline && r.year ? " · " : ""}
            {r.year}
          </div>
        )}
      </div>

      {r.description && (
        <p
          className="font-serif-cn text-foreground/85 m-0 study-resource-desc"
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            fontWeight: 400,
            gridColumn: "2 / -1",
            gridRow: 2,
          }}
        >
          {r.description}
        </p>
      )}

      <div
        className="text-right text-[11px] text-muted-foreground font-serif-cn leading-relaxed study-resource-status"
        style={{ paddingTop: 8, gridColumn: 3, gridRow: 1 }}
      >
        {r.status ?? ""}
      </div>
    </article>
  )
}

function MarginNote({ date, body }: { date: string; body: string }) {
  return (
    <aside
      className="grid items-start study-note-row"
      style={{
        gridTemplateColumns: "72px 1fr",
        columnGap: 24,
        rowGap: 10,
        padding: "20px 24px",
        marginInline: -24,
        background: "var(--paper-warm)",
        borderLeft: "2px solid var(--primary)",
        marginBlock: 4,
      }}
    >
      <div
        className="study-note-label flex flex-col items-center gap-2"
        style={{ paddingTop: 4, gridColumn: 1, gridRow: 1 }}
      >
        <span
          className="text-[10px] italic uppercase text-primary"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
        >
          Note
        </span>
        <div
          className="text-[10px] text-muted-foreground font-mono"
          style={{ letterSpacing: 0.3 }}
        >
          {formatCompactDate(date)}
        </div>
      </div>
      <div className="study-note-body" style={{ gridColumn: 2, gridRow: 1 }}>
        <p
          className="font-serif-cn italic text-foreground m-0 whitespace-pre-line"
          style={{ fontSize: 14.5, lineHeight: 1.85, maxWidth: 700 }}
        >
          「 {body} 」
        </p>
      </div>
    </aside>
  )
}

function TrailView({ trail }: { trail: StudyData["trail"] }) {
  return (
    <div className="relative">
      {trail.map((item, i) => {
        const next = trail[i + 1]
        const nextIsNote = next && next.kind === "note"
        return item.kind === "resource" ? (
          <ResourceRow key={item.id} r={item} noBorder={nextIsNote} />
        ) : (
          <MarginNote key={item.id} date={item.date} body={item.body} />
        )
      })}
    </div>
  )
}

function ByMediumView({ resources }: { resources: ParsedResource[] }) {
  // 按 type 分组，组的出现顺序由首次遇到的资源决定
  const groups = useMemo(() => {
    const m = new Map<string, ParsedResource[]>()
    for (const r of resources) {
      const arr = m.get(r.type)
      if (arr) arr.push(r)
      else m.set(r.type, [r])
    }
    return Array.from(m.entries())
  }, [resources])

  return (
    <div>
      {groups.map(([type, items]) => (
        <section key={type} style={{ marginBottom: 48 }}>
          <div
            className="flex items-baseline gap-3.5 border-b border-border"
            style={{ paddingBottom: 14, marginBottom: 8 }}
          >
            <span
              className="font-serif-cn font-semibold text-foreground"
              style={{ fontSize: 22 }}
            >
              {type}
            </span>
            <span
              className="ml-auto text-[12px] text-muted-foreground"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {items.length}
            </span>
          </div>
          {items.map((r) => (
            <article
              key={r.id}
              className="grid items-start gap-6 border-b border-border/50 study-medium-row"
              style={{ padding: "16px 0", gridTemplateColumns: "1fr 140px" }}
            >
              <div>
                <h3
                  className="font-serif-cn font-bold text-foreground"
                  style={{ fontSize: 17, margin: 0, lineHeight: 1.35 }}
                >
                  {r.titleMain}
                </h3>
                {(r.byline || r.year) && (
                  <div
                    className="font-serif-cn text-muted-foreground"
                    style={{ fontSize: 12, marginTop: 4 }}
                  >
                    {r.byline}
                    {r.byline && r.year ? " · " : ""}
                    {r.year}
                  </div>
                )}
                {r.description && (
                  <p
                    className="font-serif-cn text-foreground/80 m-0"
                    style={{ fontSize: 13.5, lineHeight: 1.75, marginTop: 8 }}
                  >
                    {r.description}
                  </p>
                )}
              </div>
              <div
                className="text-right text-[11px] text-muted-foreground font-serif-cn"
                style={{ paddingTop: 4 }}
              >
                {r.status && <div>{r.status}</div>}
                <div className="mt-1 font-mono text-[10px]">{formatCompactDate(r.date)}</div>
              </div>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}

export function StudyDetailView({ study }: { study: StudyData }) {
  const [view, setView] = useState<View>("trail")

  const hasResources = study.resources.length > 0
  const hasContent = study.trail.length > 0

  return (
    <div className="font-sans text-foreground mx-auto w-full max-w-[1080px] px-5 pt-8 pb-16 md:px-16 md:pt-14 md:pb-16">
      <div>
        {/* 返回专题 */}
        <a
          href="/studies/"
          className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
        >
          <svg
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回专题
        </a>

        {/* 标题区 */}
        <header
          className="border-b border-border study-detail-header"
          style={{ paddingBottom: 36 }}
        >
          <div className="flex items-center gap-3.5 mb-4">
            <span
              className="text-[11px] text-muted-foreground italic uppercase"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
            >
              Study № {study.no}
              {study.subtitle ? ` · ${study.subtitle}` : ""}
            </span>
          </div>

          <h1
            className="font-serif-cn font-bold text-foreground"
            style={{ fontSize: 46, margin: "0 0 22px", letterSpacing: "-0.015em", lineHeight: 1.15 }}
          >
            {study.title}
          </h1>

          {study.epigraph && (
            <blockquote
              className="font-serif-cn italic text-foreground/85 m-0"
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                paddingLeft: 16,
                borderLeft: "2px solid var(--primary)",
              }}
            >
              {study.epigraph}
            </blockquote>
          )}

          <div
            className="flex flex-wrap gap-x-14 gap-y-6 mt-8"
            style={{ fontFamily: "var(--font-serif-cn)" }}
          >
            <Meta label="状态" value={<StatusMark status={study.status} />} />
            <Meta label="开题" value={study.started} />
            {study.updated && <Meta label="近期" value={study.updated} />}
            {study.field && <Meta label="领域" value={study.field} />}
          </div>
        </header>

        {hasContent ? (
          <>
            {/* 视图切换 */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "28px 0 18px" }}
            >
              <div
                className="text-[11px] uppercase text-muted-foreground"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
              >
                The Trail · 行进路线
              </div>
              {hasResources && (
                <div
                  className="flex border border-border rounded-full"
                  style={{ padding: 2 }}
                  role="group"
                  aria-label="资源视图"
                >
                  {(
                    [
                      ["trail", "按线索"],
                      ["medium", "按媒介"],
                    ] as [View, string][]
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      aria-pressed={view === v}
                      className={cn(
                        "border-0 cursor-pointer rounded-full transition-all font-sans",
                        view === v ? "bg-foreground text-background" : "bg-transparent text-muted-foreground",
                      )}
                      style={{ padding: "5px 14px", fontSize: 11, letterSpacing: 0.5 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {view === "trail" || !hasResources ? (
              <TrailView trail={study.trail} />
            ) : (
              <ByMediumView resources={study.resources} />
            )}
          </>
        ) : (
          <div
            className="text-center font-serif-cn text-muted-foreground"
            style={{ padding: "80px 0", fontSize: 14, lineHeight: 1.85 }}
          >
            这个专题的资源还在整理中。<br />
            <span className="text-muted-foreground/70 text-[12px]">敬请期待。</span>
          </div>
        )}

        {/* 末尾·空白记号 */}
        <div
          className="text-center text-muted-foreground/70"
          style={{ padding: "40px 0 0", fontSize: 14, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.5em" }}
        >
          · · ·
        </div>
        {study.updated && (
          <div
            className="text-center font-serif-cn text-muted-foreground"
            style={{ marginTop: 10, fontSize: 12 }}
          >
            这个专题还在进行中。最近一次更新于 {study.updated}。
          </div>
        )}
      </div>
    </div>
  )
}
