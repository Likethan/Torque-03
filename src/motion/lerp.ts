/**
 * Motion Engine Interpolation Primitives (Step 5 - Motion Mathematics)
 *
 * Provides linear interpolation (lerp), damping, and re-exports
 * mathematical utilities (clamp, mapRange).
 */

export { clamp } from './clamp'
export { mapRange } from './mapRange'
export { calculateVelocity, formatVelocity, calculateSecondaryInertia } from './velocity'

/**
 * Standard Linear Interpolation
 * current += (target - current) * factor
 *
 * @param current Current animated value
 * @param target Target destination value
 * @param factor Smoothing factor (0.0 to 1.0)
 */
export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor
}

/**
 * Damped Interpolation with settling cutoff (epsilon)
 * Prevents continuous infinitesimal floating calculations when settled.
 */
export function damp(
  current: number,
  target: number,
  factor: number,
  epsilon: number = 0.0001
): number {
  const diff = target - current
  if (Math.abs(diff) < epsilon) {
    return target
  }
  return current + diff * factor
}
