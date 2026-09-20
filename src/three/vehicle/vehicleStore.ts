import { useSyncExternalStore } from 'react'
import type {
  VehicleComponentId,
  DetailStudyId,
  VehicleLightingState,
  HeadlightState,
  TaillightState,
} from './vehicleTypes'

/**
 * ----------------------------------------------------------------------------
 * VEHICLE DETAIL STORE (Step 13 — Advanced Automotive Detail Systems)
 * ----------------------------------------------------------------------------
 * High-performance, zero-allocation centralized vehicle detail state:
 * - High-frequency mutable values read by useFrame (camera blending, lighting).
 * - Discrete updates emit to React UI components via useSyncExternalStore.
 * - Manages active detail studies, component hover/selection, and multi-state lights.
 */

export interface VehicleStoreState {
  activeDetailStudy: DetailStudyId | null
  detailBlend: number // 0.0 = full vehicle / scroll camera, 1.0 = full macro detail
  hoveredComponent: VehicleComponentId | null
  selectedComponent: VehicleComponentId | null
  lighting: VehicleLightingState
  wheelSpeedKmh: number
  wheelSteerAngle: number
}

// Mutable single-instance container for 60/120fps access
const activeVehicleState: VehicleStoreState = {
  activeDetailStudy: null,
  detailBlend: 0,
  hoveredComponent: null,
  selectedComponent: null,
  lighting: {
    headlightState: 'IDLE',
    taillightState: 'ACTIVE',
    headlightIntensity: 0.65,
    taillightIntensity: 0.45,
    rimIntensity: 1.25,
    keyIntensity: 0.75,
  },
  wheelSpeedKmh: 0,
  wheelSteerAngle: 0,
}

// Snapshot container for React components
let reactSnapshot: VehicleStoreState = { ...activeVehicleState, lighting: { ...activeVehicleState.lighting } }

const listeners = new Set<() => void>()

function emitChange(): void {
  reactSnapshot = {
    ...activeVehicleState,
    lighting: { ...activeVehicleState.lighting },
  }
  for (const listener of listeners) {
    listener()
  }
}

/**
 * Direct access to the live mutable vehicle detail state.
 * Use inside useFrame loops for zero-garbage-collection reading.
 */
export function getVehicleState(): Readonly<VehicleStoreState> {
  return activeVehicleState
}

/**
 * Selects an automotive detail study (e.g. 'HEADLIGHT_STUDY', 'WHEEL_STUDY'),
 * or null to return to the global scroll-driven camera.
 */
export function selectDetailStudy(studyId: DetailStudyId | null): void {
  activeVehicleState.activeDetailStudy = studyId
  if (studyId) {
    // Automatically select the primary component associated with this study
    activeVehicleState.selectedComponent = null
  }
  emitChange()
}

/**
 * Updates the smoothed detail blend factor [0.0, 1.0] from CameraRig.
 */
export function setDetailBlendRuntime(blend: number): void {
  activeVehicleState.detailBlend = blend
}

/**
 * Sets the actively hovered vehicle component.
 */
export function setVehicleComponentHovered(componentId: VehicleComponentId | null): void {
  if (activeVehicleState.hoveredComponent !== componentId) {
    activeVehicleState.hoveredComponent = componentId
    emitChange()
  }
}

/**
 * Sets the actively selected vehicle component.
 */
export function selectVehicleComponent(componentId: VehicleComponentId | null): void {
  if (activeVehicleState.selectedComponent !== componentId) {
    activeVehicleState.selectedComponent = componentId
    emitChange()
  }
}

/**
 * Sets headlight operating state ('OFF' | 'IDLE' | 'ACTIVE' | 'CINEMATIC').
 */
export function setHeadlightState(state: HeadlightState): void {
  activeVehicleState.lighting.headlightState = state
  switch (state) {
    case 'OFF':
      activeVehicleState.lighting.headlightIntensity = 0.0
      break
    case 'IDLE':
      activeVehicleState.lighting.headlightIntensity = 0.45
      break
    case 'ACTIVE':
      activeVehicleState.lighting.headlightIntensity = 1.6
      break
    case 'CINEMATIC':
      activeVehicleState.lighting.headlightIntensity = 2.8
      break
  }
  emitChange()
}

/**
 * Sets taillight operating state ('OFF' | 'ACTIVE' | 'CINEMATIC').
 */
export function setTaillightState(state: TaillightState): void {
  activeVehicleState.lighting.taillightState = state
  switch (state) {
    case 'OFF':
      activeVehicleState.lighting.taillightIntensity = 0.0
      break
    case 'ACTIVE':
      activeVehicleState.lighting.taillightIntensity = 0.55
      break
    case 'CINEMATIC':
      activeVehicleState.lighting.taillightIntensity = 1.45
      break
  }
  emitChange()
}

/**
 * Updates wheel motion kinematics (speed and front steering angle).
 */
export function updateVehicleWheelMotion(speedKmh: number, steerAngle: number): void {
  activeVehicleState.wheelSpeedKmh = speedKmh
  activeVehicleState.wheelSteerAngle = steerAngle
}

/**
 * React hook to subscribe to vehicle detail state changes.
 */
export function useVehicleState(): VehicleStoreState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => reactSnapshot
  )
}
