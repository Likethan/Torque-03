/**
 * UNIFIED MOTION & SHARED PHYSICS ARCHITECTURE
 * STEP 4 — SHARED MOTION PHYSICS SYSTEM
 *
 * Core Principle:
 * ONE SOURCE OF MOTION TRUTH, MANY RENDERERS / CONSUMERS.
 *
 * Input Priority Pipeline:
 * FINAL MOTION = SCROLL MOTION (Primary) + POINTER OFFSET (Secondary) + VELOCITY MOMENTUM + IDLE AMBIENT (Tertiary)
 *
 * Implements:
 * 1. Frame-rate independent exponential damping across 60Hz, 120Hz, 144Hz
 * 2. Continuous velocity tracking with settling and hysteresis
 * 3. Camera physical mass (decelerates before reversing direction)
 * 4. Layered vehicle attitude (pitch, yaw, roll, displacement)
 * 5. Velocity-reactive typography metrics
 * 6. Clean settling to equilibrium when user input ceases (zero jitter)
 * 7. Complete accessibility support for prefers-reduced-motion
 */

import { resolveScene, type CanonicalScene } from './sceneMapper'
import { prefersReducedMotion as checkReducedMotion } from '../animation/gsapConfig'
import { clamp } from './clamp'
import { dampDt, smoothDamp } from './lerp'
import { VelocityTracker1D, VelocityTracker2D } from './velocity'
import { VehicleInspectionEngine, type VehiclePose } from './vehicleMotionModel'

export interface MotionComposition {
  // Primary Scroll Motion
  scrollScale: number
  scrollX: number
  scrollY: number

  // Secondary Pointer Influence
  pointerTiltX: number
  pointerTiltY: number
  pointerTransX: number
  pointerTransY: number

  // Dynamic Velocity Momentum
  velocityMomentumX: number
  velocityMomentumY: number
  velocityScale: number

  // Ambient Idle Breathing
  idlePitch: number
  idleYaw: number
  idleTransX: number
  idleTransY: number
}

export interface UnifiedMotionState {
  // 1. Scroll Metrics (Authoritative story driver)
  progress: number
  rawScrollVelocity: number
  velocity: number // Smoothed px/s
  normalizedVelocity: number // Clamped [-1.0, 1.0]
  direction: -1 | 0 | 1
  isScrollSettled: boolean

  // 2. Pointer & Interaction Metrics (Viewing control)
  pointerX: number
  pointerY: number
  pointerNormalizedX: number
  pointerNormalizedY: number
  smoothedNX: number
  smoothedNY: number
  pointerVelocityX: number
  pointerVelocityY: number
  pointerSpeed: number
  isPointerInside: boolean
  isTouch: boolean

  // 3. Camera Physical Mass Metrics (Heavy stabilized rig)
  cameraOffsetX: number // px
  cameraOffsetY: number // px
  cameraVelocityX: number
  cameraVelocityY: number
  cameraScaleMultiplier: number

  // 4. Vehicle 3D Attitude (Secondary response)
  vehiclePitch: number // degrees (max ±2.0°)
  vehicleYaw: number // degrees (max ±3.5°)
  vehicleRoll: number // degrees (max ±0.5°)
  vehicleTransX: number // px (max ±18px)
  vehicleTransY: number // px (max ±12px)
  lightAngle: number // degrees
  specularShiftX: number
  specularShiftY: number
  reflectionFactor: number
  activityLevel: number

  // 5. Typography Velocity Response (Secondary elements)
  typographyShiftY: number // px (max ±20px)
  typographyStretch: number // scaleY (1.000 to 1.025 max)
  typographySkew: number // deg (max ±1.5deg)
  typographyOpacity: number

  // 6. Composition Breakdown (Separated channels)
  composition: MotionComposition

  // 7. Canonical Scene & Timeline State
  scene: string
  activeSceneObj: CanonicalScene
  localProgress: number
  sceneIndex: number

  // 8. Runtime & Accessibility
  time: number
  reducedMotion: boolean
  isFullySettled: boolean
  activeConsumersCount: number
}

export interface UnifiedMotionDOMBindings {
  progressEl?: HTMLElement | null
  sceneEl?: HTMLElement | null
  localProgEl?: HTMLElement | null
  velocityEl?: HTMLElement | null
  directionEl?: HTMLElement | null
  pointerEl?: HTMLElement | null
  pointerSpeedEl?: HTMLElement | null
  reducedMotionEl?: HTMLElement | null
  activeConsumersEl?: HTMLElement | null
}

export type UnifiedMotionListener = (state: Readonly<UnifiedMotionState>) => void

// Initial scene lookup
const initialResolution = resolveScene(0.0)

// Singleton Internal Physics Trackers (Zero garbage collection)
const scrollVelocityTracker = new VelocityTracker1D({ lambda: 8.0, maxVelocity: 1600, threshold: 0.01 })
const pointerVelocityTracker = new VelocityTracker2D({ lambda: 9.0, maxSpeed: 2500 })
const vehicleInspectionEngine = new VehicleInspectionEngine()

// Camera physical mass spring velocity refs
const camSpringVelX = { value: 0 }
const camSpringVelY = { value: 0 }

// Singleton Authoritative State (Pre-allocated for zero-garbage collection)
const motionState: UnifiedMotionState = {
  progress: 0,
  rawScrollVelocity: 0,
  velocity: 0,
  normalizedVelocity: 0,
  direction: 0,
  isScrollSettled: true,

  pointerX: 0,
  pointerY: 0,
  pointerNormalizedX: 0,
  pointerNormalizedY: 0,
  smoothedNX: 0,
  smoothedNY: 0,
  pointerVelocityX: 0,
  pointerVelocityY: 0,
  pointerSpeed: 0,
  isPointerInside: false,
  isTouch: false,

  cameraOffsetX: 0,
  cameraOffsetY: 0,
  cameraVelocityX: 0,
  cameraVelocityY: 0,
  cameraScaleMultiplier: 1.0,

  vehiclePitch: 0,
  vehicleYaw: 0,
  vehicleRoll: 0,
  vehicleTransX: 0,
  vehicleTransY: 0,
  lightAngle: -10,
  specularShiftX: 0,
  specularShiftY: 0,
  reflectionFactor: 1.0,
  activityLevel: 0,

  typographyShiftY: 0,
  typographyStretch: 1.0,
  typographySkew: 0,
  typographyOpacity: 1.0,

  composition: {
    scrollScale: 1.0,
    scrollX: 0,
    scrollY: 0,
    pointerTiltX: 0,
    pointerTiltY: 0,
    pointerTransX: 0,
    pointerTransY: 0,
    velocityMomentumX: 0,
    velocityMomentumY: 0,
    velocityScale: 1.0,
    idlePitch: 0,
    idleYaw: 0,
    idleTransX: 0,
    idleTransY: 0,
  },

  scene: initialResolution.activeScene.id,
  activeSceneObj: initialResolution.activeScene,
  localProgress: 0,
  sceneIndex: 0,

  time: 0,
  reducedMotion: false,
  isFullySettled: true,
  activeConsumersCount: 8,
}

// Active listeners and DOM bindings
const listeners = new Set<UnifiedMotionListener>()
let domBindings: UnifiedMotionDOMBindings = {}

// Initialize reduced motion state
if (typeof window !== 'undefined') {
  motionState.reducedMotion = checkReducedMotion()
}

/**
 * ----------------------------------------------------------------------------
 * 1. AUTHORITATIVE WRITERS (Deterministic State Updates)
 * ----------------------------------------------------------------------------
 */

/**
 * Updates authoritative scroll metrics from Lenis / ScrollTrigger.
 */
export function setScrollMotion(progress: number, rawVelocity: number, direction: -1 | 0 | 1): void {
  const clampedProg = clamp(progress, 0, 1)
  motionState.progress = clampedProg
  motionState.rawScrollVelocity = rawVelocity

  // Derive canonical scene & localProgress
  const res = resolveScene(clampedProg)
  motionState.scene = res.activeScene.id
  motionState.activeSceneObj = res.activeScene
  motionState.localProgress = res.localProgress
  motionState.sceneIndex = res.sceneIndex

  if (direction !== 0) {
    motionState.direction = direction
  }
}

/**
 * Updates authoritative pointer metrics from the centralized Interaction System.
 */
export function setPointerMotion(
  x: number,
  y: number,
  nx: number,
  ny: number,
  speed: number,
  isTouch: boolean = false,
  isInside: boolean = true
): void {
  motionState.pointerX = x
  motionState.pointerY = y
  motionState.pointerNormalizedX = nx
  motionState.pointerNormalizedY = ny
  motionState.pointerSpeed = speed
  motionState.isTouch = isTouch
  motionState.isPointerInside = isInside
}

/**
 * Increments authoritative shared animation time (seconds).
 */
export function updateSharedTime(delta: number): void {
  if (!motionState.reducedMotion) {
    motionState.time += delta
  }
}

/**
 * Updates authoritative accessibility reduced-motion flag.
 */
export function setReducedMotion(isReduced: boolean): void {
  motionState.reducedMotion = isReduced
  if (isReduced) {
    // Zero all physical offsets immediately
    motionState.cameraOffsetX = 0
    motionState.cameraOffsetY = 0
    motionState.cameraVelocityX = 0
    motionState.cameraVelocityY = 0
    motionState.cameraScaleMultiplier = 1.0
    motionState.vehiclePitch = 0
    motionState.vehicleYaw = 0
    motionState.vehicleRoll = 0
    motionState.vehicleTransX = 0
    motionState.vehicleTransY = 0
    motionState.typographyShiftY = 0
    motionState.typographyStretch = 1.0
    motionState.typographySkew = 0
  }
  updateDOMTelemetry()
  notifyListeners()
}

/**
 * ----------------------------------------------------------------------------
 * 2. MASTER SHARED MOTION PHYSICS STEP (Single Unified Loop)
 * ----------------------------------------------------------------------------
 * Evaluates spring-damper equations, updates velocities, applies camera mass,
 * settles to equilibrium, and prepares final values for all visual consumers.
 */
export function stepSharedMotionPhysics(deltaTimeSec: number): Readonly<UnifiedMotionState> {
  const dt = Math.min(Math.max(deltaTimeSec, 0.001), 0.1)

  if (!motionState.reducedMotion) {
    motionState.time += dt
  }

  if (motionState.reducedMotion) {
    motionState.velocity = 0
    motionState.normalizedVelocity = 0
    motionState.smoothedNX = 0
    motionState.smoothedNY = 0
    motionState.cameraOffsetX = 0
    motionState.cameraOffsetY = 0
    motionState.cameraScaleMultiplier = 1.0
    motionState.vehiclePitch = 0
    motionState.vehicleYaw = 0
    motionState.vehicleRoll = 0
    motionState.vehicleTransX = 0
    motionState.vehicleTransY = 0
    motionState.typographyShiftY = 0
    motionState.typographyStretch = 1.0
    motionState.typographySkew = 0
    motionState.isFullySettled = true
    updateDOMTelemetry()
    notifyListeners()
    return motionState
  }

  // 1. UPDATE SCROLL VELOCITY PHYSICS
  // Update smoothed velocity from raw velocity sample
  const smoothedVel = scrollVelocityTracker.updateRaw(motionState.rawScrollVelocity, dt)
  motionState.velocity = smoothedVel
  motionState.normalizedVelocity = scrollVelocityTracker.getNormalized(1200)
  motionState.direction = scrollVelocityTracker.getDirection()
  motionState.isScrollSettled = scrollVelocityTracker.settled()

  // 2. UPDATE POINTER PHYSICS & INERTIAL DAMPING
  pointerVelocityTracker.update(motionState.pointerX, motionState.pointerY, dt)
  motionState.pointerVelocityX = pointerVelocityTracker.getVx()
  motionState.pointerVelocityY = pointerVelocityTracker.getVy()

  // Smooth normalized pointer coords with delta-time aware damping (lambda: 7.5 1/s)
  // On touch: subdue pointer influence so it never fights native touch scrolling
  const targetNX = motionState.isTouch ? 0 : motionState.pointerNormalizedX
  const targetNY = motionState.isTouch ? 0 : motionState.pointerNormalizedY
  motionState.smoothedNX = dampDt(motionState.smoothedNX, targetNX, 7.5, dt)
  motionState.smoothedNY = dampDt(motionState.smoothedNY, targetNY, 7.5, dt)

  // 3. VEHICLE PHYSICAL ATTITUDE MODEL (Step 3 refinement)
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024
  vehicleInspectionEngine.updateTargets(
    motionState.smoothedNX,
    motionState.smoothedNY,
    motionState.isPointerInside,
    motionState.pointerSpeed,
    motionState.isTouch,
    isTablet,
    dt
  )
  const vPose: VehiclePose = vehicleInspectionEngine.step(dt)
  motionState.vehiclePitch = vPose.pitch
  motionState.vehicleYaw = vPose.yaw
  motionState.vehicleRoll = vPose.roll
  motionState.vehicleTransX = vPose.transX
  motionState.vehicleTransY = vPose.transY
  motionState.lightAngle = vPose.lightAngle
  motionState.specularShiftX = vPose.specularShiftX
  motionState.specularShiftY = vPose.specularShiftY
  motionState.reflectionFactor = vPose.reflectionFactor
  motionState.activityLevel = vPose.activity

  // 4. CAMERA PHYSICAL MASS & DIRECTION-REVERSAL DECELERATION
  // The camera behaves like a heavy, gyrostabilized rig.
  // Velocity response: fast scroll creates subtle camera lead (+/- 14px max) and dynamic zoom (+2% max).
  const normVel = motionState.normalizedVelocity
  const targetCamLeadX = clamp(normVel * 9.0, -14, 14)
  const targetCamLeadY = clamp(normVel * 6.0, -10, 10)
  const targetCamOffsetX = targetCamLeadX + vPose.transX * 0.35
  const targetCamOffsetY = targetCamLeadY + vPose.transY * 0.35

  // Smoothly damp camera offset with mass spring (smoothTime = 0.20s)
  motionState.cameraOffsetX = smoothDamp(
    motionState.cameraOffsetX,
    targetCamOffsetX,
    camSpringVelX,
    0.20,
    dt,
    180
  )
  motionState.cameraOffsetY = smoothDamp(
    motionState.cameraOffsetY,
    targetCamOffsetY,
    camSpringVelY,
    0.20,
    dt,
    180
  )
  motionState.cameraVelocityX = camSpringVelX.value
  motionState.cameraVelocityY = camSpringVelY.value

  // Zoom momentum: slight push-in during forward acceleration, settling at rest
  const targetScaleMult = 1 + clamp(Math.abs(normVel) * 0.02, 0, 0.024)
  motionState.cameraScaleMultiplier = dampDt(
    motionState.cameraScaleMultiplier,
    targetScaleMult,
    6.0,
    dt
  )

  // 5. VELOCITY-BASED TYPOGRAPHY RESPONSE (Secondary typography shifts & stretches)
  // Shift proportional to scroll velocity (-18px to +18px)
  const targetTypoShift = clamp(normVel * -16, -18, 18)
  motionState.typographyShiftY = dampDt(motionState.typographyShiftY, targetTypoShift, 7.5, dt)

  // Subtle stretch (1.000 to 1.022) and subtle skew (-1.8deg to +1.8deg)
  const targetStretch = 1 + clamp(Math.abs(normVel) * 0.022, 0, 0.022)
  motionState.typographyStretch = dampDt(motionState.typographyStretch, targetStretch, 8.0, dt)

  const targetSkew = clamp(normVel * -1.8, -1.8, 1.8)
  motionState.typographySkew = dampDt(motionState.typographySkew, targetSkew, 8.0, dt)

  // 6. CHANNELIZED COMPOSITION BREAKDOWN
  motionState.composition.scrollScale = 1.0
  motionState.composition.scrollX = 0
  motionState.composition.scrollY = 0
  motionState.composition.pointerTiltX = vPose.pitch
  motionState.composition.pointerTiltY = vPose.yaw
  motionState.composition.pointerTransX = vPose.transX
  motionState.composition.pointerTransY = vPose.transY
  motionState.composition.velocityMomentumX = targetCamLeadX
  motionState.composition.velocityMomentumY = targetCamLeadY
  motionState.composition.velocityScale = motionState.cameraScaleMultiplier

  // 7. SETTLING DETECTION
  const isVelocityZero = Math.abs(motionState.velocity) < 0.01 && Math.abs(camSpringVelX.value) < 0.05
  const isPointerSettled =
    Math.abs(motionState.pointerNormalizedX - motionState.smoothedNX) < 0.001 &&
    pointerVelocityTracker.settled()

  motionState.isFullySettled = isVelocityZero && isPointerSettled && !motionState.isPointerInside

  updateDOMTelemetry()
  notifyListeners()

  return motionState
}

/**
 * ----------------------------------------------------------------------------
 * 3. AUTHORITATIVE READERS & ADAPTERS (Visual Consumers)
 * ----------------------------------------------------------------------------
 */

/**
 * Returns read-only reference to current unified motion state.
 */
export function getUnifiedMotionState(): Readonly<UnifiedMotionState> {
  return motionState
}

/**
 * Camera Adapter: extracts coordinates, waypoint bounds, and pointer/velocity offset
 */
export function getCameraMotionInput() {
  return {
    progress: motionState.progress,
    scene: motionState.scene,
    localProgress: motionState.localProgress,
    pointerOffset: {
      x: motionState.reducedMotion ? 0 : motionState.smoothedNX * 0.32,
      y: motionState.reducedMotion ? 0 : -motionState.smoothedNY * 0.2,
    },
    cameraMassOffset: {
      x: motionState.reducedMotion ? 0 : (motionState.cameraOffsetX / 100) * 0.15,
      y: motionState.reducedMotion ? 0 : (motionState.cameraOffsetY / 100) * 0.15,
    },
    velocity: motionState.velocity,
    normalizedVelocity: motionState.normalizedVelocity,
    isReduced: motionState.reducedMotion,
  }
}

/**
 * Mechanical Adapter: extracts progress, velocity, direction for physical constraints
 */
export function getMechanicalMotionInput() {
  let exploded = 0
  if (motionState.progress >= 0.5 && motionState.progress <= 0.82) {
    if (motionState.progress < 0.68) {
      exploded = (motionState.progress - 0.5) / (0.68 - 0.5)
    } else {
      exploded = 1.0 - (motionState.progress - 0.68) / (0.82 - 0.68)
    }
  }

  return {
    globalProgress: motionState.progress,
    scene: motionState.scene,
    localProgress: motionState.localProgress,
    velocity: motionState.velocity,
    direction: motionState.direction,
    explodedProgress: clamp(exploded, 0, 1),
    isReduced: motionState.reducedMotion,
  }
}

/**
 * Shader Adapter: extracts uniform inputs for GLSL inspection & reveal
 */
export function getShaderMotionInput() {
  let inspection = 0
  if (motionState.progress >= 0.35 && motionState.progress <= 0.94) {
    if (motionState.progress < 0.55) {
      inspection = (motionState.progress - 0.35) / (0.55 - 0.35)
    } else if (motionState.progress > 0.82) {
      inspection = 1.0 - (motionState.progress - 0.82) / (0.94 - 0.82)
    } else {
      inspection = 1.0
    }
  }
  const smoothInspection = inspection * inspection * (3 - 2 * inspection)

  let reveal = 0
  if (motionState.progress >= 0.5 && motionState.progress <= 0.82) {
    if (motionState.progress < 0.68) {
      reveal = (motionState.progress - 0.5) / (0.68 - 0.5)
    } else {
      reveal = 1.0 - (motionState.progress - 0.68) / (0.82 - 0.68)
    }
  }

  return {
    progress: motionState.progress,
    scene: motionState.scene,
    localProgress: motionState.localProgress,
    inspection: smoothInspection,
    reveal: clamp(reveal, 0, 1),
    intensity: 1.0,
    pointerX: motionState.reducedMotion ? 0 : motionState.smoothedNX,
    pointerY: motionState.reducedMotion ? 0 : motionState.smoothedNY,
    time: motionState.time,
    isReduced: motionState.reducedMotion,
  }
}

/**
 * DOM & Typography Adapter: extracts parameters for GSAP timelines & secondary typography
 */
export function getDomMotionInput() {
  return {
    progress: motionState.progress,
    scene: motionState.scene,
    chapter: motionState.activeSceneObj.chapter,
    title: motionState.activeSceneObj.title,
    localProgress: motionState.localProgress,
    velocity: motionState.velocity,
    normalizedVelocity: motionState.normalizedVelocity,
    direction: motionState.direction,
    typographyShiftY: motionState.typographyShiftY,
    typographyStretch: motionState.typographyStretch,
    typographySkew: motionState.typographySkew,
    isReduced: motionState.reducedMotion,
  }
}

/**
 * ----------------------------------------------------------------------------
 * 4. TELEMETRY & DOM BINDINGS (Zero React Re-renders)
 * ----------------------------------------------------------------------------
 */

export function registerUnifiedMotionDOMBindings(bindings: UnifiedMotionDOMBindings): () => void {
  domBindings = { ...domBindings, ...bindings }
  updateDOMTelemetry()
  return () => {
    domBindings = {}
  }
}

export function subscribeToUnifiedMotion(listener: UnifiedMotionListener): () => void {
  listeners.add(listener)
  listener(motionState)
  return () => {
    listeners.delete(listener)
  }
}

function notifyListeners(): void {
  for (const l of listeners) {
    l(motionState)
  }
}

function updateDOMTelemetry(): void {
  if (domBindings.progressEl) {
    domBindings.progressEl.textContent = `${(motionState.progress * 100).toFixed(1)}%`
  }
  if (domBindings.sceneEl) {
    domBindings.sceneEl.textContent = `${motionState.activeSceneObj.chapter} // ${motionState.scene}`
  }
  if (domBindings.localProgEl) {
    domBindings.localProgEl.textContent = `${(motionState.localProgress * 100).toFixed(1)}%`
  }
  if (domBindings.velocityEl) {
    domBindings.velocityEl.textContent = `${motionState.velocity >= 0 ? '+' : ''}${motionState.velocity.toFixed(2)} px/s`
  }
  if (domBindings.directionEl) {
    domBindings.directionEl.textContent =
      motionState.direction === 1 ? 'DOWN' : motionState.direction === -1 ? 'UP' : 'IDLE'
  }
  if (domBindings.pointerEl) {
    domBindings.pointerEl.textContent = `(${motionState.smoothedNX.toFixed(2)}, ${motionState.smoothedNY.toFixed(2)})`
  }
  if (domBindings.pointerSpeedEl) {
    domBindings.pointerSpeedEl.textContent = `${motionState.pointerSpeed.toFixed(1)} px/s`
  }
  if (domBindings.reducedMotionEl) {
    domBindings.reducedMotionEl.textContent = motionState.reducedMotion ? 'ACTIVE (REDUCED)' : 'OFF (FULL)'
  }
  if (domBindings.activeConsumersEl) {
    domBindings.activeConsumersEl.textContent = `${motionState.activeConsumersCount} ACTIVE [LENIS, ST, GSAP, PTR, R3F, CAM, MECH, GLSL]`
  }
}
