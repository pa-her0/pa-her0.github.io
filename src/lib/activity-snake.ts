/** Closed path inside an even-column grid, reserving its top row for the return. */
export function buildSnakeRoute(columns: number, rows = 7) {
  if (columns < 2 || columns % 2 !== 0 || rows < 2) throw new Error("Snake grid needs an even number of columns and at least two rows")
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }]
  const arrivals: number[] = []
  arrivals[0] = 0
  for (let x = 0; x < columns; x++) {
    for (let step = 0; step < rows - 1; step++) {
      const y = x % 2 === 0 ? step + 1 : rows - 1 - step
      arrivals[x * rows + y] = points.length
      points.push({ x, y })
    }
  }
  for (let x = columns - 1; x > 0; x--) {
    arrivals[x * rows] = points.length
    points.push({ x, y: 0 })
  }
  points.push({ x: 0, y: 0 })
  return { points, arrivals }
}
