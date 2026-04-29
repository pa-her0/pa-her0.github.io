"use client"

import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import {
  RESOURCE_TYPES,
  RESOURCE_TYPE_ORDER,
  type Study,
  type StudyResource,
  type StudyNote,
  type ResourceTypeKey,
} from "@/data/studies"
import { StatusMark } from "@/components/studies-shared"

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div
        className="text-[10px] text-muted-foreground/80 uppercase mb-1.5"
        style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
      >
        {label}
      </div>
      <div className="text-[13px] font-serif text-foreground/90">{value}</div>
    </div>
  )
}

type View = "trail" | "medium"

function ResourceRow({ r }: { r: StudyResource }) {
  const typeFull = RESOURCE_TYPES[r.type]?.full || r.type
  return (
    <article
      className="grid items-start gap-6 border-b border-border/50 study-resource-row"
      style={{ gridTemplateColumns: "60px 1fr 140px", padding: "26px 0" }}
    >
      <div className="text-center" style={{ paddingTop: 4 }}>
        <div
          className="font-serif text-foreground"
          style={{
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1,
            paddingBottom: 8,
            marginBottom: 8,
            borderBottom: "1px solid var(--border)",
          }}
        >
          {r.type}
        </div>
        <div
          className="text-[10px] text-muted-foreground font-mono"
          style={{ letterSpacing: 0.3 }}
        >
          {r.date}
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2.5 mb-1 flex-wrap">
          <span
            className="text-[11px] text-muted-foreground italic uppercase"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.12em" }}
          >
            {typeFull}
          </span>
          {r.tags.map((t) => (
            <span key={t} className="text-[11px] text-muted-foreground font-serif">
              · {t}
            </span>
          ))}
        </div>
        <h3
          className="font-serif font-semibold text-foreground"
          style={{ fontSize: 18, margin: "0 0 4px", letterSpacing: "-0.005em", lineHeight: 1.35 }}
        >
          {r.title}
        </h3>
        <div className="text-[12px] text-muted-foreground font-serif mb-3">
          {r.author}
          {r.year && <span> · {r.year}</span>}
        </div>
        {r.note && (
          <p
            className="font-serif text-foreground/80 m-0"
            style={{ fontSize: 14, lineHeight: 1.8, maxWidth: 600 }}
          >
            {r.note}
          </p>
        )}
      </div>

      <div
        className="text-right text-[11px] text-muted-foreground font-serif leading-relaxed study-resource-status"
        style={{ paddingTop: 6 }}
      >
        {r.status}
      </div>
    </article>
  )
}

function MarginNote({ n }: { n: StudyNote }) {
  return (
    <aside
      className="grid items-start gap-6 border-b border-border/50"
      style={{
        gridTemplateColumns: "60px 1fr 140px",
        padding: "20px 24px",
        marginInline: -24,
        background: "color-mix(in oklab, var(--primary), transparent 94%)",
        borderLeft: "2px solid var(--primary)",
        marginBlock: 4,
      }}
    >
      <div className="text-center" style={{ paddingTop: 4 }}>
        <div
          className="text-[10px] italic uppercase text-primary"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
        >
          Note
        </div>
        <div
          className="text-[10px] text-muted-foreground font-mono mt-1.5"
        >
          {n.date}
        </div>
      </div>
      <div style={{ gridColumn: "2 / 4" }}>
        <p
          className="font-serif italic text-foreground m-0"
          style={{ fontSize: 14.5, lineHeight: 1.85, maxWidth: 700 }}
        >
          「 {n.body} 」
        </p>
        <div className="mt-2 text-[11px] text-muted-foreground font-serif">—— 我的笔记</div>
      </div>
    </aside>
  )
}

function TrailView({ resources, notes }: { resources: StudyResource[]; notes: StudyNote[] }) {
  const merged = useMemo(() => {
    const notesByResource = new Map<string, StudyNote[]>()
    for (const n of notes) {
      const arr = notesByResource.get(n.after)
      if (arr) arr.push(n)
      else notesByResource.set(n.after, [n])
    }
    const arr: ({ kind: "resource"; data: StudyResource } | { kind: "note"; data: StudyNote })[] = []
    for (const r of resources) {
      arr.push({ kind: "resource", data: r })
      const ns = notesByResource.get(r.id)
      if (ns) for (const n of ns) arr.push({ kind: "note", data: n })
    }
    return arr
  }, [resources, notes])

  return (
    <div className="relative">
      {merged.map((item) =>
        item.kind === "resource" ? (
          <ResourceRow key={item.data.id} r={item.data} />
        ) : (
          <MarginNote key={item.data.id} n={item.data} />
        ),
      )}
    </div>
  )
}

function ByMediumView({ grouped }: { grouped: Partial<Record<ResourceTypeKey, StudyResource[]>> }) {
  const types = RESOURCE_TYPE_ORDER.filter((t) => grouped[t]?.length)
  return (
    <div>
      {types.map((t) => {
        const items = grouped[t] ?? []
        return (
          <section key={t} style={{ marginBottom: 48 }}>
            <div
              className="flex items-baseline gap-3.5 border-b border-border"
              style={{ paddingBottom: 14, marginBottom: 8 }}
            >
              <span className="font-serif font-semibold text-foreground" style={{ fontSize: 22 }}>
                {RESOURCE_TYPES[t]?.full}
              </span>
              <span
                className="text-[12px] italic text-muted-foreground/80"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
              >
                {RESOURCE_TYPES[t]?.en}
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
                style={{ padding: "18px 0", gridTemplateColumns: "1fr 140px" }}
              >
                <div>
                  <h3
                    className="font-serif font-semibold text-foreground"
                    style={{ fontSize: 17, margin: "0 0 4px" }}
                  >
                    {r.title}
                  </h3>
                  <div className="text-[12px] text-muted-foreground font-serif mb-2">
                    {r.author}
                    {r.year ? ` · ${r.year}` : ""}
                  </div>
                  {r.note && (
                    <p
                      className="font-serif text-foreground/80 m-0"
                      style={{ fontSize: 13.5, lineHeight: 1.75, maxWidth: 600 }}
                    >
                      {r.note}
                    </p>
                  )}
                </div>
                <div
                  className="text-right text-[11px] text-muted-foreground font-serif"
                  style={{ paddingTop: 4 }}
                >
                  <div>{r.status}</div>
                  <div className="mt-1.5 font-mono text-[10px]">{r.date}</div>
                </div>
              </article>
            ))}
          </section>
        )
      })}
    </div>
  )
}

export function StudyDetailView({
  study,
  resources,
  notes,
}: {
  study: Study
  resources: StudyResource[]
  notes: StudyNote[]
}) {
  const [view, setView] = useState<View>("trail")

  const grouped = useMemo(() => {
    const g: Partial<Record<ResourceTypeKey, StudyResource[]>> = {}
    resources.forEach((r) => {
      if (!g[r.type]) g[r.type] = []
      g[r.type]!.push(r)
    })
    return g
  }, [resources])

  const hasResources = resources.length > 0

  return (
    <div className="font-sans text-foreground">
      <main className="mx-auto" style={{ maxWidth: 1080, padding: "56px 64px 0" }}>
        {/* 面包屑 */}
        <div
          className="text-[12px] text-muted-foreground font-serif"
          style={{ marginBottom: 36 }}
        >
          <a href="/studies/" className="text-muted-foreground no-underline hover:text-foreground transition-colors">
            专题
          </a>
          <span className="mx-2 text-muted-foreground/70">›</span>
          <span className="text-foreground/85">{study.title}</span>
        </div>

        {/* 标题区 */}
        <header
          className="grid gap-[60px] border-b border-border study-detail-header"
          style={{ gridTemplateColumns: "1fr 280px", paddingBottom: 36 }}
        >
          <div>
            <div className="flex items-center gap-3.5 mb-4">
              <span
                className="text-[11px] text-muted-foreground italic uppercase"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
              >
                Study № {study.no} · {study.subtitle}
              </span>
            </div>

            <h1
              className="font-serif font-bold text-foreground"
              style={{ fontSize: 46, margin: "0 0 22px", letterSpacing: "-0.015em", lineHeight: 1.15 }}
            >
              {study.title}
            </h1>

            <blockquote
              className="font-serif italic text-foreground/85 m-0"
              style={{
                fontSize: 17,
                lineHeight: 1.6,
                marginBottom: 18,
                paddingLeft: 16,
                borderLeft: "2px solid var(--primary)",
              }}
            >
              {study.epigraph}
            </blockquote>

            <p
              className="font-serif text-foreground/80 m-0"
              style={{ fontSize: 15, lineHeight: 1.85, maxWidth: 580 }}
            >
              {study.intro}
            </p>
          </div>

          <aside
            className="flex flex-col gap-[22px]"
            style={{ paddingTop: 6, fontFamily: "'Noto Serif SC', Georgia, serif" }}
          >
            <Meta label="状态" value={<StatusMark status={study.status} />} />
            <Meta label="开题" value={study.started} />
            <Meta label="近期" value={study.updated} />
            <Meta label="领域" value={study.field} />
            <div style={{ marginTop: 6, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
              <div
                className="text-[10px] text-muted-foreground/80 uppercase mb-2.5"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.16em" }}
              >
                Resources
              </div>
              <div className="flex flex-col gap-1.5">
                {RESOURCE_TYPE_ORDER
                  .filter((t) => (study.counts[t] ?? 0) > 0)
                  .map((t) => (
                    <div
                      key={t}
                      className="flex justify-between text-[12px] text-foreground/85"
                    >
                      <span>{RESOURCE_TYPES[t]?.full || t}</span>
                      <span
                        className="text-muted-foreground"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {study.counts[t]}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </header>

        {hasResources ? (
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
            </div>

            {view === "trail" ? (
              <TrailView resources={resources} notes={notes} />
            ) : (
              <ByMediumView grouped={grouped} />
            )}
          </>
        ) : (
          <div
            className="text-center font-serif text-muted-foreground"
            style={{ padding: "80px 0", fontSize: 14, lineHeight: 1.85 }}
          >
            这个专题的资源还在整理中。<br />
            <span className="text-muted-foreground/70 text-[12px]">敬请期待。</span>
          </div>
        )}

        {/* 末尾·空白记号 */}
        <div
          className="text-center text-muted-foreground/70"
          style={{ padding: "80px 0 0", fontSize: 14, fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.5em" }}
        >
          · · ·
        </div>
        <div
          className="text-center font-serif text-muted-foreground"
          style={{ marginTop: 16, fontSize: 12 }}
        >
          这个专题还在进行中。最近一次更新于 {study.updated}。
        </div>
      </main>
    </div>
  )
}
