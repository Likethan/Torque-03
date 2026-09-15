/**
 * CHASSIS & ARCHITECTURE SCENE TIMELINE (Step 10 - Advanced Scroll Storytelling)
 *
 * Choreographs the Chapter 03 Monocoque Architecture narrative:
 * 1. Structural Badge & CAD identifier emergence
 * 2. Unibody Title & Architectural Lead reveal
 * 3. Accent hairline rule expansion
 * 4. Staggered structural specs (+27% Torsional Rigidity, 48% High-Tensile Steel, Double-Wishbone, 5★ Safety)
 *
 * Pure GSAP timeline function with zero scroll dependencies.
 */

import gsap from 'gsap'

export interface ChassisTimelineTargets {
  container: HTMLElement | null
  badge: HTMLElement | null
  title: HTMLElement | null
  hairline: HTMLElement | null
  lead: HTMLElement | null
  specs: (HTMLElement | null)[]
}

export interface ChassisTimelineOptions {
  paused?: boolean
  onComplete?: () => void
  onUpdate?: () => void
}

export function createChassisTimeline(
  targets: ChassisTimelineTargets,
  options: ChassisTimelineOptions = {}
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

  const validSpecs = targets.specs.filter(Boolean) as HTMLElement[]
  if (validSpecs.length > 0) {
    gsap.set(validSpecs, { opacity: 0, y: 18, scale: 0.96 })
  }

  tl.addLabel('chassisStart', 0)

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
      'chassisStart'
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
      'chassisStart+=0.15'
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
      'chassisStart+=0.25'
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
      'chassisStart+=0.35'
    )
  }

  // 5. Architectural Lead
  if (targets.lead) {
    tl.to(
      targets.lead,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
      },
      'chassisStart+=0.4'
    )
  }

  // 6. Staggered structural specs
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
      'chassisStart+=0.5'
    )
  }

  tl.addLabel('chassisComplete')

  return tl
}
