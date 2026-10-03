import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const scriptPath = fileURLToPath(import.meta.url)
const defaultRepoRoot = path.resolve(path.dirname(scriptPath), "..")
const whitespaceDiagnostic = /^.+:\d+: (?:trailing whitespace|space before tab in indent|new blank line at EOF)\.$/

export function isWhitespaceOnlyOutput(output) {
  let hasDiagnostic = false
  for (const line of String(output).split(/\r?\n/)) {
    if (!line.trim()) continue
    if (whitespaceDiagnostic.test(line)) {
      hasDiagnostic = true
    } else if (!hasDiagnostic || !line.startsWith("+")) {
      return false
    }
  }
  return hasDiagnostic
}

function git(args, repoRoot) {
  const result = spawnSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, LC_ALL: "C", LANG: "C" },
  })
  if (result.error) throw result.error
  if (result.signal || result.status === null) throw new Error("Git validation was interrupted.")
  return result
}

export function checkPublishWhitespace(repoRoot = defaultRepoRoot) {
  const conflicts = git(["ls-files", "--unmerged"], repoRoot)
  if (conflicts.status !== 0) {
    throw new Error(conflicts.stderr.trim() || "Unable to check for unresolved merge conflicts.")
  }
  if (conflicts.stdout.trim()) {
    throw new Error("Unresolved merge conflicts exist. Resolve them before publishing.")
  }

  const result = git([
    "-c", "core.whitespace=blank-at-eol,space-before-tab,-blank-at-eof",
    "diff", "--cached", "--check",
  ], repoRoot)
  if (result.status === 0) return ""
  // Only known formatting diagnostics are advisory. Conflict markers, Git
  // failures, and unknown diagnostics must still stop the publish workflow.
  if ([1, 2].includes(result.status) && !result.stderr.trim() && isWhitespaceOnlyOutput(result.stdout)) {
    return result.stdout.trimEnd()
  }
  throw new Error([result.stderr, result.stdout].filter(Boolean).join("\n").trim()
    || `Git validation failed (${result.status}).`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    const warnings = checkPublishWhitespace()
    if (warnings) {
      console.log("[WARN] Whitespace formatting suggestions only; publishing will continue.")
      console.log(warnings)
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
