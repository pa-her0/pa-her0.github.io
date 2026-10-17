import {
  AmbientLight, Color, DirectionalLight, Fog, GridHelper, Group,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, PCFSoftShadowMap,
  PerspectiveCamera, PlaneGeometry, Raycaster, Scene, ShadowMaterial,
  Vector2, Vector3, WebGLRenderer,
} from "three"
import { SVGRenderer } from "three/addons/renderers/SVGRenderer.js"
import { DINOSAUR_BRICKS, DINOSAUR_CENTER_X, DINOSAUR_SIZE } from "@/data/voxel-dinosaur"
import {
  BRICK_GRID, BRICK_PALETTE, brickSize, brickVolumes, canPlaceBrick, defaultBrickTone, placeBrickAgainst,
  type BrickKind, type BrickPiece, type BrickTone, type QuarterTurn,
} from "@/data/brick-kit"
import { BRICK_UNIT, createBrickGeometry, type BrickGeometryPart } from "@/lib/brick-geometry"

type Block = { piece: BrickPiece; group: Group }
type SceneOptions = {
  background: string
  accent: string
  grid: string
  onChange: (count: number) => void
  onBrushChange: (kind: BrickKind, turn: QuarterTurn) => void
  onFeedback: (message: string) => void
}
export type VoxelScene = { dispose: () => void; setBrush: (kind: BrickKind, turn: QuarterTurn) => void; undo: () => void }

const LOOK_HEIGHT = DINOSAUR_SIZE.height * BRICK_UNIT * 0.5
const CENTER_X = DINOSAUR_CENTER_X * BRICK_UNIT

/** Event-rendered scene: only camera movement and brief placement animations use RAF. */
export function createVoxelScene(canvas: HTMLDivElement, options: SceneOptions): VoxelScene {
  const createVectorRenderer = () => {
    const vectorRenderer = new SVGRenderer()
    vectorRenderer.setQuality("high")
    vectorRenderer.setPrecision(2)
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
  const camera = new PerspectiveCamera(38, 1, 10, 6000)
  scene.fog = new Fog(options.background, 1900, 3200)
  scene.add(new AmbientLight(0xffffff, 1.5))
  const light = new DirectionalLight(0xffffff, 2.5)
  light.position.set(-300, 850, 600)
  light.castShadow = true
  light.shadow.mapSize.set(2048, 2048)
  Object.assign(light.shadow.camera, { left: -650, right: 650, top: 650, bottom: -650, near: 1, far: 1800 })
  light.shadow.bias = -0.0004
  light.shadow.normalBias = 0.35
  scene.add(light)
  const fill = new DirectionalLight(0xd8d0ff, 0.7)
  fill.position.set(400, 300, -500)
  scene.add(fill)

  const size = BRICK_UNIT * BRICK_GRID.half * 2
  const grid = new GridHelper(size, BRICK_GRID.half * 2, options.grid, options.grid)
  grid.material.transparent = true
  grid.material.opacity = 0.45
  grid.material.depthWrite = false
  scene.add(grid)
  const floorGeometry = new PlaneGeometry(size, size)
  const floorMaterial = new ShadowMaterial({ opacity: 0.09 })
  const floor = new Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.5
  floor.receiveShadow = true
  floor.visible = renderer instanceof WebGLRenderer
  scene.add(floor)

  const geometries = new Map<BrickKind, BrickGeometryPart[]>()
  const materials = new Map<BrickTone, MeshLambertMaterial>()
  const geometryFor = (kind: BrickKind) => {
    if (!geometries.has(kind)) geometries.set(kind, createBrickGeometry(kind))
    return geometries.get(kind)!
  }
  const materialFor = (tone: BrickTone) => {
    if (!materials.has(tone)) materials.set(tone, new MeshLambertMaterial({ color: new Color(BRICK_PALETTE[tone]) }))
    return materials.get(tone)!
  }
  const transform = (group: Group, piece: BrickPiece) => {
    const dimensions = brickSize(piece)
    group.position.set((piece.x + dimensions.width / 2) * BRICK_UNIT, (piece.y + dimensions.height / 2) * BRICK_UNIT, (piece.z + dimensions.depth / 2) * BRICK_UNIT)
    group.rotation.set(0, (piece.turn ?? 0) * Math.PI / 2, 0)
  }
  const makeGroup = (piece: BrickPiece, ghost = false) => {
    const group = new Group()
    for (const part of geometryFor(piece.kind)) {
      const mesh = new Mesh(part.geometry, ghost ? previewMaterial : materialFor(part.tone ?? piece.tone ?? defaultBrickTone(piece.kind)))
      mesh.castShadow = !ghost
      mesh.receiveShadow = !ghost
      group.add(mesh)
    }
    transform(group, piece)
    return group
  }
  const previewMaterial = new MeshBasicMaterial({ color: options.accent, transparent: true, opacity: 0.36, depthWrite: false })
  let preview = new Group()
  preview.visible = false
  scene.add(preview)

  let blocks: Block[] = []
  const history: BrickPiece[][] = []
  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const selection = { x: -6, z: 4 }
  let brush: { kind: BrickKind; turn: QuarterTurn } = { kind: "cube", turn: 0 }
  let selectedPiece: BrickPiece | null = null
  let selectedBlock: Block | undefined
  let lastPointer: { x: number; y: number } | null = null
  let keyboardMode = false
  let yaw = 0.45
  let pitch = 0.3
  let zoom = 1
  let frame = 0
  let active = true
  let disposed = false
  let press: { id: number; x: number; y: number; time: number; yaw: number; pitch: number; moved: boolean; touch: boolean; remove: boolean } | null = null
  const events = new AbortController()
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
  const arrivals = new Map<Group, number>()

  const invalidate = () => {
    if (frame || disposed || !active || document.hidden) return
    frame = requestAnimationFrame((now) => {
      frame = 0
      if (disposed) return
      arrivals.forEach((start, group) => {
        const t = Math.min(1, (now - start) / 360)
        group.scale.setScalar(1 + 0.55 * (2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2)))
        if (t >= 1) { group.scale.setScalar(1); arrivals.delete(group) }
      })
      scene.updateMatrixWorld()
      renderer.render(scene, camera)
      if (arrivals.size) invalidate()
    })
  }
  const updateCamera = () => {
    const halfFov = Math.tan(camera.fov * Math.PI / 360)
    const projectedWidth = DINOSAUR_SIZE.width * Math.abs(Math.cos(yaw)) + DINOSAUR_SIZE.depth * Math.abs(Math.sin(yaw))
    const fitWidth = projectedWidth * BRICK_UNIT / (2 * halfFov * camera.aspect * 0.85)
    const fitHeight = (DINOSAUR_SIZE.height + DINOSAUR_SIZE.depth * 0.35) * BRICK_UNIT / (2 * halfFov * 0.86)
    const radius = Math.max(980, fitWidth, fitHeight) * zoom
    camera.position.set(CENTER_X + Math.sin(yaw) * Math.cos(pitch) * radius, LOOK_HEIGHT + Math.sin(pitch) * radius, Math.cos(yaw) * Math.cos(pitch) * radius)
    camera.lookAt(CENTER_X, LOOK_HEIGHT, 0)
    camera.updateMatrixWorld()
    invalidate()
  }
  const publish = () => { options.onChange(blocks.length); invalidate() }
  const remember = () => {
    history.push(blocks.map(({ piece }) => ({ ...piece })))
    if (history.length > 60) history.shift()
  }
  const add = (piece: BrickPiece, animate = false) => {
    const group = makeGroup(piece)
    blocks.push({ piece: { ...piece }, group })
    scene.add(group)
    if (animate && !motion.matches) { group.scale.setScalar(0.45); arrivals.set(group, performance.now()) }
  }
  const replace = (pieces: readonly BrickPiece[]) => {
    blocks.forEach(({ group }) => scene.remove(group))
    arrivals.clear()
    blocks = []
    pieces.forEach((piece) => add(piece))
    selectedBlock = undefined
    selectedPiece = null
    preview.visible = false
    scene.updateMatrixWorld()
    publish()
  }
  const undo = () => {
    const previous = history.pop()
    if (previous) { replace(previous); options.onFeedback("已撤销上一步") }
  }
  const showPreview = (remove = false) => {
    const piece = remove ? selectedBlock?.piece : selectedPiece
    scene.remove(preview)
    preview.clear()
    if (piece) {
      preview = makeGroup(piece, true)
      previewMaterial.color.set(remove ? "#a484bd" : canPlaceBrick(piece, blocks.map((block) => block.piece)) ? options.accent : "#bc6f81")
      previewMaterial.opacity = remove ? 0.55 : 0.36
      if (remove) preview.scale.setScalar(1.025)
      scene.add(preview)
    }
    preview.visible = Boolean(piece)
    invalidate()
  }
  const hitTest = (clientX: number, clientY: number, remove = false) => {
    const bounds = canvas.getBoundingClientRect()
    pointer.set(((clientX - bounds.left) / bounds.width) * 2 - 1, -((clientY - bounds.top) / bounds.height) * 2 + 1)
    scene.updateMatrixWorld()
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects([...blocks.map(({ group }) => group), floor], true)[0]
    selectedBlock = blocks.find(({ group }) => group === hit?.object.parent)
    selectedPiece = null
    if (hit) {
      const point = hit.point.clone().divideScalar(BRICK_UNIT)
      const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new Vector3(0, 1, 0)
      selectedPiece = placeBrickAgainst(brush.kind, brush.turn, point, normal, selectedBlock?.piece)
    }
    showPreview(remove)
  }
  const applySelection = (remove: boolean) => {
    if (remove && selectedBlock) {
      remember()
      scene.remove(selectedBlock.group)
      arrivals.delete(selectedBlock.group)
      blocks = blocks.filter((block) => block !== selectedBlock)
      selectedBlock = undefined
      preview.visible = false
      publish()
    } else if (!remove && selectedPiece) {
      if (!canPlaceBrick(selectedPiece, blocks.map(({ piece }) => piece))) {
        options.onFeedback(blocks.length >= BRICK_GRID.limit ? "背包里的积木已经放满了，移除一些再试试" : "这里放不下，换一个空位试试")
        return
      }
      remember()
      add(selectedPiece, true)
      preview.visible = false
      publish()
    }
  }
  const keyboardSelection = () => {
    const column = blocks.flatMap((block) => brickVolumes(block.piece)
      .filter((b) => selection.x >= b.minX && selection.x < b.maxX && selection.z >= b.minZ && selection.z < b.maxZ)
      .map((b) => ({ block, top: b.maxY })))
      .sort((a, b) => b.top - a.top)
    selectedBlock = column[0]?.block
    selectedPiece = { ...brush, ...selection, y: column[0]?.top ?? 0, tone: defaultBrickTone(brush.kind) }
    showPreview()
  }
  const setBrush = (kind: BrickKind, turn: QuarterTurn) => {
    brush = { kind, turn }
    if (keyboardMode) keyboardSelection()
    else if (lastPointer && canvas === document.activeElement) hitTest(lastPointer.x, lastPointer.y)
    else { preview.visible = false; invalidate() }
  }
  const onPointerDown = (event: PointerEvent) => {
    if ((event.button !== 0 && event.button !== 2) || !event.isPrimary) return
    keyboardMode = false
    canvas.focus({ preventScroll: true })
    press = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now(), yaw, pitch, moved: false, touch: event.pointerType === "touch", remove: event.button === 2 || event.shiftKey }
    canvas.setPointerCapture(event.pointerId)
    hitTest(event.clientX, event.clientY, press.remove)
  }
  const onPointerMove = (event: PointerEvent) => {
    keyboardMode = false
    lastPointer = { x: event.clientX, y: event.clientY }
    if (press) {
      if (event.pointerId !== press.id) return
      const dx = event.clientX - press.x, dy = event.clientY - press.y
      if (Math.hypot(dx, dy) > 6) press.moved = true
      if (press.moved) {
        yaw = press.yaw - dx * 0.004
        pitch = Math.max(0.16, Math.min(1.05, press.pitch + dy * 0.003))
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
  const hidePreview = () => { lastPointer = null; preview.visible = false; invalidate() }
  const onKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); undo(); return }
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      event.preventDefault()
      keyboardMode = true
      if (event.key === "ArrowLeft") selection.x--
      if (event.key === "ArrowRight") selection.x++
      if (event.key === "ArrowUp") selection.z--
      if (event.key === "ArrowDown") selection.z++
      const dimensions = brickSize(brush)
      selection.x = Math.max(-BRICK_GRID.half, Math.min(BRICK_GRID.half - dimensions.width, selection.x))
      selection.z = Math.max(-BRICK_GRID.half, Math.min(BRICK_GRID.half - dimensions.depth, selection.z))
      keyboardSelection()
    } else if (["Enter", " ", "Delete", "Backspace"].includes(event.key)) {
      event.preventDefault(); keyboardMode = true; keyboardSelection()
      applySelection(event.shiftKey || event.key === "Delete" || event.key === "Backspace")
      keyboardSelection()
    } else if (event.key.toLowerCase() === "r") {
      event.preventDefault()
      const turn = ((brush.turn + 1) % 4) as QuarterTurn
      setBrush(brush.kind, turn)
      options.onBrushChange(brush.kind, turn)
    } else if (["+", "=", "-"].includes(event.key)) {
      event.preventDefault(); zoom = Math.max(0.65, Math.min(1.7, zoom + (event.key === "-" ? 0.08 : -0.08))); updateCamera()
    } else if (["w", "a", "s", "d"].includes(event.key.toLowerCase())) {
      event.preventDefault()
      const key = event.key.toLowerCase()
      yaw += key === "a" ? -0.12 : key === "d" ? 0.12 : 0
      pitch = Math.max(0.16, Math.min(1.05, pitch + (key === "w" ? 0.07 : key === "s" ? -0.07 : 0)))
      hidePreview(); updateCamera()
    } else if (event.key === "Escape") { hidePreview(); canvas.blur() }
  }
  const resize = () => {
    const width = canvas.clientWidth, height = canvas.clientHeight
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
    renderer = createVectorRenderer(); floor.visible = false; attachRenderer(); resize()
  }
  const onWheel = (event: WheelEvent) => {
    event.preventDefault()
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : 1)
    zoom = Math.max(0.65, Math.min(1.7, zoom * Math.exp(Math.max(-100, Math.min(100, delta)) * 0.0018)))
    hidePreview(); updateCamera()
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
  const intersectionObserver = new IntersectionObserver(([entry]) => { active = entry.isIntersecting; if (active) invalidate() })
  intersectionObserver.observe(canvas)
  replace(DINOSAUR_BRICKS)
  resize()

  return {
    setBrush, undo,
    dispose: () => {
      disposed = true
      release(); events.abort(); resizeObserver.disconnect(); intersectionObserver.disconnect(); cancelAnimationFrame(frame)
      geometries.forEach((parts) => parts.forEach(({ geometry }) => geometry.dispose()))
      materials.forEach((material) => material.dispose())
      previewMaterial.dispose(); floorGeometry.dispose(); floorMaterial.dispose(); grid.geometry.dispose(); grid.material.dispose(); light.shadow.dispose()
      if (renderer instanceof WebGLRenderer) { renderer.dispose(); renderer.forceContextLoss() }
      arrivals.clear(); canvas.replaceChildren(); scene.clear()
    },
  }
}
