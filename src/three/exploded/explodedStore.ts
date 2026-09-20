import { useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { clamp } from '../../motion/clamp'
import { prefersReducedMotion } from '../../animation/gsapConfig'

/**
 * ----------------------------------------------------------------------------
 * EXPLODED VIEW STATE STORE (Step 9 — Exploded View)
 * ----------------------------------------------------------------------------
 * Central authoritative state manager for the interactive exploded engineering
 * visualization.
 *
 * Coordinates:
 * - engineeringProgress: continuous normalized float [0.0, 1.0]
 *   (0.0 = completely assembled, 1.0 = completely exploded)
 * - isExploded: boolean state toggle
 * - selectedComponentId: string | null
 * - hoveredComponentId: string | null
 * - Smooth synchronization between scroll scrub and manual toggle
 */

export interface ExplodedState {
  progress: number
  isExploded: boolean
  selectedId: string | null
  hoveredId: string | null
  activeCategory: string | null
}

type ExplodedSubscriber = (state: ExplodedState) => void

class ExplodedViewStore {
  private state: ExplodedState = {
    progress: 0.0,
    isExploded: false,
    selectedId: null,
    hoveredId: null,
    activeCategory: null,
  }

  private subscribers: Set<ExplodedSubscriber> = new Set()
  private toggleTween: gsap.core.Tween | null = null

  /**
   * Retrieves current immutable snapshot.
   */
  public getState(): Readonly<ExplodedState> {
    return this.state
  }

  /**
   * Subscribes to state updates.
   */
  public subscribe(callback: ExplodedSubscriber): () => void {
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
   * Sets the continuous engineering progress (e.g. from ScrollTrigger or useFrame).
   */
  public setProgress(rawProgress: number): void {
    const p = clamp(rawProgress, 0, 1)
    if (Math.abs(this.state.progress - p) < 0.0005) return

    this.state.progress = p
    this.state.isExploded = p > 0.45
    this.notify()
  }

  /**
   * Sets hovered component ID.
   */
  public setHovered(id: string | null): void {
    if (this.state.hoveredId === id) return
    this.state.hoveredId = id
    this.notify()
  }

  /**
   * Selects or toggles a component for detailed spatial inspection.
   */
  public selectComponent(id: string | null): void {
    if (this.state.selectedId === id) {
      this.state.selectedId = null
    } else {
      this.state.selectedId = id
    }
    this.notify()
  }

  /**
   * Toggles between Assembled (0.0) and Exploded (1.0) with smooth GSAP animation.
   * If reduced-motion is preferred, instantly snaps without animation.
   */
  public toggleExploded(): void {
    if (this.toggleTween) {
      this.toggleTween.kill()
      this.toggleTween = null
    }

    const targetProgress = this.state.progress > 0.45 ? 0.0 : 1.0
    const isReduced = prefersReducedMotion()

    if (isReduced) {
      this.setProgress(targetProgress)
      return
    }

    const proxy = { p: this.state.progress }
    this.toggleTween = gsap.to(proxy, {
      p: targetProgress,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.setProgress(proxy.p)
      },
      onComplete: () => {
        this.toggleTween = null
      },
    })
  }

  /**
   * Explicitly sets exploded state to true or false with animation.
   */
  public setExploded(targetExploded: boolean): void {
    if (this.state.isExploded === targetExploded) return
    this.toggleExploded()
  }
}

export const explodedStore = new ExplodedViewStore()

// Functional convenience exports
export const getExplodedState = () => explodedStore.getState()
export const setExplodedProgress = (p: number) => explodedStore.setProgress(p)
export const setExplodedHovered = (id: string | null) => explodedStore.setHovered(id)
export const selectExplodedComponent = (id: string | null) => explodedStore.selectComponent(id)
export const toggleExplodedState = () => explodedStore.toggleExploded()
export const subscribeToExplodedStore = (fn: ExplodedSubscriber) => explodedStore.subscribe(fn)

export function useExplodedState(): ExplodedState {
  return useSyncExternalStore(
    (onStoreChange) => explodedStore.subscribe(onStoreChange),
    () => explodedStore.getState(),
    () => explodedStore.getState()
  )
}
