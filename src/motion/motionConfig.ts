/**
 * Centralized Motion Configuration (Step 5 - Motion Mathematics)
 *
 * Defines interpolation smoothing, primary motion ranges, secondary inertia
 * factors, and narrative thresholds.
 */

export const MOTION_CONFIG = {
  // Configurable progress smoothing (Section 4)
  // Low (0.16) = fast response | Medium (0.08) = controlled weight | High (0.04) = heavier mass
  progressSmoothing: 0.08,

  // Settling cutoff to prevent infinite micro-floating
  epsilon: 0.0001,

  // Frame sequence metrics
  totalFrames: 100,
  fps: 24,

  // Narrative thresholds (Section 11)
  thresholds: {
    arrival: { start: 0.0, end: 0.2 },
    reveal: { start: 0.2, end: 0.45 },
    approach: { start: 0.45, end: 0.7 },
    form: { start: 0.7, end: 1.0 },
    transition: { start: 0.92, end: 1.0 },
  },

  // Primary Motion Ranges (Section 10)
  vehicle: {
    scaleStart: 1.0,
    scaleEnd: 1.05, // Restrained 1.00 -> 1.05 zoom
    yStart: 0,
    yEnd: -20, // Vertical camera translation in px
    shadowDarknessStart: 0.85,
    shadowDarknessEnd: 0.0,
    shadowFadeEnd: 0.45,
  },

  // Secondary Motion Parameters (Velocity-driven physical inertia) (Sections 6 & 7)
  secondaryMotion: {
    // Camera zoom inertia (subtle nudge proportional to scrub velocity)
    inertiaScaleFactor: 0.12,
    maxInertiaScale: 0.012, // Max +/- 1.2% zoom offset

    // Camera vertical inertia
    inertiaYFactor: 30,
    maxInertiaY: 3.5, // Max +/- 3.5px offset

    // Background lighting / vignette response
    bgShiftFactor: 18,
    maxBgShift: 4.0,
  },
} as const

export type MotionConfig = typeof MOTION_CONFIG
