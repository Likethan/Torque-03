/**
 * UNIFIED MOTION ARCHITECTURE
 * STEP 19 — CENTRALIZED MOTION STATE & RUNTIME
 *
 * Core Principle:
 * ONE SOURCE OF MOTION TRUTH, MANY RENDERERS / CONSUMERS.
 *
 * Coordinates:
 * - Lenis (Authoritative scroll position & physics)
 * - ScrollTrigger (Trigger boundaries & pinned scrubbing)
 * - Interaction System (Authoritative pointer & touch)
 * - Canonical Scene Mapper (8 narrative stages)
 * - CameraRig (3D camera choreography & pointer offset)
 * - Mechanical System (Kinematic constraints, angles, valve lift)
 * - Accord GLSL Shaders (Inspection, reveal, uniforms)
 * - DOM & Kinetic Typography (GSAP timelines & text split)
 * - Accessibility (prefers-reduced-motion)
 */

import { resolveScene, type CanonicalScene } from './sceneMapper'
import { prefersReducedMotion as checkReducedMotion } from '../animation/gsapConfig'

export interface UnifiedMotionState {
  // Scroll Metrics (Owned by Lenis + ScrollTrigger)
  progress: number
  velocity: number
  direction: -1 | 0 | 1

  // Pointer Metrics (Owned by Interaction System)
  pointerX: number
  pointerY: number
  pointerNormalizedX: number
  pointerNormalizedY: number
  pointerVelocity: number

  // Scene Metrics (Owned by Canonical Scene Mapper)
  scene: string
  activeSceneObj: CanonicalScene
  localProgress: number
  sceneIndex: number

  // Runtime Metrics
  time: number
  reducedMotion: boolean
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

// Singleton Authoritative State (Pre-allocated for zero-garbage collection)
const motionState: UnifiedMotionState = {
  progress: 0,
  velocity: 0,
  direction: 0,

  pointerX: 0,
  pointerY: 0,
  pointerNormalizedX: 0,
  pointerNormalizedY: 0,
  pointerVelocity: 0,

  scene: initialResolution.activeScene.id,
  activeSceneObj: initialResolution.activeScene,
  localProgress: 0,
  sceneIndex: 0,

  time: 0,
  reducedMotion: false,
  activeConsumersCount: 8, // Lenis, ScrollTrigger, GSAP, Interaction, R3F, CameraRig, Mechanical, GLSL
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
export function setScrollMotion(progress: number, velocity: number, direction: -1 | 0 | 1): void {
  const clampedProg = Math.min(Math.max(progress, 0), 1)
  motionState.progress = clampedProg
  motionState.velocity = velocity
  motionState.direction = direction

  // Automatically derive canonical scene & localProgress
  const res = resolveScene(clampedProg)
  motionState.scene = res.activeScene.id
  motionState.activeSceneObj = res.activeScene
  motionState.localProgress = res.localProgress
  motionState.sceneIndex = res.sceneIndex

  updateDOMTelemetry()
  notifyListeners()
}

/**
 * Updates authoritative pointer metrics from the centralized Interaction System.
 */
export function setPointerMotion(
  x: number,
  y: number,
  nx: number,
  ny: number,
  speed: number
): void {
  motionState.pointerX = x
  motionState.pointerY = y
  motionState.pointerNormalizedX = nx
  motionState.pointerNormalizedY = ny
  motionState.pointerVelocity = speed

  updateDOMTelemetry()
  notifyListeners()
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
  updateDOMTelemetry()
  notifyListeners()
}

/**
 * ----------------------------------------------------------------------------
 * 2. AUTHORITATIVE READERS & ADAPTERS (Visual Consumers)
 * ----------------------------------------------------------------------------
 */

/**
 * Returns read-only reference to current unified motion state.
 */
export function getUnifiedMotionState(): Readonly<UnifiedMotionState> {
  return motionState
}

/**
 * Camera Adapter: extracts coordinates, waypoint bounds, and pointer offset
 */
export function getCameraMotionInput() {
  return {
    progress: motionState.progress,
    scene: motionState.scene,
    localProgress: motionState.localProgress,
    pointerOffset: {
      x: motionState.reducedMotion ? 0 : motionState.pointerNormalizedX * 0.32,
      y: motionState.reducedMotion ? 0 : -motionState.pointerNormalizedY * 0.2,
    },
    velocity: motionState.velocity,
    isReduced: motionState.reducedMotion,
  }
}

/**
 * Mechanical Adapter: extracts progress, velocity, direction for physical constraints
 */
export function getMechanicalMotionInput() {
  // Exploded disassembly active between Architecture and Mechanical stages (0.50 -> 0.82)
  let exploded = 0
  if (motionState.progress >= 0.50 && motionState.progress <= 0.82) {
    if (motionState.progress < 0.68) {
      exploded = (motionState.progress - 0.50) / (0.68 - 0.50)
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
    explodedProgress: Math.min(Math.max(exploded, 0), 1),
    isReduced: motionState.reducedMotion,
  }
}

/**
 * Shader Adapter: extracts uniform inputs for GLSL inspection & reveal
 */
export function getShaderMotionInput() {
  // Inspection intensity: ramps up during Architecture & Powertrain (0.35 -> 0.94)
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

  // Reveal factor tied to exploded disassembly
  let reveal = 0
  if (motionState.progress >= 0.50 && motionState.progress <= 0.82) {
    if (motionState.progress < 0.68) {
      reveal = (motionState.progress - 0.50) / (0.68 - 0.50)
    } else {
      reveal = 1.0 - (motionState.progress - 0.68) / (0.82 - 0.68)
    }
  }

  return {
    progress: motionState.progress,
    scene: motionState.scene,
    localProgress: motionState.localProgress,
    inspection: smoothInspection,
    reveal: Math.min(Math.max(reveal, 0), 1),
    intensity: 1.0,
    pointerX: motionState.reducedMotion ? 0 : motionState.pointerNormalizedX,
    pointerY: motionState.reducedMotion ? 0 : motionState.pointerNormalizedY,
    time: motionState.time,
    isReduced: motionState.reducedMotion,
  }
}

/**
 * DOM Adapter: extracts parameters for GSAP timelines and kinetic typography
 */
export function getDomMotionInput() {
  return {
    progress: motionState.progress,
    scene: motionState.scene,
    chapter: motionState.activeSceneObj.chapter,
    title: motionState.activeSceneObj.title,
    localProgress: motionState.localProgress,
    velocity: motionState.velocity,
    direction: motionState.direction,
    isReduced: motionState.reducedMotion,
  }
}

/**
 * ----------------------------------------------------------------------------
 * 3. TELEMETRY & DOM BINDINGS (Zero React Re-renders)
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
    domBindings.velocityEl.textContent = `${motionState.velocity >= 0 ? '+' : ''}${motionState.velocity.toFixed(3)} px/f`
  }
  if (domBindings.directionEl) {
    domBindings.directionEl.textContent =
      motionState.direction === 1 ? 'DOWN' : motionState.direction === -1 ? 'UP' : 'IDLE'
  }
  if (domBindings.pointerEl) {
    domBindings.pointerEl.textContent = `(${motionState.pointerNormalizedX.toFixed(2)}, ${motionState.pointerNormalizedY.toFixed(2)})`
  }
  if (domBindings.pointerSpeedEl) {
    domBindings.pointerSpeedEl.textContent = `${motionState.pointerVelocity.toFixed(1)} px/s`
  }
  if (domBindings.reducedMotionEl) {
    domBindings.reducedMotionEl.textContent = motionState.reducedMotion ? 'ACTIVE (REDUCED)' : 'OFF (FULL)'
  }
  if (domBindings.activeConsumersEl) {
    domBindings.activeConsumersEl.textContent = `${motionState.activeConsumersCount} ACTIVE [LENIS, ST, GSAP, PTR, R3F, CAM, MECH, GLSL]`
  }
}
