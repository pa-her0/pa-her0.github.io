import sharp from "sharp"
import { mkdir, stat, readFile, writeFile } from "node:fs/promises"

// Derived thumbnails only; keep original photographs untouched.
const publicRoot = new URL("../public/", import.meta.url)
const outputRoot = new URL("home-gallery/", publicRoot)
await mkdir(outputRoot, { recursive: true })
let before = 0
let after = 0
for (const name of ["hero-avatar-02", "hero-avatar-03", "hero-avatar-04", "hero-avatar-05", "hero-avatar"]) {
  const source = new URL(`${name}.jpg`, publicRoot)
  const output = new URL(`${name}.webp`, outputRoot)
  const inputBytes = (await stat(source)).size
  const result = await sharp(await readFile(source))
    .rotate().resize({ width: 480, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer()
  await writeFile(output, result)
  before += inputBytes
  after += result.length
  console.log(`${name}: ${inputBytes} -> ${result.length} bytes`)
}
console.log(`Total: ${before} -> ${after} bytes (${(100 - after / before * 100).toFixed(1)}% smaller)`)
