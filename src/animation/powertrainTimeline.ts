/**
 * POWERTRAIN SCENE TIMELINE (Step 11 - Technical Typography & Kinetic Text)
 *
 * Choreographs the Chapter 04 Powertrain narrative:
 * 1. Powertrain Tag & Eyebrow emergence with CAD coordinates
 * 2. Masked-word baseline reveal of Title ("The Mechanical Heart: 3.0L V6 VTEC")
 * 3. Accent hairline rule expansion
 * 4. Word-staggered Engineering Lead reveal
 * 5. Specification Hierarchy reveal: Category -> Value -> Unit
 *
 * Implemented as a pure GSAP timeline with zero scroll dependencies.
 */

import gsap from 'gsap'
import type { SpecCellTargets } from './kineticTypography'

export interface PowertrainTimelineTargets {
  container: HTMLElement | null
  badge: HTMLElement | null
  title: HTMLElement | null
  titleWords?: HTMLElement[]
  hairline: HTMLElement | null
  lead: HTMLElement | null
  leadWords?: HTMLElement[]
  specs: (HTMLElement | null)[]
  specCells?: SpecCellTargets[]
}

export interface PowertrainTimelineOptions {
  paused?: boolean
  onComplete?: () => void
  onUpdate?: () => void
}

export function createPowertrainTimeline(
  targets: PowertrainTimelineTargets,
  options: PowertrainTimelineOptions = {}
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
  if (targets.title && !targets.titleWords) {
    gsap.set(targets.title, { opacity: 0, y: 20 })
  }
  if (targets.hairline) {
    gsap.set(targets.hairline, { scaleX: 0, transformOrigin: 'left center' })
  }
  if (targets.lead && !targets.leadWords) {
    gsap.set(targets.lead, { opacity: 0, y: 15 })
  }

  const validSpecs = targets.specs.filter(Boolean) as HTMLElement[]
  if (validSpecs.length > 0 && !targets.specCells) {
    gsap.set(validSpecs, { opacity: 0, y: 18, scale: 0.96 })
  }

  // Choreographed Sequence
  tl.addLabel('powertrainStart', 0)

  // 1. Container appears
  if (targets.container) {
    tl.to(
      targets.container,
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power2.out',
      },
      'powertrainStart'
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
      'powertrainStart+=0.15'
    )
  }

  // 3. Title reveal (Masked words if split, otherwise element fromTo)
  if (targets.titleWords && targets.titleWords.length > 0) {
    tl.fromTo(
      targets.titleWords,
      { opacity: 0, y: '105%' },
      {
        opacity: 1,
        y: '0%',
        duration: 0.65,
        stagger: 0.065,
        ease: 'power3.out',
      },
      'powertrainStart+=0.25'
    )
  } else if (targets.title) {
    tl.to(
      targets.title,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      'powertrainStart+=0.25'
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
      'powertrainStart+=0.35'
    )
  }

  // 5. Engineering Lead (Word-level kinetic reveal if available)
  if (targets.leadWords && targets.leadWords.length > 0) {
    tl.fromTo(
      targets.leadWords,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.02,
        ease: 'power2.out',
      },
      'powertrainStart+=0.4'
    )
  } else if (targets.lead) {
    tl.to(
      targets.lead,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      'powertrainStart+=0.4'
    )
  }

  // 6. Specification Hierarchy Reveal (Category -> Value -> Unit)
  if (targets.specCells && targets.specCells.length > 0) {
    targets.specCells.forEach((cell, idx) => {
      const cellStart = `powertrainStart+=${0.5 + idx * 0.08}`
      if (cell.container) {
        tl.fromTo(
          cell.container,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          cellStart
        )
      }
      if (cell.labelEl) {
        tl.fromTo(
          cell.labelEl,
          { opacity: 0, x: -6 },
          { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' },
          `${cellStart}+=0.06`
        )
      }
      if (cell.valueEl) {
        tl.fromTo(
          cell.valueEl,
          { opacity: 0, y: 12, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'power3.out' },
          `${cellStart}+=0.1`
        )
      }
      if (cell.unitEl) {
        tl.fromTo(
          cell.unitEl,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
          `${cellStart}+=0.14`
        )
      }
    })
  } else if (validSpecs.length > 0) {
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
      'powertrainStart+=0.5'
    )
  }

  tl.addLabel('powertrainComplete')

  return tl
}
