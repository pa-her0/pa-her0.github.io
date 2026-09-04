import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSnakeRoute } from '../src/lib/activity-snake.ts'

test('snake visits every calendar cell once and closes the loop without jumps', () => {
  for (const columns of [2, 18, 26, 52]) {
    const { points, arrivals } = buildSnakeRoute(columns)
    assert.equal(arrivals.length, columns * 7)
    assert.equal(new Set(arrivals).size, columns * 7)
    arrivals.forEach((step, index) => assert.deepEqual(points[step], { x: Math.floor(index / 7), y: index % 7 }))
    assert.deepEqual(points[0], points.at(-1))
    assert.equal(new Set(points.slice(0, -1).map(point => `${point.x},${point.y}`)).size, columns * 7)
    assert.ok(points.every(point => point.x >= 0 && point.x < columns && point.y >= 0 && point.y < 7))
    for (let i = 1; i < points.length; i++) assert.equal(Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y), 1)
  }
})
