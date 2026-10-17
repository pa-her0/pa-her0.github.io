import { BoxGeometry, ExtrudeGeometry, Shape } from "three"
import type { BufferGeometry } from "three"
import { BRICK_DEFINITIONS, type BrickKind, type BrickTone } from "@/data/brick-kit"

export const BRICK_UNIT = 36
export type BrickGeometryPart = { geometry: BufferGeometry; tone?: BrickTone }

/** Flat voxel faces: no studs, rounded edges or curved detail. */
export function createBrickGeometry(kind: BrickKind): BrickGeometryPart[] {
  const { width: w, height: h, depth: d, form } = BRICK_DEFINITIONS[kind]
  const gap = 0.025
  if (form === "eye") {
    return [
      { geometry: new BoxGeometry(0.94, 0.94, 0.1), tone: "ivory" },
      { geometry: new BoxGeometry(0.5, 0.58, 0.035).translate(0.08, -0.025, 0.065), tone: "ink" },
      { geometry: new BoxGeometry(0.14, 0.14, 0.02).translate(-0.03, 0.13, 0.092), tone: "ivory" },
    ].map(({ geometry, tone }) => ({ geometry: geometry.scale(BRICK_UNIT, BRICK_UNIT, BRICK_UNIT), tone: tone as BrickTone }))
  }
  let geometry: BufferGeometry
  if (form === "stair") {
    const profile = new Shape()
      .moveTo(-w / 2 + gap / 2, -h / 2 + gap / 2)
      .lineTo(w / 2 - gap / 2, -h / 2 + gap / 2)
      .lineTo(w / 2 - gap / 2, -gap / 2)
      .lineTo(-gap / 2, -gap / 2)
      .lineTo(-gap / 2, h / 2 - gap / 2)
      .lineTo(-w / 2 + gap / 2, h / 2 - gap / 2)
      .closePath()
    geometry = new ExtrudeGeometry(profile, { depth: d - gap, steps: 1, bevelEnabled: false })
      .translate(0, 0, -(d - gap) / 2)
  } else {
    geometry = new BoxGeometry(w - gap, h - gap, d - gap)
  }
  geometry.scale(BRICK_UNIT, BRICK_UNIT, BRICK_UNIT)
  geometry.computeBoundingSphere()
  return [{ geometry }]
}
