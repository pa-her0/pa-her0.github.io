import { RUNNER_GROUND_MARGIN, RUNNER_X, type RunnerObstacle, type RunnerState } from "./dino-runner"

type Palette = { ink: string; accent: string; muted: string; paper: string }

function pixelDino(ctx: CanvasRenderingContext2D, state: RunnerState, ground: number, palette: Palette) {
  const duck = state.ducking && state.height === 0
  const stride = state.phase === "running" && state.height === 0 ? Math.floor(state.elapsed * 10) % 2 : 0
  ctx.save()
  ctx.translate(RUNNER_X, ground - state.height)
  if (state.grace > 0) ctx.globalAlpha = 0.56
  ctx.fillStyle = palette.ink
  if (duck) {
    ctx.fillRect(0, -22, 42, 16)
    ctx.fillRect(36, -29, 25, 18)
    ctx.fillRect(-6, -29, 8, 14)
    ctx.fillRect(16 + stride * 8, -7, 7, 7)
    ctx.fillRect(32 - stride * 8, -7, 7, 7)
    ctx.fillStyle = palette.paper
    ctx.fillRect(52, -26, 4, 4)
  } else {
    ctx.beginPath()
    ctx.moveTo(22, -58)
    ctx.lineTo(47, -58)
    ctx.lineTo(47, -38)
    ctx.lineTo(33, -38)
    ctx.lineTo(33, -32)
    ctx.lineTo(40, -32)
    ctx.lineTo(40, -23)
    ctx.lineTo(35, -23)
    ctx.lineTo(35, -28)
    ctx.lineTo(31, -28)
    ctx.lineTo(31, -16)
    ctx.lineTo(25, -10)
    ctx.lineTo(9, -10)
    ctx.lineTo(9, -17)
    ctx.lineTo(3, -17)
    ctx.lineTo(3, -24)
    ctx.lineTo(-3, -24)
    ctx.lineTo(-3, -39)
    ctx.lineTo(3, -39)
    ctx.lineTo(3, -31)
    ctx.lineTo(10, -27)
    ctx.lineTo(15, -27)
    ctx.lineTo(15, -39)
    ctx.lineTo(22, -39)
    ctx.closePath()
    ctx.fill()
    ctx.fillRect(10, -12, 6, stride ? 7 : 12)
    ctx.fillRect(10, stride ? -6 : -4, 11, 4)
    ctx.fillRect(23, -12, 6, stride ? 12 : 7)
    ctx.fillRect(23, stride ? -4 : -6, 10, 4)
    ctx.fillStyle = palette.paper
    ctx.fillRect(37, -52, 4, 4)
    ctx.fillRect(36, -42, 11, 3)
    ctx.fillStyle = palette.accent
    ctx.fillRect(17, -36, 17, 5)
    ctx.fillRect(10, -33, 10, 5)
  }
  ctx.restore()
}

function cactus(ctx: CanvasRenderingContext2D, x: number, ground: number, height: number, width: number) {
  const stem = Math.round(width * 0.35)
  const middle = Math.round(width * 0.42)
  ctx.fillRect(x + middle, ground - height, stem, height)
  ctx.fillRect(x, ground - height * 0.71, stem * 0.7, height * 0.34)
  ctx.fillRect(x, ground - height * 0.42, middle, stem * 0.7)
  ctx.fillRect(x + middle + stem, ground - height * 0.79, stem * 0.7, height * 0.27)
  ctx.fillRect(x + middle, ground - height * 0.56, width - middle, stem * 0.7)
}

function obstacleArt(ctx: CanvasRenderingContext2D, obstacle: RunnerObstacle, ground: number, elapsed: number, palette: Palette) {
  ctx.save()
  ctx.globalAlpha = obstacle.hit ? 0.25 : 0.8
  ctx.fillStyle = palette.accent
  const x = Math.round(obstacle.x)
  if (obstacle.kind === "cactus") {
    if (obstacle.width > 30) {
      cactus(ctx, x, ground, obstacle.height * 0.72, 20)
      cactus(ctx, x + 23, ground, obstacle.height, 25)
    } else cactus(ctx, x, ground, obstacle.height, obstacle.width)
  } else {
    const y = ground - obstacle.elevation - 10
    ctx.fillStyle = palette.muted
    ctx.fillRect(x + 4, y, 34, 8)
    ctx.fillRect(x, y + 2, 8, 4)
    ctx.fillRect(x + 33, y - 4, 12, 5)
    const wingUp = Math.floor(elapsed * 6) % 2 === 0
    ctx.beginPath()
    ctx.moveTo(x + 16, y + 3)
    ctx.lineTo(x + 22, y + (wingUp ? -19 : 16))
    ctx.lineTo(x + 32, y + 4)
    ctx.fill()
  }
  ctx.restore()
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.beginPath()
  ctx.moveTo(0, 14)
  ctx.lineTo(9, 14)
  ctx.quadraticCurveTo(9, 3, 20, 5)
  ctx.quadraticCurveTo(27, -10, 39, 2)
  ctx.quadraticCurveTo(51, 0, 54, 14)
  ctx.lineTo(64, 14)
  ctx.stroke()
  ctx.restore()
}

export function paintRunner(ctx: CanvasRenderingContext2D, state: RunnerState, width: number, height: number, palette: Palette) {
  ctx.clearRect(0, 0, width, height)
  const ground = height - RUNNER_GROUND_MARGIN
  const offset = state.distance
  ctx.save()

  // A quiet landscape is drawn directly on the page, without a game-window frame.
  const sunX = width * 0.8
  const sunY = Math.max(42, ground - 144)
  ctx.fillStyle = palette.accent
  ctx.globalAlpha = 0.055
  ctx.beginPath()
  ctx.arc(sunX, sunY, 37, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.2
  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(sunX, sunY, 25, 0, Math.PI * 2)
  ctx.stroke()

  ctx.globalAlpha = 0.055
  ctx.fillStyle = palette.accent
  for (let i = -1; i < Math.ceil(width / 400) + 1; i += 1) {
    const x = i * 400 - (offset * 0.09 % 400)
    ctx.beginPath()
    ctx.moveTo(x, ground)
    ctx.bezierCurveTo(x + 60, ground - 3, x + 135, ground - 100, x + 215, ground - 47)
    ctx.bezierCurveTo(x + 290, ground - 4, x + 330, ground - 30, x + 400, ground)
    ctx.closePath()
    ctx.fill()
  }
  ctx.globalAlpha = 0.32
  ctx.strokeStyle = palette.muted
  ctx.lineWidth = 1.2
  for (let i = 0; i < 3; i += 1) {
    const x = ((width * (0.22 + i * 0.31) - offset * (0.05 + i * 0.012)) % (width + 90) + width + 90) % (width + 90) - 45
    cloud(ctx, x, 38 + (i % 2) * 40, 0.7 + i * 0.13)
  }

  ctx.globalAlpha = 0.45
  const line = ctx.createLinearGradient(0, 0, width, 0)
  line.addColorStop(0, "transparent")
  line.addColorStop(0.08, palette.muted)
  line.addColorStop(0.9, palette.muted)
  line.addColorStop(1, "transparent")
  ctx.strokeStyle = line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, Math.round(ground) + 0.5)
  ctx.lineTo(width, Math.round(ground) + 0.5)
  ctx.stroke()
  ctx.fillStyle = palette.muted
  ctx.globalAlpha = 0.23
  for (let i = 0; i < Math.ceil(width / 26) + 2; i += 1) {
    const x = i * 26 - offset % 26
    const y = ground + 8 + (i * 13 % 19)
    ctx.fillRect(x, y, i % 3 === 0 ? 8 : 3, 1)
  }
  ctx.restore()

  if (state.phase === "idle") {
    obstacleArt(ctx, { id: 0, kind: "cactus", x: width * 0.76, width: 26, height: 48, elevation: 0, hit: false }, ground, 0, palette)
    obstacleArt(ctx, { id: 1, kind: "cactus", x: width * 0.91, width: 48, height: 35, elevation: 0, hit: false }, ground, 0, palette)
  }
  for (const obstacle of state.obstacles) obstacleArt(ctx, obstacle, ground, state.elapsed, palette)
  pixelDino(ctx, state, ground, palette)

  if (state.hitEffect > 0) {
    ctx.save()
    ctx.globalAlpha = Math.min(1, state.hitEffect * 2)
    ctx.fillStyle = "#b8705d"
    ctx.font = '600 21px "Geist Mono", monospace'
    ctx.fillText("−10", RUNNER_X + 10, ground - 82 - (1 - state.hitEffect) * 32)
    ctx.restore()
  }
}
