import type { BrickTone } from "./brick-kit"

type EyePatch = {
  tone: BrickTone
  points: [number, number][]
  depth: number
  z: number
  gaze?: boolean
}

// Normalized face coordinates, shared by the 3D model and its static fallback.
const steppedRectangle = (width: number, height: number, step: number): [number, number][] => {
  const x = width / 2, y = height / 2
  return [
    [-x + step, y], [x - step, y], [x - step, y - step], [x, y - step],
    [x, -y + step], [x - step, -y + step], [x - step, -y], [-x + step, -y],
    [-x + step, -y + step], [-x, -y + step], [-x, y - step], [-x + step, y - step],
  ]
}

export const BRICK_EYE_PATCHES: readonly EyePatch[] = [
  // 12.5% smaller than the old 0.96 outline, with a 30% thinner border.
  { tone: "eyeFrame", points: steppedRectangle(0.84, 0.84, 0.055), depth: 0.07, z: 0 },
  { tone: "eyePupil", points: steppedRectangle(0.714, 0.756, 0.035), depth: 0.03, z: 0.045, gaze: true },
  {
    tone: "eyeSparkle", depth: 0.014, z: 0.067, gaze: true,
    points: [[-0.24, 0.24], [0.01, 0.24], [0.01, 0.13], [-0.12, 0.13], [-0.12, -0.01], [-0.24, -0.01]],
  },
  {
    tone: "eyeSparkle", depth: 0.014, z: 0.067, gaze: true,
    points: [[0.13, -0.15], [0.23, -0.15], [0.23, -0.25], [0.13, -0.25]],
  },
]
