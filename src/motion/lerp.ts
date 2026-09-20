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

/**
 * Delta-Time-Aware Exponential Damping (Frame-Rate Independent)
 *
 * Guarantees identical smoothing characteristics across 60Hz, 120Hz, and 144Hz displays.
 * Formula: factor = 1 - exp(-lambda * dt)
 *
 * @param current Current value
 * @param target Target destination value
 * @param lambda Damping stiffness / decay rate (1/second). Typical values: 4 (slow/heavy) to 18 (snappy)
 * @param dt Delta time since last frame in seconds
 * @param epsilon Settling threshold to prevent infinite micro-floating
 */
export function dampDt(
  current: number,
  target: number,
  lambda: number,
  dt: number,
  epsilon: number = 0.0001
): number {
  const diff = target - current
  if (Math.abs(diff) < epsilon) {
    return target
  }
  const safeDt = Math.min(Math.max(dt, 0), 0.1)
  const factor = 1.0 - Math.exp(-lambda * safeDt)
  return current + diff * factor
}

/**
 * Critically Damped Spring Smoothing (Spring-Damper Physics)
 * Gradually changes a value towards a desired goal over time without oscillation.
 * Models physical mass and momentum for cameras and mechanical assemblies.
 *
 * @param current Current position
 * @param target Desired target position
 * @param velocityRef Mutable object `{ value: number }` holding velocity (updated in-place)
 * @param smoothTime Approximate time it takes to reach the target (in seconds, e.g. 0.2s - 0.4s)
 * @param dt Delta time since last frame (in seconds)
 * @param maxSpeed Maximum allowed velocity magnitude
 */
export function smoothDamp(
  current: number,
  target: number,
  velocityRef: { value: number },
  smoothTime: number,
  dt: number,
  maxSpeed: number = Infinity
): number {
  smoothTime = Math.max(0.0001, smoothTime)
  const omega = 2 / smoothTime

  const safeDt = Math.min(Math.max(dt, 0.0001), 0.1)
  const x = omega * safeDt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  let change = current - target
  const originalTo = target

  // Clamp maximum speed
  const maxChange = maxSpeed * smoothTime
  change = Math.min(Math.max(change, -maxChange), maxChange)
  const targetAdjusted = current - change

  const temp = (velocityRef.value + omega * change) * safeDt
  velocityRef.value = (velocityRef.value - omega * temp) * exp
  let output = targetAdjusted + (change + temp) * exp

  // Prevent overshoot past target
  if ((originalTo - current > 0.0) === (output > originalTo)) {
    output = originalTo
    velocityRef.value = (output - originalTo) / safeDt
  }

  return output
}

