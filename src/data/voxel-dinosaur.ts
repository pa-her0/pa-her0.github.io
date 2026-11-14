import { brickBounds, type BrickPiece, type BrickTone } from "./brick-kit"

// A chubby baby dino built like a toy: a big round head, a puffy body, stubby legs,
// a curled tail and a row of sunny back plates. It is sculpted as soft voxel blobs
// and then packed into real brick sizes (2x2, 4x1, 2x1, 1x1), so every piece stays editable.
const voxels = new Map<string, BrickTone>()
const id = (x: number, y: number, z: number) => `${x},${y},${z}`

/** Soft super-ellipsoid: p = 2 is a sphere, larger p is a squarer, toy-like roundness. */
function blob(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, tone: BrickTone, p = 2) {
  for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.ceil(cy + ry); y++) {
      for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++) {
        const d = Math.abs((x + 0.5 - cx) / rx) ** p + Math.abs((y + 0.5 - cy) / ry) ** p + Math.abs((z + 0.5 - cz) / rz) ** p
        if (d <= 1) voxels.set(id(x, y, z), tone)
      }
    }
  }
}
function fill(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, tone: BrickTone) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) voxels.set(id(x, y, z), tone)
}
const column = (x: number, z: number) => {
  let top = -1
  voxels.forEach((_, key) => {
    const [vx, vy, vz] = key.split(",").map(Number)
    if (vx === x && vz === z && vy > top) top = vy
  })
  return top + 1
}
const frontOf = (y: number, z: number) => {
  let front = -Infinity
  voxels.forEach((_, key) => {
    const [vx, vy, vz] = key.split(",").map(Number)
    if (vy === y && vz === z && vx > front) front = vx
  })
  return front + 1
}

// Tail first, so the body and legs overlap its root.
blob(0.8, 3.4, 0.5, 2.7, 1.8, 2.0, "violet", 2.3)
blob(-1.6, 4.1, 0.5, 1.9, 1.4, 1.5, "violet")
blob(-3.3, 5.4, 0.5, 1.4, 1.3, 1.1, "violet")
blob(-4.3, 7.0, 0.5, 1.0, 1.2, 0.8, "violet")

// Puffy body with a cream belly stripe down the front and underneath.
blob(5.5, 4.7, 0.5, 4.2, 3.4, 2.9, "violet", 2.4)
voxels.forEach((tone, key) => {
  const [x, y, z] = key.split(",").map(Number)
  if (tone !== "violet" || x < 3 || Math.abs(z) > 1) return
  const nx = (x + 0.5 - 5.5) / 4.2, ny = (y + 0.5 - 4.7) / 3.4
  if ((nx > 0.38 && ny < 0.5) || (ny < -0.62 && nx > -0.4)) voxels.set(key, "cream")
})

// Stubby legs with wide, flat toes.
for (const z0 of [-2, 1]) {
  fill(3, 5, 1, 2, z0, z0 + 1, "violet")
  fill(3, 6, 0, 0, z0, z0 + 1, "plum")
}
// Tiny arms held up on the chest.
for (const z of [-3, 3]) fill(8, 9, 5, 5, z, z, "lilac")

// Big round head, wider than the body.
blob(8.4, 10.2, 0.5, 4.0, 3.2, 3.4, "violet", 2.7)

// A flat face panel: pad the front so the painted details sit flush.
const eyes = [{ z: -2 }, { z: 1.5 }]
const faceFront = Math.max(...[8, 9, 10, 11].flatMap((y) => [-2, -1, 0, 1, 2].map((z) => frontOf(y, z))))
for (const y of [8, 9, 10, 11]) for (const z of [-2, -1, 0, 1, 2]) for (let x = frontOf(y, z); x < faceFront; x++) voxels.set(id(x, y, z), "violet")

// Sunny back plates, big on the back and shrinking along the tail.
for (const x of [5, 3, 1, -1, -3]) {
  const base = column(x, 0)
  const tone: BrickTone = "sun"
  voxels.set(id(x, base, 0), tone)
  if (x >= 1) voxels.set(id(x, base + 1, 0), tone)
}
// Two little horns.
for (const z of [-2, 2]) voxels.set(id(8, column(8, z), z), "sun")

// Pack voxels into real bricks, one layer at a time.
const pieces: BrickPiece[] = []
const used = new Set<string>()
const free = (x: number, y: number, z: number, tone: BrickTone) => voxels.get(id(x, y, z)) === tone && !used.has(id(x, y, z))
const layers = new Map<number, [number, number][]>()
voxels.forEach((_, key) => {
  const [x, y, z] = key.split(",").map(Number)
  layers.set(y, [...(layers.get(y) ?? []), [x, z]])
})
for (const y of [...layers.keys()].sort((a, b) => a - b)) {
  const cells = layers.get(y)!.sort((a, b) => a[1] - b[1] || a[0] - b[0])
  for (const [x, z] of cells) {
    if (used.has(id(x, y, z))) continue
    const tone = voxels.get(id(x, y, z))!
    const run = (dx: number, dz: number, n: number) => Array.from({ length: n }, (_, i) => free(x + dx * i, y, z + dz * i, tone)).every(Boolean)
    const take = (kind: BrickPiece["kind"], w: number, d: number, turn: 0 | 1 = 0) => {
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) used.add(id(x + i, y, z + j))
      pieces.push({ kind, x, y, z, tone, turn })
    }
    if (run(1, 0, 2) && free(x, y, z + 1, tone) && free(x + 1, y, z + 1, tone)) take("square", 2, 2)
    else if (run(1, 0, 4)) take("long", 4, 1)
    else if (run(1, 0, 2)) take("beam", 2, 1)
    else if (run(0, 1, 2)) take("beam", 1, 2, 1)
    else take("cube", 1, 1)
  }
}

// Painted face details (decals sit on the padded front panel).
eyes.forEach(({ z }) => pieces.push({ kind: "eye", x: faceFront, y: 10, z, turn: 1, tone: "ivory" }))
for (const z of [-2, 2]) pieces.push({ kind: "cheek", x: faceFront, y: 8.2, z, turn: 1, tone: "blush" })
pieces.push({ kind: "mouth", x: faceFront, y: 8.1, z: 0, turn: 1, tone: "ink" })

export const DINOSAUR_BRICKS: readonly BrickPiece[] = pieces
const bounds = pieces.map(brickBounds)
export const DINOSAUR_SIZE = {
  width: Math.max(...bounds.map((b) => b.maxX)) - Math.min(...bounds.map((b) => b.minX)),
  height: Math.max(...bounds.map((b) => b.maxY)),
  depth: Math.max(...bounds.map((b) => b.maxZ)) - Math.min(...bounds.map((b) => b.minZ)),
}
export const DINOSAUR_CENTER_X = (Math.max(...bounds.map((b) => b.maxX)) + Math.min(...bounds.map((b) => b.minX))) / 2
