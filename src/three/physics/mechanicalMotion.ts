/**
 * ----------------------------------------------------------------------------
 * MECHANICAL MOTION ENGINE (Step 16 — Mechanical Physics)
 * ----------------------------------------------------------------------------
 * Frame-rate independent mathematical motion primitives for damping,
 * angular conversions, kinematics interpolation, and velocity smoothing.
 */

const TWO_PI = Math.PI * 2
const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

/**
 * Converts degrees to radians.
 */
export function degToRad(degrees: number): number {
  return degrees * DEG_TO_RAD
}

/**
 * Converts radians to degrees.
 */
export function radToDeg(radians: number): number {
  return radians * RAD_TO_DEG
}

/**
 * Normalizes an angle in radians into the [0, 2π) interval.
 */
export function normalizeAngle(radians: number): number {
  let a = radians % TWO_PI
  if (a < 0) a += TWO_PI
  return a
}

/**
 * Normalizes an angle into [-π, π] interval.
 */
export function normalizeAngleSigned(radians: number): number {
  let a = radians % TWO_PI
  if (a > Math.PI) a -= TWO_PI
  if (a < -Math.PI) a += TWO_PI
  return a
}

/**
 * Standard linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1)
}

/**
 * Frame-rate independent exponential damping.
 * Smoothly approaches `target` from `current` over `delta` seconds.
 * 
 * Formula: current + (target - current) * (1 - e^(-lambda * delta))
 *
 * @param current Current scalar value
 * @param target Target scalar value
 * @param lambda Damping stiffness factor (higher = faster approach)
 * @param delta Elapsed time in seconds
 */
export function damp(current: number, target: number, lambda: number, delta: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * Math.max(delta, 0.0001)))
}

/**
 * Frame-rate independent angular damping handling circular wrap-around.
 */
export function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  let diff = normalizeAngleSigned(target - current)
  return current + diff * (1 - Math.exp(-lambda * Math.max(delta, 0.0001)))
}

/**
 * Velocity estimator with Exponential Moving Average (EMA) smoothing.
 */
export class VelocityTracker {
  private lastValue: number
  private velocity: number
  private smoothing: number

  constructor(initialValue = 0, smoothing = 0.25) {
    this.lastValue = initialValue
    this.velocity = 0
    this.smoothing = smoothing
  }

  public update(currentValue: number, delta: number): number {
    if (delta <= 0.00001) return this.velocity
    const instantaneousVel = (currentValue - this.lastValue) / delta
    this.velocity = this.velocity + (instantaneousVel - this.velocity) * this.smoothing
    this.lastValue = currentValue
    return this.velocity
  }

  public getVelocity(): number {
    return this.velocity
  }

  public reset(value = 0): void {
    this.lastValue = value
    this.velocity = 0
  }
}
