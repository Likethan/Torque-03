import { useSyncExternalStore } from 'react'
import type { RoadPhaseId } from './roadTypes'

/**
 * ----------------------------------------------------------------------------
 * ROAD STATE STORE (Step 11 — Driving / Road Cinematic Sequence)
 * ----------------------------------------------------------------------------
 * Reactive store for the road sequence, matching the pattern of explodedStore
 * and interiorStore.
 */

export interface RoadStoreState {
  roadProgress: number
  activePhaseId: RoadPhaseId
  activePhaseIndex: number
  speedKmh: number
  distanceMeters: number
  isDriving: boolean
}

let currentState: RoadStoreState = {
  roadProgress: 0,
  activePhaseId: 'ROAD_DEPARTURE',
  activePhaseIndex: 0,
  speedKmh: 0,
  distanceMeters: 0,
  isDriving: false,
}

const listeners = new Set<() => void>()

function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function getRoadState(): Readonly<RoadStoreState> {
  return currentState
}

export function setRoadStoreProgress(
  progress: number,
  phaseId: RoadPhaseId,
  phaseIndex: number,
  speedKmh: number,
  distanceMeters: number
): void {
  currentState = {
    ...currentState,
    roadProgress: progress,
    activePhaseId: phaseId,
    activePhaseIndex: phaseIndex,
    speedKmh,
    distanceMeters,
    isDriving: progress > 0.01 && progress < 0.98,
  }
  emitChange()
}

export function useRoadState(): RoadStoreState {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback)
      return () => listeners.delete(callback)
    },
    () => currentState
  )
}
