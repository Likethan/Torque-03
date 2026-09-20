import { useSyncExternalStore } from 'react'
import { clamp } from '../../motion/clamp'

/**
 * ----------------------------------------------------------------------------
 * INTERIOR STATE STORE (Step 10 — Interior Camera Transition)
 * ----------------------------------------------------------------------------
 * Central authoritative state manager for the interior camera transition
 * sequence. Follows the same high-frequency mutable store pattern as
 * explodedStore.ts for zero-React-render performance.
 *
 * Coordinates:
 * - interiorProgress: continuous normalized float [0.0, 1.0]
 *   (0.0 = fully exterior, 1.0 = interior transition complete)
 * - cameraMode: discrete state tracking the transition phase
 * - isInside: boolean derived from progress threshold
 * - hoveredTargetId / selectedTargetId: interactive target tracking
 */

export type CameraMode = 'EXTERIOR' | 'ENGINEERING' | 'ENTRY' | 'INTERIOR' | 'EXIT' | 'ROAD'

export interface InteriorState {
  progress: number
  cameraMode: CameraMode
  isInside: boolean
  hoveredTargetId: string | null
  selectedTargetId: string | null
  /** Active interior chapter for sidebar display */
  activeChapter: string
}

type InteriorSubscriber = (state: InteriorState) => void

class InteriorViewStore {
  private state: InteriorState = {
    progress: 0.0,
    cameraMode: 'EXTERIOR',
    isInside: false,
    hoveredTargetId: null,
    selectedTargetId: null,
    activeChapter: 'EXTERIOR',
  }

  private subscribers: Set<InteriorSubscriber> = new Set()

  public getState(): Readonly<InteriorState> {
    return this.state
  }

  public subscribe(callback: InteriorSubscriber): () => void {
    this.subscribers.add(callback)
    callback(this.state)
    return () => {
      this.subscribers.delete(callback)
    }
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub(this.state)
    }
  }

  /**
   * Sets the continuous interior transition progress (from ScrollTrigger scrub).
   */
  public setProgress(rawProgress: number): void {
    const p = clamp(rawProgress, 0, 1)
    if (Math.abs(this.state.progress - p) < 0.0005) return

    this.state.progress = p
    this.state.isInside = p > 0.45

    // Derive camera mode from progress thresholds
    if (p < 0.05) {
      this.state.cameraMode = 'EXTERIOR'
      this.state.activeChapter = 'EXTERIOR'
    } else if (p < 0.25) {
      this.state.cameraMode = 'ENTRY'
      this.state.activeChapter = 'APPROACH'
    } else if (p < 0.45) {
      this.state.cameraMode = 'ENTRY'
      this.state.activeChapter = 'ENTRY'
    } else if (p < 0.88) {
      this.state.cameraMode = 'INTERIOR'
      this.state.activeChapter = this.resolveInteriorChapter(p)
    } else {
      this.state.cameraMode = 'EXIT'
      this.state.activeChapter = 'EXIT'
    }

    this.notify()
  }

  /**
   * Resolves the active interior chapter name based on interior progress.
   */
  private resolveInteriorChapter(p: number): string {
    if (p < 0.52) return 'CABIN'
    if (p < 0.62) return 'STEERING'
    if (p < 0.72) return 'CLUSTER'
    if (p < 0.82) return 'DASHBOARD'
    return 'WINDSHIELD'
  }

  public setHovered(id: string | null): void {
    if (this.state.hoveredTargetId === id) return
    this.state.hoveredTargetId = id
    this.notify()
  }

  public selectTarget(id: string | null): void {
    if (this.state.selectedTargetId === id) {
      this.state.selectedTargetId = null
    } else {
      this.state.selectedTargetId = id
    }
    this.notify()
  }
}

export const interiorStore = new InteriorViewStore()

// Functional convenience exports
export const getInteriorState = () => interiorStore.getState()
export const setInteriorProgress = (p: number) => interiorStore.setProgress(p)
export const setInteriorHovered = (id: string | null) => interiorStore.setHovered(id)
export const selectInteriorTarget = (id: string | null) => interiorStore.selectTarget(id)
export const subscribeToInteriorStore = (fn: InteriorSubscriber) => interiorStore.subscribe(fn)

export function useInteriorState(): InteriorState {
  return useSyncExternalStore(
    (onStoreChange) => interiorStore.subscribe(onStoreChange),
    () => interiorStore.getState(),
    () => interiorStore.getState()
  )
}
