/**
 * GSAP Animation Configuration (Step 6 - GSAP Fundamentals)
 *
 * Defines centralized timing tokens, cinematic easing curves, stagger intervals,
 * and accessibility helpers for controlled UI animations.
 */

export const GSAP_CONFIG = {
  // Timing Durations (in seconds)
  durations: {
    stageAwaken: 1.4,
    titleReveal: 1.1,
    metadataReveal: 0.8,
    hudEntrance: 0.65,
    hairlineDraw: 0.85,
    supportingSettle: 0.7,
    interactiveHover: 0.28,
  },

  // Engineered Cinematic Easing Curves
  // Restrained, precise curves representing automotive mass and mechanical confidence
  ease: {
    // Primary entrance deceleration: smooth, confident landing without overshoot
    cinematicOut: 'power3.out',
    // Secondary information reveal: clean, linear-damped decay
    technicalOut: 'power2.out',
    // Structural divider line wipe: balanced symmetric acceleration and deceleration
    structuralInOut: 'power3.inOut',
    // Interactive hover micro-motion
    microOut: 'power2.out',
  },

  // Stagger Delays (in seconds)
  stagger: {
    hudTelemetry: 0.12,
    specsGrid: 0.08,
    footerActions: 0.1,
  },
} as const

/**
 * Checks whether the user has requested reduced motion in their OS / browser.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
