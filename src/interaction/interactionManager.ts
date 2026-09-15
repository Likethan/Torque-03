/**
 * INTERACTION MANAGER (Step 12 — Advanced Interaction System)
 *
 * Centralizes global pointer and touch event capture:
 * 1. Single window-level event listener set.
 * 2. Caches bounding boxes and updates them on scroll/resize (zero layout thrashing).
 * 3. Handles magnetic attraction and proximity detection with GSAP interpolation.
 * 4. Reference counted for React Strict Mode safety.
 */

import gsap from 'gsap'
import {
  setRawPointer,
  setPointerLeave,
  setActiveInteraction,
  getInteractionState,
} from './interactionStore'
import {
  calculateDistance,
  getProximityStrength,
  calculateMagneticDisplacement,
} from './interactionMath'
import { prefersReducedMotion } from '../animation/gsapConfig'

export interface MagneticTargetConfig {
  element: HTMLElement
  name: string
  radius?: number
  factor?: number
  maxOffset?: number
  onUpdate?: (mx: number, my: number, strength: number) => void
}

export interface ProximityTargetConfig {
  element: HTMLElement
  name: string
  radius?: number
  onStrengthChange?: (strength: number) => void
}

let isInitialized = false
let refCount = 0

// Target Registries
const magneticTargets = new Map<HTMLElement, MagneticTargetConfig & { center: { x: number; y: number } }>()
const proximityTargets = new Map<HTMLElement, ProximityTargetConfig & { center: { x: number; y: number } }>()

/**
 * Recalculates center coordinates for all registered targets.
 * Called on scroll or resize rather than querying getBoundingClientRect() every frame!
 */
export function updateTargetBounds(): void {
  magneticTargets.forEach((config, element) => {
    if (!element.isConnected) {
      magneticTargets.delete(element)
      return
    }
    const rect = element.getBoundingClientRect()
    config.center = {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
    }
  })

  proximityTargets.forEach((config, element) => {
    if (!element.isConnected) {
      proximityTargets.delete(element)
      return
    }
    const rect = element.getBoundingClientRect()
    config.center = {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
    }
  })
}

/**
 * Evaluates magnetic and proximity targets for current cursor position.
 */
function evaluateTargets(pointerX: number, pointerY: number): void {
  if (prefersReducedMotion()) return

  const state = getInteractionState()
  if (state.touchMode) return // Disable magnetic and hover proximity on touch

  let activeTargetName = 'NONE'
  let maxProximity = 0
  let maxMagnetic = 0

  // 1. Evaluate Magnetic Targets
  magneticTargets.forEach((config, element) => {
    const { mx, my, strength } = calculateMagneticDisplacement(
      { x: pointerX, y: pointerY },
      config.center,
      config.radius ?? 85,
      config.factor ?? 0.35,
      config.maxOffset ?? 18
    )

    if (strength > 0) {
      activeTargetName = config.name
      maxMagnetic = Math.max(maxMagnetic, strength)

      gsap.to(element, {
        x: mx,
        y: my,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      config.onUpdate?.(mx, my, strength)
    } else {
      // Spring back to origin when cursor exits radius
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.55,
        ease: 'elastic.out(1, 0.45)',
        overwrite: 'auto',
      })
      config.onUpdate?.(0, 0, 0)
    }
  })

  // 2. Evaluate Proximity Targets
  proximityTargets.forEach((config) => {
    const dist = calculateDistance(pointerX, pointerY, config.center.x, config.center.y)
    const strength = getProximityStrength(dist, config.radius ?? 160)

    if (strength > 0) {
      if (activeTargetName === 'NONE') {
        activeTargetName = config.name
      }
      maxProximity = Math.max(maxProximity, strength)
    }

    config.onStrengthChange?.(strength)
  })

  setActiveInteraction(activeTargetName, maxProximity, maxMagnetic)
}

function handlePointerMove(e: PointerEvent): void {
  const isTouch = e.pointerType === 'touch'
  setRawPointer(e.clientX, e.clientY, isTouch)
  evaluateTargets(e.clientX, e.clientY)
}

function handlePointerLeave(): void {
  setPointerLeave()
  // Settle all magnetic elements
  magneticTargets.forEach((_config, element) => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    })
  })
}

function handleScrollOrResize(): void {
  updateTargetBounds()
}

/**
 * Initializes global interaction capture on window.
 */
export function initInteraction(): () => void {
  if (typeof window === 'undefined') return () => {}

  refCount++
  if (!isInitialized) {
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    window.addEventListener('resize', handleScrollOrResize, { passive: true })
    window.addEventListener('scroll', handleScrollOrResize, { passive: true })
    isInitialized = true
    setTimeout(updateTargetBounds, 100) // Initial target measurement
  }

  return () => {
    refCount--
    if (refCount <= 0) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize)
      isInitialized = false
    }
  }
}

/**
 * Registers an element for magnetic attraction.
 */
export function registerMagneticTarget(config: MagneticTargetConfig): () => void {
  const rect = config.element.getBoundingClientRect()
  magneticTargets.set(config.element, {
    ...config,
    center: {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
    },
  })

  return () => {
    magneticTargets.delete(config.element)
    gsap.killTweensOf(config.element)
  }
}

/**
 * Registers an element for hover/proximity illumination.
 */
export function registerProximityTarget(config: ProximityTargetConfig): () => void {
  const rect = config.element.getBoundingClientRect()
  proximityTargets.set(config.element, {
    ...config,
    center: {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5,
    },
  })

  return () => {
    proximityTargets.delete(config.element)
  }
}
