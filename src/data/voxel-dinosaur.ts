import { brickBounds, type BrickKind, type BrickPiece, type BrickTone, type QuarterTurn } from "./brick-kit"

// Keep the original side-on, purple pixel silhouette. A broad head, a curled
// tail and short, staggered feet give this little T. rex a friendlier stance.
const pieces: BrickPiece[] = []
function put(kind: BrickKind, x: number, y: number, z: number, tone: BrickTone = "violet", turn: QuarterTurn = 0) {
  pieces.push({ kind, x, y, z, tone, turn })
}

// Each row is built from individual cubes, so the silhouette remains editable.
const bodyRows = [
  { y: 2, from: -2, to: 1 },
  { y: 3, from: -4, to: 2 },
  { y: 4, from: -5, to: 3 },
  { y: 5, from: -4, to: 3 },
  { y: 6, from: -3, to: 3 },
  { y: 7, from: -2, to: 3 },
  { y: 8, from: -1, to: 3 },
  { y: 9, from: 0, to: 3 },
]
for (const { y, from, to } of bodyRows) {
  for (let x = from; x <= to; x++) {
    for (const z of [-1, 0]) put("cube", x, y, z)
  }
}

// Half-height steps soften the diagonal back without rounding the voxels.
for (const [x, y] of [[-5, 5], [-4, 6], [-3, 7], [-2, 8], [-1, 9]]) {
  for (const z of [-1, 0]) put("slab", x, y, z)
}
for (const [x, y] of [[-8, 6], [-7, 5], [-7, 6], [-6, 4], [-6, 5], [-7, 4]]) {
  for (const z of [-1, 0]) put("cube", x, y, z)
}
put("wide-stair", -8, 7, -1)
put("wide-stair", -6, 6, -1, "violet", 2)

// Feet are offset in both depth and position, with a low, flat toe on each.
for (const [x, z] of [[-3, -2], [1, 1]]) {
  put("stair", x, 0, z)
  put("cube", x, 1, z)
  for (const y of [2, 3]) put("beam", x - 1, y, z)
  put("stair", x - 1, 4, z)
}

// Two little tucked arms. No claws or contrasting tips.
for (const z of [-2, 1]) {
  put("slab", 3, 7.5, z)
  put("plate", 3, 7, z)
  put("pixel", 4.5, 6.5, z + 0.25)
}

// A closed, gently stepped snout and a large forehead, with no teeth.
for (const z of [-1.5, -0.5, 0.5]) {
  for (const y of [10, 11]) {
    for (let x = 0; x < 8; x++) put("cube", x, y, z)
  }
  for (let x = 0; x < 7; x++) put("cube", x, 12, z)
  put("slab", 7, 12, z)
  put("stair", 0, 13, z, "violet", 2)
  for (let x = 2; x < 5; x++) put("cube", x, 13, z)
  put("stair", 5, 13, z)
  for (const x of [4, 6]) put("plate", x, 9.5, z)
}
put("eye", 2, 11.3, 1.5)
put("eye", 2, 11.3, -1.75, "violet", 2)

export const DINOSAUR_BRICKS: readonly BrickPiece[] = pieces
const bounds = pieces.map(brickBounds)
export const DINOSAUR_SIZE = {
  width: Math.max(...bounds.map((b) => b.maxX)) - Math.min(...bounds.map((b) => b.minX)),
  height: Math.max(...bounds.map((b) => b.maxY)),
  depth: Math.max(...bounds.map((b) => b.maxZ)) - Math.min(...bounds.map((b) => b.minZ)),
}
export const DINOSAUR_CENTER_X = (Math.max(...bounds.map((b) => b.maxX)) + Math.min(...bounds.map((b) => b.minX))) / 2
