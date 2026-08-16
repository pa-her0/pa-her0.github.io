import { spawnSync } from "child_process"

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T[\d:.+\-Z]+$/

/** Unescape git's quoted paths (e.g. "src/foo/\351\200\232..." → decoded string) */
function unescapeGitPath(raw: string): string {
  // git wraps paths with non-ASCII chars in double quotes and octal-escapes them
  if (raw.startsWith('"') && raw.endsWith('"')) {
    const inner = raw.slice(1, -1)
    // Replace octal sequences \NNN with the corresponding byte, then decode as UTF-8
    const bytes: number[] = []
    let i = 0
    while (i < inner.length) {
      if (inner[i] === "\\" && i + 3 < inner.length && /^[0-7]{3}$/.test(inner.slice(i + 1, i + 4))) {
        bytes.push(parseInt(inner.slice(i + 1, i + 4), 8))
        i += 4
      } else {
        bytes.push(inner.charCodeAt(i))
        i++
      }
    }
    return Buffer.from(bytes).toString("utf-8")
  }
  return raw
}

function loadAllGitDates(): Map<string, Date> {
  const map = new Map<string, Date>()
  try {
    const result = spawnSync(
      "git",
      // -z: NUL-delimited output so we don't rely on newline parsing for quoted paths
      ["log", "--format=%aI", "--diff-filter=M", "-z", "--name-only", "--", "src/content/posts/"],
      {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        cwd: process.cwd(),
      },
    )
    if (result.status !== 0 || !result.stdout) return map

    // With -z, records are NUL-separated; dates are still on their own "line" before filenames
    // Split on both \n and \0 to handle the mixed output
    let currentDate: Date | null = null
    for (const part of result.stdout.split(/[\n\0]/)) {
      const trimmed = part.trim()
      if (!trimmed) continue
      if (isoDateRegex.test(trimmed)) {
        currentDate = new Date(trimmed)
      } else if (currentDate) {
        const path = unescapeGitPath(trimmed)
        if (!map.has(path)) {
          map.set(path, currentDate)
        }
      }
    }
  } catch {
    // Not a git repo or git unavailable — degrade gracefully
  }
  return map
}

const gitDatesCache = loadAllGitDates()

export function getGitModifiedDate(postId: string): Date | null {
  const key = `src/content/posts/${postId}`.replace(/\\/g, "/")
  return gitDatesCache.get(key) ?? null
}
