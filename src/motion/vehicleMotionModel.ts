/**
 * VEHICLE INSPECTION MOTION MODEL
 * STEP 3 — INTERACTIVE 3D VEHICLE EXPERIENCE
 *
 * Implements a weighted 1.5-ton automotive physical motion model for pointer-driven
 * vehicle inspection. Uses spring-damper interpolation to eliminate snapping,
 * providing authentic automotive presence, subtle idle breathing, and dynamic
 * studio lighting responses.
 *
 * Designed to operate with zero object allocations inside GSAP's animation loop.
 */

import { dampDt } from './lerp'
import { clamp } from './clamp'
import { prefersReducedMotion } from '../animation/gsapConfig'

export interface VehiclePose {
  /** Rotation around X-axis (pitch) in degrees [subtle vertical tilt: -2.0 to +2.0] */
  pitch: number
  /** Rotation around Y-axis (yaw) in degrees [subtle horizontal tilt: -3.5 to +3.5] */
  yaw: number
  /** Rotation around Z-axis (roll) in degrees [-0.6 to +0.6] */
  roll: number
  /** Horizontal parallax translation in pixels [-18 to +18] */
  transX: number
  /** Vertical parallax translation in pixels [-12 to +12] */
  transY: number
  /** Light sweep angle in degrees [-18 to -2] */
  lightAngle: number
  /** Specular highlight X offset in percentage */
  specularShiftX: number
  /** Specular highlight Y offset in percentage */
  specularShiftY: number
  /** Dynamic metallic paint reflection factor [1.0 to 1.3] */
  reflectionFactor: number
  /** Normalized interaction activity [0.0 = resting/idle, 1.0 = active inspection] */
  activity: number
}

export class VehicleInspectionEngine {
  // Target values derived from normalized pointer [-1.0 to +1.0]
  private targetPitch = 0
  private targetYaw = 0
  private targetRoll = 0
  private targetTransX = 0
  private targetTransY = 0

  // Current smoothed state values (with heavy automotive damping)
  private currentPitch = 0
  private currentYaw = 0
  private currentRoll = 0
  private currentTransX = 0
  private currentTransY = 0

  // Lighting response state
  private currentSpecularX = 0
  private currentSpecularY = 0
  private currentLightAngle = -10
  private currentReflection = 1.0

  // Idle harmonic breathing state
  private idleTime = 0
  private activityLevel = 0

  // Physics tuning parameters (Automotive mass & inertia; decay stiffness 1/second)
  private readonly DAMPING_LAMBDA = 4.8 // Heavy 1.5-ton unibody inertia (dt-invariant)
  private readonly LIGHT_LAMBDA = 6.5
  private readonly MAX_PITCH = 2.0 // Degrees
  private readonly MAX_YAW = 3.5 // Degrees
  private readonly MAX_ROLL = 0.5 // Degrees
  private readonly MAX_TRANS_X = 18 // Pixels
  private readonly MAX_TRANS_Y = 12 // Pixels

  // Pre-allocated return snapshot (Zero allocations during update loops)
  private readonly outputPose: VehiclePose = {
    pitch: 0,
    yaw: 0,
    roll: 0,
    transX: 0,
    transY: 0,
    lightAngle: -10,
    specularShiftX: 0,
    specularShiftY: 0,
    reflectionFactor: 1.0,
    activity: 0,
  }

  /**
   * Updates the target state from pointer coordinates, velocity, and viewport size.
   * @param normalizedX Clamped [-1, 1] relative to viewport center
   * @param normalizedY Clamped [-1, 1] relative to viewport center
   * @param isPointerInside Whether pointer is currently within the active window
   * @param pointerSpeed Current pointer speed in px/ms
   * @param isTouch Whether user is on a touch device
   * @param isTablet Whether user is on a tablet device
   */
  public updateTargets(
    normalizedX: number,
    normalizedY: number,
    isPointerInside: boolean,
    pointerSpeed: number = 0,
    isTouch: boolean = false,
    isTablet: boolean = false,
    dt: number = 0.016
  ): void {
    if (prefersReducedMotion() || isTouch) {
      this.targetPitch = 0
      this.targetYaw = 0
      this.targetRoll = 0
      this.targetTransX = 0
      this.targetTransY = 0
      this.activityLevel = 0
      return
    }

    if (!isPointerInside) {
      // Return gracefully to neutral when pointer exits viewport
      this.targetPitch = 0
      this.targetYaw = 0
      this.targetRoll = 0
      this.targetTransX = 0
      this.targetTransY = 0
      this.activityLevel = dampDt(this.activityLevel, 0, 3.5, dt)
      return
    }

    this.activityLevel = dampDt(this.activityLevel, 1, 5.0, dt)

    // Scale down interaction range by 40% on tablet to preserve layout
    const deviceScale = isTablet ? 0.6 : 1.0

    // Velocity compliance factor (subtle momentum compliance on fast mouse sweeps)
    const velBoost = 1 + clamp(pointerSpeed * 0.04, 0, 0.28)

    // Pointer X controls horizontal yaw & horizontal parallax
    this.targetYaw = clamp(
      normalizedX * this.MAX_YAW * deviceScale * velBoost,
      -this.MAX_YAW * 1.2,
      this.MAX_YAW * 1.2
    )
    this.targetTransX = clamp(
      normalizedX * this.MAX_TRANS_X * deviceScale,
      -this.MAX_TRANS_X,
      this.MAX_TRANS_X
    )

    // Pointer Y controls subtle vertical pitch, roll, and vertical parallax
    this.targetPitch = clamp(
      -normalizedY * this.MAX_PITCH * deviceScale * velBoost,
      -this.MAX_PITCH * 1.2,
      this.MAX_PITCH * 1.2
    )
    this.targetRoll = clamp(
      -normalizedX * normalizedY * this.MAX_ROLL * deviceScale,
      -this.MAX_ROLL,
      this.MAX_ROLL
    )
    this.targetTransY = clamp(
      normalizedY * this.MAX_TRANS_Y * deviceScale,
      -this.MAX_TRANS_Y,
      this.MAX_TRANS_Y
    )
  }

  /**
   * Steps the physics simulation forward by deltaTime seconds.
   * Interpolates current values toward targets with frame-rate independent spring-damper easing.
   */
  public step(deltaTimeSec: number = 0.016): Readonly<VehiclePose> {
    if (prefersReducedMotion()) {
      this.currentPitch = 0
      this.currentYaw = 0
      this.currentRoll = 0
      this.currentTransX = 0
      this.currentTransY = 0
      this.outputPose.pitch = 0
      this.outputPose.yaw = 0
      this.outputPose.roll = 0
      this.outputPose.transX = 0
      this.outputPose.transY = 0
      this.outputPose.lightAngle = -10
      this.outputPose.specularShiftX = 0
      this.outputPose.specularShiftY = 0
      this.outputPose.reflectionFactor = 1.0
      this.outputPose.activity = 0
      return this.outputPose
    }

    const dt = Math.min(Math.max(deltaTimeSec, 0.001), 0.1)
    this.idleTime += dt

    // Interpolate rotational and translational physics with delta-time aware damping
    this.currentPitch = dampDt(this.currentPitch, this.targetPitch, this.DAMPING_LAMBDA, dt)
    this.currentYaw = dampDt(this.currentYaw, this.targetYaw, this.DAMPING_LAMBDA, dt)
    this.currentRoll = dampDt(this.currentRoll, this.targetRoll, this.DAMPING_LAMBDA, dt)
    this.currentTransX = dampDt(this.currentTransX, this.targetTransX, this.DAMPING_LAMBDA, dt)
    this.currentTransY = dampDt(this.currentTransY, this.targetTransY, this.DAMPING_LAMBDA, dt)

    // Subtle idle breathing motion (operates only when pointer is resting or outside)
    const idleWeight = (1 - this.activityLevel) * 0.85
    const idlePitch = Math.cos(this.idleTime * 0.85) * 0.28 * idleWeight
    const idleYaw = Math.sin(this.idleTime * 0.65) * 0.45 * idleWeight
    const idleTransX = Math.sin(this.idleTime * 0.55) * 1.8 * idleWeight
    const idleTransY = Math.cos(this.idleTime * 0.75) * 1.2 * idleWeight

    // Dynamic Studio Lighting Response
    const targetSpecularX = (this.currentYaw / this.MAX_YAW) * 22
    const targetSpecularY = (this.currentPitch / this.MAX_PITCH) * 14
    const targetLightAngle = -10 + (this.currentYaw / this.MAX_YAW) * 8.5
    const targetReflection = 1.0 + Math.abs(this.currentYaw / this.MAX_YAW) * 0.18

    this.currentSpecularX = dampDt(this.currentSpecularX, targetSpecularX, this.LIGHT_LAMBDA, dt)
    this.currentSpecularY = dampDt(this.currentSpecularY, targetSpecularY, this.LIGHT_LAMBDA, dt)
    this.currentLightAngle = dampDt(this.currentLightAngle, targetLightAngle, this.LIGHT_LAMBDA, dt)
    this.currentReflection = dampDt(this.currentReflection, targetReflection, this.LIGHT_LAMBDA, dt)

    // Pack into pre-allocated output structure
    this.outputPose.pitch = this.currentPitch + idlePitch
    this.outputPose.yaw = this.currentYaw + idleYaw
    this.outputPose.roll = this.currentRoll
    this.outputPose.transX = this.currentTransX + idleTransX
    this.outputPose.transY = this.currentTransY + idleTransY
    this.outputPose.lightAngle = this.currentLightAngle
    this.outputPose.specularShiftX = this.currentSpecularX
    this.outputPose.specularShiftY = this.currentSpecularY
    this.outputPose.reflectionFactor = this.currentReflection
    this.outputPose.activity = this.activityLevel

    return this.outputPose
  }


  /**
   * Resets all internal physical velocities and positions to resting neutral.
   */
  public reset(): void {
    this.targetPitch = 0
    this.targetYaw = 0
    this.targetRoll = 0
    this.targetTransX = 0
    this.targetTransY = 0
    this.currentPitch = 0
    this.currentYaw = 0
    this.currentRoll = 0
    this.currentTransX = 0
    this.currentTransY = 0
    this.currentSpecularX = 0
    this.currentSpecularY = 0
    this.currentLightAngle = -10
    this.currentReflection = 1.0
    this.activityLevel = 0
  }
}
