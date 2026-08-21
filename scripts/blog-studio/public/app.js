const $ = (selector) => document.querySelector(selector)
const $$ = (selector) => [...document.querySelectorAll(selector)]

const elements = {
  list: $("#entryList"), search: $("#searchInput"), title: $("#titleInput"), slug: $("#slugInput"),
  published: $("#publishedInput"), description: $("#descriptionInput"), category: $("#categoryInput"),
  tags: $("#tagsInput"), image: $("#imageInput"), body: $("#bodyInput"), draft: $("#draftInput"),
  pinned: $("#pinnedInput"), preview: $("#preview"), wordCount: $("#wordCount"), saveState: $("#saveState"),
}

const state = { entries: [], filter: "post", selectedPath: "", type: "post", originalMeta: {}, dirty: false, previewTimer: null }

function readPreference(key) {
  try { return localStorage.getItem(key) === "true" } catch { return false }
}

function savePreference(key, value) {
  try { localStorage.setItem(key, String(value)) } catch { /* 浏览器禁用存储时仅保留本次状态 */ }
}

function setLibraryCollapsed(collapsed) {
  const workspace = $(".workspace")
  const button = $("#toggleLibraryButton")
  workspace.classList.toggle("library-collapsed", collapsed)
  button.setAttribute("aria-expanded", String(!collapsed))
  button.title = collapsed ? "展开文章列表" : "收起文章列表"
  button.querySelector(".sr-only").textContent = button.title
  $("#libraryToggleIcon").textContent = collapsed ? "›" : "‹"
  savePreference("blogStudio.libraryCollapsed", collapsed)
}

function setFieldsCollapsed(collapsed) {
  const panel = $("#fieldsPanel")
  const button = $("#toggleFieldsButton")
  panel.classList.toggle("collapsed", collapsed)
  button.setAttribute("aria-expanded", String(!collapsed))
  $("#fieldsToggleLabel").textContent = collapsed ? "展开" : "收起"
  $("#fieldsToggleIcon").textContent = collapsed ? "⌄" : "⌃"
  savePreference("blogStudio.fieldsCollapsed", collapsed)
}

setLibraryCollapsed(readPreference("blogStudio.libraryCollapsed"))
setFieldsCollapsed(readPreference("blogStudio.fieldsCollapsed"))

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || `请求失败（${response.status}）`)
    error.output = data.output || ""
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
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char])
}

function renderList() {
  const query = elements.search.value.trim().toLowerCase()
  const entries = state.entries.filter((entry) => entry.type === state.filter && [entry.title, entry.slug, ...(entry.tags || [])].join(" ").toLowerCase().includes(query))
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
  elements.category.value = meta.category || "学习"
  elements.tags.value = Array.isArray(meta.tags) ? meta.tags.join(", ") : ""
  elements.image.value = meta.image || ""
  elements.body.value = body || ""
  elements.draft.checked = meta.draft !== false
  elements.pinned.checked = Boolean(meta.pinned)
  $$(".post-only").forEach((element) => element.toggleAttribute("hidden", type !== "post"))
  setDirty(false)
  updateWordCount()
  refreshPreview()
}

async function loadEntries(selectFirst = false) {
  const data = await request("/api/entries")
  state.entries = data.entries
  renderList()
  if (selectFirst && !state.selectedPath) {
    const first = state.entries.find((entry) => entry.type === state.filter)
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
}

function newEntry(type) {
  if (!confirmDiscard()) return
  state.selectedPath = ""
  state.filter = type
  syncFilterButtons()
  setForm(type, type === "post" ? { draft: true, category: "学习", tags: ["学习"] } : { tags: ["日常"] }, "")
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
    description: elements.description.value.trim(), category: elements.category.value.trim(),
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
  try {
    const data = await request("/api/content", { method: "POST", body: JSON.stringify(formPayload()) })
    state.selectedPath = data.path
    state.originalMeta = data.meta
    setDirty(false)
    await loadEntries()
    renderList()
    toast("内容已保存到本地")
    await refreshGit()
  } catch (error) {
    elements.saveState.textContent = "保存失败"
    toast(error.message)
  } finally { button.disabled = false }
}

async function refreshPreview() {
  clearTimeout(state.previewTimer)
  state.previewTimer = setTimeout(async () => {
    try {
      const { html } = await request("/api/preview", { method: "POST", body: JSON.stringify({ body: elements.body.value }) })
      elements.preview.innerHTML = html || '<p class="preview-empty">正文会在这里显示。</p>'
    } catch { elements.preview.innerHTML = '<p class="preview-empty">预览暂时不可用。</p>' }
  }, 180)
}

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
  try {
    const data = await request("/api/upload", { method: "POST", body: JSON.stringify({ name: file.name, data: await fileToDataUrl(file), kind, slug: elements.slug.value || elements.title.value }) })
    if (kind === "cover") elements.image.value = data.path
    else insertAtCursor(`![图片说明](${data.path})`)
    setDirty(true)
    toast(`图片已保存：${data.path}`)
  } catch (error) { toast(error.message) }
}

function insertAtCursor(value) {
  const area = elements.body
  area.setRangeText(value, area.selectionStart, area.selectionEnd, "end")
  area.focus()
  setDirty(true)
  updateWordCount()
  refreshPreview()
}

async function refreshGit() {
  try {
    const data = await request("/api/git/status")
    $("#gitBranch").textContent = `${data.branch} · ${data.head.split(" ")[0]}`
    const count = data.changes ? data.changes.split("\n").length : 0
    $("#gitSummary").textContent = count ? `${count} 项本地改动等待处理` : "本地内容已全部保存"
    return data
  } catch (error) { $("#gitSummary").textContent = error.message; throw error }
}

function showLog(title, eyebrow = "运行结果") {
  $("#logEyebrow").textContent = eyebrow
  $("#logTitle").textContent = title
  $("#logOutput").textContent = "请稍候，这可能需要一两分钟…"
  $("#logDialog").showModal()
}

async function runCheck() {
  showLog("正在检查博客", "发布前检查")
  try {
    const data = await request("/api/check", { method: "POST", body: JSON.stringify({ task: "check" }) })
    $("#logTitle").textContent = "检查通过"
    $("#logOutput").textContent = data.output
  } catch (error) {
    $("#logTitle").textContent = "检查未通过"
    $("#logOutput").textContent = [error.message, error.output].filter(Boolean).join("\n\n")
  }
}

async function openPublish() {
  if (state.dirty) return toast("请先保存正在编辑的内容")
  try {
    const data = await refreshGit()
    $("#publishChanges").textContent = data.changes || "没有未提交改动；将同步当前本地版本。"
    $("#publishDialog").showModal()
  } catch (error) { toast(error.message) }
}

async function publish(event) {
  event.preventDefault()
  $("#publishDialog").close()
  showLog("正在发布到 GitHub", "请不要关闭工作台")
  try {
    const data = await request("/api/publish", { method: "POST", body: JSON.stringify({ message: $("#commitMessage").value }) })
    $("#logTitle").textContent = "发布完成"
    $("#logOutput").textContent = data.log
    toast("博客已经成功发布")
    await refreshGit()
  } catch (error) {
    $("#logTitle").textContent = "发布已停止"
    $("#logOutput").textContent = [error.message, error.output].filter(Boolean).join("\n\n")
  }
}

elements.list.addEventListener("click", (event) => { const button = event.target.closest("[data-path]"); if (button) loadEntry(button.dataset.path) })
elements.search.addEventListener("input", renderList)
$("#toggleLibraryButton").addEventListener("click", () => setLibraryCollapsed(!$(".workspace").classList.contains("library-collapsed")))
$("#toggleFieldsButton").addEventListener("click", () => setFieldsCollapsed(!$("#fieldsPanel").classList.contains("collapsed")))
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
$$("[data-insert]").forEach((button) => button.addEventListener("click", () => insertAtCursor(button.dataset.insert)))
$("#cancelPublish").addEventListener("click", () => $("#publishDialog").close())
$("#publishForm").addEventListener("submit", publish)
$("#closeLog").addEventListener("click", () => $("#logDialog").close())

for (const input of [elements.title, elements.slug, elements.published, elements.description, elements.category, elements.tags, elements.image, elements.body, elements.draft, elements.pinned]) {
  input.addEventListener("input", () => { setDirty(true); if (input === elements.body) { updateWordCount(); refreshPreview() } })
}
window.addEventListener("beforeunload", (event) => { if (state.dirty) event.preventDefault() })
window.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save() }
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "l") {
    event.preventDefault()
    setLibraryCollapsed(!$(".workspace").classList.contains("library-collapsed"))
  }
})

Promise.all([loadEntries(true), refreshGit()]).catch((error) => toast(error.message))
