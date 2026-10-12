import { createEditor } from "/editor-bundle.js"

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const elements = {
  list: $("#entryList"), search: $("#searchInput"), title: $("#titleInput"), slug: $("#slugInput"),
  published: $("#publishedInput"), description: $("#descriptionInput"), category: $("#categoryInput"),
  section: $("#sectionInput"), series: $("#seriesInput"),
  tags: $("#tagsInput"), image: $("#imageInput"), body: $("#bodyInput"), draft: $("#draftInput"),
  pinned: $("#pinnedInput"), preview: $("#preview"), wordCount: $("#wordCount"), saveState: $("#saveState"),
}

const state = { entries: [], filter: "post", selectedPath: "", type: "post", originalMeta: {}, dirty: false, previewTimer: null, imageStorage: "local", dragDepth: 0, previewRevision: 0, previewOrigin: "", frameReady: false, pendingPreview: null, resetPreview: false }

const editor = createEditor({
  parent: $("#markdownEditor"),
  onChange(value) { elements.body.value = value; setDirty(true); updateWordCount(); refreshPreview() },
  onSelection(line, column) { $("#cursorPosition").textContent = `第 ${line} 行，${column} 列` },
  onScroll(ratio) { if ($("#syncScroll").checked && state.frameReady) elements.preview.contentWindow.postMessage({ type: "studio:scroll", ratio }, state.previewOrigin) },
  onSave: save,
})

function readPreference(key) {
  try { return localStorage.getItem(key) === "true" } catch { return false }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, String(value)) } catch { /* 浏览器禁用存储时仅保留本次状态 */ }
}

function setLibraryCollapsed(collapsed) {
  const dialog = $("#libraryPanel")
  if (collapsed) dialog.close()
  else if (!dialog.open) { dialog.showModal(); elements.search.focus() }
}

function setFieldsCollapsed(collapsed) {
  const dialog = $("#fieldsPanel")
  if (collapsed) dialog.close()
  else if (!dialog.open) dialog.showModal()
}

function setEditorDark(dark) {
  editor.setTheme(dark ? "dark" : "light")
  $("#editorThemeButton").textContent = dark ? "浅色编辑" : "深色编辑"
  $("#editorThemeButton").setAttribute("aria-pressed", String(dark))
  savePreference("blogStudio.editorDark", dark)
}
setEditorDark(readPreference("blogStudio.editorDark"))

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || `请求失败（${response.status}）`)
    error.output = data.output || ""
    error.diagnostics = Array.isArray(data.diagnostics) ? data.diagnostics : []
    throw error
  }
  return data
}

function toast(message) {
  const node = $("#toast")
  node.textContent = message
  node.classList.add("show")
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600)
}

function friendlyError(error) {
  if (/spawn pnpm ENOENT/i.test(error.message || "")) {
    return "工作台没有找到 pnpm。请关闭工作台后，使用“启动博客工作台.cmd”重新启动。"
  }
  return error.message || "操作没有完成，请稍后再试。"
}

function setButtonBusy(button, busy, busyLabel) {
  if (!button) return
  if (!button.dataset.label) button.dataset.label = button.innerHTML
  button.disabled = busy
  button.toggleAttribute("aria-busy", busy)
  button.innerHTML = busy ? `<span class="spinner" aria-hidden="true"></span>${busyLabel}` : button.dataset.label
}

function localDateTime(value) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return shifted.toISOString().slice(0, 16)
}

function isoWithOffset(value) {
  if (!value) return ""
  const date = new Date(value)
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  const hours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0")
  const minutes = String(Math.abs(offset) % 60).padStart(2, "0")
  return `${value}:00${sign}${hours}:${minutes}`
}

function confirmDiscard() {
  return !state.dirty || confirm("当前内容还没有保存，确定要离开吗？")
}

function setDirty(value) {
  state.dirty = value
  elements.saveState.textContent = value ? "有未保存的修改" : "已保存"
  elements.saveState.classList.toggle("dirty", value)
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char])
}

function renderList() {
  const query = elements.search.value.trim().toLowerCase()
  const entries = state.entries.filter((entry) => entry.type === state.filter && [entry.title, entry.slug, ...(entry.tags || [])].join(" ").toLowerCase().includes(query))
  $("#entryCount").textContent = `${entries.length} 篇`
  if (!entries.length) {
    elements.list.innerHTML = `<div class="empty-list">${query ? "没有匹配的内容" : state.filter === "post" ? "还没有文章" : "还没有碎碎念"}</div>`
    return
  }
  elements.list.innerHTML = entries.map((entry) => {
    const date = String(entry.published || "").slice(0, 10) || "未设置日期"
    return `<button class="entry ${entry.path === state.selectedPath ? "active" : ""}" data-path="${escapeHtml(entry.path)}"><strong>${escapeHtml(entry.title || "未命名")}</strong><span class="entry-meta"><span>${date}</span>${entry.draft ? '<span class="badge">草稿</span>' : ""}</span></button>`
  }).join("")
}

function setForm(type, meta = {}, body = "") {
  state.type = type
  state.originalMeta = { ...meta }
  $("#editorEyebrow").textContent = type === "post" ? (meta.draft === false ? "公开文章" : "文章草稿") : "碎碎念"
  elements.title.value = meta.title || ""
  elements.slug.value = meta.slug || ""
  elements.published.value = localDateTime(meta.published || new Date())
  elements.description.value = meta.description || ""
  elements.section.value = meta.section || (["生活", "日常", "思考", "随笔", "阅读", "记忆", "旅行"].includes(meta.category) ? "life" : "note")
  elements.series.value = meta.series || ""
  elements.category.value = meta.category || "学习"
  elements.tags.value = Array.isArray(meta.tags) ? meta.tags.join(", ") : ""
  elements.image.value = meta.image || ""
  elements.body.value = body || ""
  editor.setValue(elements.body.value)
  elements.draft.checked = meta.draft !== false
  elements.pinned.checked = Boolean(meta.pinned)
  $$(".post-only").forEach((element) => element.toggleAttribute("hidden", type !== "post"))
  setDirty(false)
  updateWordCount()
  state.resetPreview = true
  refreshPreview()
}

async function loadEntries(selectFirst = false) {
  const data = await request("/api/entries")
  state.entries = data.entries
  renderList()
  if (selectFirst && !state.selectedPath) {
    let lastPath = ""
    try { lastPath = localStorage.getItem("blogStudio.lastEntry") || "" } catch { /* Storage is optional. */ }
    const first = state.entries.find((entry) => entry.path === lastPath) || state.entries.find((entry) => entry.type === state.filter)
    if (first) await loadEntry(first.path)
    else newEntry(state.filter)
  }
}

async function loadEntry(path) {
  if (!confirmDiscard()) return
  const data = await request(`/api/content?path=${encodeURIComponent(path)}`)
  state.selectedPath = path
  state.filter = data.type
  syncFilterButtons()
  setForm(data.type, data.meta, data.body)
  renderList()
  setLibraryCollapsed(true)
  try { localStorage.setItem("blogStudio.lastEntry", path) } catch { /* Storage is optional. */ }
}

function newEntry(type) {
  if (!confirmDiscard()) return
  state.selectedPath = ""
  state.filter = type
  syncFilterButtons()
  setForm(type, type === "post" ? { draft: true, section: "note", category: "学习", tags: ["学习"] } : { tags: ["日常"] }, "")
  setLibraryCollapsed(true)
  elements.title.focus()
  renderList()
}

function syncFilterButtons() {
  $$("[data-filter]").forEach((button) => button.classList.toggle("active", button.dataset.filter === state.filter))
}

function formPayload() {
  const meta = {
    ...state.originalMeta,
    title: elements.title.value.trim(), slug: elements.slug.value.trim(), published: isoWithOffset(elements.published.value),
    description: elements.description.value.trim(), section: elements.section.value, series: elements.series.value.trim(), category: elements.category.value.trim(),
    tags: elements.tags.value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean), image: elements.image.value.trim(),
    draft: elements.draft.checked, pinned: elements.pinned.checked,
  }
  return { type: state.type, originalPath: state.selectedPath, meta, body: elements.body.value }
}

async function save() {
  if (state.type === "post" && !elements.title.value.trim()) return toast("请先填写文章标题")
  if (state.type === "thought" && !elements.body.value.trim()) return toast("请先填写碎碎念内容")
  const button = $("#saveButton")
  button.disabled = true
  elements.saveState.textContent = "正在保存…"
  const payload = JSON.stringify(formPayload())
  try {
    const data = await request("/api/content", { method: "POST", body: payload })
    const unchanged = JSON.stringify(formPayload()) === payload
    state.selectedPath = data.path
    state.originalMeta = data.meta
    setDirty(!unchanged)
    await loadEntries()
    renderList()
    toast("内容已保存到本地")
    await refreshGit()
  } catch (error) {
    elements.saveState.textContent = "保存失败"
    toast(friendlyError(error))
  } finally { button.disabled = false }
}

async function refreshPreview() {
  clearTimeout(state.previewTimer)
  state.previewController?.abort()
  const revision = ++state.previewRevision
  $("#previewFreshness").textContent = "更新中…"
  state.previewTimer = setTimeout(async () => {
    const controller = new AbortController()
    state.previewController = controller
    try {
      const result = await request("/api/preview", { method: "POST", body: JSON.stringify(formPayload()), signal: controller.signal })
      if (revision !== state.previewRevision) return
      state.pendingPreview = { type: "studio:render", html: result.html, resetScroll: state.resetPreview }
      state.resetPreview = false
      state.previewOrigin = result.origin
      $("#openPreview").href = result.previewUrl
      $("#openPreview").hidden = false
      if (!elements.preview.hasAttribute("src")) elements.preview.src = result.previewUrl
      else if (state.frameReady) elements.preview.contentWindow.postMessage(state.pendingPreview, state.previewOrigin)
      $("#previewStatus").textContent = "博客原样预览"
    } catch (error) {
      if (error.name === "AbortError" || revision !== state.previewRevision) return
      $("#previewFreshness").textContent = "更新失败"
      $("#previewStatus").textContent = "预览暂时不可用"
      if (!state.frameReady) $("#previewLoading p").textContent = error.message
      toast(error.message)
    }
  }, 400)
}

window.addEventListener("message", (event) => {
  if (event.source !== elements.preview.contentWindow || event.origin !== state.previewOrigin) return
  if (event.data?.type === "studio:ready") {
    state.frameReady = true
    $("#previewLoading").hidden = true
    if (state.pendingPreview) elements.preview.contentWindow.postMessage(state.pendingPreview, state.previewOrigin)
  }
  if (event.data?.type === "studio:updated") $("#previewFreshness").textContent = "已更新"
  if (event.data?.type === "studio:issues") {
    const issues = event.data.issues || []
    $("#previewIssues").hidden = !issues.length
    $("#previewIssueCount").textContent = `${issues.length} 处显示提醒`
    $("#previewIssueList").innerHTML = issues.map((issue, index) => `<button data-issue="${index}">${escapeHtml(issue)}</button>`).join("")
  }
})

function updateWordCount() {
  const source = elements.body.value.trim()
  const chinese = (source.match(/[\u3400-\u9fff]/g) || []).length
  const words = (source.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || []).length
  elements.wordCount.textContent = `${chinese + words} 字`
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function upload(file, kind) {
  if (!file) return
  if (!file.type.startsWith("image/")) return toast("请选择 PNG、JPEG、WebP 或 GIF 图片")
  const button = kind === "body" ? $("#imageButton") : $("#coverButton")
  setButtonBusy(button, true, "上传中")
  try {
    const data = await request("/api/upload", { method: "POST", body: JSON.stringify({ name: file.name, data: await fileToDataUrl(file), kind, storage: "auto", slug: elements.slug.value || elements.title.value }) })
    if (kind === "cover") elements.image.value = data.path
    else insertAtCursor(`![图片说明](${data.path})`)
    setDirty(true)
    toast(`${data.storage === "cloud" ? "已上传图床并插入" : "图片已保存到博客"}：${data.path}`)
  } catch (error) { toast(friendlyError(error)) }
  finally { setButtonBusy(button, false) }
}

async function refreshUploadStatus() {
  try {
    const data = await request("/api/upload/status")
    state.imageStorage = data.storage
    const status = $("#imageUploadStatus")
    status.textContent = data.label
    status.dataset.storage = data.storage
    status.title = data.storage === "cloud" ? `图片将上传至 ${data.publicBaseUrl}` : "未配置云图床，图片会保存到博客 public 目录"
  } catch {
    $("#imageUploadStatus").textContent = "图片存储状态未知"
  }
}

function imageFromTransfer(transfer) {
  return [...(transfer?.files || [])].find((file) => file.type.startsWith("image/"))
    || [...(transfer?.items || [])].find((item) => item.type.startsWith("image/"))?.getAsFile()
}

function insertAtCursor(value) {
  editor.insert(value)
}

async function refreshGit() {
  try {
    const data = await request("/api/git/status")
    $("#gitBranch").textContent = `${data.branch} · ${data.head.split(" ")[0]}`
    const count = data.changes ? data.changes.split("\n").length : 0
    $("#gitSummary").textContent = count ? `${count} 项本地改动等待处理` : "本地内容已全部保存"
    return data
  } catch (error) { $("#gitSummary").textContent = friendlyError(error); throw error }
}

function showLog(title, eyebrow = "运行结果", hint = "工作台正在执行任务，完成后会显示结果。") {
  $("#logEyebrow").textContent = eyebrow
  $("#logTitle").textContent = title
  $("#logHint").textContent = hint
  $("#logDialog").dataset.state = "working"
  renderDiagnostics([])
  $("#logOutput").textContent = "正在准备运行环境…"
  $("#logDialog").showModal()
}

function renderDiagnostics(diagnostics = []) {
  const list = $("#diagnosticList")
  list.replaceChildren()
  list.hidden = diagnostics.length === 0
  for (const diagnostic of diagnostics) {
    const item = document.createElement(diagnostic.contentPath ? "button" : "div")
    item.className = "diagnostic-item"
    if (diagnostic.contentPath) {
      item.type = "button"
      item.dataset.diagnosticPath = diagnostic.contentPath
    }
    const heading = document.createElement("span")
    heading.className = "diagnostic-heading"
    const title = document.createElement("strong")
    title.textContent = diagnostic.title || "未命名内容"
    const location = document.createElement("em")
    location.textContent = diagnostic.location || "文件级问题"
    heading.append(title, location)
    const message = document.createElement("span")
    message.className = "diagnostic-message"
    message.textContent = diagnostic.message || "请查看完整检查信息。"
    const path = document.createElement("code")
    path.textContent = diagnostic.file || "项目配置或运行环境"
    item.append(heading, message, path)
    if (diagnostic.contentPath) {
      const action = document.createElement("span")
      action.className = "diagnostic-action"
      action.textContent = diagnostic.severity === "warning" ? "打开查看 →" : "打开修改 →"
      item.append(action)
    }
    list.append(item)
  }
}

function finishLog(state, title, output, hint, diagnostics = []) {
  $("#logDialog").dataset.state = state
  $("#logTitle").textContent = title
  $("#logHint").textContent = hint
  renderDiagnostics(diagnostics)
  $("#logOutput").textContent = output || "任务完成，没有额外输出。"
}

async function runCheck() {
  const button = $("#checkButton")
  setButtonBusy(button, true, "检查中")
  showLog("正在检查博客", "发布前检查", "正在核对内容结构、Astro 与 TypeScript。")
  try {
    const data = await request("/api/check", { method: "POST", body: JSON.stringify({ task: "check" }) })
    const warnings = Array.isArray(data.warnings) ? data.warnings : []
    finishLog("success", warnings.length ? "检查通过（有格式提醒）" : "检查通过", data.output,
      warnings.length ? "空白格式仅作提醒，不会阻止发布。可点击查看，也可以直接继续发布。" : "博客状态正常，可以继续构建或发布。", warnings)
  } catch (error) {
    finishLog("error", "检查未通过", [friendlyError(error), error.output].filter(Boolean).join("\n\n"), "已整理出问题位置，点击对应项目即可打开修改。", error.diagnostics)
  } finally {
    setButtonBusy(button, false)
  }
}

async function openPublish() {
  if (state.dirty) return toast("请先保存正在编辑的内容")
  const button = $("#publishButton")
  setButtonBusy(button, true, "读取状态")
  try {
    const data = await refreshGit()
    $("#publishChanges").textContent = data.changes || "没有未提交改动；将同步当前本地版本。"
    $("#publishDialog").showModal()
  } catch (error) { toast(friendlyError(error)) }
  finally { setButtonBusy(button, false) }
}

async function publish(event) {
  event.preventDefault()
  $("#publishDialog").close()
  showLog("正在发布到 GitHub", "安全发布", "将依次检查、构建、提交并推送；失败时不会覆盖远程内容。")
  try {
    const data = await request("/api/publish", { method: "POST", body: JSON.stringify({ message: $("#commitMessage").value }) })
    finishLog("success", "发布完成", data.log, `版本 ${data.commit} 已安全推送到 GitHub。`)
    toast("博客已经成功发布")
    await refreshGit()
  } catch (error) {
    finishLog("error", "发布已安全停止", [friendlyError(error), error.output].filter(Boolean).join("\n\n"), "远程内容没有被强制覆盖，请查看并修正下方问题。", error.diagnostics)
  }
}

elements.list.addEventListener("click", (event) => { const button = event.target.closest("[data-path]"); if (button) loadEntry(button.dataset.path) })
elements.search.addEventListener("input", renderList)
$("#toggleLibraryButton").addEventListener("click", () => setLibraryCollapsed(false))
$("#toggleFieldsButton").addEventListener("click", () => setFieldsCollapsed(false))
$$("[data-filter]").forEach((button) => button.addEventListener("click", () => { if (!confirmDiscard()) return; state.filter = button.dataset.filter; syncFilterButtons(); renderList() }))
$("#newButton").addEventListener("click", () => $("#newDialog").showModal())
$("#newDialog").addEventListener("close", () => { const value = $("#newDialog").returnValue; if (["post", "thought"].includes(value)) newEntry(value) })
$("#saveButton").addEventListener("click", save)
$("#checkButton").addEventListener("click", runCheck)
$("#publishButton").addEventListener("click", openPublish)
$("#refreshGit").addEventListener("click", refreshGit)
$("#refreshPreview").addEventListener("click", refreshPreview)
$("#coverButton").addEventListener("click", () => $("#coverFile").click())
$("#imageButton").addEventListener("click", () => $("#bodyFile").click())
$("#coverFile").addEventListener("change", (event) => upload(event.target.files[0], "cover"))
$("#bodyFile").addEventListener("change", (event) => upload(event.target.files[0], "body"))
$("#editorDropZone").addEventListener("paste", (event) => {
  const file = imageFromTransfer(event.clipboardData)
  if (!file) return
  event.preventDefault()
  upload(file, "body")
}, true)
const dropZone = $("#editorDropZone")
dropZone.addEventListener("dragenter", (event) => {
  if (!imageFromTransfer(event.dataTransfer)) return
  event.preventDefault()
  state.dragDepth += 1
  dropZone.classList.add("is-dragging")
})
dropZone.addEventListener("dragover", (event) => {
  if (![...(event.dataTransfer?.items || [])].some((item) => item.type.startsWith("image/"))) return
  event.preventDefault()
  event.dataTransfer.dropEffect = "copy"
})
dropZone.addEventListener("dragleave", () => {
  state.dragDepth = Math.max(0, state.dragDepth - 1)
  if (state.dragDepth === 0) dropZone.classList.remove("is-dragging")
})
dropZone.addEventListener("drop", (event) => {
  const file = imageFromTransfer(event.dataTransfer)
  state.dragDepth = 0
  dropZone.classList.remove("is-dragging")
  if (!file) return
  event.preventDefault()
  upload(file, "body")
})
$$("[data-insert]").forEach((button) => button.addEventListener("click", () => insertAtCursor(button.dataset.insert)))
$$("[data-wrap]").forEach((button) => button.addEventListener("click", () => editor.insert(button.dataset.wrap, button.dataset.wrap)))
$$("[data-close]").forEach((button) => button.addEventListener("click", () => $(`#${button.dataset.close}`).close()))
$("#editorThemeButton").addEventListener("click", () => setEditorDark($("#markdownEditor").dataset.theme !== "dark"))
$$("button[data-layout]").forEach((button) => button.addEventListener("click", () => {
  $(".workspace").dataset.layout = button.dataset.layout
  $$("button[data-layout]").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)) })
}))
$$("button[data-device]").forEach((button) => button.addEventListener("click", () => {
  $(".preview-viewport").dataset.device = button.dataset.device
  $$("button[data-device]").forEach((item) => { const active = item === button; item.classList.toggle("active", active); item.setAttribute("aria-pressed", String(active)) })
}))
$("#previewIssueList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-issue]")
  if (button) { elements.preview.contentWindow.postMessage({ type: "studio:issue", index: Number(button.dataset.issue) }, state.previewOrigin); $("#previewIssues").open = false }
})
const snippets = {
  code: '\n~~~python\nprint("Hello, world!")\n~~~\n',
  note: "\n> [!NOTE]\n> 在这里写下提示内容。\n",
  quote: "\n> 在这里写下引用。\n",
  table: "\n| 标题 | 说明 |\n| --- | --- |\n| 内容 | 内容 |\n",
  list: "\n- [ ] 待完成\n- [x] 已完成\n",
  math: "$E = mc^2$",
  equation: "\n$$\nf(x) = \\sum_{i=1}^{n} x_i\n$$\n",
  divider: "\n\n---\n\n",
}
$("#insertSelect").addEventListener("change", (event) => { const text = snippets[event.target.value]; if (text) insertAtCursor(text); event.target.value = "" })
$("#cancelPublish").addEventListener("click", () => $("#publishDialog").close())
$("#publishForm").addEventListener("submit", publish)
$("#closeLog").addEventListener("click", () => $("#logDialog").close())
$("#diagnosticList").addEventListener("click", async (event) => {
  const item = event.target.closest("[data-diagnostic-path]")
  if (!item) return
  $("#logDialog").close()
  await loadEntry(item.dataset.diagnosticPath)
  elements.title.focus()
  toast("已打开对应内容")
})

for (const input of [elements.title, elements.slug, elements.published, elements.description, elements.section, elements.series, elements.category, elements.tags, elements.image, elements.body, elements.draft, elements.pinned]) {
  input.addEventListener("input", () => { setDirty(true); if (input === elements.body) updateWordCount(); refreshPreview() })
}
window.addEventListener("beforeunload", (event) => { if (state.dirty) event.preventDefault() })
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save() }
  if ((event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "l"))) {
    event.preventDefault()
    setLibraryCollapsed($("#libraryPanel").open)
  }
})

Promise.all([loadEntries(true), refreshGit(), refreshUploadStatus()]).catch((error) => toast(error.message))
