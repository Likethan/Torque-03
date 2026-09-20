import * as THREE from 'three'
import { CAMERA_WAYPOINTS } from './cameraWaypoints'
import type { CameraWaypoint } from './cameraTypes'

/**
 * ----------------------------------------------------------------------------
 * CAMERA CHOREOGRAPHY ENGINE (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * Maps continuous global scroll progress into localized waypoint transitions,
 * calculates target-based lookAt orientations, and manages zero-allocation
 * vector interpolation.
 */

// Reusable static vectors to avoid GC allocations in useFrame
const staticPosA = new THREE.Vector3()
const staticPosB = new THREE.Vector3()
const staticTargetA = new THREE.Vector3()
const staticTargetB = new THREE.Vector3()

/**
 * Maps a global scroll progress [0.0, 1.0] into a scene's local progress [0.0, 1.0].
 * Strictly clamped to [0.0, 1.0].
 */
export function getLocalProgress(
  globalProgress: number,
  start: number,
  end: number
): number {
  if (end <= start) return 0
  const t = (globalProgress - start) / (end - start)
  return Math.min(Math.max(t, 0), 1)
}

/**
 * Cubic smoothstep curve for weighted automotive deceleration and acceleration.
 */
export function smoothstep(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1)
  return clamped * clamped * (3 - 2 * clamped)
}

/**
 * Linear interpolation helper for numbers.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Computes the complete choreographed 3D state for a given global scroll progress.
 * Writes directly into outPosition and outTarget without creating new objects.
 */
export function sampleChoreography(
  globalProgress: number,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3,
  scaleFactor: number = 1.0
): {
  activeWaypoint: CameraWaypoint
  nextWaypoint?: CameraWaypoint
  localProgress: number
  transitionProgress: number
  componentElevation: number
  assemblyAzimuth: number
} {
  const clampedProgress = Math.min(Math.max(globalProgress, 0), 1)
  const waypoints = CAMERA_WAYPOINTS
  const count = waypoints.length

  // 1. Identify active waypoint segment
  let activeIndex = 0
  for (let i = 0; i < count; i++) {
    if (clampedProgress >= waypoints[i].range.start && clampedProgress <= waypoints[i].range.end) {
      activeIndex = i
      break
    }
    if (clampedProgress > waypoints[i].range.end && i < count - 1 && clampedProgress < waypoints[i + 1].range.start) {
      activeIndex = i
      break
    }
  }

  // Bound check for edge values
  if (clampedProgress >= 1.0) activeIndex = count - 1

  const currentWp = waypoints[activeIndex]
  const nextWp = activeIndex < count - 1 ? waypoints[activeIndex + 1] : currentWp

  // 2. Calculate local progress within current waypoint
  const localProg = getLocalProgress(clampedProgress, currentWp.range.start, currentWp.range.end)

  // 3. Interpolate between current and next waypoint
  let t = 0
  if (activeIndex < count - 1) {
    // Segment progress spans from start of current to start of next
    const segStart = currentWp.range.start
    const segEnd = nextWp.range.start
    t = smoothstep(getLocalProgress(clampedProgress, segStart, segEnd))
  } else {
    t = smoothstep(localProg)
  }

  // 4. Zero-allocation vector interpolation
  staticPosA.set(...currentWp.position).multiplyScalar(scaleFactor)
  staticPosB.set(...nextWp.position).multiplyScalar(scaleFactor)
  staticTargetA.set(...currentWp.target)
  staticTargetB.set(...nextWp.target)

  outPosition.lerpVectors(staticPosA, staticPosB, t)
  outTarget.lerpVectors(staticTargetA, staticTargetB, t)

  // 5. Restrained object choreography (elevation and rotation)
  const elevationA = currentWp.componentElevation ?? 0
  const elevationB = nextWp.componentElevation ?? 0
  const componentElevation = lerp(elevationA, elevationB, t)

  const azimuthA = currentWp.assemblyAzimuth ?? 0
  const azimuthB = nextWp.assemblyAzimuth ?? 0
  const assemblyAzimuth = lerp(azimuthA, azimuthB, t)

  return {
    activeWaypoint: currentWp,
    nextWaypoint: nextWp !== currentWp ? nextWp : undefined,
    localProgress: localProg,
    transitionProgress: t,
    componentElevation,
    assemblyAzimuth,
  }
}

// ============================================================================
// INTERIOR CAMERA CHOREOGRAPHY (Step 10 — Interior Camera Transition)
// ============================================================================

import { INTERIOR_WAYPOINTS, type InteriorWaypoint } from './interiorWaypoints'

// Pre-allocated static vectors for interior choreography (zero GC)
const intPosA = new THREE.Vector3()
const intPosB = new THREE.Vector3()
const intTargetA = new THREE.Vector3()
const intTargetB = new THREE.Vector3()

/**
 * Computes the complete choreographed interior 3D state for a given
 * interior scroll progress [0.0, 1.0].
 *
 * Mirrors sampleChoreography() but operates on INTERIOR_WAYPOINTS
 * and additionally returns FOV and pointer scale interpolation.
 */
export function sampleInteriorChoreography(
  interiorProgress: number,
  outPosition: THREE.Vector3,
  outTarget: THREE.Vector3,
  scaleFactor: number = 1.0
): {
  activeWaypoint: InteriorWaypoint
  nextWaypoint?: InteriorWaypoint
  localProgress: number
  transitionProgress: number
  fov: number
  pointerScale: number
} {
  const clampedProgress = Math.min(Math.max(interiorProgress, 0), 1)
  const waypoints = INTERIOR_WAYPOINTS
  const count = waypoints.length

  // 1. Identify active waypoint segment
  let activeIndex = 0
  for (let i = 0; i < count; i++) {
    if (clampedProgress >= waypoints[i].range.start && clampedProgress <= waypoints[i].range.end) {
      activeIndex = i
      break
    }
    if (clampedProgress > waypoints[i].range.end && i < count - 1 && clampedProgress < waypoints[i + 1].range.start) {
      activeIndex = i
      break
    }
  }

  if (clampedProgress >= 1.0) activeIndex = count - 1

  const currentWp = waypoints[activeIndex]
  const nextWp = activeIndex < count - 1 ? waypoints[activeIndex + 1] : currentWp

  // 2. Calculate local progress within current waypoint
  const localProg = getLocalProgress(clampedProgress, currentWp.range.start, currentWp.range.end)

  // 3. Interpolation factor between current and next
  let t = 0
  if (activeIndex < count - 1) {
    const segStart = currentWp.range.start
    const segEnd = nextWp.range.start
    t = smoothstep(getLocalProgress(clampedProgress, segStart, segEnd))
  } else {
    t = smoothstep(localProg)
  }

  // 4. Zero-allocation vector interpolation
  intPosA.set(...currentWp.position).multiplyScalar(scaleFactor)
  intPosB.set(...nextWp.position).multiplyScalar(scaleFactor)
  intTargetA.set(...currentWp.target)
  intTargetB.set(...nextWp.target)

  outPosition.lerpVectors(intPosA, intPosB, t)
  outTarget.lerpVectors(intTargetA, intTargetB, t)

  // 5. FOV and pointer scale interpolation
  const fov = lerp(currentWp.fovOverride, nextWp.fovOverride, t)
  const pointerScale = lerp(currentWp.pointerScale, nextWp.pointerScale, t)

  return {
    activeWaypoint: currentWp,
    nextWaypoint: nextWp !== currentWp ? nextWp : undefined,
    localProgress: localProg,
    transitionProgress: t,
    fov,
    pointerScale,
  }
}

