import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { test } from 'node:test'
import MarkdownIt from 'markdown-it'
import { JSDOM } from 'jsdom'
import { remarkEncyclopediaDiagrams } from '../src/plugins/remark-encyclopedia-diagrams.mjs'

test('all article Mermaid diagrams parse with strict security, including both fence styles', async (context) => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  globalThis.window = dom.window
  globalThis.document = dom.window.document
  try {
    const { default: mermaid } = await import('mermaid')
    mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true })
    const root = new URL('../src/content/posts/', import.meta.url)
    const files = (await readdir(root, { recursive: true })).filter((file) => /\.mdx?$/.test(file))
    const markdown = new MarkdownIt()
    let total = 0
    for (const file of files) {
      const content = await readFile(new URL(file.replaceAll('\\', '/'), root), 'utf8')
      for (const token of markdown.parse(content, {})) {
        if (token.type !== 'fence' || token.info.trim() !== 'mermaid') continue
        const result = await mermaid.parse(token.content)
        assert.ok(result, `${file}:${token.map[0] + 1}`)
        total += 1
      }
    }
    assert.ok(total > 0, 'No Mermaid diagrams were discovered in article content')
    context.diagnostic(`Validated ${total} Mermaid diagrams`)
  } finally {
    dom.window.close()
    delete globalThis.window
    delete globalThis.document
  }
})

test('diagram markup preserves escaped source and provides accessible size controls', () => {
  const tree = { type: 'root', children: [{ type: 'code', lang: 'mermaid', value: 'flowchart LR\n A["<script>& label</script>"]' }] }
  remarkEncyclopediaDiagrams()(tree, { path: '/src/content/posts/2026/11/agent-technical-encyclopedia.md' })
  const dom = new JSDOM(tree.children[0].value)
  try {
    const figure = dom.window.document.querySelector('figure')
    assert.equal(figure.querySelector('code').textContent, 'flowchart LR\n A["<script>& label</script>"]')
    assert.equal(figure.querySelectorAll('script').length, 0)
    const button = figure.querySelector('button')
    assert.equal(button.type, 'button')
    assert.equal(button.getAttribute('aria-pressed'), 'false')
    assert.ok(figure.querySelector(`[id="${button.getAttribute('aria-controls')}"]`))
    assert.ok(button.hidden)
    assert.ok(figure.querySelector('details').open)
  } finally {
    dom.window.close()
  }
})
