import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { after, test } from "node:test"
import { checkPublishWhitespace, isWhitespaceOnlyOutput } from "./check-publish-whitespace.mjs"

test("recognizes whitespace warnings without accepting other errors", () => {
  for (const output of [
    "post.md:3: trailing whitespace.\n+Text  \n",
    "笔记 space.md:4: space before tab in indent.\n+ \tText\r\n",
    "post.md:5: new blank line at EOF.\n",
    "post.md:3: trailing whitespace.\n+Text \ncode.cpp:9: trailing whitespace.\n+  \n",
  ]) assert.equal(isWhitespaceOnlyOutput(output), true)
  for (const output of [
    "", "fatal: not a git repository", "+Text ",
    "post.md:3: leftover conflict marker.\n+<<<<<<< HEAD\n",
    "post.md:3: trailing whitespace.\n+Text \npost.md:4: leftover conflict marker.\n+=======\n",
  ]) assert.equal(isWhitespaceOnlyOutput(output), false)
})

const fixtureBase = realpathSync(tmpdir())
const fixtureRoot = mkdtempSync(path.join(fixtureBase, "jiely-publish-whitespace-"))
after(() => {
  const resolved = realpathSync(fixtureRoot)
  assert.equal(path.dirname(resolved), fixtureBase)
  assert.ok(path.basename(resolved).startsWith("jiely-publish-whitespace-"))
  rmSync(resolved, { recursive: true })
})

function git(args, input) {
  const result = spawnSync("git", args, { cwd: fixtureRoot, encoding: "utf8", input, windowsHide: true })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
  return result.stdout.trim()
}

test("staged whitespace is non-blocking and the source stays unchanged", () => {
  git(["init", "--quiet"])
  git(["config", "core.autocrlf", "false"])
  const source = "const answer = 42; \n\n"
  writeFileSync(path.join(fixtureRoot, "post.md"), source)
  git(["add", "post.md"])
  assert.match(checkPublishWhitespace(fixtureRoot), /post\.md:1: trailing whitespace/)
  assert.equal(readFileSync(path.join(fixtureRoot, "post.md"), "utf8"), source)
})

test("a clean file passes", () => {
  writeFileSync(path.join(fixtureRoot, "post.md"), "const answer = 42;\n")
  git(["add", "post.md"])
  assert.equal(checkPublishWhitespace(fixtureRoot), "")
})

test("leftover merge conflict markers still stop publishing", () => {
  writeFileSync(path.join(fixtureRoot, "post.md"), "<<<<<<< HEAD\nours\n=======\ntheirs\n>>>>>>> branch\n")
  git(["add", "post.md"])
  assert.throws(() => checkPublishWhitespace(fixtureRoot), /leftover conflict marker/)
})

test("unresolved index conflicts still stop publishing", () => {
  const object = git(["hash-object", "-w", "--stdin"], "fixture\n")
  git(["update-index", "--force-remove", "post.md"])
  git(["update-index", "--index-info"], [1, 2, 3].map((stage) => `100644 ${object} ${stage}\tpost.md\n`).join(""))
  assert.throws(() => checkPublishWhitespace(fixtureRoot), /Unresolved merge conflicts/)
})

test("Git errors are not converted into warnings", () => {
  assert.throws(() => checkPublishWhitespace(path.join(fixtureRoot, "missing")))
})
