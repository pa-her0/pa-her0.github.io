import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifest = JSON.parse(await fs.readFile(path.join(root, "artwork/post-covers/generated-files.json"), "utf8"))
const outputDirectory = path.join(root, "public/post-covers/anime-v1")
await fs.mkdir(outputDirectory, { recursive: true })

for (const item of manifest) {
  if (!/^[a-z0-9-]+$/.test(item.id)) throw new Error(`Invalid cover id: ${item.id}`)
  const metadata = await sharp(item.source).metadata()
  if (!metadata.width || !metadata.height || metadata.width / metadata.height < 1.6) {
    throw new Error(`Expected a landscape cover: ${item.id}`)
  }
  const destination = path.join(outputDirectory, `${item.id}.webp`)
  await sharp(item.source)
    .resize({ width: 1672, withoutEnlargement: true })
    .webp({ quality: 88, effort: 6, smartSubsample: true })
    .toFile(destination)
  const stat = await fs.stat(destination)
  console.log(`${item.id}: ${Math.round(stat.size / 1024)} KB`)
}
