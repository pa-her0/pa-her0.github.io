import test from "node:test"
import assert from "node:assert/strict"
import { layoutTopics } from "../src/lib/topic-cloud.ts"

test("word cloud is deterministic, bounded and collision-free", () => {
  const input = Array.from({ length: 28 }, (_, i) => ({ name: `主题${i}`, count: 28 - i }))
  const words = layoutTopics(input)
  assert.deepEqual(words, layoutTopics(input))
  assert.ok(words.length > 0)
  assert.equal(input[0].count, 28)
  for (const a of words) {
    assert.ok(a.x - a.width / 2 >= 0 && a.x + a.width / 2 <= 360)
    assert.ok(a.y - a.height / 2 >= 0 && a.y + a.height / 2 <= 224)
    for (const b of words) {
      if (a === b) continue
      assert.ok(Math.abs(a.x - b.x) >= (a.width + b.width) / 2 || Math.abs(a.y - b.y) >= (a.height + b.height) / 2)
    }
  }
})

test("empty and invalid counts do not generate misleading topics", () => {
  assert.deepEqual(layoutTopics([]), [])
  assert.deepEqual(layoutTopics([{ name: "", count: 2 }, { name: "无", count: 0 }, { name: "未知", count: NaN }]), [])
})

test("higher counts receive larger type", () => {
  const words = layoutTopics([{ name: "学习", count: 22 }, { name: "生活", count: 9 }, { name: "开发", count: 1 }])
  assert.equal(words.length, 3)
  assert.ok(words[0].size > words[1].size && words[1].size > words[2].size)
})
