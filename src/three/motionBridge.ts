import * as THREE from 'three'
import type { CameraStateId } from './camera/cameraTypes'

/**
 * ----------------------------------------------------------------------------
 * MOTION BRIDGE STORE (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * High-frequency mutable store bridging ScrollTrigger + Lenis + GSAP directly
 * into R3F's useFrame loop outside React's component state.
 *
 * Implements Requirement 12 & 33 (Priority & Ownership):
 *   finalCameraPosition = scrollCameraPosition + pointerOffset
 */

export interface MotionBridgeState {
  globalProgress: number
  activeWaypointId: CameraStateId
  localProgress: number
  componentElevation: number
  assemblyAzimuth: number
  scrollCameraPosition: THREE.Vector3
  scrollCameraTarget: THREE.Vector3
  pointerOffset: THREE.Vector2
  // Step 16 Mechanical Physics state
  mechanicalProgress: number
  mechanicalVelocity: number
  explodedProgress: number
  primaryAngleDeg: number
  drivenAngleDeg: number
  valveLiftMm: number
  rockerAngleDeg: number
  gearRatio: number
  constraintStatus: 'OPTIMAL' | 'LIMIT_REACHED' | 'RESTRICTED'
  // Step 18 Accord GLSL Shader System state
  shaderInspection: number
  shaderReveal: number
  shaderIntensity: number
}

const state: MotionBridgeState = {
  globalProgress: 0,
  activeWaypointId: 'ARRIVAL',
  localProgress: 0,
  componentElevation: 0,
  assemblyAzimuth: 0,
  scrollCameraPosition: new THREE.Vector3(5.2, 3.2, 6.4),
  scrollCameraTarget: new THREE.Vector3(0, 0, 0),
  pointerOffset: new THREE.Vector2(0, 0),
  mechanicalProgress: 0,
  mechanicalVelocity: 0,
  explodedProgress: 0,
  primaryAngleDeg: 0,
  drivenAngleDeg: 0,
  valveLiftMm: 0,
  rockerAngleDeg: 0,
  gearRatio: -2.0,
  constraintStatus: 'OPTIMAL',
  shaderInspection: 0,
  shaderReveal: 0,
  shaderIntensity: 1.0,
}

/**
 * Sets global scroll progress [0.0, 1.0] from ScrollTrigger scrub.
 */
export function setChoreographyProgress(globalProgress: number): void {
  state.globalProgress = Math.min(Math.max(globalProgress, 0), 1)
  state.mechanicalProgress = state.globalProgress
}

/**
 * Sets instantaneous mechanical scroll velocity.
 */
export function setMechanicalVelocity(vel: number): void {
  state.mechanicalVelocity = vel
}

/**
 * Updates full choreography state from CameraRig.
 */
export function updateChoreographyRuntime(
  waypointId: CameraStateId,
  localProgress: number,
  elevation: number,
  azimuth: number,
  camX: number,
  camY: number,
  camZ: number,
  targetX: number,
  targetY: number,
  targetZ: number,
  ptrX: number,
  ptrY: number
): void {
  state.activeWaypointId = waypointId
  state.localProgress = localProgress
  state.componentElevation = elevation
  state.assemblyAzimuth = azimuth
  state.scrollCameraPosition.set(camX, camY, camZ)
  state.scrollCameraTarget.set(targetX, targetY, targetZ)
  state.pointerOffset.set(ptrX, ptrY)
}

/**
 * Updates full mechanical state from EngineeringAssembly.
 */
export function updateMechanicalRuntime(
  explodedProg: number,
  primaryDeg: number,
  drivenDeg: number,
  liftMm: number,
  rockerDeg: number,
  velocity: number,
  status: 'OPTIMAL' | 'LIMIT_REACHED' | 'RESTRICTED'
): void {
  state.explodedProgress = explodedProg
  state.primaryAngleDeg = primaryDeg
  state.drivenAngleDeg = drivenDeg
  state.valveLiftMm = liftMm
  state.rockerAngleDeg = rockerDeg
  state.mechanicalVelocity = velocity
  state.constraintStatus = status
}

/**
 * Updates Accord GLSL shader runtime state.
 */
export function updateShaderRuntime(
  inspection: number,
  reveal: number,
  intensity = 1.0
): void {
  state.shaderInspection = inspection
  state.shaderReveal = reveal
  state.shaderIntensity = intensity
}

/**
 * Returns read-only reference to current motion bridge state.
 */
export function getMotionBridgeState(): Readonly<MotionBridgeState> {
  return state
}
