export interface Topic { name: string; count: number }
export interface CloudWord extends Topic { x: number; y: number; width: number; height: number; size: number }

// Deterministic bounded packing: identical layout during SSR and hydration.
export function layoutTopics(topics: Topic[]): CloudWord[] {
  const sorted = topics.filter(t => t.name.trim() && Number.isFinite(t.count) && t.count > 0)
    .slice().sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)).slice(0, 28)
  const max = sorted[0]?.count ?? 1
  const placed: CloudWord[] = []
  for (const topic of sorted) {
    const units = [...topic.name].reduce((sum, char) => sum + (/[^\x00-\x7F]/.test(char) ? 1.04 : .72), 0)
    const size = Math.min(14 + topic.count / max * 44, 310 / units)
    const width = units * size + 5
    // Reserve CJK ascent/descent as well as the visible glyph body.
    const height = size * 1.36 + 5
    for (let step = 0; step < 2400; step++) {
      const angle = step * .23
      const radius = step * .085
      const x = 180 + Math.cos(angle) * radius * 1.4
      const y = 112 + Math.sin(angle) * radius
      if (x - width / 2 < 4 || x + width / 2 > 356 || y - height / 2 < 4 || y + height / 2 > 220) continue
      if (placed.some(word => Math.abs(x - word.x) < (width + word.width) / 2 && Math.abs(y - word.y) < (height + word.height) / 2)) continue
      placed.push({ ...topic, x, y, width, height, size })
      break
    }
  }
  return placed
}
