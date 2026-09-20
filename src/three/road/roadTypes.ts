import type * as THREE from 'three'

/**
 * ----------------------------------------------------------------------------
 * ROAD CINEMATIC TYPES (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * Type definitions for the spline path, vehicle dynamics, 8 directed camera
 * shots, and telemetry.
 */

export type RoadPhaseId =
  | 'ROAD_DEPARTURE'
  | 'ROAD_REVEAL'
  | 'ROAD_MOMENTUM'
  | 'ROAD_MACHINE'
  | 'ROAD_ENVIRONMENT'
  | 'ROAD_HERO'
  | 'ROAD_ARRIVAL'
  | 'ROAD_HOLD'

export interface RoadCameraShot {
  id: RoadPhaseId
  phase: string
  title: string
  subtitle: string
  range: { start: number; end: number }
  /**
   * Camera offset relative to the vehicle's local orthonormal basis:
   * [right (lateral), up (vertical), forward (longitudinal)]
   */
  offset: [number, number, number]
  /** Look-at target offset relative to vehicle origin */
  targetOffset: [number, number, number]
  fov: number
  /** Pointer parallax scale (0.0 = disabled, 1.0 = full scale) */
  pointerScale: number
  editorialTag?: string
  description: string
}

export interface RoadVehicleState {
  position: THREE.Vector3
  forward: THREE.Vector3
  right: THREE.Vector3
  up: THREE.Vector3
  distanceTraveled: number
  wheelAngle: number
  steeringAngle: number
  bodyRoll: number
  bodyPitch: number
  bodyBounce: number
  speedKmh: number
}

export interface RoadChoreographyResult {
  activeShot: RoadCameraShot
  nextShot?: RoadCameraShot
  localProgress: number
  transitionProgress: number
  fov: number
  pointerScale: number
  editorialTag?: string
}
