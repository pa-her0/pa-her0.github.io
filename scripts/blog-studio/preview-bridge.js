let parentOrigin = ""
let reportTimer

function reportIssues() {
  clearTimeout(reportTimer)
  reportTimer = setTimeout(() => {
    const nodes = [...document.querySelectorAll(".katex-error, .article-reading__main img")]
      .filter((node) => node.matches(".katex-error") || (node.complete && node.naturalWidth === 0))
    nodes.forEach((node, index) => { node.dataset.previewIssue = String(index) })
    window.parent.postMessage({ type: "studio:issues", issues: nodes.map((node) =>
      node.matches("img") ? `图片未加载：${node.getAttribute("alt") || node.getAttribute("src")}` : `公式：${node.getAttribute("title") || node.textContent}`,
    ) }, parentOrigin || "*")
  }, 150)
}

window.addEventListener("message", (event) => {
  if (event.source !== window.parent || !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(event.origin)) return
  parentOrigin = event.origin
  if (event.data?.type === "studio:render") {
    const incoming = new DOMParser().parseFromString(event.data.html, "text/html")
    const next = incoming.querySelector(".article-reading__main")
    const current = document.querySelector(".article-reading__main")
    if (!next || !current) return
    const scroll = window.scrollY
    current.replaceWith(next)
    // Expressive Code can add a stylesheet the first time a fence is inserted.
    for (const script of next.querySelectorAll("script")) {
      const url = script.getAttribute("src")
      if (url?.startsWith("/_astro/")) {
        const replacement = document.createElement("script")
        replacement.type = "module"
        replacement.src = url
        script.replaceWith(replacement)
      } else script.remove()
    }
    window.scrollTo(0, event.data.resetScroll ? 0 : scroll)
    reportIssues()
    window.parent.postMessage({ type: "studio:updated" }, parentOrigin)
  }
  if (event.data?.type === "studio:scroll") {
    window.scrollTo({ top: Math.max(0, document.documentElement.scrollHeight - innerHeight) * event.data.ratio, behavior: "instant" })
  }
  if (event.data?.type === "studio:issue") {
    document.querySelector(`[data-preview-issue="${Number(event.data.index)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" })
  }
})

document.addEventListener("load", reportIssues, true)
document.addEventListener("error", reportIssues, true)
document.addEventListener("click", async (event) => {
  const copy = event.target.closest(".copy-btn")
  if (copy) {
    const code = copy.closest("pre")?.querySelector("code")?.textContent || ""
    try { await navigator.clipboard.writeText(code); copy.classList.add("success"); setTimeout(() => copy.classList.remove("success"), 1600) } catch { /* Clipboard may be unavailable in an embedded preview. */ }
    return
  }
  const link = event.target.closest("a")
  if (link && !link.getAttribute("href")?.startsWith("#")) { event.preventDefault(); window.open(link.href, "_blank", "noopener") }
})
window.parent.postMessage({ type: "studio:ready" }, "*")
reportIssues()
