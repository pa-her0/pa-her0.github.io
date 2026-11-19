import { visit } from "unist-util-visit"

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character])

export function remarkEncyclopediaDiagrams() {
  return (tree, file) => {
    if (!String(file.path ?? "").replace(/\\/g, "/").endsWith("/agent-technical-encyclopedia.md")) return

    let diagramCount = 0
    visit(tree, "code", (node, index, parent) => {
      if (node.lang?.trim() !== "mermaid" || !parent || index === undefined) return
      const id = `mermaid-figure-${++diagramCount}`
      parent.children[index] = {
        type: "html",
        value: `<figure id="${id}" class="article-diagram"><div id="${id}-canvas" class="article-diagram__canvas" hidden></div><button type="button" class="article-diagram__scale" aria-controls="${id}-canvas" aria-pressed="false" hidden>原始大小</button><details open><summary>查看流程图源码</summary><pre><code>${escapeHtml(node.value)}</code></pre></details></figure>`,
      }
    })
  }
}
