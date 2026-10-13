import { createHash, createHmac } from "node:crypto"
import path from "node:path"

const regions = new Set(["z0", "cn-east-2", "z1", "z2", "na0", "as0", "ap-southeast-2", "ap-southeast-3"])
const base64 = (value) => Buffer.from(value).toString("base64").replaceAll("+", "-").replaceAll("/", "_")

export function cloudImageConfig(env = process.env) {
  const region = env.QINIU_REGION || "z0"
  return {
    accessKey: env.QINIU_ACCESS_KEY || "",
    secretKey: env.QINIU_SECRET_KEY || "",
    bucket: env.QINIU_BUCKET || "",
    region,
    uploadUrl: env.QINIU_UPLOAD_URL || "",
    publicBaseUrl: String(env.IMAGE_CDN_BASE_URL || "https://dns.whalefall.top").replace(/\/+$/, ""),
    prefix: String(env.QINIU_PREFIX || "").replace(/^\/+|\/+$/g, ""),
    configured: Boolean(env.QINIU_ACCESS_KEY && env.QINIU_SECRET_KEY && env.QINIU_BUCKET),
  }
}

export function uploadNetworkMessage(error) {
  const code = error?.cause?.code || error?.code || ""
  if (/TIMEOUT|ETIMEDOUT/.test(code) || error?.name === "TimeoutError")
    return "连接七牛云超时，已尝试备用上传节点。请检查网络后重试，或保存到博客本地。"
  if (/ENOTFOUND|EAI_AGAIN/.test(code)) return "无法解析七牛上传域名。请检查网络或 DNS 后重试，或保存到博客本地。"
  if (/CERT|TLS|SSL/.test(code)) return "七牛云 HTTPS 连接验证失败，请检查系统时间、代理和证书。"
  return "七牛云连接中断，已尝试备用上传节点。图片仍保留在待上传列表，可重试或保存到博客本地。"
}

function safeBase(value) {
  return (
    String(value)
      .normalize("NFKC")
      .replace(/[\\/:*?"<>|#%&{}$!'@+=`]/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^[-.]+|[-.]+$/g, "")
      .slice(0, 80) || "image"
  )
}

function token(cloud, key) {
  const policy = base64(
    JSON.stringify({ scope: `${cloud.bucket}:${key}`, deadline: Math.floor(Date.now() / 1000) + 3600, insertOnly: 1 }),
  )
  return `${cloud.accessKey}:${base64(createHmac("sha1", cloud.secretKey).update(policy).digest())}:${policy}`
}

// Discovery is cached per account/space. Only official HTTPS upload hosts are accepted.
export function createQiniuUploader({ fetchImpl = fetch, timeoutMs = 30000, discoveryTimeoutMs = 5000 } = {}) {
  let discovery
  let preferred = ""

  async function endpoints(cloud) {
    const fallback = regions.has(cloud.region)
      ? [`https://upload-${cloud.region}.qiniup.com`, `https://up-${cloud.region}.qiniup.com`]
      : []
    if (cloud.uploadUrl) {
      const custom = new URL(cloud.uploadUrl)
      if (custom.protocol !== "https:" || custom.username || custom.password)
        throw new Error("QINIU_UPLOAD_URL 必须是 HTTPS 上传地址。")
      return [...new Set([custom.origin, ...fallback])]
    }
    const identity = `${cloud.accessKey}:${cloud.bucket}`
    if (!discovery || discovery.identity !== identity || discovery.expires < Date.now()) {
      const url = new URL("https://uc.qbox.me/v4/query")
      url.searchParams.set("ak", cloud.accessKey)
      url.searchParams.set("bucket", cloud.bucket)
      let hosts = []
      try {
        const response = await fetchImpl(url, { signal: AbortSignal.timeout(discoveryTimeoutMs), redirect: "error" })
        const result = await response.json()
        if (response.ok)
          hosts = (result.hosts || [])
            .flatMap((item) => item.up?.domains || [])
            .filter((host) => /^(?:up|upload)(?:-[a-z0-9-]+)?\.qiniup\.com$/.test(host))
            .map((host) => `https://${host}`)
      } catch {
        /* A failed discovery must not block configured regional endpoints. */
      }
      discovery = {
        identity,
        hosts: hosts.length ? hosts : fallback,
        expires: Date.now() + (hosts.length ? 3600000 : 60000),
      }
    }
    const hosts = discovery.hosts
    if (!hosts.length) throw new Error("无法确定七牛空间的上传区域，请检查 QINIU_REGION 配置。")
    return preferred && hosts.includes(preferred) ? [preferred, ...hosts.filter((host) => host !== preferred)] : hosts
  }

  return async function upload({ payload, bytes, mimeType, extension, cloud }) {
    const original = path.basename(String(payload.name || "image"), path.extname(String(payload.name || "")))
    const generic = /^(?:image|clipboard|pasted-image|screenshot|blob)$/i.test(original.trim())
    const base = safeBase(generic ? payload.slug || "image" : original)
    // Content-addressed names make a retry safe even if the first response was lost.
    const fileName = `${base}-${createHash("sha256").update(bytes).digest("hex").slice(0, 24)}${extension}`
    const key = cloud.prefix ? `${cloud.prefix}/${fileName}` : fileName
    const hosts = await endpoints(cloud)
    let failure
    for (let attempt = 0; attempt < Math.max(2, Math.min(3, hosts.length)); attempt++) {
      const endpoint = hosts[attempt % hosts.length]
      const form = new FormData()
      form.set("token", token(cloud, key))
      form.set("key", key)
      form.set("file", new Blob([bytes], { type: mimeType }), fileName)
      let response, result
      try {
        response = await fetchImpl(endpoint, {
          method: "POST",
          body: form,
          signal: AbortSignal.timeout(timeoutMs),
          redirect: "error",
        })
        result = await response.json().catch(() => ({}))
      } catch (error) {
        failure = new Error(uploadNetworkMessage(error))
        continue
      }
      if (response.ok || response.status === 614) {
        preferred = endpoint
        return {
          path: `${cloud.publicBaseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`,
          storage: "cloud",
          key,
        }
      }
      if (response.status === 401 || response.status === 403)
        throw new Error(`七牛云拒绝上传（${response.status}），请检查上传密钥、空间权限和系统时间。`)
      if (/incorrect region/i.test(result.error || "")) {
        discovery = undefined
        failure = new Error("七牛空间与上传区域不一致，请检查 QINIU_REGION 或自定义上传地址。")
        continue
      }
      failure = new Error(
        `七牛云上传失败（${response.status}），${response.status >= 500 || response.status === 429 ? "服务暂时不可用，可稍后重试或保存到博客本地。" : "请检查空间配置及上传限制。"}`,
      )
      if (response.status < 500 && response.status !== 429) throw failure
    }
    throw failure
  }
}
