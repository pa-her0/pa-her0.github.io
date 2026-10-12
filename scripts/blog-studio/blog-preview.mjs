import { randomUUID } from "node:crypto"
import { fileURLToPath } from "node:url"
import { dev } from "astro"
import { createMarkdownProcessor } from "@astrojs/markdown-remark"

// A private Astro instance shares the blog's resolved Markdown plugins and CSS.
// Preview drafts stay in memory, outside content collections and Git.
export function createBlogPreview(repoRoot) {
  const drafts = new Map()
  let running
  let processor
  let instance
  const entrypoint = fileURLToPath(new URL("./preview.astro", import.meta.url))
  const start = () => running ||= dev({
    root: repoRoot,
    server: { host: "127.0.0.1", port: 0, open: false },
    devToolbar: { enabled: false },
    vite: { cacheDir: "node_modules/.vite-studio", plugins: [{
      name: "studio-private-cache",
      config() { return { cacheDir: "node_modules/.vite-studio" } },
    }] },
    integrations: [{
      name: "local-studio-preview",
      hooks: {
        "astro:config:setup": ({ injectRoute }) => injectRoute({ pattern: "/__studio/preview", entrypoint, prerender: false }),
        "astro:config:done": async ({ config }) => { processor = await createMarkdownProcessor(config.markdown) },
        "astro:server:setup": ({ server }) => {
          server.middlewares.use((req, res, next) => {
            const url = new URL(req.url || "/", "http://127.0.0.1")
            if (url.pathname !== "/__studio/data") return next()
            const draft = drafts.get(url.searchParams.get("id"))
            res.setHeader("Content-Type", "application/json; charset=utf-8")
            res.setHeader("Cache-Control", "no-store")
            res.statusCode = draft ? 200 : 404
            res.end(JSON.stringify(draft || { error: "预览已过期，请刷新预览。" }))
          })
        },
      },
    }],
  }).then((server) => { instance = server; return server }).catch((error) => { running = undefined; throw error })

  return {
    async render(payload) {
      const server = await start()
      const body = String(payload.body || "")
      const meta = payload.meta && typeof payload.meta === "object" ? payload.meta : {}
      const result = await processor.render(body, { frontmatter: meta })
      const id = randomUUID()
      drafts.set(id, { html: result.code, meta, type: payload.type, frontmatter: result.metadata.frontmatter })
      while (drafts.size > 30) drafts.delete(drafts.keys().next().value)
      const origin = `http://127.0.0.1:${server.address.port}`
      const previewUrl = `${origin}/__studio/preview/?id=${id}`
      const response = await fetch(previewUrl)
      if (!response.ok) throw new Error("博客预览渲染失败，请查看工作台日志。")
      return { html: await response.text(), previewUrl, origin }
    },
    async stop() { if (instance) await instance.stop() },
  }
}
