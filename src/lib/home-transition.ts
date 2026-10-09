import { isTransitionBeforePreparationEvent, isTransitionBeforeSwapEvent } from "astro:transitions/client"
import { getTransitionCopy } from "./transition-copy"

type IntroRun = {
  controller: AbortController
  animations: Animation[]
  startedAt: number
  minimum: number
  cover: Promise<unknown>
  settling: boolean
}

/** One persistent overlay with destination-specific copy for page navigation. */
export function initHomeTransition() {
  const overlay = document.querySelector<HTMLElement>("#home-transition")
  if (!overlay || overlay.dataset.initialized) return
  overlay.dataset.initialized = "true"

  const paper = overlay.querySelector<HTMLElement>(".home-transition__paper")!
  const pixels = overlay.querySelector<HTMLElement>(".home-transition__pixels")!
  const copy = overlay.querySelector<HTMLElement>(".home-transition__copy")!
  const strokeTemplate = overlay.querySelector<SVGSVGElement>(".home-transition__stroke")!.cloneNode(true)
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")
  let current: IntroRun | null = null

  const setCopy = (pathname: string) => {
    const pageCopy = getTransitionCopy(pathname)
    overlay.dataset.page = pageCopy.key
    const word = (text: string) => {
      const wrapper = document.createElement("span")
      wrapper.className = "home-transition__word"
      const inner = document.createElement("span")
      inner.textContent = text
      wrapper.append(inner)
      return wrapper
    }
    copy.replaceChildren(...pageCopy.lines.map(({ before, keyword, after }) => {
      const line = document.createElement("span")
      line.className = "home-transition__line"
      const accent = document.createElement("span")
      accent.className = "home-transition__keyword"
      accent.append(word(keyword), strokeTemplate.cloneNode(true))
      line.append(word(before), accent, word(after))
      return line
    }))
  }

  const pause = (milliseconds: number, signal: AbortSignal) => new Promise<void>((resolve) => {
    if (signal.aborted || milliseconds <= 0) return resolve()
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve() }
    const timer = window.setTimeout(finish, milliseconds)
    signal.addEventListener("abort", finish, { once: true })
  })

  const finish = (run = current) => {
    if (!run || current !== run) return
    current = null
    run.controller.abort()
    run.animations.forEach((animation) => animation.cancel())
    document.documentElement.removeAttribute("data-home-transition")
    overlay.dataset.phase = "idle"
    pixels.replaceChildren()
  }

  const animate = (run: IntroRun, element: Element, keyframes: Keyframe[], timing: KeyframeAnimationOptions) => {
    const animation = element.animate(keyframes, { fill: "both", ...timing })
    run.animations.push(animation)
    return animation.finished.catch(() => undefined)
  }

  const makePixels = () => {
    const columns = innerWidth < 640 ? 16 : 36
    const rows = Math.ceil(innerHeight / (innerWidth / columns))
    pixels.style.setProperty("--pixel-columns", String(columns))
    pixels.style.setProperty("--pixel-rows", String(rows))
    const tiles = Array.from({ length: columns * rows }, () => {
      const tile = document.createElement("div")
      tile.className = "home-transition__pixel"
      return tile
    })
    pixels.replaceChildren(...tiles)
    // Shuffle a complete set so every tile gets a distinct place in the reveal.
    const order = tiles.map((_, index) => index)
    for (let index = order.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1))
      ;[order[index], order[other]] = [order[other], order[index]]
    }
    return { tiles, order }
  }

  const start = (initial: boolean, pathname: string) => {
    finish()
    if (reducedMotion.matches) {
      document.documentElement.removeAttribute("data-home-transition")
      return null
    }
    const run: IntroRun = {
      controller: new AbortController(), animations: [], startedAt: performance.now(),
      minimum: initial ? 2300 : 1950, cover: Promise.resolve(), settling: false,
    }
    current = run
    setCopy(pathname)
    const { tiles, order } = makePixels()
    document.documentElement.dataset.homeTransition = "active"
    overlay.dataset.phase = initial ? "writing" : "covering"
    paper.style.opacity = initial ? "1" : "0"
    copy.style.opacity = "0"
    if (!initial) {
      run.cover = Promise.all(tiles.map((tile, index) => animate(run, tile, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 1, delay: order[index] / tiles.length * 260,
      })))
    }
    void run.cover.then(() => {
      if (run.controller.signal.aborted) return
      paper.style.opacity = "1"
      overlay.dataset.phase = "writing"
      copy.style.opacity = "1"
      const words = [...copy.querySelectorAll<HTMLElement>(".home-transition__word > span")]
      const strokes = [...copy.querySelectorAll<SVGPathElement>(".home-transition__stroke path")]
      words.forEach((word, index) => {
        void animate(run, word, [{ transform: "translateY(110%)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], {
          duration: 550, delay: index * 45, easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        })
      })
      void Promise.all(strokes.map((stroke, index) =>
        animate(run, stroke, [{ strokeDashoffset: "1" }, { strokeDashoffset: "0" }], {
          duration: index % 2 ? 260 : 400, delay: (index < 2 ? 300 : 780) + (index % 2) * 80,
          easing: "cubic-bezier(0.45, 0, 0.25, 1)",
        })
      )).then(() => {
        if (current === run && overlay.dataset.phase === "writing") overlay.dataset.phase = "reading"
      })
    })
    // Errors, slow assets and interrupted navigation must never strand a mask.
    void pause(6000, run.controller.signal).then(() => finish(run))
    return run
  }

  const homeReady = (signal: AbortSignal) => new Promise<void>((resolve) => {
    const playground = document.querySelector<HTMLElement>(".voxel-playground")
    if (!playground || playground.dataset.status !== "loading" || signal.aborted) return resolve()
    const complete = () => {
      observer.disconnect()
      clearTimeout(timer)
      signal.removeEventListener("abort", complete)
      resolve()
    }
    const observer = new MutationObserver(() => {
      if (playground.dataset.status !== "loading") complete()
    })
    const timer = window.setTimeout(complete, 1600)
    signal.addEventListener("abort", complete, { once: true })
    observer.observe(playground, { attributes: true, attributeFilter: ["data-status"] })
  })

  const reveal = async (run: IntroRun) => {
    if (run.settling || run.controller.signal.aborted) return
    run.settling = true
    await Promise.all([run.cover, homeReady(run.controller.signal), pause(run.minimum - (performance.now() - run.startedAt), run.controller.signal)])
    if (current !== run || run.controller.signal.aborted) return
    overlay.dataset.phase = "revealing"
    await animate(run, copy, [{ opacity: 1 }, { opacity: 0 }], { duration: 180 })
    if (run.controller.signal.aborted) return
    paper.style.opacity = "0"
    const tiles = [...pixels.children]
    const order = tiles.map(() => Math.random())
    await Promise.all(tiles.map((tile, index) => animate(run, tile, [{ opacity: 1 }, { opacity: 0 }], {
      duration: 1, delay: order[index] * 650,
    })))
    finish(run)
  }

  document.addEventListener("astro:before-preparation", (event) => {
    if (!isTransitionBeforePreparationEvent(event)) return
    const samePage = event.from.pathname === event.to.pathname && event.from.search === event.to.search
    if (samePage || event.from.pathname === event.to.pathname) {
      finish()
      return
    }
    const run = start(false, event.to.pathname)
    if (!run) return
    event.signal.addEventListener("abort", () => finish(run), { once: true })
    const originalLoader = event.loader
    event.loader = async () => {
      try {
        await Promise.all([originalLoader(), run.cover])
        if (event.defaultPrevented) finish(run)
      }
      catch (error) { finish(run); throw error }
    }
  })

  document.addEventListener("astro:before-swap", (event) => {
    if (!isTransitionBeforeSwapEvent(event) || !current) return
    event.newDocument.documentElement.dataset.homeTransition = "active"
    // The pixel overlay owns this transition; don't crossfade a second snapshot.
    void event.viewTransition.ready.catch(() => undefined)
    event.viewTransition.skipTransition()
  })
  document.addEventListener("astro:page-load", () => { if (current) void reveal(current) })
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") finish() })
  window.addEventListener("pageshow", (event) => { if (event.persisted) finish() })
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) finish() })

  if (document.documentElement.dataset.homeTransition === "initial") {
    const run = start(true, location.pathname)
    if (run) void reveal(run)
  }
}
