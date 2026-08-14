import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptDir, "..")
const powershellScript = path.join(scriptDir, "publish-blog.ps1")
const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--")

const result = spawnSync(
  "powershell.exe",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", powershellScript, ...forwardedArgs],
  {
    cwd: repoRoot,
    stdio: "inherit",
    windowsHide: true,
  },
)

if (result.error) {
  console.error(`无法启动发布脚本：${result.error.message}`)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
