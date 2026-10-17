import { BRICK_DEFINITIONS, BRICK_PALETTE, type BrickKind } from "@/data/brick-kit"

/** Isometric previews use the same flat silhouettes as the canvas pieces. */
export function BrickThumbnail({ kind }: { kind: BrickKind }) {
  const { form, width: w, depth: d, height: h } = BRICK_DEFINITIONS[kind]
  const scale = Math.min(18, 60 / (w + d * 0.55), 36 / h)
  const project = (x: number, y: number, z: number) => [48 + (x - w / 2 + (z - d / 2) * 0.55) * scale, 34 + (h / 2 - y - (z - d / 2) * 0.32) * scale]
  const points = (...coords: number[][]) => coords.map((point) => point.join(",")).join(" ")
  const solid = (x: number, y: number, width: number, height: number) => <g strokeLinejoin="miter" strokeWidth=".5">
    <polygon points={points(project(x, y, 0), project(x + width, y, 0), project(x + width, y + height, 0), project(x, y + height, 0))} fill={BRICK_PALETTE.violet} stroke={BRICK_PALETTE.violet} />
    <polygon points={points(project(x + width, y, 0), project(x + width, y, d), project(x + width, y + height, d), project(x + width, y + height, 0))} fill={BRICK_PALETTE.plum} stroke={BRICK_PALETTE.plum} />
    <polygon points={points(project(x, y + height, 0), project(x + width, y + height, 0), project(x + width, y + height, d), project(x, y + height, d))} fill={BRICK_PALETTE.lilac} stroke={BRICK_PALETTE.lilac} />
  </g>
  return (
    <svg className="brick-thumbnail" viewBox="0 0 96 64" fill="none" aria-hidden="true">
      <ellipse cx="49" cy="53" rx="26" ry="3" fill="#625291" opacity=".06" />
      {form === "stair" ? <>{solid(0, 0, w, h / 2)}{solid(0, h / 2, w / 2, h / 2)}</> : solid(0, 0, w, h)}
    </svg>
  )
}
