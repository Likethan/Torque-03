/**
 * ----------------------------------------------------------------------------
 * AUTOMOTIVE MOTION TOKENS & EASING SYSTEM (Step 14 — Production Direction)
 * ----------------------------------------------------------------------------
 * Single source of truth for all kinetic transitions, camera interpolation,
 * and micro-interactions across the 2003 Honda Accord experience.
 *
 * Core Aesthetic Principles:
 * - Heavy, precise, controlled, mechanical, and editorial.
 * - Zero cartoonish overshoot, zero bouncy elastic springs.
 * - Physically damped mass that respects vehicle momentum.
 */

export const MOTION_TOKENS = {
  // Easing Curves (CSS cubic-bezier strings & GSAP aliases)
  easing: {
    // Primary camera and hero transition curve — confident deceleration
    cinematic: 'cubic-bezier(0.22, 1, 0.36, 1)',
    cinematicGsap: 'power3.out',

    // Heavy mechanical mass — suspension settling & monocoque assembly
    heavy: 'cubic-bezier(0.16, 1, 0.3, 1)',
    heavyGsap: 'power4.out',

    // Soft atmospheric and lighting gradients
    soft: 'cubic-bezier(0.25, 1, 0.5, 1)',
    softGsap: 'power2.out',

    // Precise CAD reticles and blueprint lines
    technical: 'cubic-bezier(0.19, 1, 0.22, 1)',
    technicalGsap: 'expo.out',

    // Editorial typography and headline spatial mask reveals
    reveal: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
    revealGsap: 'circ.out',
  },

  // Delta-time Invariant Damping Lambdas (for dampDt in useFrame loops)
  damping: {
    // Standard camera tracking and target interpolation
    camera: 6.8,

    // Close-up detail study transition speed
    detailCamera: 7.5,

    // Chassis and suspension settling upon deceleration
    settling: 12.0,

    // Steering rack and wheel angle alignment
    steering: 9.5,

    // Magnetic cursor tracking and leader lines
    magnetic: 8.5,

    // Accelerated settling when prefers-reduced-motion is active
    reducedMotion: 24.0,
  },

  // Authored Durations (seconds)
  duration: {
    cameraWaypoint: 1.4,
    detailStudy: 1.2,
    lightSweep: 2.2,
    editorialReveal: 0.85,
    hudUpdate: 0.2,
    preloaderFade: 0.55,
  },
} as const

export type MotionTokens = typeof MOTION_TOKENS
