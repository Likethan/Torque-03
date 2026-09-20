/**
 * ----------------------------------------------------------------------------
 * VEHICLE DETAIL TYPES (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * Type definitions for the 20 audited vehicle components, 9 close-up
 * automotive camera studies, lighting states, and detail hotspots.
 */

export type VehicleComponentId =
  | 'BODY_MAIN'
  | 'BODY_HOOD'
  | 'BODY_ROOF'
  | 'BODY_TRUNK'
  | 'DOORS_FLANK'
  | 'FRONT_BUMPER'
  | 'REAR_BUMPER'
  | 'FRONT_GRILLE'
  | 'HEADLIGHTS'
  | 'TAILLIGHTS'
  | 'WHEELS'
  | 'TIRES'
  | 'BRAKES'
  | 'BRAKE_CALIPERS'
  | 'EXHAUST'
  | 'GLASS'
  | 'MIRRORS'
  | 'INTERIOR_CABIN'
  | 'POWERTRAIN'
  | 'CHASSIS'

export type ComponentCategory =
  | 'BODY'
  | 'LIGHTING'
  | 'CHASSIS'
  | 'POWERTRAIN'
  | 'AERODYNAMICS'
  | 'CABIN'

export type DetailStudyId =
  | 'FRONT_STUDY'
  | 'HEADLIGHT_STUDY'
  | 'GRILLE_STUDY'
  | 'WHEEL_STUDY'
  | 'BRAKE_STUDY'
  | 'BODYLINE_STUDY'
  | 'REAR_LIGHT_STUDY'
  | 'GLASS_STUDY'
  | 'INTERIOR_STUDY'

export type HeadlightState = 'OFF' | 'IDLE' | 'ACTIVE' | 'CINEMATIC'
export type TaillightState = 'OFF' | 'ACTIVE' | 'CINEMATIC'

export interface VehicleComponentDetail {
  id: VehicleComponentId
  name: string
  category: ComponentCategory
  code: string
  spec: string
  description: string
  materialToken: string
  anchorPosition: [number, number, number] // [X, Y, Z] relative to car root
  studyId?: DetailStudyId
}

export interface DetailStudyConfig {
  id: DetailStudyId
  index: string // e.g. "01", "02"
  title: string
  subtitle: string
  description: string
  primaryComponent: VehicleComponentId
  cameraPosition: [number, number, number] // [X, Y, Z]
  cameraTarget: [number, number, number]   // [X, Y, Z]
  fov: number
  pointerScale: number
  keyLightModifier: {
    positionOffset: [number, number, number]
    intensityMultiplier: number
    color?: string
  }
  rimLightModifier: {
    positionOffset: [number, number, number]
    intensityMultiplier: number
  }
  fillLightModifier: {
    positionOffset: [number, number, number]
    intensityMultiplier: number
  }
}

export interface VehicleLightingState {
  headlightState: HeadlightState
  taillightState: TaillightState
  headlightIntensity: number
  taillightIntensity: number
  rimIntensity: number
  keyIntensity: number
}

export interface DetailHotspotConfig {
  id: string
  componentId: VehicleComponentId
  studyId: DetailStudyId
  label: string
  shortSpec: string
  worldPosition: [number, number, number]
}
