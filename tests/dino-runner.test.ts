import test from "node:test"
import assert from "node:assert/strict"
import { createRunner, jumpRunner, pauseRunner, readRunnerBest, runnerSpeed, stepRunner, type RunnerObstacle } from "../src/lib/dino-runner.ts"

const cactus = (id = 1): RunnerObstacle => ({ id, kind: "cactus", x: 85, width: 26, height: 56, elevation: 0, hit: false })

test("collisions deduct exactly ten once per obstacle and never end the run, even below zero", () => {
  const state = createRunner()
  state.phase = "running"
  state.nextSpawn = 100
  state.obstacles = [cactus()]
  stepRunner(state, 0.01, 900)
  assert.equal(state.score, -10)
  assert.equal(state.hits, 1)
  assert.equal(state.phase, "running")
  for (let i = 0; i < 30; i++) stepRunner(state, 1 / 60, 900)
  assert.equal(state.hits, 1)
  assert.ok(state.distance > 100)
  assert.equal(state.score, Math.floor(state.distance / 28) - 10)
  for (let i = 0; i < 60; i++) stepRunner(state, 1 / 60, 900)
  state.obstacles = [cactus(2)]
  stepRunner(state, 0.01, 900)
  assert.equal(state.hits, 2)
  assert.equal(state.score, Math.floor(state.distance / 28) - 20)
  assert.equal(state.phase, "running")
})

test("jump clears an obstacle, cannot double jump, and lands back on the ground", () => {
  const state = createRunner()
  state.nextSpawn = 100
  jumpRunner(state)
  for (let i = 0; i < 18; i++) stepRunner(state, 1 / 60, 900)
  assert.ok(state.height > 90)
  const velocity = state.velocity
  jumpRunner(state)
  assert.equal(state.velocity, velocity)
  state.obstacles = [cactus()]
  for (let i = 0; i < 60; i++) stepRunner(state, 1 / 60, 900)
  assert.equal(state.hits, 0)
  assert.equal(state.height, 0)
  assert.equal(state.velocity, 0)
})

test("ducking avoids a low bird, pause freezes the whole world, and resume preserves the score", () => {
  const state = createRunner()
  state.phase = "running"
  state.nextSpawn = 100
  state.ducking = true
  state.obstacles = [{ ...cactus(), kind: "bird", width: 48, height: 24, elevation: 35 }]
  for (let i = 0; i < 24; i++) stepRunner(state, 1 / 60, 900)
  assert.equal(state.hits, 0)
  pauseRunner(state)
  const snapshot = structuredClone(state)
  stepRunner(state, 10, 900)
  assert.deepEqual(state, snapshot)
  jumpRunner(state)
  assert.equal(state.score, snapshot.score)
  assert.equal(state.phase, "running")
})

test("long runs stay bounded, remain playable, and are independent of the display frame rate", () => {
  const run = (fps: number) => {
    const state = createRunner()
    state.phase = "running"
    for (let i = 0; i < fps * 90; i++) stepRunner(state, 1 / fps, 650, () => 0.4)
    return state
  }
  const normal = run(60)
  const slow = run(30)
  assert.equal(normal.phase, "running")
  assert.ok(normal.hits > 10)
  assert.ok(normal.obstacles.length < 5)
  assert.ok(Math.abs(normal.score - slow.score) <= 1)
  normal.elapsed = 10000
  assert.equal(runnerSpeed(normal), 430)
  const before = normal.distance
  stepRunner(normal, 30, 650)
  assert.ok(normal.distance - before <= 44, "a suspended tab cannot skip thirty seconds of obstacles")
})

test("stored best score rejects invalid values", () => {
  for (const value of [null, "NaN", "Infinity", "-10", "1.5", "garbage", "9007199254740992"]) assert.equal(readRunnerBest(value), 0)
  assert.equal(readRunnerBest("187"), 187)
})
