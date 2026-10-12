import { basicSetup, EditorView } from "codemirror"
import { Compartment, EditorState } from "@codemirror/state"
import { keymap, placeholder } from "@codemirror/view"
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language"
import { markdown, markdownLanguage } from "@codemirror/lang-markdown"
import { languages } from "@codemirror/language-data"
import { tags } from "@lezer/highlight"

const color = new Compartment()
const palettes = {
  light: { text: "#343440", heading: "#7661d3", strong: "#b6632d", link: "#247b98", quote: "#768246", code: "#b65382", comment: "#9693a5" },
  dark: { text: "#e5e4ee", heading: "#bd9cff", strong: "#ffb978", link: "#83d9ef", quote: "#dcdf91", code: "#f38bc9", comment: "#8f8da4" },
}
function highlight(mode) {
  const p = palettes[mode] || palettes.light
  return syntaxHighlighting(HighlightStyle.define([
    { tag: tags.heading, color: p.heading, fontWeight: "700" },
    { tag: tags.strong, color: p.strong, fontWeight: "700" },
    { tag: tags.emphasis, fontStyle: "italic", color: p.strong },
    { tag: tags.quote, color: p.quote, fontStyle: "italic" },
    { tag: [tags.link, tags.url], color: p.link, textDecoration: "underline" },
    { tag: [tags.monospace, tags.string, tags.special(tags.string)], color: p.code },
    { tag: [tags.keyword, tags.modifier, tags.controlKeyword], color: p.heading },
    { tag: [tags.number, tags.bool, tags.atom], color: p.strong },
    { tag: [tags.typeName, tags.className], color: p.link },
    { tag: [tags.comment, tags.meta, tags.processingInstruction], color: p.comment },
    { tag: [tags.punctuation, tags.list, tags.contentSeparator], color: p.heading },
    { tag: tags.strikethrough, textDecoration: "line-through" },
  ]))
}

export function createEditor({ parent, onChange, onSelection, onScroll, onSave }) {
  let replacing = false
  const extensions = [
    basicSetup,
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ "aria-label": "Markdown 正文", spellcheck: "false" }),
    placeholder("把想法写下来…"),
    color.of(highlight("light")),
    keymap.of([{ key: "Mod-s", run: () => { onSave(); return true } }]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !replacing) onChange(update.state.doc.toString())
      if (update.selectionSet || update.docChanged) {
        const head = update.state.selection.main.head
        const line = update.state.doc.lineAt(head)
        onSelection(line.number, head - line.from + 1)
      }
    }),
    EditorView.domEventHandlers({ scroll: (_event, view) => {
      const el = view.scrollDOM
      onScroll(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight))
    } }),
  ]
  const view = new EditorView({ parent, state: EditorState.create({ extensions }) })
  return {
    get value() { return view.state.doc.toString() },
    setValue(value) {
      replacing = true
      view.setState(EditorState.create({ doc: value, extensions }))
      replacing = false
      this.setTheme(parent.dataset.theme || "light")
      onSelection(1, 1)
    },
    insert(text, surround = "") {
      const { from, to } = view.state.selection.main
      const selected = view.state.sliceDoc(from, to)
      const insert = surround ? `${text}${selected || "文字"}${surround}` : text
      view.dispatch({ changes: { from, to, insert }, selection: { anchor: from + insert.length }, scrollIntoView: true })
      view.focus()
    },
    setTheme(mode) {
      parent.dataset.theme = mode
      view.dispatch({ effects: color.reconfigure(highlight(mode)) })
    },
    focus() { view.focus() },
    destroy() { view.destroy() },
  }
}
