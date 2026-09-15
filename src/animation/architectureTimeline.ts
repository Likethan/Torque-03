import gsap from 'gsap'
import { GSAP_CONFIG, prefersReducedMotion } from './gsapConfig'
import type { TimelineOptions } from './arrivalTimeline'

export interface ArchitectureTimelineTargets {
  container?: HTMLElement | null
  label?: HTMLElement | null
  title?: HTMLElement | null
  divider?: HTMLElement | null
  paragraphs?: (HTMLElement | null)[]
  detailItems?: (HTMLElement | null)[]
  media?: HTMLElement | null
}

/**
 * ----------------------------------------------------------------------------
 * ARCHITECTURE / ENGINEERING SCENE TIMELINE (Step 9)
 * ----------------------------------------------------------------------------
 * Modular, scroll-controlled timeline for the Powertrain & Architecture section.
 * Designed to be controlled by ScrollTrigger with scrub: 1.
 *
 * Sequence:
 *   [Label: "archStart"]   Baseline setup
 *   [Label: "header"]      Powertrain category tag fades in
 *   [Label: "title"]       Section title translates translateY(40px -> 0px) & opacity 0 -> 1
 *   [Label: "divider"]     Red divider draws across
 *   [Label: "editorial"]   Technical body copy fades in
 *   [Label: "specs"]       Staggered reveal of engine specification key-value cards
 *   [Label: "media"]       Engine bay photography translates & scales into focus
 */
export function createArchitectureTimeline(
  targets: ArchitectureTimelineTargets,
  options: TimelineOptions = {}
): gsap.core.Timeline {
  const isReduced = prefersReducedMotion()

  const tl = gsap.timeline({
    paused: options.paused ?? true, // Created paused; ScrollTrigger scrubs it
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
      targets.label,
      targets.title,
      targets.divider,
      ...(targets.paragraphs || []),
      ...(targets.detailItems || []),
      targets.media,
    ].filter(Boolean)

    tl.set(all, { opacity: 1, clearProps: 'transform' })
    if (targets.divider) {
      tl.set(targets.divider, { scaleX: 1 })
    }
    return tl
  }

  // 1. Initial State Setup
  if (targets.divider) {
    gsap.set(targets.divider, {
      scaleX: 0,
      transformOrigin: 'left center',
      willChange: 'transform',
    })
  }

  // 2. Timeline Sequence with Labels & Position Parameters
  tl
    // --- LABEL: "archStart" ---
    .addLabel('archStart', 0)

    // --- LABEL: "header" ---
    .addLabel('header', 0.05)

  if (targets.label) {
    tl.from(
      targets.label,
      {
        opacity: 0,
        x: -16,
        duration: 0.6,
        ease: GSAP_CONFIG.ease.technicalOut,
      },
      'header'
    )
  }

  // --- LABEL: "title" ---
  // Demonstrates the Step 9 fundamental: translateY(40px) -> 0 with opacity 0 -> 1
  tl.addLabel('title', '<0.12')

  if (targets.title) {
    tl.from(
      targets.title,
      {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power2.out',
      },
      'title'
    )
  }

  // --- LABEL: "divider" ---
  tl.addLabel('divider', '<0.15')

  if (targets.divider) {
    tl.to(
      targets.divider,
      {
        scaleX: 1,
        duration: 0.6,
        ease: 'power2.inOut',
      },
      'divider'
    )
  }

  // --- LABEL: "editorial" ---
  tl.addLabel('editorial', '<0.1')

  const validParagraphs = (targets.paragraphs || []).filter(Boolean)
  if (validParagraphs.length > 0) {
    tl.from(
      validParagraphs,
      {
        opacity: 0,
        y: 24,
        duration: 0.7,
        stagger: 0.15,
        ease: 'power2.out',
      },
      'editorial'
    )
  }

  // --- LABEL: "specs" ---
  tl.addLabel('specs', '<0.2')

  const validDetails = (targets.detailItems || []).filter(Boolean)
  if (validDetails.length > 0) {
    tl.from(
      validDetails,
      {
        opacity: 0,
        y: 20,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
      },
      'specs'
    )
  }

  // --- LABEL: "media" ---
  tl.addLabel('media', 'specs-=0.2')

  if (targets.media) {
    tl.from(
      targets.media,
      {
        opacity: 0,
        scale: 0.95,
        y: 30,
        duration: 0.9,
        ease: GSAP_CONFIG.ease.cinematicOut,
      },
      'media'
    )
  }

  return tl
}
