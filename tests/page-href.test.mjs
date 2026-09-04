import test from "node:test"
import assert from "node:assert/strict"
import { getPageHref } from "../src/lib/page-href.ts"

test("page one always has the canonical trailing slash", () => {
  for (const base of ["articles", "/articles", "/articles/", "/articles///"]) {
    assert.equal(getPageHref(1, base), "/articles/")
    assert.equal(getPageHref(2, base), "/articles/2/")
    assert.equal(`${getPageHref(1, base)}?category=test`, "/articles/?category=test")
  }
})
test("root pagination still works", () => {
  assert.equal(getPageHref(1, "/"), "/")
  assert.equal(getPageHref(2, "/"), "/2/")
})
