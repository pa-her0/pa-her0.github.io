import { defineConfig } from "astro/config"
import { promises as fs } from "node:fs"
import { fileURLToPath } from "node:url"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import mdx from "@astrojs/mdx"
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import expressiveCode from "astro-expressive-code"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeComponents from "rehype-components"
import rehypeKatex from "rehype-katex"
import rehypeSlug from "rehype-slug"
import remarkDirective from "remark-directive"
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives"
import remarkMath from "remark-math"
import remarkSectionize from "remark-sectionize"
import { remarkShiftHeadings } from "./src/plugins/remark-shift-headings.mjs"
import { AdmonitionComponent } from "./src/plugins/rehype-component-admonition.mjs"
import { GithubCardComponent } from "./src/plugins/rehype-component-github-card.mjs"
import { parseDirectiveNode } from "./src/plugins/remark-directive-rehype.js"
import { remarkExcerpt } from "./src/plugins/remark-excerpt.js"
import { remarkReadingTime } from "./src/plugins/remark-reading-time.mjs"
import { pluginLanguageBadge } from "./src/plugins/expressive-code/language-badge"
import { pluginCustomCopyButton } from "./src/plugins/expressive-code/custom-copy-button"

const createAdmonitionComponent = (type) => (properties = {}, children = []) => {
  const normalizedChildren = Array.isArray(children) ? children : []
  return AdmonitionComponent(properties, normalizedChildren, type)
}

const learningProgressFile = fileURLToPath(new URL("./src/data/learning-progress.json", import.meta.url))
const learningTrackIds = new Set(["nowcoder", "hdu", "regional-vp", "ai-infra", "agent"])
const safeTaskId = /^[a-z0-9][a-z0-9-]{0,95}$/i
const safeDate = /^\d{4}-\d{2}-\d{2}$/

const sanitizeLearningProgress = (payload) => {
  const source = payload && typeof payload === "object" ? payload : {}
  const completedAt = {}
  Object.entries(source.completedAt && typeof source.completedAt === "object" ? source.completedAt : {})
    .slice(0, 1000)
    .forEach(([taskId, date]) => {
      if (safeTaskId.test(taskId) && typeof date === "string" && safeDate.test(date)) completedAt[taskId] = date
    })

  const currentTaskByTrack = {}
  Object.entries(source.currentTaskByTrack && typeof source.currentTaskByTrack === "object" ? source.currentTaskByTrack : {})
    .forEach(([trackId, taskId]) => {
      if (learningTrackIds.has(trackId) && typeof taskId === "string" && safeTaskId.test(taskId)) currentTaskByTrack[trackId] = taskId
    })

  const statusNoteByTrack = {}
  Object.entries(source.statusNoteByTrack && typeof source.statusNoteByTrack === "object" ? source.statusNoteByTrack : {})
    .forEach(([trackId, note]) => {
      if (learningTrackIds.has(trackId) && typeof note === "string") statusNoteByTrack[trackId] = note.slice(0, 240)
    })

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    dailyGoal: Math.max(1, Math.min(20, Number(source.dailyGoal) || 1)),
    completedAt,
    currentTaskByTrack,
    statusNoteByTrack,
  }
}

const readJsonBody = (request) => new Promise((resolve, reject) => {
  let body = ""
  request.setEncoding("utf8")
  request.on("data", (chunk) => {
    body += chunk
    if (body.length > 256_000) reject(new Error("Request body is too large"))
  })
  request.on("end", () => {
    try { resolve(JSON.parse(body || "{}")) }
    catch { reject(new Error("Invalid JSON")) }
  })
  request.on("error", reject)
})

const sendJson = (response, status, payload) => {
  response.statusCode = status
  response.setHeader("Content-Type", "application/json; charset=utf-8")
  response.setHeader("Cache-Control", "no-store")
  response.end(JSON.stringify(payload))
}

function localLearningProgressApi() {
  return {
    name: "local-learning-progress-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || "/", "http://localhost").pathname
        if (pathname !== "/__local/learning-progress") return next()

        const remoteAddress = request.socket.remoteAddress || ""
        const isLoopback = remoteAddress === "127.0.0.1" || remoteAddress === "::1" || remoteAddress === "::ffff:127.0.0.1"
        if (!isLoopback) return sendJson(response, 403, { error: "Local access only" })

        try {
          if (request.method === "GET") {
            const current = JSON.parse(await fs.readFile(learningProgressFile, "utf8"))
            return sendJson(response, 200, current)
          }
          if (request.method === "PUT") {
            const nextProgress = sanitizeLearningProgress(await readJsonBody(request))
            await fs.writeFile(learningProgressFile, `${JSON.stringify(nextProgress, null, 2)}\n`, "utf8")
            return sendJson(response, 200, nextProgress)
          }
          return sendJson(response, 405, { error: "Method not allowed" })
        } catch (error) {
          return sendJson(response, 400, { error: error instanceof Error ? error.message : "Invalid request" })
        }
      })
    },
  }
}

export default defineConfig({
  srcDir: "./src",
  output: "static",
  site: "https://www.whalefall.top",
  trailingSlash: "always",
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  alias: {
    "@": "./src",
  },
  vite: {
    plugins: [
      {
        name: "isolated-dependency-cache",
        config(_config, { mode }) {
          // Astro's build/check can optimize dependencies while dev is still running.
          // Never overwrite development React modules with production variants.
          return { cacheDir: mode === "production" ? "node_modules/.vite-production" : "node_modules/.vite-development" }
        },
      },
      localLearningProgressApi(),
    ],
    resolve: { dedupe: ["react", "react-dom"] },
    optimizeDeps: {
      include: ["liquid-gooey", "@splinetool/react-spline", "framer-motion"],
      // Keep Spline's scene-version updater chunks relative to its runtime file.
      exclude: ["@splinetool/runtime"],
    },
  },
  integrations: [
    expressiveCode({
      themes: ["github-dark", "github-light"],
      themeCssSelector: (theme) => {
        // 根据主题名称返回对应的 CSS 选择器
        if (theme.name === "github-light") return ":root:not(.dark)"
        return ".dark"
      },
      plugins: [
        pluginCollapsibleSections(),
        pluginLineNumbers(),
        pluginLanguageBadge(),
        pluginCustomCopyButton(),
      ],
      defaultProps: {
        wrap: true,
        overridesByLang: {
          shellsession: {
            showLineNumbers: false,
          },
        },
      },
      styleOverrides: {
        codeBackground: "var(--codeblock-bg)",
        borderRadius: "0.75rem",
        borderColor: "transparent",
        codeFontSize: "0.875rem",
        codeFontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        codeLineHeight: "1.625",
        frames: {
          editorBackground: "var(--codeblock-bg)",
          terminalBackground: "var(--codeblock-bg)",
          terminalTitlebarBackground: "var(--codeblock-topbar-bg)",
          editorTabBarBackground: "var(--codeblock-topbar-bg)",
          editorActiveTabBackground: "transparent",
          editorActiveTabIndicatorBottomColor: "var(--primary)",
          editorActiveTabIndicatorTopColor: "transparent",
          editorTabBarBorderBottomColor: "var(--codeblock-topbar-bg)",
          terminalTitlebarBorderBottomColor: "transparent",
        },
      },
      frames: {
        showCopyToClipboardButton: false,
      },
    }),
    react(),
    sitemap({ filter: (page) => !page.includes("/learning/manage/") }),
    mdx(),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkReadingTime,
      remarkExcerpt,
      remarkShiftHeadings,
      remarkGithubAdmonitionsToDirectives,
      remarkDirective,
      remarkSectionize,
      parseDirectiveNode,
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeComponents,
        {
          components: {
            github: GithubCardComponent,
            note: createAdmonitionComponent("note"),
            tip: createAdmonitionComponent("tip"),
            important: createAdmonitionComponent("important"),
            caution: createAdmonitionComponent("caution"),
            warning: createAdmonitionComponent("warning"),
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: {
            className: ["anchor"],
          },
          content: {
            type: "element",
            tagName: "span",
            properties: {
              className: ["anchor-icon"],
              "data-pagefind-ignore": true,
            },
            children: [
              {
                type: "text",
                value: "#",
              },
            ],
          },
        },
      ],
    ],
  },
})
