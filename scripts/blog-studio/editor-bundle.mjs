import { build } from "esbuild"
import { fileURLToPath } from "node:url"

let bundle
export function editorBundle() {
  return bundle ||= build({
    entryPoints: [fileURLToPath(new URL("./public/editor.js", import.meta.url))],
    bundle: true, write: false, format: "esm", platform: "browser", target: "es2022", minify: true,
  }).then((result) => result.outputFiles[0].contents).catch((error) => { bundle = undefined; throw error })
}
