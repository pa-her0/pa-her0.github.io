"use client"

import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useRef } from "react"
import { homeJourney } from "@/data/home-journey"

gsap.registerPlugin(useGSAP, ScrollTrigger)

const MEDIA = "/home-gallery/character-journey"
const LAST_FRAME = 63
const SHEET_COUNT = 8
const FRAMES_PER_SHEET = 8

interface ScrollJourneyProps {
  articleHref?: string
}

export function ScrollJourney({ articleHref = "/articles/" }: ScrollJourneyProps) {
  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { opening, introduction, philosophy } = homeJourney

  useGSAP(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d", { alpha: false })
    if (!root || !canvas || !context) return

    const query = gsap.utils.selector(root)
    const visual = query(".journey-visual")[0] as HTMLElement
    const intro = query(".journey-intro")[0] as HTMLElement
    const ending = query(".journey-philosophy")[0] as HTMLElement
    const endingCopy = query(".journey-philosophy__copy")[0] as HTMLElement
    const chapterNumbers = query("[data-journey-chapter]") as HTMLElement[]
    const match = gsap.matchMedia()

    match.add({
      compact: "(max-width: 760px)",
      desktop: "(min-width: 761px)",
      reduce: "(prefers-reduced-motion: reduce)",
      short: "(max-height: 560px)",
    }, (mediaContext) => {
      const { compact, reduce, short } = mediaContext.conditions!
      const visibilityTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top 70%",
        end: "bottom top",
        onToggle: (trigger) => { root.dataset.inView = String(trigger.isActive) },
        onRefresh: (trigger) => { root.dataset.inView = String(trigger.isActive) },
      })
      // A readable, ordinary document remains available without motion or JS.
      if (reduce || short) return () => {
        visibilityTrigger.kill()
        delete root.dataset.inView
      }

      root.dataset.animated = "true"
      const width = compact ? 768 : 1114
      const height = compact ? 398 : 576
      canvas.width = width
      canvas.height = height
      context.imageSmoothingQuality = "high"
      const sheets: (HTMLImageElement | undefined)[] = []
      const requests: HTMLImageElement[] = []
      const playhead = { frame: 0 }
      let disposed = false
      let drawnFrame = -1
      let activeChapter = -1

      const renderFrame = () => {
        const target = Math.max(0, Math.min(LAST_FRAME, Math.round(playhead.frame)))
        let frame = target
        // Hold the closest loaded pose on a slow connection; never flash blank.
        if (!sheets[Math.floor(frame / FRAMES_PER_SHEET)]) {
          const available = sheets.flatMap((sheet, index) => sheet ? [index] : [])
          if (!available.length) return
          const nearest = available.reduce((a, b) =>
            Math.abs(a * FRAMES_PER_SHEET - target) < Math.abs(b * FRAMES_PER_SHEET - target) ? a : b,
          )
          frame = Math.max(nearest * FRAMES_PER_SHEET, Math.min(nearest * FRAMES_PER_SHEET + 7, target))
        }
        if (frame === drawnFrame) return
        const sheet = sheets[Math.floor(frame / FRAMES_PER_SHEET)]!
        const cell = frame % FRAMES_PER_SHEET
        context.drawImage(sheet, (cell % 4) * width, Math.floor(cell / 4) * height, width, height, 0, 0, width, height)
        drawnFrame = frame
        canvas.dataset.frame = String(frame)
        canvas.style.opacity = "1"
      }

      // Load nearby frames only when the section approaches. Three requests at a
      // time keep the rest of the homepage responsive; mobile uses smaller sheets.
      const queue = [0, 7, 1, 2, 3, 4, 5, 6]
      let cursor = 0
      const loadNext = () => {
        if (disposed || cursor >= SHEET_COUNT) return
        const index = queue[cursor++]
        const image = new Image()
        requests.push(image)
        image.decoding = "async"
        image.onload = () => {
          if (disposed) return
          sheets[index] = image
          renderFrame()
          loadNext()
        }
        image.onerror = () => { if (!disposed) loadNext() }
        image.src = `${MEDIA}/${compact ? "mobile" : "scene"}-${String(index).padStart(2, "0")}.webp`
      }
      const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        for (let worker = 0; worker < 3; worker++) loadNext()
      }, { rootMargin: "800px" })
      observer.observe(root)

      gsap.set([intro, ending, endingCopy], { autoAlpha: 0 })
      gsap.set(".journey-opening__line", { yPercent: 0 })
      // Establish all staggered children up front, so the last item cannot flash
      // ahead of the others when entering or reversing through a transition.
      gsap.set(".journey-intro__reveal", { autoAlpha: 0, y: 22 })
      gsap.set(".journey-philosophy__character", { autoAlpha: 0, y: 24 })
      gsap.set(".journey-practice", { autoAlpha: 0, y: 18 })

      const syncAccess = (progress: number) => {
        // Invisible panels cannot receive keyboard focus. Reversible on scroll-up.
        intro.inert = progress < 0.36 || progress >= 0.61
        intro.setAttribute("aria-hidden", String(intro.inert))
        ending.inert = progress < 0.65
        ending.setAttribute("aria-hidden", String(ending.inert))
        endingCopy.inert = progress < 0.79
        endingCopy.setAttribute("aria-hidden", String(endingCopy.inert))
        const chapter = progress < 0.34 ? 0 : progress < 0.65 ? 1 : 2
        if (chapter === activeChapter) return
        activeChapter = chapter
        root.dataset.chapter = String(chapter)
        chapterNumbers.forEach((number, index) => number.dataset.active = String(index === chapter))
      }

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.32,
          invalidateOnRefresh: true,
        },
        onUpdate() { syncAccess(this.progress()) },
      })

      timeline
        .to(playhead, { frame: LAST_FRAME, duration: 0.29, ease: "none", onUpdate: renderFrame }, 0.035)
        .to(".journey-opening__line", { yPercent: -110, stagger: 0.012, duration: 0.065 }, 0.17)
        .to(".journey-opening__caption", { autoAlpha: 0, y: -12, duration: 0.065 }, 0.17)
        .to(".journey-opening", { autoAlpha: 0, duration: 0.05 }, 0.25)
        .to(visual, compact
          ? { top: "6%", yPercent: 0, height: "37%", duration: 0.11 }
          : { left: "26%", width: "52%", duration: 0.11 }, 0.29)
        .to(".journey-visual__veil", { opacity: 1, duration: 0.1 }, 0.29)
        .fromTo(intro, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.09 }, 0.34)
        .to(".journey-intro__reveal", { y: 0, autoAlpha: 1, duration: 0.07, stagger: 0.014 }, 0.35)
        // Deliberate reading hold: the gaze is frozen for the entire introduction.
        .to(intro, { autoAlpha: 0, y: -24, duration: 0.075 }, 0.58)
        .to(visual, { autoAlpha: 0, scale: 1.035, duration: 0.095 }, 0.59)
        .to(ending, { autoAlpha: 1, duration: 0.1 }, 0.61)
        .to(".journey-philosophy__character", { autoAlpha: 1, y: 0, stagger: 0.02, duration: 0.055 }, 0.65)
        .to(".journey-philosophy__title", compact
          ? { top: "15%", yPercent: 0, duration: 0.095 }
          : { left: "24%", duration: 0.095 }, 0.755)
        .fromTo(endingCopy, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.06 }, 0.79)
        .to(".journey-practice", { autoAlpha: 1, y: 0, duration: 0.045, stagger: 0.012 }, 0.8)
        .to({}, { duration: 0.1 }, 0.9)

      syncAccess(timeline.progress())
      ScrollTrigger.refresh()
      root.dataset.inView = String(visibilityTrigger.isActive)

      return () => {
        disposed = true
        observer.disconnect()
        visibilityTrigger.kill()
        timeline.scrollTrigger?.kill()
        timeline.kill()
        requests.forEach((image) => { image.onload = null; image.onerror = null; image.src = "" })
        sheets.length = 0
        canvas.style.opacity = "0"
        delete canvas.dataset.frame
        delete root.dataset.animated
        delete root.dataset.chapter
        delete root.dataset.inView
        for (const panel of [intro, ending, endingCopy]) {
          panel.inert = false
          panel.removeAttribute("aria-hidden")
        }
      }
    })

    return () => match.revert()
  }, { scope: rootRef })

  return (
    <section id="personal-journey" className="character-journey" ref={rootRef} aria-label="认识 Jiely：从思考到行动">
      <div className="journey-stage">
        <div className="journey-visual" aria-hidden="true">
          <picture>
            <source media="(prefers-reduced-motion: reduce), (max-height: 560px)" srcSet={`${MEDIA}/gaze.webp`} />
            <img src={`${MEDIA}/head-down.webp`} width={1114} height={576} alt="" loading="lazy" decoding="async" />
          </picture>
          <canvas ref={canvasRef} width={768} height={398} />
          <div className="journey-visual__veil" />
        </div>

        <div className="journey-opening">
          <h2>{opening.lines.map((line) => <span className="journey-line-mask" key={line}><span className="journey-opening__line">{line}</span></span>)}</h2>
          <p className="journey-opening__caption">{opening.caption}<span aria-hidden="true">↓</span></p>
        </div>

        <article className="journey-intro">
          <h2 className="journey-intro__reveal"><small>{introduction.greeting}</small><span>{introduction.name}<i aria-hidden="true">.</i></span></h2>
          <p className="journey-intro__lead journey-intro__reveal">{introduction.lead}</p>
          <p className="journey-description journey-intro__reveal">{introduction.description}</p>
          <ul className="journey-interests journey-intro__reveal" aria-label="兴趣方向">
            {introduction.interests.map((interest) => <li key={interest}>{interest}</li>)}
          </ul>
          <a className="journey-text-link journey-intro__reveal" href={introduction.link}>{introduction.linkLabel}<span aria-hidden="true">↗</span></a>
        </article>

        <section className="journey-philosophy" aria-labelledby="journey-philosophy-title">
          <div className="journey-philosophy__glow" aria-hidden="true" />
          <div className="journey-philosophy__title">
            <h2 id="journey-philosophy-title" aria-label={philosophy.title}>
              {Array.from(philosophy.title).map((character) => <span className="journey-philosophy__character" aria-hidden="true" key={character}>{character}</span>)}
            </h2>
            <p className="journey-philosophy__subtitle">{philosophy.subtitle}</p>
          </div>
          <div className="journey-philosophy__copy">
            <h3>{philosophy.heading.map((line) => <span key={line}>{line}</span>)}</h3>
            <p className="journey-description">{philosophy.description}</p>
            <div className="journey-practices">
              {philosophy.entries.map((entry) => (
                <a className="journey-practice" href={entry.href} key={entry.index}>
                  <span className="journey-practice__number">{entry.index}</span>
                  <span><strong>{entry.title}</strong><small>{entry.description}</small></span>
                  <span className="journey-practice__arrow" aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
            <a className="journey-text-link" href={articleHref}>{philosophy.latestLabel}<span aria-hidden="true">↗</span></a>
          </div>
        </section>

        <div className="journey-chapters" aria-hidden="true">
          <span data-journey-chapter data-active="true">01 <i>蓄力</i></span>
          <span data-journey-chapter>02 <i>相识</i></span>
          <span data-journey-chapter>03 <i>践行</i></span>
        </div>
      </div>
    </section>
  )
}
