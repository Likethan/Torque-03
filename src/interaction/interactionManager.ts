/**
 * INTERACTION MANAGER (Step 6 — Advanced Cursor & Magnetic Interaction System)
 *
 * Centralizes global pointer, magnetic physics, and contextual cursor state:
 * 1. Single window-level event listener set (zero duplicate listeners).
 * 2. Declarative target discovery for [data-magnetic] and [data-cursor] elements.
 * 3. Caches center coordinates and bounding rects on scroll/resize (zero layout thrashing during moves).
 * 4. Physics-based magnetic attraction with strict displacement bounds and spring return.
 * 5. Full reference-counted lifecycle and React Strict Mode safety.
 * 6. Completely disabled on touch devices and prefers-reduced-motion.
 */

import gsap from 'gsap'
import {
  setRawPointer,
  setPointerLeave,
  setActiveInteraction,
  setCursorMode,
  getInteractionState,
  type CursorMode,
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
  cursorMode?: CursorMode
  cursorLabel?: string
  onUpdate?: (mx: number, my: number, strength: number) => void
}

export interface ProximityTargetConfig {
  element: HTMLElement
  name: string
  radius?: number
  onStrengthChange?: (strength: number) => void
}

interface TargetWithCenter extends MagneticTargetConfig {
  center: { x: number; y: number }
  isActive: boolean
}

let isInitialized = false
let refCount = 0

// Target Registries
const magneticTargets = new Map<HTMLElement, TargetWithCenter>()
const proximityTargets = new Map<HTMLElement, ProximityTargetConfig & { center: { x: number; y: number } }>()

/**
 * Scans the DOM for elements with data-magnetic and data-cursor attributes
 * and registers them into the active magnetic interaction system.
 */
export function scanDeclarativeTargets(): void {
  if (typeof document === 'undefined') return

  const elements = document.querySelectorAll<HTMLElement>('[data-magnetic="true"]')
  elements.forEach((el) => {
    if (!magneticTargets.has(el)) {
      const radius = parseFloat(el.getAttribute('data-magnetic-radius') || '75')
      const factor = parseFloat(el.getAttribute('data-magnetic-factor') || '0.32')
      const maxOffset = parseFloat(el.getAttribute('data-magnetic-max') || '14')
      const cursorMode = (el.getAttribute('data-cursor') || 'MAGNETIC').toUpperCase() as CursorMode
      const cursorLabel = el.getAttribute('data-cursor-label') || ''
      const name = el.getAttribute('data-name') || el.getAttribute('aria-label') || el.innerText || 'TARGET'

      registerMagneticTarget({
        element: el,
        name: name.slice(0, 30),
        radius,
        factor,
        maxOffset,
        cursorMode,
        cursorLabel,
      })
    }
  })
}

/**
 * Recalculates center coordinates for all registered targets.
 * Called on scroll or resize rather than querying getBoundingClientRect() on pointermove!
 */
export function updateTargetBounds(): void {
  scanDeclarativeTargets()

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
 * Evaluates magnetic attraction and contextual cursor modes for the current pointer position.
 */
function evaluateTargets(pointerX: number, pointerY: number, targetEl: HTMLElement | null): void {
  if (prefersReducedMotion()) return

  const state = getInteractionState()
  if (state.touchMode) return // Disable on touch devices

  let activeTargetName = 'NONE'
  let maxProximity = 0
  let maxMagnetic = 0
  let activeCursorMode: CursorMode | null = null
  let activeCursorLabel = ''

  // 1. Evaluate Magnetic Targets
  magneticTargets.forEach((config, element) => {
    const { mx, my, strength } = calculateMagneticDisplacement(
      { x: pointerX, y: pointerY },
      config.center,
      config.radius ?? 75,
      config.factor ?? 0.32,
      config.maxOffset ?? 14
    )

    if (strength > 0) {
      activeTargetName = config.name
      maxMagnetic = Math.max(maxMagnetic, strength)
      config.isActive = true

      if (!activeCursorMode) {
        activeCursorMode = config.cursorMode || 'MAGNETIC'
        activeCursorLabel = config.cursorLabel || ''
      }

      // Smoothly attract element toward cursor with physical damping
      gsap.to(element, {
        x: mx,
        y: my,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      config.onUpdate?.(mx, my, strength)
    } else if (config.isActive) {
      // Spring back to equilibrium when cursor exits magnetic field
      config.isActive = false
      gsap.to(element, {
        x: 0,
        y: 0,
        duration: 0.52,
        ease: 'power3.out',
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

  // 3. Evaluate Direct Hover Target for Contextual Cursor Mode
  if (!activeCursorMode && targetEl) {
    const cursorElem = targetEl.closest?.('[data-cursor]') as HTMLElement | null
    if (cursorElem) {
      const modeAttr = cursorElem.getAttribute('data-cursor')?.toUpperCase() as CursorMode
      if (modeAttr) {
        activeCursorMode = modeAttr
        activeCursorLabel = cursorElem.getAttribute('data-cursor-label') || ''
      }
    } else if (targetEl.tagName === 'A' || targetEl.tagName === 'BUTTON' || targetEl.getAttribute('role') === 'button') {
      activeCursorMode = 'LINK'
    }
  }

  // Set unified interaction and cursor states
  setActiveInteraction(activeTargetName, maxProximity, maxMagnetic)
  setCursorMode(activeCursorMode || 'DEFAULT', activeCursorLabel)
}

function handlePointerMove(e: PointerEvent): void {
  const isTouch = e.pointerType === 'touch'
  setRawPointer(e.clientX, e.clientY, isTouch)
  evaluateTargets(e.clientX, e.clientY, e.target as HTMLElement | null)
}

function handlePointerLeave(): void {
  setPointerLeave()
  // Settle all magnetic elements back to equilibrium
  magneticTargets.forEach((config, element) => {
    config.isActive = false
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.45,
      ease: 'power3.out',
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
    setTimeout(updateTargetBounds, 120) // Initial target measurement
  }

  return () => {
    refCount--
    if (refCount <= 0) {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize)
      magneticTargets.clear()
      proximityTargets.clear()
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
    isActive: false,
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
