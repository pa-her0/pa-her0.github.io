export type BrickForm = "box" | "stair" | "eye"
export type BrickTone = "violet" | "lilac" | "plum" | "ivory" | "ink"
export type QuarterTurn = 0 | 1 | 2 | 3

export const BRICK_KIT = [
  { id: "cube", name: "正方体", size: "1 × 1 × 1", width: 1, height: 1, depth: 1, form: "box" },
  { id: "beam", name: "长方体", size: "2 × 1 × 1", width: 2, height: 1, depth: 1, form: "box" },
  { id: "square", name: "宽方块", size: "2 × 1 × 2", width: 2, height: 1, depth: 2, form: "box" },
  { id: "long", name: "长条块", size: "4 × 1 × 1", width: 4, height: 1, depth: 1, form: "box" },
  { id: "slab", name: "半砖", size: "1 × ½ × 1", width: 1, height: 0.5, depth: 1, form: "box" },
  { id: "plate", name: "长半砖", size: "2 × ½ × 1", width: 2, height: 0.5, depth: 1, form: "box" },
  { id: "deck", name: "宽半砖", size: "2 × ½ × 2", width: 2, height: 0.5, depth: 2, form: "box" },
  { id: "tile", name: "薄片", size: "2 × ¼ × 1", width: 2, height: 0.25, depth: 1, form: "box" },
  { id: "stair", name: "台阶", size: "2 × 1 × 1", width: 2, height: 1, depth: 1, form: "stair" },
  { id: "wide-stair", name: "宽台阶", size: "2 × 1 × 2", width: 2, height: 1, depth: 2, form: "stair" },
  { id: "pixel", name: "小方块", size: "½ × ½ × ½", width: 0.5, height: 0.5, depth: 0.5, form: "box" },
  { id: "pillar", name: "立柱", size: "1 × 2 × 1", width: 1, height: 2, depth: 1, form: "box" },
] as const

// A painted square eye belongs to the model; the backpack offers building primitives.
const DECORATIONS = [{ id: "eye", name: "像素眼", size: "1 × 1", width: 1, height: 1, depth: 0.25, form: "eye" }] as const
export type BrickDefinition = (typeof BRICK_KIT)[number] | (typeof DECORATIONS)[number]
export type BrickKind = BrickDefinition["id"]
export type BrickPiece = {
  kind: BrickKind
  x: number
  y: number
  z: number
  turn?: QuarterTurn
  tone?: BrickTone
}

export const BRICK_DEFINITIONS = Object.fromEntries([...BRICK_KIT, ...DECORATIONS].map((brick) => [brick.id, brick])) as Record<BrickKind, BrickDefinition>
export const BRICK_PALETTE: Record<BrickTone, string> = {
  violet: "#6258e8", lilac: "#aaa2ff", plum: "#4d45b8", ivory: "#fffaf0", ink: "#26223a",
}
export const BRICK_GRID = { half: 14, height: 20, limit: 440 }

export function brickSize(piece: Pick<BrickPiece, "kind" | "turn">) {
  const definition = BRICK_DEFINITIONS[piece.kind]
  const sideways = (piece.turn ?? 0) % 2 !== 0
  return { width: sideways ? definition.depth : definition.width, height: definition.height, depth: sideways ? definition.width : definition.depth }
}

export function brickBounds(piece: BrickPiece) {
  const size = brickSize(piece)
  return { minX: piece.x, maxX: piece.x + size.width, minY: piece.y, maxY: piece.y + size.height, minZ: piece.z, maxZ: piece.z + size.depth }
}

// Stairs have a half-height platform and a raised half. The empty half remains usable.
export function brickVolumes(piece: BrickPiece) {
  const bounds = brickBounds(piece)
  if (BRICK_DEFINITIONS[piece.kind].form !== "stair") return [bounds]
  const midY = (bounds.minY + bounds.maxY) / 2
  const upper = { ...bounds, minY: midY }
  switch (piece.turn ?? 0) {
    case 0: upper.maxX = (bounds.minX + bounds.maxX) / 2; break
    case 1: upper.minZ = (bounds.minZ + bounds.maxZ) / 2; break
    case 2: upper.minX = (bounds.minX + bounds.maxX) / 2; break
    case 3: upper.maxZ = (bounds.minZ + bounds.maxZ) / 2; break
  }
  return [{ ...bounds, maxY: midY }, upper]
}

export function bricksOverlap(a: BrickPiece, b: BrickPiece) {
  const epsilon = 0.015
  return brickVolumes(a).some((aa) => brickVolumes(b).some((bb) => aa.minX < bb.maxX - epsilon && aa.maxX > bb.minX + epsilon
    && aa.minY < bb.maxY - epsilon && aa.maxY > bb.minY + epsilon
    && aa.minZ < bb.maxZ - epsilon && aa.maxZ > bb.minZ + epsilon))
}

export function brickInGrid(piece: BrickPiece) {
  const b = brickBounds(piece)
  return Number.isFinite(piece.x + piece.y + piece.z) && b.minX >= -BRICK_GRID.half && b.maxX <= BRICK_GRID.half
    && b.minZ >= -BRICK_GRID.half && b.maxZ <= BRICK_GRID.half && b.minY >= -0.001 && b.maxY <= BRICK_GRID.height
}

export function canPlaceBrick(piece: BrickPiece, pieces: readonly BrickPiece[]) {
  return pieces.length < BRICK_GRID.limit && brickInGrid(piece) && !pieces.some((other) => bricksOverlap(piece, other))
}

export function defaultBrickTone(_kind: BrickKind): BrickTone {
  return "violet"
}

type Point3 = { x: number; y: number; z: number }

export function placeBrickAgainst(kind: BrickKind, turn: QuarterTurn, point: Point3, normal: Point3, target?: BrickPiece): BrickPiece {
  const size = brickSize({ kind, turn })
  const snap = (value: number, step: number) => Math.floor((value + 0.001) / step) * step
  const piece: BrickPiece = {
    kind, turn, tone: defaultBrickTone(kind),
    x: snap(point.x, Math.min(1, size.width)), y: 0, z: snap(point.z, Math.min(1, size.depth)),
  }
  if (!target) return piece
  const ax = Math.abs(normal.x), ay = Math.abs(normal.y), az = Math.abs(normal.z)
  const axis = ay >= ax && ay >= az ? "y" : ax >= az ? "x" : "z"
  const volumes = brickVolumes(target)
  const contains = (value: number, min: number, max: number) => value >= min - 0.03 && value <= max + 0.03
  const faces = volumes.filter((b) =>
    (axis === "x" || contains(point.x, b.minX, b.maxX)) &&
    (axis === "y" || contains(point.y, b.minY, b.maxY)) &&
    (axis === "z" || contains(point.z, b.minZ, b.maxZ)))
  const faceDistance = (b: ReturnType<typeof brickBounds>) => {
    const face = axis === "x" ? (normal.x < 0 ? b.minX : b.maxX) : axis === "y" ? (normal.y < 0 ? b.minY : b.maxY) : (normal.z < 0 ? b.minZ : b.maxZ)
    return Math.abs(point[axis] - face)
  }
  const bounds = (faces.length ? faces : volumes).sort((a, b) => faceDistance(a) - faceDistance(b))[0]
  if (ay >= ax && ay >= az) {
    piece.y = normal.y < -0.5 ? bounds.minY - size.height : bounds.maxY
  } else {
    piece.y = Math.max(bounds.minY, Math.min(snap(point.y, 0.25), bounds.maxY - size.height))
    if (ax >= az) piece.x = normal.x >= 0 ? bounds.maxX : bounds.minX - size.width
    else piece.z = normal.z >= 0 ? bounds.maxZ : bounds.minZ - size.depth
  }
  return piece
}
