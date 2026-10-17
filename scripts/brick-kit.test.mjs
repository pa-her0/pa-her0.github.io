import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

// Compile the same TypeScript data and geometry used by the client, without a browser.
const result = await build({
  stdin: {
    contents: 'export * from "./src/data/brick-kit"; export * from "./src/data/voxel-dinosaur"; export * from "./src/lib/brick-geometry";',
    resolveDir: fileURLToPath(new URL('../', import.meta.url)),
    loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
})
const { BRICK_DEFINITIONS, BRICK_GRID, BRICK_UNIT, DINOSAUR_BRICKS, brickSize, brickBounds, bricksOverlap, brickInGrid, canPlaceBrick, placeBrickAgainst, createBrickGeometry } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const up = { x: 0, y: 1, z: 0 }

test('all backpack shapes produce finite, visible geometry', () => {
  for (const definition of Object.values(BRICK_DEFINITIONS)) {
    const parts = createBrickGeometry(definition.id)
    assert.ok(parts.length > 0, definition.id)
    for (const { geometry } of parts) {
      assert.ok(geometry.getAttribute('position').count >= 12, definition.id)
      for (const name of ['position', 'normal']) assert.ok(geometry.getAttribute(name).array.every(Number.isFinite), `${definition.id}: ${name}`)
      geometry.computeBoundingBox()
      const b = geometry.boundingBox
      assert.ok(b.max.x > b.min.x && b.max.y > b.min.y && b.max.z > b.min.z, definition.id)
      assert.ok(b.max.x - b.min.x <= definition.width * BRICK_UNIT + 1, definition.id)
      assert.ok(b.max.y - b.min.y <= definition.height * BRICK_UNIT, `${definition.id}: no protruding studs`)
      const normals = geometry.getAttribute('normal')
      for (let i = 0; i < normals.count; i++) {
        const axes = [normals.getX(i), normals.getY(i), normals.getZ(i)].map(Math.abs)
        assert.equal(axes.filter((value) => value > 0.999).length, 1, `${definition.id}: axis-aligned voxel faces`)
      }
      geometry.dispose()
    }
  }
})

test('quarter turns rotate the entire footprint, including long pieces', () => {
  assert.deepEqual(brickSize({ kind: 'long', turn: 0 }), { width: 4, height: 1, depth: 1 })
  assert.deepEqual(brickSize({ kind: 'long', turn: 1 }), { width: 1, height: 1, depth: 4 })
  assert.deepEqual(brickSize({ kind: 'long', turn: 2 }), brickSize({ kind: 'long', turn: 0 }))
  assert.deepEqual(brickSize({ kind: 'long', turn: 3 }), brickSize({ kind: 'long', turn: 1 }))
  assert.equal(brickInGrid({ kind: 'long', turn: 1, x: 13, y: 0, z: 10 }), true)
  assert.equal(brickInGrid({ kind: 'long', turn: 1, x: 13, y: 0, z: 11 }), false)
})

test('ground placement snaps negative coordinates and small pieces correctly', () => {
  const long = placeBrickAgainst('long', 1, { x: -1.2, y: 0, z: 2.3 }, up)
  assert.deepEqual([long.x, long.y, long.z], [-2, 0, 2])
  const pixel = placeBrickAgainst('pixel', 0, { x: -1.2, y: 0, z: 2.3 }, up)
  assert.deepEqual([pixel.x, pixel.y, pixel.z], [-1.5, 0, 2])
})

test('half slabs stack without gaps, drift or false collisions', () => {
  const pieces = [{ kind: 'plate', x: 0, y: 0, z: 0 }]
  for (let i = 1; i < 6; i++) {
    const target = pieces.at(-1)
    const piece = placeBrickAgainst('plate', 0, { x: 0.4, y: brickBounds(target).maxY - 0.0125, z: 0.4 }, up, target)
    assert.ok(canPlaceBrick(piece, pieces))
    pieces.push(piece)
  }
  assert.ok(Math.abs(brickBounds(pieces.at(-1)).maxY - 3) < 1e-8)
})

test('side placement attaches flush to all four faces of a rotated brick', () => {
  const target = { kind: 'long', turn: 1, x: -2, y: 2, z: -2 }
  const cases = [
    [{ x: -1, y: 2.4, z: -1.5 }, { x: 1, y: 0, z: 0 }, [-1, 2, -2]],
    [{ x: -2, y: 2.4, z: -1.5 }, { x: -1, y: 0, z: 0 }, [-4, 2, -2]],
    [{ x: -1.5, y: 2.4, z: 2 }, { x: 0, y: 0, z: 1 }, [-2, 2, 2]],
    [{ x: -1.5, y: 2.4, z: -2 }, { x: 0, y: 0, z: -1 }, [-2, 2, -3]],
  ]
  for (const [point, normal, expected] of cases) {
    const placed = placeBrickAgainst('beam', 0, point, normal, target)
    assert.deepEqual([placed.x, placed.y, placed.z], expected)
    assert.ok(canPlaceBrick(placed, [target]))
  }
})

test('collision checks cover the full rotated volume, but allow touching faces', () => {
  const long = { kind: 'long', turn: 1, x: 0, y: 0, z: 0 }
  assert.equal(canPlaceBrick({ kind: 'cube', x: 0, y: 0, z: 3 }, [long]), false)
  assert.equal(canPlaceBrick({ kind: 'cube', x: 1, y: 0, z: 3 }, [long]), true)
  assert.equal(canPlaceBrick({ kind: 'cube', x: 0, y: 1, z: 3 }, [long]), true)
  assert.equal(bricksOverlap({ kind: 'plate', x: 0, y: 0, z: 0 }, { kind: 'plate', x: 0, y: 0.5, z: 0 }), false)
})

test('a half slab fits the lower step and rotates with its supporting stair', () => {
  const steps = [
    [0, { x: 1.4, y: 0.4875, z: 0.4 }],
    [1, { x: 0.4, y: 0.4875, z: 0.4 }],
    [2, { x: 0.4, y: 0.4875, z: 0.4 }],
    [3, { x: 0.4, y: 0.4875, z: 1.4 }],
  ]
  for (const [turn, point] of steps) {
    const stair = { kind: 'stair', turn, x: 0, y: 0, z: 0 }
    const slab = placeBrickAgainst('slab', 0, point, up, stair)
    assert.equal(slab.y, 0.5)
    assert.ok(canPlaceBrick(slab, [stair]), `rotation ${turn}`)
    assert.equal(canPlaceBrick({ ...slab, y: 0.25 }, [stair]), false)
  }
})

test('invalid coordinates, floor penetration, height and capacity limits are rejected', () => {
  for (const piece of [
    { kind: 'cube', x: NaN, y: 0, z: 0 },
    { kind: 'cube', x: 0, y: -1, z: 0 },
    { kind: 'cube', x: 0, y: BRICK_GRID.height, z: 0 },
    { kind: 'long', x: BRICK_GRID.half - 3, y: 0, z: 0 },
  ]) assert.equal(canPlaceBrick(piece, []), false)
  assert.equal(canPlaceBrick({ kind: 'cube', x: 5, y: 0, z: 5 }, Array(BRICK_GRID.limit).fill({ kind: 'cube', x: 0, y: 0, z: 0 })), false)
})

test('the dinosaur fits the building area and contains no duplicate pieces', () => {
  assert.ok(DINOSAUR_BRICKS.every(brickInGrid))
  assert.ok(DINOSAUR_BRICKS.length < BRICK_GRID.limit)
  assert.equal(new Set(DINOSAUR_BRICKS.map((p) => `${p.kind}:${p.x}:${p.y}:${p.z}:${p.turn}`)).size, DINOSAUR_BRICKS.length)
  assert.ok(DINOSAUR_BRICKS.some((p) => p.kind === 'stair'))
  for (let i = 0; i < DINOSAUR_BRICKS.length; i++) {
    for (let j = i + 1; j < DINOSAUR_BRICKS.length; j++) {
      assert.equal(bricksOverlap(DINOSAUR_BRICKS[i], DINOSAUR_BRICKS[j]), false, `pieces ${i} and ${j} overlap`)
    }
  }
  assert.ok(DINOSAUR_BRICKS.filter((p) => p.kind !== 'eye').every((p) => p.tone === 'violet'), 'uniform purple body without teeth or claws')
})
