import { clamp } from './clamp'
import { lerp } from './lerp'

export interface ScrollVelocityState {
  rawVelocity: number
  smoothedVelocity: number
  normalizedVelocity: number
  direction: 1 | -1 | 0
  isFastScroll: boolean
}

/**
 * ScrollVelocityTracker
 *
 * Tracks, smooths, and clamps scroll velocity values across animation frames.
 * Uses zero allocations during animation loops.
 */
export class ScrollVelocityTracker {
  private rawVelocity = 0
  private smoothedVelocity = 0
  private smoothingFactor: number
  private maxVelocity: number

  constructor(smoothingFactor = 0.12, maxVelocity = 1200) {
    this.smoothingFactor = smoothingFactor
    this.maxVelocity = maxVelocity
  }

  /**
   * Updates velocity with a new raw sample (e.g. from ScrollTrigger.getVelocity() or Lenis)
   */
  public update(rawVelocity: number): void {
    this.rawVelocity = clamp(rawVelocity, -this.maxVelocity, this.maxVelocity)
    this.smoothedVelocity = lerp(
      this.smoothedVelocity,
      this.rawVelocity,
      this.smoothingFactor
    )

    // Snap to zero when very small to allow scenes to settle naturally
    if (Math.abs(this.smoothedVelocity) < 0.005) {
      this.smoothedVelocity = 0
    }
  }

  /**
   * Returns current smoothed velocity in normalized range [-1.0, 1.0]
   */
  public getNormalizedVelocity(): number {
    return clamp(this.smoothedVelocity / this.maxVelocity, -1, 1)
  }

  /**
   * Returns raw velocity
   */
  public getRawVelocity(): number {
    return this.rawVelocity
  }

  /**
   * Returns smoothed velocity in px/s
   */
  public getSmoothedVelocity(): number {
    return this.smoothedVelocity
  }

  /**
   * Returns scroll direction (1 for down, -1 for up, 0 for idle)
   */
  public getDirection(): 1 | -1 | 0 {
    if (this.smoothedVelocity > 0.05) return 1
    if (this.smoothedVelocity < -0.05) return -1
    return 0
  }

  /**
   * Returns kinetic stretch scale factor for typography:
   * Subtle vertical stretch proportional to velocity, clamped between 1.0 and 1.045
   */
  public getTypographyStretch(): number {
    const norm = Math.abs(this.getNormalizedVelocity())
    return 1 + clamp(norm * 0.045, 0, 0.045)
  }

  /**
   * Returns subtle kinetic skew angle for typography (in degrees)
   * Clamped between -2.5deg and 2.5deg
   */
  public getTypographySkew(): number {
    const norm = this.getNormalizedVelocity()
    return clamp(norm * -2.5, -2.5, 2.5)
  }

  /**
   * Returns atmospheric reactivity multiplier (0.0 to 0.3)
   */
  public getAtmosphericBoost(): number {
    const norm = Math.abs(this.getNormalizedVelocity())
    return clamp(norm * 0.28, 0, 0.28)
  }

  /**
   * Resets tracker state
   */
  public reset(): void {
    this.rawVelocity = 0
    this.smoothedVelocity = 0
  }
}
