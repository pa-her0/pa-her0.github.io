import test from "node:test"
import assert from "node:assert/strict"
import { resolvePostUpdatedDate, articleDisplayDate } from "../src/lib/post-updated.ts"

const date = value => new Date(value)
test("latest update wins, even when Git history is older than frontmatter", () => {
  assert.equal(resolvePostUpdatedDate(date("2025-01-01"), date("2026-09-01"), date("2026-08-01")).toISOString().slice(0, 10), "2026-09-01")
  assert.equal(resolvePostUpdatedDate(date("2025-01-01"), date("2026-08-01"), date("2026-09-01")).toISOString().slice(0, 10), "2026-09-01")
})
test("missing/invalid updates fall back to publication", () => {
  const published = date("2026-03-01")
  assert.deepEqual(resolvePostUpdatedDate(published), published)
  assert.deepEqual(resolvePostUpdatedDate(published, date("invalid"), date("2025-01-01")), published)
})
test("older article updated recently sorts before newly created article", () => {
  const entries = [
    { published: date("2026-08-01"), updated: null },
    { published: date("2025-01-01"), updated: date("2026-09-01") },
  ].sort((a, b) => resolvePostUpdatedDate(b.published, b.updated) - resolvePostUpdatedDate(a.published, a.updated))
  assert.equal(entries[0].published.getUTCFullYear(), 2025)
})
test("card date and year grouping use the update, with a creation fallback", () => {
  assert.equal(articleDisplayDate({ date: "2025-01-01", updated: "2026-09-01" }), "2026-09-01")
  assert.equal(articleDisplayDate({ date: "2025-01-01", updated: "" }), "2025-01-01")
})
