import { useEffect, useRef, useState } from 'react'
import {
  HeroBackground,
  HeroTitle,
  HeroSubtitle,
  HeroMeta,
  HeroTechLine,
  ScrollIndicator,
} from './Hero'
import {
  FormHeader,
  FormDimensions,
  TechnicalAnnotations,
} from './Form'
import './ArrivalToForm.css'

/**
 * ArrivalToForm Orchestrator (Step 3)
 *
 * Implements the first real scroll-driven motion sequence connecting:
 * ARRIVAL (Hero)
 *   ↓
 * PHASE 1: VEHICLE REVEAL (Vehicle scales & elevates, title recedes)
 *   ↓
 * PHASE 2: TRANSITION INTO FORM (Vehicle stays pinned as focal anchor,
 *          form narrative & editorial annotations appear sequentially)
 *
 * PERFORMANCE ARCHITECTURE:
 * - Passive window scroll listener throttled with requestAnimationFrame.
 * - Zero RAF loops when idle.
 * - Direct CSS custom property updates on the container element for
 *   buttery-smooth 60fps compositor transitions without React re-render thrash.
 * - Independent data-element attributes ready for GSAP in Step 4.
 */
export function ArrivalToForm() {
  const stageRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activePhase, setActivePhase] = useState<'arrival' | 'reveal' | 'form'>('arrival')

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    // Accessibility check: disable continuous scroll-linked motion if reduced motion is requested
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setScrollProgress(0.65)
      setActivePhase('form')
      return
    }

    let ticking = false

    const calculateScroll = () => {
      const rect = stage.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const totalScrollable = rect.height - windowHeight

      if (totalScrollable <= 0) return

      // Progress from 0 (top of stage at top of viewport) to 1 (bottom of stage at bottom of viewport)
      const scrolled = -rect.top
      const rawProgress = scrolled / totalScrollable
      const progress = Math.min(Math.max(rawProgress, 0), 1)

      // 1. Direct CSS Custom Property Updates (Zero React re-render, 60fps GPU compositor)
      stage.style.setProperty('--stage-progress', progress.toFixed(4))

      // Hero content fades out between 0.05 and 0.28
      const heroFade = Math.max(0, 1 - progress / 0.28)
      stage.style.setProperty('--hero-opacity', heroFade.toFixed(4))
      stage.style.setProperty('--hero-y', `${(-progress * 50).toFixed(1)}px`)

      // Vehicle scale: 1.00 at top, expands subtly to 1.06 by progress 0.35, remains dominant through Form
      const vehicleScale = 1.0 + Math.min(progress * 0.14, 0.065)
      // Vehicle vertical elevation: moves up slightly into dominant focal position
      const vehicleY = -Math.min(progress * 45, 26)
      stage.style.setProperty('--vehicle-scale', vehicleScale.toFixed(4))
      stage.style.setProperty('--vehicle-y', `${vehicleY.toFixed(1)}px`)

      // Form content enters between 0.28 and 0.55
      const formFade = Math.min(Math.max((progress - 0.26) / 0.24, 0), 1)
      const formY = Math.max(0, (1 - formFade) * 35)
      stage.style.setProperty('--form-opacity', formFade.toFixed(4))
      stage.style.setProperty('--form-y', `${formY.toFixed(1)}px`)

      // Form annotations fade between 0.38 and 0.90, receding at the very end
      const annotationsFade =
        progress < 0.36
          ? 0
          : progress > 0.92
          ? Math.max(0, 1 - (progress - 0.92) / 0.08)
          : Math.min((progress - 0.36) / 0.12, 1)
      stage.style.setProperty('--annotations-opacity', annotationsFade.toFixed(4))

      // 2. Coarse State Updates for DOM attributes / conditional rendering
      let currentPhase: 'arrival' | 'reveal' | 'form' = 'arrival'
      if (progress > 0.32) {
        currentPhase = 'form'
      } else if (progress > 0.08) {
        currentPhase = 'reveal'
      }

      setScrollProgress(progress)
      setActivePhase((prev) => (prev !== currentPhase ? currentPhase : prev))

      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(calculateScroll)
        ticking = true
      }
    }

    const onResize = () => {
      onScroll()
    }

    // Initial calculation on mount
    calculateScroll()

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <section
      ref={stageRef}
      className="arrival-form-stage motion-scroll-stage"
      data-phase={activePhase}
      aria-label="Accord Arrival and Form Exploration"
    >
      {/* Anchor point for Form navigation in header */}
      <div id="form" className="stage-form-anchor" aria-hidden="true" />

      {/* Sticky Viewport Stage (Pinned 100vh) */}
      <div className="stage-sticky-viewport motion-sticky-viewport">
        {/* Background Atmosphere */}
        <HeroBackground />

        {/* Shared Focal Vehicle Visual (Remains connected across Arrival & Form) */}
        <div
          className="stage-visual-layer"
          data-element="stage-visual"
          style={{
            transform: 'translate3d(0, var(--vehicle-y, 0px), 0) scale(var(--vehicle-scale, 1))',
          }}
        >
          <div className="stage-vehicle-frame">
            <img
              src="/images/accord-hero.jpg"
              alt="2003 Honda Accord sedan, three-quarter front view in studio lighting"
              className="stage-vehicle-img"
              loading="eager"
            />
            {/* Dynamic ambient gradient connecting lighting to active section */}
            <div className="stage-vehicle-overlay" aria-hidden="true" />
          </div>
        </div>

        {/* Hero Layer (Fades & recedes gracefully on scroll) */}
        <div
          className="stage-hero-layer container"
          data-element="hero-content"
          style={{
            opacity: 'var(--hero-opacity, 1)',
            transform: 'translate3d(0, var(--hero-y, 0px), 0)',
            pointerEvents: activePhase === 'form' ? 'none' : 'auto',
          }}
        >
          <HeroTitle />
          <HeroSubtitle />
          <HeroTechLine />
          <HeroMeta />
          <ScrollIndicator />
        </div>

        {/* Form Layer (Enters smoothly as user scrolls into Form) */}
        <div
          className="stage-form-layer container"
          data-element="form-content"
          style={{
            opacity: 'var(--form-opacity, 0)',
            transform: 'translate3d(0, var(--form-y, 35px), 0)',
            pointerEvents: activePhase === 'arrival' ? 'none' : 'auto',
          }}
        >
          <div className="stage-form-top">
            <FormHeader />
          </div>

          <div className="stage-form-bottom">
            <FormDimensions />
          </div>
        </div>

        {/* Technical Annotations Layer (Restrained editorial pins around the vehicle) */}
        <div
          className="stage-annotations-wrapper"
          style={{
            opacity: 'var(--annotations-opacity, 0)',
            pointerEvents: activePhase === 'form' ? 'auto' : 'none',
          }}
        >
          <TechnicalAnnotations progress={scrollProgress} />
        </div>

        {/* Stage Progress Indicator (Editorial Scroll Tracker) */}
        <div className="stage-progress-rail" aria-hidden="true">
          <div className="stage-progress-track">
            <div
              className="stage-progress-fill"
              style={{ height: `${(scrollProgress * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="stage-progress-code">
            {activePhase === 'arrival' && 'PHASE 01 // ARRIVAL'}
            {activePhase === 'reveal' && 'PHASE 02 // REVEAL'}
            {activePhase === 'form' && 'PHASE 03 // FORM & STANCE'}
          </span>
        </div>
      </div>
    </section>
  )
}
