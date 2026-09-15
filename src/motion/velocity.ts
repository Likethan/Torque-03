import { clamp } from './clamp'

/**
 * Velocity & Secondary Motion Mathematics (Step 5)
 *
 * Tracks the frame-to-frame rate of progress change and derives
 * subtle physical inertia (secondary motion) for camera and layout elements.
 */

/**
 * Calculates instantaneous velocity between consecutive animation frames.
 * Positive = scrolling forward (downwards)
 * Negative = scrolling backward (upwards)
 */
export function calculateVelocity(currentProgress: number, previousProgress: number): number {
  return currentProgress - previousProgress
}

/**
 * Formats signed velocity for technical debug telemetry display.
 * Examples: "▼ +0.015", "▲ -0.012", "●  0.000"
 */
export function formatVelocity(velocity: number): string {
  const abs = Math.abs(velocity)
  if (abs < 0.0001) {
    return '●  0.0000'
  }
  const sign = velocity > 0 ? '+' : '-'
  const arrow = velocity > 0 ? '▼' : '▲'
  return `${arrow} ${sign}${abs.toFixed(4)}`
}

/**
 * Derives a clamped secondary inertial offset from velocity.
 * Used to apply subtle physical lag/nudge to camera framing without oscillation.
 *
 * @param velocity Instantaneous frame velocity
 * @param factor Multiplier scaling velocity to offset
 * @param maxLimit Maximum allowable deviation
 */
export function calculateSecondaryInertia(
  velocity: number,
  factor: number,
  maxLimit: number
): number {
  return clamp(velocity * factor, -maxLimit, maxLimit)
}
