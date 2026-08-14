import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const contentRoots = [
  path.join(repoRoot, "src", "content", "posts"),
  path.join(repoRoot, "src", "content", "thoughts"),
]
const writeChanges = process.argv.slice(2).filter((arg) => arg !== "--").includes("--write")

function stableFlatSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function shanghaiYearMonth(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`无法识别发布时间：${value}`)
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]))
  return { year: values.year, month: values.month }
}

async function planRootFiles(contentRoot) {
  const entries = await readdir(contentRoot, { withFileTypes: true })
  const plans = []

  for (const entry of entries) {
    if (!entry.isFile() || !/\.mdx?$/i.test(entry.name)) continue

    const source = path.join(contentRoot, entry.name)
    const original = await readFile(source, "utf8")
    const parsed = matter(original)
    if (!parsed.data.published) {
      throw new Error(`缺少 published，无法归档：${path.relative(repoRoot, source)}`)
    }

    const { year, month } = shanghaiYearMonth(parsed.data.published)
    const baseName = path.basename(entry.name, path.extname(entry.name))
    const stableSlug = String(parsed.data.slug || stableFlatSlug(baseName))
    const bom = original.startsWith("\uFEFF") ? "\uFEFF" : ""
    const sourceWithoutBom = bom ? original.slice(1) : original
    const lineEnding = sourceWithoutBom.startsWith("---\r\n") ? "\r\n" : "\n"
    const fence = `---${lineEnding}`
    if (!sourceWithoutBom.startsWith(fence)) {
      throw new Error(`frontmatter 格式不正确：${path.relative(repoRoot, source)}`)
    }

    const content = parsed.data.slug
      ? original
      : `${bom}${fence}slug: ${JSON.stringify(stableSlug)}${lineEnding}${sourceWithoutBom.slice(fence.length)}`
    const destination = path.join(contentRoot, year, month, entry.name)
    plans.push({ source, destination, content, stableSlug })
  }

  return plans
}

async function main() {
  const plans = (await Promise.all(contentRoots.map(planRootFiles))).flat()
  if (plans.length === 0) {
    console.log("没有需要整理的根目录 Markdown 文件。")
    return
  }

  console.log(writeChanges ? "准备整理以下内容：" : "归档预览（尚未修改文件）：")
  for (const plan of plans) {
    console.log(
      `- ${path.relative(repoRoot, plan.source)} -> ${path.relative(repoRoot, plan.destination)} [slug: ${plan.stableSlug}]`,
    )
  }

  if (!writeChanges) {
    console.log(`\n共 ${plans.length} 个文件。确认后执行：pnpm organize:content -- --write`)
    return
  }

  for (const plan of plans) {
    await mkdir(path.dirname(plan.destination), { recursive: true })
    await writeFile(plan.destination, plan.content, { encoding: "utf8", flag: "wx" })
    try {
      await rm(plan.source)
    } catch (error) {
      await rm(plan.destination, { force: true })
      throw error
    }
  }

  console.log(`\n整理完成：${plans.length} 个文件。原有 slug 已写入 frontmatter。`)
}

main().catch((error) => {
  console.error(`整理失败：${error.message}`)
  process.exitCode = 1
})
