import { cn } from "@/lib/utils"
import type { StudyStatus } from "@/lib/studies"

type StatusStyle = {
  dotClass?: string
  dotStyle?: React.CSSProperties
  textClass: string
  ring?: boolean
}

const STATUS_STYLES: Record<StudyStatus, StatusStyle> = {
  在读:   { dotClass: "bg-primary", textClass: "text-foreground" },
  沉淀中: { dotStyle: { background: "var(--muted-foreground)" }, textClass: "text-muted-foreground" },
  暂搁:   { dotStyle: { background: "transparent" }, textClass: "text-muted-foreground/70", ring: true },
  已结:   { dotStyle: { background: "var(--foreground)" }, textClass: "text-muted-foreground" },
}

export function StatusMark({ status }: { status: StudyStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-sans text-[11px] tracking-wider", s.textClass)}>
      <span
        className={cn("inline-block h-[6px] w-[6px] rounded-full box-border", s.dotClass)}
        style={{
          ...s.dotStyle,
          border: s.ring ? "1px solid var(--border)" : undefined,
        }}
        aria-hidden="true"
      />
      {status}
    </span>
  )
}
