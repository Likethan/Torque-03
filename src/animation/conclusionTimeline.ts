/**
 * CONCLUSION & SYNTHESIS TIMELINE (Step 10 - Advanced Scroll Storytelling)
 *
 * Choreographs the Chapter 05 Conclusion & Narrative Handoff:
 * 1. Synthesis Badge emergence
 * 2. Synthesis Title & Narrative Lead
 * 3. Accent hairline rule
 * 4. Staggered engineering synthesis cards
 * 5. Downstream handoff cue into specifications archive
 *
 * Pure GSAP timeline function with zero scroll dependencies.
 */

import gsap from 'gsap'

export interface ConclusionTimelineTargets {
  container: HTMLElement | null
  badge: HTMLElement | null
  title: HTMLElement | null
  hairline: HTMLElement | null
  lead: HTMLElement | null
  specs: (HTMLElement | null)[]
  ctaCue: HTMLElement | null
}

export interface ConclusionTimelineOptions {
  paused?: boolean
  onComplete?: () => void
  onUpdate?: () => void
}

export function createConclusionTimeline(
  targets: ConclusionTimelineTargets,
  options: ConclusionTimelineOptions = {}
): gsap.core.Timeline {
  const { paused = true, onComplete, onUpdate } = options

  const tl = gsap.timeline({
    paused,
    defaults: { ease: 'power2.out' },
    onComplete,
    onUpdate,
  })

  // Initial state setup
  if (targets.container) {
    gsap.set(targets.container, { opacity: 0, y: 30, pointerEvents: 'none' })
  }
  if (targets.badge) {
    gsap.set(targets.badge, { opacity: 0, x: -15 })
  }
  if (targets.title) {
    gsap.set(targets.title, { opacity: 0, y: 20 })
  }
  if (targets.hairline) {
    gsap.set(targets.hairline, { scaleX: 0, transformOrigin: 'left center' })
  }
  if (targets.lead) {
    gsap.set(targets.lead, { opacity: 0, y: 15 })
  }
  if (targets.ctaCue) {
    gsap.set(targets.ctaCue, { opacity: 0, y: 12 })
  }

  const validSpecs = targets.specs.filter(Boolean) as HTMLElement[]
  if (validSpecs.length > 0) {
    gsap.set(validSpecs, { opacity: 0, y: 18, scale: 0.96 })
  }

  tl.addLabel('conclusionStart', 0)

  // 1. Container emerges
  if (targets.container) {
    tl.to(
      targets.container,
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
      },
      'conclusionStart'
    )
  }

  // 2. Badge & Eyebrow
  if (targets.badge) {
    tl.to(
      targets.badge,
      {
        opacity: 1,
        x: 0,
        duration: 0.5,
      },
      'conclusionStart+=0.15'
    )
  }

  // 3. Title reveal
  if (targets.title) {
    tl.to(
      targets.title,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      'conclusionStart+=0.25'
    )
  }

  // 4. Hairline draw
  if (targets.hairline) {
    tl.to(
      targets.hairline,
      {
        scaleX: 1,
        duration: 0.5,
        ease: 'power1.inOut',
      },
      'conclusionStart+=0.35'
    )
  }

  // 5. Narrative Lead
  if (targets.lead) {
    tl.to(
      targets.lead,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      'conclusionStart+=0.4'
    )
  }

  // 6. Staggered synthesis specs
  if (validSpecs.length > 0) {
    tl.to(
      validSpecs,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power2.out',
      },
      'conclusionStart+=0.5'
    )
  }

  // 7. Downstream handoff cue
  if (targets.ctaCue) {
    tl.to(
      targets.ctaCue,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      },
      'conclusionStart+=0.65'
    )
  }

  tl.addLabel('conclusionComplete')

  return tl
}
