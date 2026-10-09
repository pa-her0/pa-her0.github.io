// Game rules live independently of rendering so collisions and timing stay testable.
export const RUNNER_GROUND_MARGIN = 38
export const RUNNER_X = 62
export const COLLISION_PENALTY = 10
export const RUNNER_STEP = 1 / 120

export type RunnerPhase = "idle" | "running" | "paused"
export type RunnerObstacle = {
  id: number
  kind: "cactus" | "bird"
  x: number
  width: number
  height: number
  elevation: number
  hit: boolean
}

export type RunnerState = {
  phase: RunnerPhase
  elapsed: number
  distance: number
  score: number
  hits: number
  height: number
  velocity: number
  ducking: boolean
  grace: number
  hitEffect: number
  nextSpawn: number
  nextId: number
  obstacles: RunnerObstacle[]
}

export function createRunner(): RunnerState {
  return {
    phase: "idle", elapsed: 0, distance: 0, score: 0, hits: 0,
    height: 0, velocity: 0, ducking: false, grace: 0, hitEffect: 0,
    nextSpawn: 0.8, nextId: 1, obstacles: [],
  }
}

export function jumpRunner(state: RunnerState) {
  if (state.phase !== "running") state.phase = "running"
  state.ducking = false
  if (state.height === 0) state.velocity = 650
}

export function pauseRunner(state: RunnerState) {
  if (state.phase === "running") state.phase = "paused"
  state.ducking = false
}

export function runnerSpeed(state: RunnerState) {
  return Math.min(430, 285 + state.elapsed * 1.25)
}

export function runnerBounds(state: RunnerState) {
  const ducking = state.ducking && state.height === 0
  return {
    left: RUNNER_X + 6,
    right: RUNNER_X + (ducking ? 56 : 42),
    bottom: state.height + 3,
    top: state.height + (ducking ? 27 : 54),
  }
}

export function stepRunner(state: RunnerState, seconds: number, worldWidth: number, random = Math.random) {
  if (state.phase !== "running") return
  // Split delayed frames to prevent tunnelling through a narrow cactus.
  let remaining = Math.max(0, Math.min(seconds, 0.1))
  while (remaining > 0) {
    const dt = Math.min(remaining, RUNNER_STEP)
    remaining -= dt
    state.elapsed += dt
    const travel = runnerSpeed(state) * dt
    state.distance += travel
    state.grace = Math.max(0, state.grace - dt)
    state.hitEffect = Math.max(0, state.hitEffect - dt)

    if (state.height > 0 || state.velocity > 0) {
      state.velocity -= (state.ducking ? 3200 : 1850) * dt
      state.height = Math.max(0, state.height + state.velocity * dt)
      if (state.height === 0) state.velocity = 0
    }

    state.nextSpawn -= dt
    if (state.nextSpawn <= 0) {
      const bird = state.elapsed > 16 && random() > 0.72
      const wide = random() > 0.62
      state.obstacles.push({
        id: state.nextId++, kind: bird ? "bird" : "cactus",
        x: worldWidth + 50, width: bird ? 48 : wide ? 48 : 26,
        height: bird ? 24 : wide ? 50 : 56,
        elevation: bird ? (random() > 0.5 ? 35 : 70) : 0, hit: false,
      })
      // Every obstacle remains reachable with a full jump, even at top speed.
      state.nextSpawn = 1.45 + random() * 0.8
    }

    const player = runnerBounds(state)
    for (const obstacle of state.obstacles) {
      obstacle.x -= travel
      const touches = player.right > obstacle.x + 4
        && player.left < obstacle.x + obstacle.width - 3
        && player.top > obstacle.elevation + 3
        && player.bottom < obstacle.elevation + obstacle.height - 3
      if (touches && !obstacle.hit) {
        obstacle.hit = true
        if (state.grace === 0) {
          state.hits += 1
          state.grace = 0.85
          state.hitEffect = 1
        }
      }
    }
    state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -20)
    // Always deduct exactly ten, including when the score is below ten.
    state.score = Math.floor(state.distance / 28) - state.hits * COLLISION_PENALTY
  }
}

export function readRunnerBest(value: string | null) {
  const best = Number(value)
  return Number.isSafeInteger(best) && best >= 0 ? best : 0
}
