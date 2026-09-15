import gsap from 'gsap'
import { GSAP_CONFIG, prefersReducedMotion } from './gsapConfig'
import type { TimelineOptions } from './arrivalTimeline'

export interface FormTimelineTargets {
  container?: HTMLElement | null
  badge?: HTMLElement | null
  hairline?: HTMLElement | null
  title?: HTMLElement | null
  titleWords?: HTMLElement[]
  lead?: HTMLElement | null
  leadWords?: HTMLElement[]
  specs?: (HTMLElement | null)[]
}

/**
 * ----------------------------------------------------------------------------
 * SECOND CINEMATIC SCENE: FORM & ARCHITECTURE TIMELINE (Step 7)
 * ----------------------------------------------------------------------------
 * Demonstrates how GSAP timelines choreograph independent narrative scenes.
 *
 * Sequence:
 *   [Label: "formStart"]   Baseline setup via gsap.set()
 *   [Label: "badge"]       Architecture identifier enters from left
 *   [Label: "hairline"]    Architectural red hairline divider draws open
 *   [Label: "title"]       Section title enters with smooth power3 deceleration
 *   [Label: "lead"]        Editorial context paragraph appears
 *   [Label: "specs"]       Staggered reveal of dimension specification cells
 *   [Label: "settle"]      Scene reaches stable equilibrium
 */
export function createFormTimeline(
  targets: FormTimelineTargets,
  options: TimelineOptions = {}
): gsap.core.Timeline {
  const isReduced = prefersReducedMotion()

  const tl = gsap.timeline({
    paused: options.paused ?? true,
    defaults: {
      ease: GSAP_CONFIG.ease.cinematicOut,
    },
    onStart: () => options.onStart?.(),
    onUpdate: () => options.onUpdate?.(),
    onComplete: () => options.onComplete?.(),
  })

  // Reduced motion handling
  if (isReduced) {
    const all = [
      targets.container,
      targets.badge,
      targets.hairline,
      targets.title,
      targets.lead,
      ...(targets.specs || []),
    ].filter(Boolean)

    tl.set(all, { opacity: 1, clearProps: 'transform' })
    if (targets.hairline) {
      tl.set(targets.hairline, { scaleX: 1 })
    }
    return tl
  }

  // 1. Initial State Configuration (gsap.set)
  if (targets.hairline) {
    gsap.set(targets.hairline, {
      scaleX: 0,
      transformOrigin: 'left center',
      willChange: 'transform',
    })
  }

  // 2. Timeline Sequencing with Labels & Position Parameters
  tl
    // --- LABEL: "formStart" ---
    .addLabel('formStart', 0)

    // --- LABEL: "badge" ---
    // Model Tag / Eyebrow appears
    .addLabel('badge', 0.05)

  if (targets.badge) {
    tl.from(
      targets.badge,
      {
        opacity: 0,
        x: -18,
        duration: 0.6,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      'badge'
    )
  }

  // --- LABEL: "hairline" ---
  // POSITION PARAMETER: "<0.12" (starts 0.12s after badge begins)
  tl.addLabel('hairline', '<0.12')

  if (targets.hairline) {
    tl.to(
      targets.hairline,
      {
        scaleX: 1,
        duration: 0.75,
        ease: GSAP_CONFIG.ease.structuralInOut,
      },
      'hairline'
    )
  }

  // --- LABEL: "title" ---
  // Section Title rises: "Sculpted by Wind and Purpose" (Step 11 Masked Words)
  tl.addLabel('title', '<0.15')

  if (targets.titleWords && targets.titleWords.length > 0) {
    tl.fromTo(
      targets.titleWords,
      { opacity: 0, y: '105%' },
      {
        opacity: 1,
        y: '0%',
        duration: 0.75,
        stagger: 0.065,
        ease: GSAP_CONFIG.ease.cinematicOut,
      },
      'title'
    )
  } else if (targets.title) {
    tl.from(
      targets.title,
      {
        opacity: 0,
        y: 28,
        duration: 0.9,
        ease: GSAP_CONFIG.ease.cinematicOut,
      },
      'title'
    )
  }

  // --- LABEL: "lead" ---
  // Editorial Lead Paragraph
  // POSITION PARAMETER: "<0.2"
  tl.addLabel('lead', '<0.2')

  if (targets.leadWords && targets.leadWords.length > 0) {
    tl.fromTo(
      targets.leadWords,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.02,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      'lead'
    )
  } else if (targets.lead) {
    tl.from(
      targets.lead,
      {
        opacity: 0,
        y: 16,
        duration: 0.75,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      'lead'
    )
  }

  // --- LABEL: "specs" ---
  // Staggered reveal of dimension capsules (Wheelbase, Cd, Length, Steel)
  // STAGGER: 0.09s interval between each spec cell
  // POSITION PARAMETER: "-=0.25" (starts 0.25s before lead finishes)
  tl.addLabel('specs', '-=0.25')

  const validSpecs = (targets.specs || []).filter(Boolean) as HTMLElement[]
  if (validSpecs.length > 0) {
    tl.from(
      validSpecs,
      {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.09,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      'specs'
    )
  }

  // --- LABEL: "settle" ---
  tl.addLabel('settle')

  return tl
}
