import { CylinderGeometry, ExtrudeGeometry, Shape } from "three"
import type { BufferGeometry } from "three"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js"
import { BRICK_DEFINITIONS, type BrickKind, type BrickTone } from "@/data/brick-kit"

export const BRICK_UNIT = 36
export type BrickGeometryPart = { geometry: BufferGeometry; tone?: BrickTone; stud?: boolean }

const scaled = (geometry: BufferGeometry) => geometry.scale(BRICK_UNIT, BRICK_UNIT, BRICK_UNIT)

/** Soft toy-brick shapes: rounded edges, round studs on top, and flat painted face decals. */
export function createBrickGeometry(kind: BrickKind): BrickGeometryPart[] {
  const { width: w, height: h, depth: d, form } = BRICK_DEFINITIONS[kind]
  const gap = 0.03
  if (form === "eye") {
    // A big glossy bead: ink pupil, two sparkles.
    return [
      { geometry: new RoundedBoxGeometry(0.96, 0.96, 0.1, 2, 0.04), tone: "ivory" as const },
      { geometry: new RoundedBoxGeometry(0.78, 0.84, 0.05, 2, 0.05).translate(0, -0.02, 0.06), tone: "ink" as const },
      { geometry: new RoundedBoxGeometry(0.26, 0.26, 0.03, 2, 0.04).translate(-0.12, 0.16, 0.095), tone: "ivory" as const },
      { geometry: new RoundedBoxGeometry(0.12, 0.12, 0.03, 2, 0.02).translate(0.16, -0.2, 0.095), tone: "ivory" as const },
    ].map(({ geometry, tone }) => ({ geometry: scaled(geometry.scale(w, h, 1)), tone }))
  }
  if (form === "cheek") {
    return [{ geometry: scaled(new RoundedBoxGeometry(0.74, 0.46, 0.06, 2, 0.04)), tone: "blush" as const }]
  }
  if (form === "mouth") {
    // A tiny "u" smile built from three ink strokes.
    const stroke = (x: number, y: number, sw: number, sh: number) => scaled(new RoundedBoxGeometry(sw, sh, 0.06, 2, 0.02).translate(x, y, 0))
    return [{ geometry: mergeGeometries([stroke(-0.26, 0.04, 0.14, 0.2), stroke(0.26, 0.04, 0.14, 0.2), stroke(0, -0.1, 0.5, 0.14)])!, tone: "ink" as const }]
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
    const radius = Math.min(0.09, (Math.min(w, h, d) - gap) / 2.2)
    geometry = new RoundedBoxGeometry(w - gap, h - gap, d - gap, 2, radius)
  }
  scaled(geometry)
  geometry.computeBoundingSphere()
  const parts: BrickGeometryPart[] = [{ geometry }]

  // One round stud per whole top cell, merged into a single mesh per brick.
  if (form === "box" && h >= 0.5 && w >= 1 && d >= 1) {
    const studs: BufferGeometry[] = []
    for (let i = 0; i < Math.floor(w); i++) {
      for (let j = 0; j < Math.floor(d); j++) {
        studs.push(scaled(new CylinderGeometry(0.29, 0.31, 0.15, 10).translate(-w / 2 + 0.5 + i, h / 2 + 0.07, -d / 2 + 0.5 + j)))
      }
    }
    parts.push({ geometry: mergeGeometries(studs)!, stud: true })
  }
  return parts
}
