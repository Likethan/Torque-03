/**
 * KINETIC TYPOGRAPHY CHOREOGRAPHY ENGINE
 * STEP 11 — TECHNICAL TYPOGRAPHY & KINETIC TEXT
 *
 * Implements the 3-tier typographic motion hierarchy:
 * 1. Character-level staggered spatial reveal (Hero title)
 * 2. Masked-word baseline emergence (Chapter display headings)
 * 3. Technical specification hierarchy (Category -> Value -> Unit)
 *
 * Pure GSAP timeline functions with zero scroll dependencies.
 */

import gsap from 'gsap'

export interface KineticTextOptions {
  paused?: boolean
  stagger?: number
  duration?: number
  ease?: string
  onComplete?: () => void
  onUpdate?: () => void
}

/**
 * Tier 1: Character-Level Spatial Reveal
 * Animates characters rising with precise editorial cadence.
 * Avoids typewriter jitter by combining spatial translation with micro-stagger.
 */
export function createCharacterRevealTimeline(
  chars: HTMLElement[],
  options: KineticTextOptions = {}
): gsap.core.Timeline {
  const {
    paused = true,
    stagger = 0.045,
    duration = 0.75,
    ease = 'power3.out',
    onComplete,
    onUpdate,
  } = options

  const tl = gsap.timeline({
    paused,
    defaults: { ease },
    onComplete,
    onUpdate,
  })

  if (chars.length === 0) return tl

  // Initial state setup
  gsap.set(chars, { opacity: 0, y: 28, rotateZ: 0.001 }) // 0.001 deg prevents subpixel font blur

  tl.to(chars, {
    opacity: 1,
    y: 0,
    duration,
    stagger,
    ease,
  })

  return tl
}

/**
 * Tier 2: Masked Word Baseline Emergence
 * Animates words or lines rising from behind an invisible editorial mask (overflow: hidden).
 */
export function createMaskedWordTimeline(
  targets: HTMLElement[],
  options: KineticTextOptions = {}
): gsap.core.Timeline {
  const {
    paused = true,
    stagger = 0.065,
    duration = 0.65,
    ease = 'power2.out',
    onComplete,
    onUpdate,
  } = options

  const tl = gsap.timeline({
    paused,
    defaults: { ease },
    onComplete,
    onUpdate,
  })

  if (targets.length === 0) return tl

  gsap.set(targets, { opacity: 0, y: '105%' })

  tl.to(targets, {
    opacity: 1,
    y: '0%',
    duration,
    stagger,
    ease,
  })

  return tl
}

/**
 * Tier 3: Technical Specification Hierarchy
 * Enforces engineering information hierarchy:
 * Category label -> Primary numerical value -> Supporting engineering unit
 */
export interface SpecCellTargets {
  container: HTMLElement | null
  valueEl?: HTMLElement | null
  unitEl?: HTMLElement | null
  labelEl?: HTMLElement | null
}

export function createSpecHierarchyTimeline(
  cells: SpecCellTargets[],
  options: KineticTextOptions = {}
): gsap.core.Timeline {
  const {
    paused = true,
    stagger = 0.09,
    duration = 0.55,
    ease = 'power2.out',
    onComplete,
    onUpdate,
  } = options

  const tl = gsap.timeline({
    paused,
    defaults: { ease },
    onComplete,
    onUpdate,
  })

  cells.forEach((cell, index) => {
    const startTime = index * stagger

    if (cell.container) {
      tl.fromTo(
        cell.container,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration, ease },
        startTime
      )
    }

    if (cell.labelEl) {
      tl.fromTo(
        cell.labelEl,
        { opacity: 0, x: -6 },
        { opacity: 1, x: 0, duration: duration * 0.8, ease },
        startTime + 0.08
      )
    }

    if (cell.valueEl) {
      tl.fromTo(
        cell.valueEl,
        { opacity: 0, y: 12, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration, ease: 'power3.out' },
        startTime + 0.12
      )
    }

    if (cell.unitEl) {
      tl.fromTo(
        cell.unitEl,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: duration * 0.8, ease },
        startTime + 0.18
      )
    }
  })

  return tl
}
