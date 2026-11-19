import { visit } from "unist-util-visit"

const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character])

export function remarkEncyclopediaDiagrams() {
  return (tree, file) => {
    if (!String(file.path ?? "").replace(/\\/g, "/").endsWith("/agent-technical-encyclopedia.md")) return

    visit(tree, "code", (node, index, parent) => {
      if (node.lang?.trim() !== "mermaid" || !parent || index === undefined) return
      parent.children[index] = {
        type: "html",
        value: `<figure class="article-diagram"><div class="article-diagram__canvas" hidden></div><details open><summary>查看流程图源码</summary><pre><code>${escapeHtml(node.value)}</code></pre></details></figure>`,
      }
    })
  }
}
