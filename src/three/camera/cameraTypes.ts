/**
 * ----------------------------------------------------------------------------
 * CAMERA CHOREOGRAPHY TYPES (Step 15 — 3D Choreography)
 * ----------------------------------------------------------------------------
 * Type definitions for cinematic camera waypoints, local scene progress ranges,
 * and composed camera states.
 */

export type CameraStateId =
  | 'ARRIVAL'
  | 'APPROACH'
  | 'FORM'
  | 'ARCHITECTURE'
  | 'POWERTRAIN'
  | 'MECHANICAL'
  | 'RECONSTRUCTION'
  | 'FINAL'

export interface SceneRange {
  start: number // Normalized start bound within global progress [0.0, 1.0]
  end: number   // Normalized end bound within global progress [0.0, 1.0]
}

export interface CameraWaypoint {
  id: CameraStateId
  chapter: string
  title: string
  subtitle: string
  range: SceneRange
  position: [number, number, number]
  target: [number, number, number]
  description: string
  componentElevation?: number // Restrained mechanical separation in meters
  assemblyAzimuth?: number    // Assembly rotation angle in radians
}

export interface ChoreographyState {
  globalProgress: number
  activeWaypoint: CameraWaypoint
  nextWaypoint?: CameraWaypoint
  localProgress: number // Clamped [0.0, 1.0] within active waypoint
  transitionProgress: number // Segment interpolation factor
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  componentElevation: number
  assemblyAzimuth: number
}
