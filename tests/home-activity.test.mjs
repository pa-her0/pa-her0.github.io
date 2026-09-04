import test from 'node:test'
import assert from 'node:assert/strict'
import { buildHomeActivity } from '../src/lib/home-activity.ts'

test('yearly snake board uses 53 complete weeks with real counts', () => {
  const result = buildHomeActivity(['2025-09-10', '2026-08-01', '2020-01-01'], new Date('2026-09-04T00:00:00Z'), 53)
  assert.equal(result.days.length, 371)
  assert.equal(result.total, 2)
  assert.equal(new Date(result.days[0].date).getUTCDay(), 0)
})

test('calendar has 18 Sunday-first weeks and excludes future/out-of-window publications', () => {
  const result = buildHomeActivity(['2026-09-04', '2026-09-04', '2026-09-05', '2020-01-01'], new Date('2026-09-04T00:00:00Z'))
  assert.equal(result.days.length, 126)
  assert.equal(new Date(result.days[0].date).getUTCDay(), 0)
  assert.equal(result.total, 2)
  assert.equal(result.days.find(day => day.date === '2026-09-05').future, true)
  assert.equal(result.days.find(day => day.date === '2026-09-05').count, 0)
  assert.equal(result.months.at(-1).label, 'Sep')
})

test('month labels handle a midweek New Year and an empty publication history', () => {
  const result = buildHomeActivity([], new Date('2027-01-01T00:00:00Z'))
  assert.equal(result.total, 0)
  assert.equal(result.months.at(-1).label, 'Jan')
  assert.ok(result.days.every(day => day.level === 0))
})

test('heat intensity is capped without losing the actual publication count', () => {
  const result = buildHomeActivity(Array(8).fill('2026-07-31'), new Date('2026-09-04T00:00:00Z'))
  assert.equal(result.total, 8)
  assert.equal(result.days.find(day => day.date === '2026-07-31').level, 4)
  assert.equal(result.days.find(day => day.date === '2026-07-31').count, 8)
})
