export type VoxelCell = { x: number; y: number; z: number }

// Side profile of a little T. rex, extruded into two layers of editable cubes.
// The empty pixel in the head is its eye; the gap below the snout is its jaw.
const PROFILE = [
  "........#####.",
  "........#.####",
  "........######",
  "........###...",
  ".......####...",
  "#.....#####...",
  "##...######...",
  "###########...",
  ".########.#...",
  "..#######.....",
  "...#####......",
  "....##.##.....",
  "....###.###...",
] as const

export const DINOSAUR_SIZE = { width: PROFILE[0].length, height: PROFILE.length, depth: 2 }

export const DINOSAUR_CELLS: VoxelCell[] = PROFILE.flatMap((row, rowIndex) =>
  [...row].flatMap((pixel, column) => pixel === "#"
    ? [-1, 0].map((z) => ({
        x: column - DINOSAUR_SIZE.width / 2,
        y: DINOSAUR_SIZE.height - rowIndex - 1,
        z,
      }))
    : []),
)
