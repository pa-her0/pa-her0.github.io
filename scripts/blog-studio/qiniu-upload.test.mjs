import test from "node:test"
import assert from "node:assert/strict"
import { createQiniuUploader, uploadNetworkMessage } from "./qiniu-upload.mjs"

const cloud = {
  accessKey: "test-access",
  secretKey: "test-secret",
  bucket: "test",
  region: "as0",
  publicBaseUrl: "https://images.example.com",
  prefix: "notes",
}
const input = {
  cloud,
  payload: { name: "image.png", slug: "test-post" },
  bytes: Buffer.from("fixture"),
  mimeType: "image/png",
  extension: ".png",
}
const discovery = () =>
  Response.json({
    hosts: [{ up: { domains: ["up-as0.qiniup.com", "upload-as0.qiniup.com", "untrusted.example.com"] } }],
  })

test("switches regional upload host after connection timeout; remembers working host", async () => {
  const attempts = []
  const upload = createQiniuUploader({
    fetchImpl: async (url, options) => {
      if (url instanceof URL) return discovery()
      attempts.push({ url, key: options.body.get("key") })
      if (url.includes("//up-")) throw new TypeError("fetch failed", { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } })
      return Response.json({ key: options.body.get("key") })
    },
  })
  const first = await upload(input)
  const second = await upload(input)
  assert.equal(first.path, second.path)
  assert.equal(attempts.length, 3)
  assert.equal(attempts[0].key, attempts[1].key)
  assert.equal(attempts[2].url, "https://upload-as0.qiniup.com")
})

test("a lost successful response followed by 614 is idempotent", async () => {
  let uploads = 0
  const upload = createQiniuUploader({
    fetchImpl: async (url) => {
      if (url instanceof URL) return discovery()
      if (++uploads === 1) throw new TypeError("fetch failed")
      return { ok: false, status: 614, json: async () => ({ error: "file exists" }) }
    },
  })
  assert.equal((await upload(input)).storage, "cloud")
  assert.equal(uploads, 2)
})

test("discovery failure falls back to configured region; authentication errors are not retried", async () => {
  const attempted = []
  const upload = createQiniuUploader({
    fetchImpl: async (url) => {
      if (url instanceof URL) throw new Error("offline discovery")
      attempted.push(url)
      return Response.json({ error: "bad token" }, { status: 401 })
    },
  })
  await assert.rejects(upload(input), /密钥/)
  assert.deepEqual(attempted, ["https://upload-as0.qiniup.com"])
})

test("all nodes failing returns an actionable message without exposing credentials", async () => {
  const upload = createQiniuUploader({
    fetchImpl: async (url) => {
      if (url instanceof URL) return discovery()
      throw new TypeError("fetch failed", { cause: { code: "ENOTFOUND" } })
    },
  })
  await assert.rejects(upload(input), /DNS/)
  assert.match(uploadNetworkMessage({ name: "TimeoutError" }), /超时/)
})
