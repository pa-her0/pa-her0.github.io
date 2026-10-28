import manifest from "@/data/home-character-sprites.json"

export const CHARACTER_IMAGE_ROOT = "/images/home-scrapbook/ds-actions/"
export const CHARACTER_SPRITES = manifest.assets
type SpriteName = keyof typeof CHARACTER_SPRITES
type Motion = "bounce" | "pat" | "talk" | "think" | "eat" | "sweep" | "sleep" | "angry" | "tail" | "poke" | "walk-left" | "walk-right" | "dizzy" | "still"
export interface CharacterPhase { asset: SpriteName; duration: number; cycles?: number; height?: number }
export interface CharacterAction { id: string; label: string; motion: Motion; phases: CharacterPhase[] }

// Pose names and frame order follow ds-local-pet. See the bundled NOTICE.md.
export const CHARACTER_ACTIONS: CharacterAction[] = [
  { id: "happy", label: "开心", motion: "bounce", phases: [{ asset: "happy", duration: 2100 }] },
  { id: "head-pat", label: "摸摸头", motion: "pat", phases: [{ asset: "head_pat", duration: 1800, cycles: 2 }] },
  { id: "talking", label: "打招呼", motion: "talk", phases: [{ asset: "talk", duration: 2600 }] },
  { id: "thinking", label: "思考", motion: "think", phases: [{ asset: "idle_think", duration: 2500 }] },
  { id: "eating", label: "吃点心", motion: "eat", phases: [{ asset: "eat", duration: 2400, cycles: 4 }] },
  { id: "sweeping", label: "扫扫地", motion: "sweep", phases: [{ asset: "sweep", duration: 2800 }] },
  { id: "sleeping", label: "打个盹", motion: "sleep", phases: [
    { asset: "sleep_enter", duration: 1050 }, { asset: "sleep", duration: 2400, height: .61 }, { asset: "sleep_wake", duration: 900 },
  ] },
  { id: "angry", label: "鼓起脸颊", motion: "angry", phases: [{ asset: "angry", duration: 1900 }] },
  { id: "tail", label: "摇摇尾巴", motion: "tail", phases: [{ asset: "tail_react", duration: 1800, cycles: 2 }] },
  { id: "poke", label: "被戳一下", motion: "poke", phases: [{ asset: "poke_react", duration: 1500, cycles: 2 }] },
  { id: "walk-left", label: "向左散步", motion: "walk-left", phases: [
    { asset: "walk_start_left", duration: 260 }, { asset: "walk_side", duration: 2000, cycles: 4 }, { asset: "walk_stop_left", duration: 300 },
  ] },
  { id: "walk-right", label: "向右散步", motion: "walk-right", phases: [
    { asset: "walk_start_right", duration: 260 }, { asset: "walk_side_right", duration: 2000, cycles: 4 }, { asset: "walk_stop_right", duration: 300 },
  ] },
  { id: "dizzy", label: "晕乎乎", motion: "dizzy", phases: [{ asset: "dizzy", duration: 2300, height: .67 }] },
  { id: "blink", label: "眨眨眼", motion: "still", phases: [{ asset: "idle_blink", duration: 1120, cycles: 2 }] },
  { id: "glance", label: "左右看看", motion: "still", phases: [{ asset: "idle_glance", duration: 1800 }] },
]

/** Every pose appears once per round, including no repeats across round boundaries. */
export function createActionDeck(random = Math.random) {
  let remaining: CharacterAction[] = []
  let previous = ""
  const refill = () => {
    if (remaining.length) return
    remaining = [...CHARACTER_ACTIONS]
    for (let i = remaining.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[remaining[i], remaining[j]] = [remaining[j], remaining[i]]
    }
    if (remaining[0].id === previous) [remaining[0], remaining[1]] = [remaining[1], remaining[0]]
  }
  return {
    peek() { refill(); return remaining[0] },
    next() { refill(); const action = remaining.shift()!; previous = action.id; return action },
  }
}

export function getActionDuration(action: CharacterAction) {
  return action.phases.reduce((total, phase) => total + phase.duration, 0)
}

export function getActionFrame(action: CharacterAction, elapsed: number, reducedMotion = false) {
  let phase = action.phases[action.phases.length - 1]
  let time = elapsed
  if (reducedMotion) {
    // Prefer the main pose over the entrance or waking transition.
    phase = action.phases.find((item) => item.duration === Math.max(...action.phases.map((part) => part.duration)))!
    time = 0
  } else {
    for (const part of action.phases) {
      phase = part
      if (time < part.duration) break
      time -= part.duration
    }
  }
  const asset = CHARACTER_SPRITES[phase.asset]
  const progress = Math.min(Math.max(time / phase.duration, 0), .999999)
  const index = reducedMotion ? Math.floor(asset.frames.length / 2) : Math.floor(progress * asset.frames.length * (phase.cycles ?? 1)) % asset.frames.length
  return { file: asset.frames[index], crop: asset.crop, height: phase.height ?? .93 }
}

export function getActionMotion(motion: Motion, progress: number) {
  const envelope = Math.sin(Math.PI * Math.min(1, Math.max(0, progress)))
  const swing = Math.sin(progress * Math.PI * 6) * envelope
  const result = { x: 0, y: 0, angle: 0, scaleY: 1 }
  switch (motion) {
    case "bounce": result.y = -Math.abs(swing) * .025; break
    case "pat": result.angle = swing * .018; break
    case "talk": result.y = -Math.abs(swing) * .006; break
    case "think": result.angle = swing * .015; break
    case "eat": result.scaleY += swing * .008; break
    case "sweep": result.angle = swing * .035; result.x = swing * .012; break
    case "sleep": result.scaleY += swing * .005; break
    case "angry": result.x = Math.sin(progress * Math.PI * 18) * envelope * .005; break
    case "tail": result.angle = swing * .01; break
    case "poke": result.x = swing * .012; break
    case "walk-left": result.x = -envelope * .045; break
    case "walk-right": result.x = envelope * .045; break
    case "dizzy": result.angle = swing * .03; break
  }
  return result
}
