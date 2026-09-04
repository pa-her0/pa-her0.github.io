import { useMemo } from "react"
import { layoutTopics, type Topic } from "@/lib/topic-cloud"
import "@/styles/topic-cloud.css"

export function TopicCloud({ topics, coding = false }: { topics: Topic[]; coding?: boolean }) {
  const words = useMemo(() => layoutTopics(topics), [topics])
  return <div className="topic-cloud">
    {words.length ? <svg viewBox="0 0 360 224" role="img" aria-label={coding ? "编程语言时长词云" : "文章分类与标签词云：字号越大，相关文章越多"}>
      <title>{words.map(word => `${word.name}：${word.count}${coding ? " 小时" : " 篇"}`).join("；")}</title>
      {words.map((word, index) => <text key={word.name} x={word.x.toFixed(2)} y={word.y.toFixed(2)}
        textAnchor="middle" dominantBaseline="central" fontSize={word.size.toFixed(2)}
        className={`topic-cloud-word topic-cloud-tone-${index % 3}`}>
        <title>{`${word.name} · ${word.count}${coding ? " 小时" : " 篇文章"}`}</title>{word.name}
      </text>)}
    </svg> : <p className="bento-muted">发表文章后，这里会显示主题词云。</p>}
  </div>
}
