import {
  AmbientLight, BoxGeometry, Color, DirectionalLight, Fog, GridHelper,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PCFSoftShadowMap,
  PerspectiveCamera, PlaneGeometry, Raycaster, Scene, ShadowMaterial,
  Vector2, WebGLRenderer,
} from "three"
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js"

type Cell = { x: number; y: number; z: number }
type Block = { cell: Cell; mesh: Mesh<BoxGeometry, MeshLambertMaterial> }
type SceneOptions = {
  background: string
  accent: string
  grid: string
  onChange: (count: number) => void
}
export type VoxelScene = { dispose: () => void }

const CELL_SIZE = 44
const HALF_GRID = 12
const LIMIT = 160
const INITIAL_CELLS: Cell[] = [
  { x: -7, y: 0, z: 4 }, { x: -5, y: 0, z: -4 },
  { x: 2, y: 0, z: -6 }, { x: 7, y: 0, z: -2 },
  { x: 8, y: 0, z: 3 }, { x: 8, y: 1, z: 3 },
]
const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y && a.z === b.z
const inGrid = ({ x, y, z }: Cell) => x >= -HALF_GRID && x < HALF_GRID && z >= -HALF_GRID && z < HALF_GRID && y >= 0 && y < 9

/** An original, event-rendered voxel playground. No continuous idle render loop. */
export function createVoxelScene(canvas: HTMLDivElement, options: SceneOptions): VoxelScene {
  const createVectorRenderer = () => {
    const vectorRenderer = new SVGRenderer()
    vectorRenderer.setQuality("high")
    vectorRenderer.setPrecision(3)
    vectorRenderer.setClearColor(new Color(options.background), 0)
    return vectorRenderer
  }
  let renderer: WebGLRenderer | SVGRenderer
  try {
    const gpuRenderer = new WebGLRenderer({ antialias: true, alpha: true })
    gpuRenderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio, 2)))
    gpuRenderer.setClearColor(options.background, 0)
    gpuRenderer.shadowMap.enabled = true
    gpuRenderer.shadowMap.type = PCFSoftShadowMap
    renderer = gpuRenderer
  } catch {
    // Both renderers use the same 3D meshes, camera and raycasts. Keep the entire
    // interaction working even in embedded browsers without a working GPU.
    renderer = createVectorRenderer()
  }
  const attachRenderer = () => {
    renderer.domElement.setAttribute("aria-hidden", "true")
    renderer.domElement.style.pointerEvents = "none"
    canvas.dataset.renderer = renderer instanceof WebGLRenderer ? "webgl" : "vector"
    canvas.replaceChildren(renderer.domElement)
  }
  attachRenderer()

  const scene = new Scene()
  const camera = new PerspectiveCamera(38, 1, 10, 4000)
  scene.fog = new Fog(options.background, 1500, 2600)
  scene.add(new AmbientLight(0xffffff, 2.1))
  const light = new DirectionalLight(0xffffff, 3)
  light.position.set(-300, 650, 400)
  light.castShadow = true
  light.shadow.mapSize.set(1024, 1024)
  Object.assign(light.shadow.camera, { left: -650, right: 650, top: 650, bottom: -650, near: 1, far: 1600 })
  light.shadow.bias = -0.0008
  light.shadow.normalBias = 0.4
  scene.add(light)

  const size = CELL_SIZE * HALF_GRID * 2
  const grid = new GridHelper(size, HALF_GRID * 2, options.grid, options.grid)
  grid.material.transparent = true
  grid.material.opacity = 0.65
  grid.material.depthWrite = false
  scene.add(grid)
  const floorGeometry = new PlaneGeometry(size, size)
  const floorMaterial = new ShadowMaterial({ opacity: 0.10 })
  const floor = new Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.5
  floor.receiveShadow = true
  floor.visible = renderer instanceof WebGLRenderer
  scene.add(floor)

  const geometry = new BoxGeometry(CELL_SIZE - 0.5, CELL_SIZE - 0.5, CELL_SIZE - 0.5)
  const material = new MeshLambertMaterial({ color: new Color(options.accent).multiplyScalar(0.69) })
  const previewMaterial = new MeshBasicMaterial({ color: options.accent, transparent: true, opacity: 0.2, depthWrite: false })
  const preview = new Mesh(geometry, previewMaterial)
  preview.visible = false
  scene.add(preview)

  let blocks: Block[] = []
  const history: Cell[][] = []
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const selection = { x: 0, z: 0 }
  let selectedCell: Cell | null = null
  let selectedBlock: Block | undefined
  let width = 1
  let height = 1
  let yaw = 0.45
  let pitch = 0.58
  let zoom = 1
  let frame = 0
  let active = true
  let disposed = false
  let press: { id: number; x: number; y: number; time: number; yaw: number; pitch: number; moved: boolean; touch: boolean; remove: boolean } | null = null
  const events = new AbortController()

  const invalidate = () => {
    if (frame || disposed || !active || document.hidden) return
    frame = requestAnimationFrame(() => {
      frame = 0
      if (disposed) return
      scene.updateMatrixWorld()
      renderer.render(scene, camera)
    })
  }
  const updateCamera = () => {
    const radius = (width < 700 ? 1250 : 1175) * zoom
    camera.position.set(Math.sin(yaw) * Math.cos(pitch) * radius, Math.sin(pitch) * radius, Math.cos(yaw) * Math.cos(pitch) * radius)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    invalidate()
  }
  const publish = () => {
    options.onChange(blocks.length)
    invalidate()
  }
  const remember = () => {
    history.push(blocks.map(({ cell }) => ({ ...cell })))
    if (history.length > 60) history.shift()
  }
  const add = (cell: Cell) => {
    if (!inGrid(cell) || blocks.length >= LIMIT || blocks.some((block) => sameCell(block.cell, cell))) return false
    const mesh = new Mesh(geometry, material)
    mesh.position.set((cell.x + 0.5) * CELL_SIZE, (cell.y + 0.5) * CELL_SIZE, (cell.z + 0.5) * CELL_SIZE)
    mesh.castShadow = true
    mesh.receiveShadow = true
    blocks.push({ cell: { ...cell }, mesh })
    scene.add(mesh)
    return true
  }
  const replace = (cells: Cell[]) => {
    blocks.forEach(({ mesh }) => scene.remove(mesh))
    blocks = []
    cells.forEach(add)
    preview.visible = false
    scene.updateMatrixWorld()
    publish()
  }
  const undo = () => {
    const previous = history.pop()
    if (previous) replace(previous)
  }
  const showPreview = (remove = false) => {
    const cell = remove ? selectedBlock?.cell : selectedCell
    preview.visible = Boolean(cell && inGrid(cell))
    if (cell) {
      preview.position.set((cell.x + 0.5) * CELL_SIZE, (cell.y + 0.5) * CELL_SIZE, (cell.z + 0.5) * CELL_SIZE)
      preview.scale.setScalar(remove ? 1.04 : 1)
      previewMaterial.opacity = remove ? 0.48 : 0.2
    }
    invalidate()
  }
  const hitTest = (clientX: number, clientY: number, remove = false) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.set(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1)
    scene.updateMatrixWorld()
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects([...blocks.map(({ mesh }) => mesh), floor], false)[0]
    selectedBlock = blocks.find(({ mesh }) => mesh === hit?.object)
    selectedCell = null
    if (hit) {
      const position = hit.point.clone()
      if (hit.face) position.add(hit.face.normal.clone().transformDirection(hit.object.matrixWorld).multiplyScalar(0.6))
      selectedCell = { x: Math.floor(position.x / CELL_SIZE), y: Math.max(0, Math.floor(position.y / CELL_SIZE)), z: Math.floor(position.z / CELL_SIZE) }
    }
    showPreview(remove)
  }
  const applySelection = (remove: boolean) => {
    if (remove && selectedBlock) {
      remember()
      scene.remove(selectedBlock.mesh)
      blocks = blocks.filter((block) => block !== selectedBlock)
      selectedBlock = undefined
      preview.visible = false
      publish()
    } else if (!remove && selectedCell && inGrid(selectedCell) && blocks.length < LIMIT && !blocks.some(({ cell }) => sameCell(cell, selectedCell!))) {
      remember()
      add(selectedCell)
      preview.visible = false
      publish()
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    if ((event.button !== 0 && event.button !== 2) || !event.isPrimary) return
    canvas.focus({ preventScroll: true })
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), yaw, pitch, moved: false, touch: event.pointerType === "touch", remove: event.button === 2 || event.shiftKey }
    canvas.setPointerCapture(event.pointerId)
    hitTest(event.clientX, event.clientY, press.remove)
  }
  const onPointerMove = (event: PointerEvent) => {
    if (press) {
      if (event.pointerId !== press.id) return
      const dx = event.clientX - press.x
      const dy = event.clientY - press.y
      if (Math.hypot(dx, dy) > 6) press.moved = true
      if (press.moved) {
        yaw = press.yaw - dx * 0.004
        pitch = Math.max(0.3, Math.min(1.05, press.pitch + dy * 0.003))
        preview.visible = false
        canvas.dataset.dragging = "true"
        updateCamera()
        return
      }
    }
    if (event.pointerType !== "touch") hitTest(event.clientX, event.clientY, event.shiftKey)
  }
  const release = () => {
    if (press && canvas.hasPointerCapture(press.id)) canvas.releasePointerCapture(press.id)
    press = null
    delete canvas.dataset.dragging
  }
  const onPointerUp = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return
    if (!press.moved) {
      const remove = press.remove || event.shiftKey || (press.touch && performance.now() - press.time > 500)
      hitTest(event.clientX, event.clientY, remove)
      applySelection(remove)
    }
    release()
  }
  const hidePreview = () => { preview.visible = false; invalidate() }
  const keyboardSelection = () => {
    const column = blocks.filter(({ cell }) => cell.x === selection.x && cell.z === selection.z)
    selectedBlock = column.sort((a, b) => b.cell.y - a.cell.y)[0]
    selectedCell = { ...selection, y: selectedBlock ? selectedBlock.cell.y + 1 : 0 }
    showPreview()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault()
      undo()
      return
    }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault()
      if (event.key === "ArrowLeft") selection.x--
      if (event.key === "ArrowRight") selection.x++
      if (event.key === "ArrowUp") selection.z--
      if (event.key === "ArrowDown") selection.z++
      selection.x = Math.max(-HALF_GRID, Math.min(HALF_GRID - 1, selection.x))
      selection.z = Math.max(-HALF_GRID, Math.min(HALF_GRID - 1, selection.z))
      keyboardSelection()
    } else if (["Enter", " ", "Delete", "Backspace"].includes(event.key)) {
      event.preventDefault()
      keyboardSelection()
      applySelection(event.shiftKey || event.key === "Delete" || event.key === "Backspace")
      keyboardSelection()
    } else if (["+", "=", "-"].includes(event.key)) {
      event.preventDefault()
      zoom = Math.max(0.72, Math.min(1.5, zoom + (event.key === "-" ? 0.08 : -0.08)))
      updateCamera()
    } else if (["w", "a", "s", "d"].includes(event.key.toLowerCase())) {
      event.preventDefault()
      const key = event.key.toLowerCase()
      yaw += key === "a" ? -0.1 : key === "d" ? 0.1 : 0
      pitch = Math.max(0.3, Math.min(1.05, pitch + (key === "w" ? 0.07 : key === "s" ? -0.07 : 0)))
      updateCamera()
    } else if (event.key === "Escape") {
      hidePreview()
      canvas.blur()
    }
  }
  const resize = () => {
    width = canvas.clientWidth
    height = canvas.clientHeight
    if (!width || !height) return
    if (renderer instanceof WebGLRenderer) renderer.setSize(width, height, false)
    else renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    updateCamera()
  }
  const onContextLost = (event: Event) => {
    event.preventDefault()
    if (renderer instanceof WebGLRenderer) renderer.dispose()
    renderer = createVectorRenderer()
    floor.visible = false
    attachRenderer()
    resize()
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
    zoom = Math.max(0.72, Math.min(1.6, zoom * Math.exp(Math.max(-100, Math.min(100, delta)) * 0.0018)))
    hidePreview()
    updateCamera()
  }

  canvas.addEventListener("pointerdown", onPointerDown, { signal: events.signal })
  canvas.addEventListener("pointermove", onPointerMove, { signal: events.signal })
  canvas.addEventListener("pointerup", onPointerUp, { signal: events.signal })
  canvas.addEventListener("pointercancel", release, { signal: events.signal })
  canvas.addEventListener("lostpointercapture", release, { signal: events.signal })
  canvas.addEventListener("pointerleave", hidePreview, { signal: events.signal })
  canvas.addEventListener("blur", hidePreview, { signal: events.signal })
  canvas.addEventListener("keydown", onKeyDown, { signal: events.signal })
  renderer.domElement.addEventListener("webglcontextlost", onContextLost, { signal: events.signal })
  canvas.addEventListener("wheel", onWheel, { passive: false, signal: events.signal })
  canvas.addEventListener("contextmenu", (event) => event.preventDefault(), { signal: events.signal })
  document.addEventListener("visibilitychange", invalidate, { signal: events.signal })
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting
    if (active) invalidate()
  })
  intersectionObserver.observe(canvas)
  replace(INITIAL_CELLS)
  resize()

  return {
    dispose: () => {
      disposed = true
      release()
      events.abort()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      cancelAnimationFrame(frame)
      geometry.dispose()
      material.dispose()
      previewMaterial.dispose()
      floorGeometry.dispose()
      floorMaterial.dispose()
      grid.geometry.dispose()
      grid.material.dispose()
      light.shadow.dispose()
      if (renderer instanceof WebGLRenderer) {
        renderer.dispose()
        renderer.forceContextLoss()
      }
      canvas.replaceChildren()
      scene.clear()
    },
  }
}
