import { clamp } from './clamp'
import { dampDt } from './lerp'

/**
 * Velocity & Secondary Motion Mathematics (Step 4 - Shared Motion Physics)
 *
 * Tracks the frame-to-frame rate of change, smooths velocity signals using
 * delta-time aware damping, and derives subtle physical inertia (secondary motion)
 * for camera, typography, vehicle attitude, and layout elements.
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
 * Calculates rate of change per second (frame-rate independent).
 */
export function calculateDtVelocity(current: number, previous: number, dt: number): number {
  const safeDt = Math.max(dt, 0.001)
  return (current - previous) / safeDt
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

export interface VelocityTrackerOptions {
  /** Damping stiffness / decay rate (default: 8.5 1/s) */
  lambda?: number
  /** Maximum allowable absolute velocity */
  maxVelocity?: number
  /** Minimum velocity threshold below which direction is 0 (default: 0.005) */
  threshold?: number
  /** Epsilon threshold for settling snap to 0 (default: 0.0002) */
  epsilon?: number
}

/**
 * Zero-allocation 1D Velocity Tracker with delta-time aware smoothing
 * and hysteresis-controlled direction.
 */
export class VelocityTracker1D {
  private previousValue = 0
  private rawVelocity = 0
  private smoothedVelocity = 0
  private direction: -1 | 0 | 1 = 0
  private isSettled = true
  private hasPrevious = false

  private readonly lambda: number
  private readonly maxVelocity: number
  private readonly threshold: number
  private readonly epsilon: number

  constructor(options: VelocityTrackerOptions = {}) {
    this.lambda = options.lambda ?? 8.5
    this.maxVelocity = options.maxVelocity ?? 1200
    this.threshold = options.threshold ?? 0.005
    this.epsilon = options.epsilon ?? 0.0002
  }

  /**
   * Updates tracker with a new scalar position sample.
   */
  public updateValue(currentValue: number, dt: number): number {
    if (!this.hasPrevious) {
      this.previousValue = currentValue
      this.hasPrevious = true
      return 0
    }

    const safeDt = Math.max(dt, 0.001)
    const rawVel = (currentValue - this.previousValue) / safeDt
    this.previousValue = currentValue
    return this.updateRaw(rawVel, dt)
  }

  /**
   * Updates tracker directly with an externally measured raw velocity sample (e.g. from Lenis or ScrollTrigger).
   */
  public updateRaw(rawVel: number, dt: number): number {
    this.rawVelocity = clamp(rawVel, -this.maxVelocity, this.maxVelocity)
    this.smoothedVelocity = dampDt(
      this.smoothedVelocity,
      this.rawVelocity,
      this.lambda,
      dt,
      this.epsilon
    )

    if (Math.abs(this.smoothedVelocity) < this.epsilon) {
      this.smoothedVelocity = 0
      this.direction = 0
      this.isSettled = true
    } else {
      this.isSettled = false
      if (this.smoothedVelocity > this.threshold) {
        this.direction = 1
      } else if (this.smoothedVelocity < -this.threshold) {
        this.direction = -1
      } else {
        this.direction = 0
      }
    }

    return this.smoothedVelocity
  }

  /**
   * Smoothly decays velocity towards zero when active input has stopped.
   */
  public decay(dt: number): number {
    return this.updateRaw(0, dt)
  }

  public getRaw(): number {
    return this.rawVelocity
  }

  public getSmoothed(): number {
    return this.smoothedVelocity
  }

  public getNormalized(maxBound?: number): number {
    const bound = maxBound ?? this.maxVelocity
    return clamp(this.smoothedVelocity / bound, -1, 1)
  }

  public getDirection(): -1 | 0 | 1 {
    return this.direction
  }

  public settled(): boolean {
    return this.isSettled
  }

  public reset(value: number = 0): void {
    this.previousValue = value
    this.rawVelocity = 0
    this.smoothedVelocity = 0
    this.direction = 0
    this.isSettled = true
    this.hasPrevious = false
  }
}

/**
 * Zero-allocation 2D Velocity Tracker for pointer and camera physics.
 */
export class VelocityTracker2D {
  private prevX = 0
  private prevY = 0
  private rawVx = 0
  private rawVy = 0
  private smoothedVx = 0
  private smoothedVy = 0
  private speed = 0
  private isSettled = true
  private hasPrevious = false

  private readonly lambda: number
  private readonly maxSpeed: number
  private readonly epsilon: number

  constructor(options: { lambda?: number; maxSpeed?: number; epsilon?: number } = {}) {
    this.lambda = options.lambda ?? 9.0
    this.maxSpeed = options.maxSpeed ?? 3000
    this.epsilon = options.epsilon ?? 0.001
  }

  public update(x: number, y: number, dt: number): void {
    if (!this.hasPrevious) {
      this.prevX = x
      this.prevY = y
      this.hasPrevious = true
      return
    }

    const safeDt = Math.max(dt, 0.001)
    const rawX = (x - this.prevX) / safeDt
    const rawY = (y - this.prevY) / safeDt
    this.prevX = x
    this.prevY = y

    this.rawVx = clamp(rawX, -this.maxSpeed, this.maxSpeed)
    this.rawVy = clamp(rawY, -this.maxSpeed, this.maxSpeed)

    this.smoothedVx = dampDt(this.smoothedVx, this.rawVx, this.lambda, dt, this.epsilon)
    this.smoothedVy = dampDt(this.smoothedVy, this.rawVy, this.lambda, dt, this.epsilon)

    this.speed = Math.hypot(this.smoothedVx, this.smoothedVy)

    if (this.speed < this.epsilon) {
      this.smoothedVx = 0
      this.smoothedVy = 0
      this.speed = 0
      this.isSettled = true
    } else {
      this.isSettled = false
    }
  }

  public decay(dt: number): void {
    this.smoothedVx = dampDt(this.smoothedVx, 0, this.lambda, dt, this.epsilon)
    this.smoothedVy = dampDt(this.smoothedVy, 0, this.lambda, dt, this.epsilon)
    this.speed = Math.hypot(this.smoothedVx, this.smoothedVy)
    if (this.speed < this.epsilon) {
      this.smoothedVx = 0
      this.smoothedVy = 0
      this.speed = 0
      this.isSettled = true
    }
  }

  public getVx(): number {
    return this.smoothedVx
  }

  public getVy(): number {
    return this.smoothedVy
  }

  public getSpeed(): number {
    return this.speed
  }

  public settled(): boolean {
    return this.isSettled
  }

  public reset(x: number = 0, y: number = 0): void {
    this.prevX = x
    this.prevY = y
    this.rawVx = 0
    this.rawVy = 0
    this.smoothedVx = 0
    this.smoothedVy = 0
    this.speed = 0
    this.isSettled = true
    this.hasPrevious = false
  }
}

