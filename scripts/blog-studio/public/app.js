import { createEditor } from "/editor-bundle.js"

const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const elements = {
  list: $("#entryList"),
  search: $("#searchInput"),
  title: $("#titleInput"),
  slug: $("#slugInput"),
  published: $("#publishedInput"),
  description: $("#descriptionInput"),
  category: $("#categoryInput"),
  section: $("#sectionInput"),
  series: $("#seriesInput"),
  tags: $("#tagsInput"),
  image: $("#imageInput"),
  body: $("#bodyInput"),
  draft: $("#draftInput"),
  pinned: $("#pinnedInput"),
  preview: $("#preview"),
  wordCount: $("#wordCount"),
  saveState: $("#saveState"),
}

const state = {
  entries: [],
  filter: "post",
  selectedPath: "",
  type: "post",
  originalMeta: {},
  dirty: false,
  previewTimer: null,
  imageStorage: "local",
  dragDepth: 0,
  previewRevision: 0,
  previewOrigin: "",
  frameReady: false,
  pendingPreview: null,
  resetPreview: false,
}
state.uploads = []
state.documentRevision = 0

const editor = createEditor({
  parent: $("#markdownEditor"),
  onChange(value) {
    elements.body.value = value
    setDirty(true)
    updateWordCount()
    refreshPreview()
  },
  onSelection(line, column) {
    $("#cursorPosition").textContent = `第 ${line} 行，${column} 列`
  },
  onScroll(ratio) {
    if ($("#syncScroll").checked && state.frameReady)
      elements.preview.contentWindow.postMessage({ type: "studio:scroll", ratio }, state.previewOrigin)
  },
  onSave: save,
})

function readPreference(key) {
  try {
    return localStorage.getItem(key) === "true"
  } catch {
    return false
  }
}

function savePreference(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    /* 浏览器禁用存储时仅保留本次状态 */
  }
}

function setLibraryCollapsed(collapsed) {
  const dialog = $("#libraryPanel")
  if (collapsed) dialog.close()
  else if (!dialog.open) {
    dialog.showModal()
    elements.search.focus()
  }
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
  if (error.name === "TimeoutError") return "请求超时，图片仍保留在上传列表，可重试或改为保存到博客本地。"
  if (/fetch failed|failed to fetch|networkerror/i.test(error.message || ""))
    return "工作台连接中断，请确认启动窗口仍在运行，然后重试。"
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
  if (state.saving || state.uploads.some((job) => ["queued", "uploading"].includes(job.status))) {
    toast("正在保存或上传图片，请完成后再切换文章")
    return false
  }
  if (state.uploads.some((job) => job.status === "failed")) {
    if (!confirm("还有上传失败的图片，可在列表中重试。确定放弃这些图片并离开吗？")) return false
    if (state.dirty && !confirm("当前内容还没有保存，确定要离开吗？")) return false
    for (const job of [...state.uploads]) removeUpload(job)
    return true
  }
  return !state.dirty || confirm("当前内容还没有保存，确定要离开吗？")
}

function setDirty(value) {
  state.dirty = value
  elements.saveState.textContent = value ? "有未保存的修改" : "已保存"
  elements.saveState.classList.toggle("dirty", value)
}

function escapeHtml(value) {
  return String(value || "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char],
  )
}

function renderList() {
  const query = elements.search.value.trim().toLowerCase()
  const entries = state.entries.filter(
    (entry) =>
      entry.type === state.filter &&
      [entry.title, entry.slug, ...(entry.tags || [])].join(" ").toLowerCase().includes(query),
  )
  $("#entryCount").textContent = `${entries.length} 篇`
  if (!entries.length) {
    elements.list.innerHTML = `<div class="empty-list">${query ? "没有匹配的内容" : state.filter === "post" ? "还没有文章" : "还没有碎碎念"}</div>`
    return
  }
  elements.list.innerHTML = entries
    .map((entry) => {
      const date = String(entry.published || "").slice(0, 10) || "未设置日期"
      return `<button class="entry ${entry.path === state.selectedPath ? "active" : ""}" data-path="${escapeHtml(entry.path)}"><strong>${escapeHtml(entry.title || "未命名")}</strong><span class="entry-meta"><span>${date}</span>${entry.draft ? '<span class="badge">草稿</span>' : ""}</span></button>`
    })
    .join("")
}

function setForm(type, meta = {}, body = "") {
  state.documentRevision += 1
  state.type = type
  state.originalMeta = { ...meta }
  $("#editorEyebrow").textContent = type === "post" ? (meta.draft === false ? "公开文章" : "文章草稿") : "碎碎念"
  elements.title.value = meta.title || ""
  elements.slug.value = meta.slug || ""
  elements.published.value = localDateTime(meta.published || new Date())
  elements.description.value = meta.description || ""
  elements.section.value =
    meta.section || (["生活", "日常", "思考", "随笔", "阅读", "记忆", "旅行"].includes(meta.category) ? "life" : "note")
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
    try {
      lastPath = localStorage.getItem("blogStudio.lastEntry") || ""
    } catch {
      /* Storage is optional. */
    }
    const first =
      state.entries.find((entry) => entry.path === lastPath) ||
      state.entries.find((entry) => entry.type === state.filter)
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
  try {
    localStorage.setItem("blogStudio.lastEntry", path)
  } catch {
    /* Storage is optional. */
  }
}

function newEntry(type) {
  if (!confirmDiscard()) return
  state.selectedPath = ""
  state.filter = type
  syncFilterButtons()
  setForm(
    type,
    type === "post" ? { draft: true, section: "note", category: "学习", tags: ["学习"] } : { tags: ["日常"] },
    "",
  )
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
    title: elements.title.value.trim(),
    slug: elements.slug.value.trim(),
    published: isoWithOffset(elements.published.value),
    description: elements.description.value.trim(),
    section: elements.section.value,
    series: elements.series.value.trim(),
    category: elements.category.value.trim(),
    tags: elements.tags.value
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean),
    image: elements.image.value.trim(),
    draft: elements.draft.checked,
    pinned: elements.pinned.checked,
  }
  return { type: state.type, originalPath: state.selectedPath, meta, body: elements.body.value }
}

async function save() {
  if (state.saving) return
  if (state.type === "post" && !elements.title.value.trim()) return toast("请先填写文章标题")
  if (state.type === "thought" && !elements.body.value.trim()) return toast("请先填写碎碎念内容")
  const button = $("#saveButton")
  if (state.uploads.some((job) => job.status !== "done"))
    return toast("请先完成图片上传，或移除不需要的图片，再保存文章")
  state.saving = true
  button.disabled = true
  elements.saveState.textContent = "正在保存…"
  const payload = JSON.stringify(formPayload())
  try {
    const data = await request("/api/content", { method: "POST", body: payload })
    const unchanged = JSON.stringify(formPayload()) === payload
    state.selectedPath = data.path
    state.originalMeta = data.meta
    try { localStorage.setItem("blogStudio.lastEntry", data.path) } catch { /* Storage is optional. */ }
    setDirty(!unchanged)
    await loadEntries()
    renderList()
    toast("内容已保存到本地")
    await refreshGit()
  } catch (error) {
    elements.saveState.textContent = "保存失败"
    toast(friendlyError(error))
  } finally {
    state.saving = false
    button.disabled = false
  }
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
      const result = await request("/api/preview", {
        method: "POST",
        body: JSON.stringify(formPayload()),
        signal: controller.signal,
      })
      if (revision !== state.previewRevision) return
      state.pendingPreview = { type: "studio:render", html: result.html, resetScroll: state.resetPreview }
      state.resetPreview = false
      const reloadFrame = !elements.preview.hasAttribute("src") || state.previewOrigin !== result.origin || state.forceFrameReload
      state.previewOrigin = result.origin
      $("#openPreview").href = result.previewUrl
      $("#openPreview").hidden = false
      if (reloadFrame) {
        state.frameReady = false
        state.forceFrameReload = false
        $("#previewLoading").hidden = false
        $("#previewLoading p").textContent = "正在打开博客预览…"
        elements.preview.src = result.previewUrl
      }
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
    $("#previewIssueList").innerHTML = issues
      .map((issue, index) => `<button data-issue="${index}">${escapeHtml(issue)}</button>`)
      .join("")
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
    reader.onerror = () => reject(new Error("无法读取图片，请重新复制或选择文件。"))
    reader.readAsDataURL(file)
  })
}

function renderUploads() {
  const queue = $("#uploadQueue")
  queue.hidden = !state.uploads.length
  queue.innerHTML = state.uploads
    .map(
      (job) => `<div class="upload-item" data-upload="${job.id}" data-status="${job.status}">
    <img src="${job.thumbnail}" alt="" /><div class="upload-info"><strong>${escapeHtml(job.file.name || "粘贴的图片")}${job.kind === "cover" ? " · 封面" : ""}</strong><span>${escapeHtml(job.message)}</span></div>
    <div class="upload-actions">${job.status === "failed" ? '<button data-upload-action="retry">重试</button><button data-upload-action="local">保存到本地</button>' : ""}${["failed", "queued", "done"].includes(job.status) ? '<button data-upload-action="remove" aria-label="移除图片上传项">×</button>' : '<span class="spinner" aria-label="上传中"></span>'}</div></div>`,
    )
    .join("")
}

function removeUpload(job) {
  state.uploads = state.uploads.filter((item) => item !== job)
  URL.revokeObjectURL(job.thumbnail)
  editor.forgetPosition(job.id)
  renderUploads()
}

function upload(files, kind) {
  for (const file of files) {
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      toast("支持 PNG、JPEG、WebP、GIF；请将其他格式另存后上传")
      continue
    }
    if (!file.size || file.size > 20 * 1024 * 1024) {
      toast("请选择非空图片，单张不能超过 20 MB")
      continue
    }
    const job = {
      id: crypto.randomUUID(),
      file,
      kind,
      status: "queued",
      message: "等待上传…",
      thumbnail: URL.createObjectURL(file),
      storage: $("#imageStorageSelect").value,
      revision: state.documentRevision,
      slug: elements.slug.value || elements.title.value,
    }
    state.uploads.push(job)
    if (kind === "body") editor.rememberPosition(job.id)
  }
  renderUploads()
  processUploads()
}

async function processUploads() {
  if (state.uploading) return
  state.uploading = true
  try {
    let job
    while ((job = state.uploads.find((item) => item.status === "queued"))) {
      job.status = "uploading"
      job.message =
        job.storage === "local" || state.imageStorage === "local"
          ? "正在保存到博客本地…"
          : "正在上传七牛云，连接失败会自动切换节点…"
      renderUploads()
      try {
        job.data ||= await fileToDataUrl(job.file)
        const data = await request("/api/upload", {
          method: "POST",
          signal: AbortSignal.timeout(110000),
          body: JSON.stringify({
            name: job.file.name,
            data: job.data,
            kind: job.kind,
            storage: job.storage,
            slug: job.slug,
          }),
        })
        if (job.revision !== state.documentRevision) throw new Error("文章已切换，请返回原文章后重新插入图片。")
        if (job.kind === "cover") {
          elements.image.value = data.path
          setDirty(true)
          refreshPreview()
        } else if (!editor.insertAtPosition(job.id, `\n![图片说明](${data.path})\n`))
          throw new Error("插入位置已失效，请重新粘贴图片。")
        job.status = "done"
        job.message = data.storage === "cloud" ? "已上传七牛云，并插入文章" : "已保存到博客本地，并插入文章"
        job.data = null
        if (data.storage === "cloud") $("#imageUploadStatus").textContent = "七牛上传正常"
        const completed = job
        setTimeout(() => removeUpload(completed), 2200)
      } catch (error) {
        job.status = "failed"
        job.message = friendlyError(error)
      }
      renderUploads()
    }
  } finally {
    state.uploading = false
  }
}

async function refreshUploadStatus() {
  try {
    const data = await request("/api/upload/status")
    state.imageStorage = data.storage
    const status = $("#imageUploadStatus")
    status.textContent = data.label
    status.dataset.storage = data.storage
    $("#imageStorageSelect").options[0].textContent = data.storage === "cloud" ? "七牛优先" : "自动（本地）"
    status.title =
      data.storage === "cloud" ? `图片将上传至 ${data.publicBaseUrl}` : "未配置云图床，图片会保存到博客 public 目录"
  } catch {
    $("#imageUploadStatus").textContent = "图片存储状态未知"
  }
}

function imagesFromTransfer(transfer) {
  const files = [...(transfer?.files || [])].filter((file) => file.type.startsWith("image/"))
  return files.length
    ? files
    : [...(transfer?.items || [])]
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter(Boolean)
}
function hasImageTransfer(transfer) {
  return [...(transfer?.items || [])].some((item) => item.kind === "file" && item.type.startsWith("image/"))
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
  } catch (error) {
    $("#gitSummary").textContent = friendlyError(error)
    throw error
  }
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
    finishLog(
      "success",
      warnings.length ? "检查通过（有格式提醒）" : "检查通过",
      data.output,
      warnings.length
        ? "空白格式仅作提醒，不会阻止发布。可点击查看，也可以直接继续发布。"
        : "博客状态正常，可以继续构建或发布。",
      warnings,
    )
  } catch (error) {
    finishLog(
      "error",
      "检查未通过",
      [friendlyError(error), error.output].filter(Boolean).join("\n\n"),
      "已整理出问题位置，点击对应项目即可打开修改。",
      error.diagnostics,
    )
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
  } catch (error) {
    toast(friendlyError(error))
  } finally {
    setButtonBusy(button, false)
  }
}

async function publish(event) {
  event.preventDefault()
  $("#publishDialog").close()
  showLog("正在发布到 GitHub", "安全发布", "将依次检查、构建、提交并推送；失败时不会覆盖远程内容。")
  try {
    const data = await request("/api/publish", {
      method: "POST",
      body: JSON.stringify({ message: $("#commitMessage").value }),
    })
    finishLog("success", "发布完成", data.log, `版本 ${data.commit} 已安全推送到 GitHub。`)
    toast("博客已经成功发布")
    await refreshGit()
  } catch (error) {
    finishLog(
      "error",
      "发布已安全停止",
      [friendlyError(error), error.output].filter(Boolean).join("\n\n"),
      "远程内容没有被强制覆盖，请查看并修正下方问题。",
      error.diagnostics,
    )
  }
}

elements.list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-path]")
  if (button) loadEntry(button.dataset.path).catch((error) => toast(friendlyError(error)))
})
elements.search.addEventListener("input", renderList)
$("#toggleLibraryButton").addEventListener("click", () => setLibraryCollapsed(false))
$("#toggleFieldsButton").addEventListener("click", () => setFieldsCollapsed(false))
$$("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter
    syncFilterButtons()
    renderList()
  }),
)
$("#newButton").addEventListener("click", () => $("#newDialog").showModal())
$("#newDialog").addEventListener("submit", (event) => {
  event.preventDefault()
  const value = event.submitter?.value
  $("#newDialog").close()
  if (["post", "thought"].includes(value)) newEntry(value)
})
$("#saveButton").addEventListener("click", save)
$("#checkButton").addEventListener("click", runCheck)
$("#publishButton").addEventListener("click", openPublish)
$("#refreshGit").addEventListener("click", () => refreshGit().catch((error) => toast(friendlyError(error))))
$("#refreshPreview").addEventListener("click", () => { state.forceFrameReload = true; refreshPreview() })
$("#coverButton").addEventListener("click", () => $("#coverFile").click())
$("#imageButton").addEventListener("click", () => $("#bodyFile").click())
$("#coverFile").addEventListener("change", (event) => {
  upload([...event.target.files], "cover")
  event.target.value = ""
})
$("#bodyFile").addEventListener("change", (event) => {
  upload([...event.target.files], "body")
  event.target.value = ""
})
$("#editorDropZone").addEventListener(
  "paste",
  (event) => {
    const files = imagesFromTransfer(event.clipboardData)
    if (!files.length) return
    event.preventDefault()
    event.stopPropagation()
    upload(files, "body")
  },
  true,
)
$("#uploadQueue").addEventListener("click", (event) => {
  const button = event.target.closest("[data-upload-action]")
  const job = state.uploads.find((item) => item.id === button?.closest("[data-upload]")?.dataset.upload)
  if (!job) return
  if (button.dataset.uploadAction === "remove") return removeUpload(job)
  job.storage = button.dataset.uploadAction === "local" ? "local" : job.storage
  job.status = "queued"
  job.message = "等待重试…"
  renderUploads()
  processUploads()
})
const dropZone = $("#editorDropZone")
dropZone.addEventListener("dragenter", (event) => {
  if (!hasImageTransfer(event.dataTransfer)) return
  event.preventDefault()
  state.dragDepth += 1
  dropZone.classList.add("is-dragging")
})
dropZone.addEventListener("dragover", (event) => {
  if (!hasImageTransfer(event.dataTransfer)) return
  event.preventDefault()
  event.dataTransfer.dropEffect = "copy"
})
dropZone.addEventListener("dragleave", () => {
  state.dragDepth = Math.max(0, state.dragDepth - 1)
  if (state.dragDepth === 0) dropZone.classList.remove("is-dragging")
})
dropZone.addEventListener(
  "drop",
  (event) => {
    const files = imagesFromTransfer(event.dataTransfer)
    state.dragDepth = 0
    dropZone.classList.remove("is-dragging")
    if (!files.length) return
    event.preventDefault()
    event.stopPropagation()
    upload(files, "body")
  },
  true,
)
$$("[data-insert]").forEach((button) => button.addEventListener("click", () => insertAtCursor(button.dataset.insert)))
$$("[data-wrap]").forEach((button) =>
  button.addEventListener("click", () => editor.insert(button.dataset.wrap, button.dataset.wrap)),
)
$$("[data-close]").forEach((button) => button.addEventListener("click", () => $(`#${button.dataset.close}`).close()))
$("#editorThemeButton").addEventListener("click", () => setEditorDark($("#markdownEditor").dataset.theme !== "dark"))
$$("button[data-layout]").forEach((button) =>
  button.addEventListener("click", () => {
    $(".workspace").dataset.layout = button.dataset.layout
    $$("button[data-layout]").forEach((item) => {
      const active = item === button
      item.classList.toggle("active", active)
      item.setAttribute("aria-pressed", String(active))
    })
  }),
)
$$("button[data-device]").forEach((button) =>
  button.addEventListener("click", () => {
    $(".preview-viewport").dataset.device = button.dataset.device
    $$("button[data-device]").forEach((item) => {
      const active = item === button
      item.classList.toggle("active", active)
      item.setAttribute("aria-pressed", String(active))
    })
  }),
)
$("#previewIssueList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-issue]")
  if (button) {
    elements.preview.contentWindow.postMessage(
      { type: "studio:issue", index: Number(button.dataset.issue) },
      state.previewOrigin,
    )
    $("#previewIssues").open = false
  }
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
$("#insertSelect").addEventListener("change", (event) => {
  const text = snippets[event.target.value]
  if (text) insertAtCursor(text)
  event.target.value = ""
})
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

for (const input of [
  elements.title,
  elements.slug,
  elements.published,
  elements.description,
  elements.section,
  elements.series,
  elements.category,
  elements.tags,
  elements.image,
  elements.body,
  elements.draft,
  elements.pinned,
]) {
  input.addEventListener("input", () => {
    setDirty(true)
    if (input === elements.body) updateWordCount()
    refreshPreview()
  })
}
window.addEventListener("beforeunload", (event) => {
  if (state.dirty || state.uploads.some((job) => job.status !== "done")) event.preventDefault()
})
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
    event.preventDefault()
    save()
  }
  if (
    (event.metaKey || event.ctrlKey) &&
    (event.key.toLowerCase() === "k" || (event.shiftKey && event.key.toLowerCase() === "l"))
  ) {
    event.preventDefault()
    setLibraryCollapsed($("#libraryPanel").open)
  }
})

Promise.all([loadEntries(true), refreshGit(), refreshUploadStatus()]).catch((error) => toast(error.message))
