import assert from "node:assert/strict"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const asset = (name) => fileURLToPath(new URL(`../public/pet-tools/${name}`, import.meta.url))
const source = sharp(asset("zero-spritesheet.webp"))
const { width, height, hasAlpha } = await source.metadata()
const columns = 8
const rows = 9
const scale = 2
assert.ok(hasAlpha && width % columns === 0 && height % rows === 0, "Expected the transparent 8×9 Zero atlas")

const frameWidth = width / columns
const frameHeight = height / rows
const atlasWidth = width * scale
const atlasHeight = height * scale
const showPreview = process.argv.includes("--preview")
const previewIndexes = [0, 2, 8, 24]
const previews = []
const tiles = []

function cleanOutline(data, width, height) {
  for (let i = 0; i < width * height; i++) {
    const offset = i * 4
    const alpha = data[offset + 3]
    if (alpha === 0) continue

    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    const spill = green - Math.max(red, blue)
    if (spill <= 5) continue

    const x = i % width
    const y = Math.floor(i / width)
    const edge = alpha < 240 || x < 2 || y < 2 || x >= width - 2 || y >= height - 2 ||
      [i - 2, i + 2, i - 2 * width, i + 2 * width].some((next) => data[next * 4 + 3] < 160)
    if (!edge) continue

    // Neutralize the green matte and fade the strongest spill in translucent pixels.
    data[offset + 1] = Math.max(red, blue) + 3
    const strength = Math.min(1, (spill - 5) / 38)
    data[offset + 3] = Math.round(alpha * (1 - strength * (1 - alpha / 255) * 0.9))
  }
}

for (let index = 0; index < columns * rows; index++) {
  const col = index % columns
  const row = Math.floor(index / columns)
  const cell = source.clone().extract({
    left: col * frameWidth,
    top: row * frameHeight,
    width: frameWidth,
    height: frameHeight,
  })
  const pixels = await cell.clone().ensureAlpha().raw().toBuffer()
  if (!pixels.some((channel, i) => i % 4 === 3 && channel > 0)) continue
  cleanOutline(pixels, frameWidth, frameHeight)

  const upgraded = await sharp(pixels, { raw: { width: frameWidth, height: frameHeight, channels: 4 } })
    .resize(frameWidth * scale, frameHeight * scale, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.9, m1: 0.12, m2: 1.45, y2: 10, y3: 14 })
    .png()
    .toBuffer()

  tiles.push({ input: upgraded, left: col * frameWidth * scale, top: row * frameHeight * scale })

  if (showPreview && previewIndexes.includes(index)) {
    const previewIndex = previewIndexes.indexOf(index)
    const previewWidth = 250
    const top = 22
    const pair = [await cell.png().toBuffer(), upgraded]
    for (let side = 0; side < pair.length; side++) {
      previews.push({
        input: await sharp(pair[side]).resize({ width: previewWidth }).png().toBuffer(),
        left: 12 + previewIndex * (previewWidth + 7),
        top: top + side * 292,
      })
    }
  }
}

assert.equal(tiles.length, 57, "Expected all 57 occupied cells in the original atlas")
const result = await sharp({
  create: { width: atlasWidth, height: atlasHeight, channels: 4, background: "#00000000" },
})
  .composite(tiles)
  .webp({ quality: 89, alphaQuality: 100, effort: 5 })
  .toFile(asset("zero-spritesheet-hd.webp"))
console.log(`${tiles.length} frames, ${result.width} × ${result.height}px, ${result.size} B`)

if (previews.length) {
  await sharp({
    create: { width: 1045, height: 604, channels: 3, background: "#f5f5fa" },
  })
    .composite(previews)
    .png()
    .toFile("Design/previews/zero-sharpness.png")
}
